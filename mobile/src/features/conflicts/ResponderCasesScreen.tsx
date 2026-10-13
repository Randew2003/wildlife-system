import { useState } from 'react';

import { conflictApi } from '@/services/api';
import type { AuthSession, ConflictReport } from '@/types/domain';
import { formatDate, formatLabel, locationSummary } from '@/features/app/helpers';
import { useResource } from '@/features/app/hooks';
import {
  Button,
  ChoiceGroup,
  DataCard,
  EmptyBlock,
  ErrorBlock,
  Field,
  LoadingBlock,
  MessageBanner,
  MiniMap,
  Panel,
  Row,
  SectionTitle,
  Stack,
} from '@/features/app/native-ui';

const outcomeOptions = [
  { label: 'Solved', value: 'SOLVED' },
  { label: 'Not solved', value: 'NOT_SOLVED' },
  { label: 'Needs follow-up', value: 'NEEDS_FOLLOW_UP' },
  { label: 'False alarm', value: 'FALSE_ALARM' },
] as const;

type ResponseOutcome = (typeof outcomeOptions)[number]['value'];

function isAssignedToSession(report: ConflictReport, session: AuthSession) {
  const assigned = report.assignedRanger?.toLowerCase();

  if (!assigned) {
    return false;
  }

  return [session.rangerId, session.email, session.fullName]
    .filter(Boolean)
    .map((value) => value!.toLowerCase())
    .includes(assigned);
}

export function ResponderCasesScreen({ session }: { session: AuthSession }) {
  const cases = useResource(() => conflictApi.all(session.token), [session.token]);
  const [busyCase, setBusyCase] = useState<string | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [responseOutcome, setResponseOutcome] = useState<ResponseOutcome>('SOLVED');
  const [message, setMessage] = useState<string | null>(null);

  const assignedCases =
    cases.data?.filter((report) => isAssignedToSession(report, session) && report.status !== 'CLOSED') ?? [];
  const urgentCase = assignedCases.find((report) => report.status !== 'RESOLVED') ?? assignedCases[0];

  const updateCase = async (report: ConflictReport, action: 'respond' | 'resolve') => {
    setBusyCase(`${report.reportId}-${action}`);
    setMessage(null);

    try {
      if (action === 'respond') {
        await conflictApi.respond(session.token, report.reportId);
      } else {
        await conflictApi.resolve(
          session.token,
          report.reportId,
          resolutionNotes.trim() || 'Issue handled by field responder.',
          responseOutcome,
        );
        setResolutionNotes('');
        setResponseOutcome('SOLVED');
      }

      await cases.refresh();
      setMessage('Case status updated. Park manager can see the latest result.');
    } catch (exception) {
      setMessage(exception instanceof Error ? exception.message : 'Unable to update case.');
    } finally {
      setBusyCase(null);
    }
  };

  return (
    <Stack>
      <SectionTitle
        title="My Cases"
        subtitle="Go to the place, start response, then submit the result."
        action={<Button label="Refresh" onPress={cases.refresh} variant="secondary" />}
      />

      <MessageBanner message={message} tone="sky" />

      {urgentCase ? (
        <Panel>
          <Stack>
            <SectionTitle title="Next Place To Visit" subtitle={locationSummary(urgentCase.latitude, urgentCase.longitude)} />
            <MiniMap latitude={urgentCase.latitude} longitude={urgentCase.longitude} title={formatLabel(urgentCase.conflictType)} />
            <DataCard
              title={formatLabel(urgentCase.conflictType)}
              subtitle={urgentCase.description}
              status={urgentCase.status}
              rows={[
                { label: 'Severity', value: urgentCase.severity },
                { label: 'Reported', value: formatDate(urgentCase.reportedAt) },
                { label: 'Community liaison', value: urgentCase.assignedRanger ?? 'Not assigned' },
              ]}
            />
          </Stack>
        </Panel>
      ) : null}

      <Panel>
        <Stack>
          <SectionTitle title="Result" subtitle="Submit this after visiting the place." />
          <ChoiceGroup
            label="Outcome"
            value={responseOutcome}
            options={outcomeOptions}
            onChange={setResponseOutcome}
          />
          <Field
            label="Field result"
            value={resolutionNotes}
            onChangeText={setResolutionNotes}
            multiline
            placeholder="Example: Guided animal away, informed household, area is safe."
          />
        </Stack>
      </Panel>

      <Panel>
        <Stack>
          <SectionTitle title="Case List" />
          {cases.loading ? <LoadingBlock label="Loading conflict cases" /> : null}
          {cases.error ? <ErrorBlock message={cases.error} onRetry={cases.refresh} /> : null}
          {!cases.loading && !cases.error && !assignedCases.length ? (
            <EmptyBlock title="No assigned cases" detail="Park manager assigned conflict cases will appear here." />
          ) : null}
          {assignedCases.map((report) => (
            <DataCard
              key={report.reportId}
              title={formatLabel(report.conflictType)}
              subtitle={locationSummary(report.latitude, report.longitude)}
              status={report.status}
              rows={[
                { label: 'Details', value: report.description },
                { label: 'Severity', value: report.severity },
                { label: 'Reported', value: formatDate(report.reportedAt) },
                { label: 'Outcome', value: formatLabel(report.responseOutcome ?? 'PENDING') },
                { label: 'Result', value: report.responseNotes ?? 'No result notes yet' },
              ]}
              actions={
                <Row>
                  <Button
                    label="Start Response"
                    onPress={() => updateCase(report, 'respond')}
                    busy={busyCase === `${report.reportId}-respond`}
                    disabled={report.status !== 'ASSIGNED'}
                    variant="secondary"
                  />
                  <Button
                    label="Submit Result"
                    onPress={() => updateCase(report, 'resolve')}
                    busy={busyCase === `${report.reportId}-resolve`}
                    disabled={report.status !== 'RESPONDING'}
                  />
                </Row>
              }
            />
          ))}
        </Stack>
      </Panel>
    </Stack>
  );
}
