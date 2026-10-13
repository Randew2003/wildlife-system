import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { ConflictReportScreen } from '@/features/conflicts/ConflictReportScreen';
import { ReportIncidentScreen } from '@/features/incidents/ReportIncidentScreen';
import { formatDate, formatLabel } from '@/features/app/helpers';
import { useResource } from '@/features/app/hooks';
import {
  cx,
  DataCard,
  EmptyBlock,
  ErrorBlock,
  LoadingBlock,
  SectionTitle,
  Stack,
} from '@/features/app/native-ui';
import { conflictApi, incidentApi } from '@/services/api';
import type { AuthSession } from '@/types/domain';

type ReportTab = 'incident' | 'conflict' | 'history';

export function ReportHubScreen({ session }: { session: AuthSession }) {
  const [activeTab, setActiveTab] = useState<ReportTab>(
    session.role === 'COMMUNITY_MEMBER' ? 'conflict' : 'incident',
  );
  const incidents = useResource(
    () => (session.role === 'RANGER' ? incidentApi.all(session.token) : Promise.resolve([])),
    [session.token, session.role],
  );
  const conflicts = useResource(() => conflictApi.all(session.token), [session.token]);
  const tabs: { key: ReportTab; label: string; hidden?: boolean }[] = [
    { key: 'incident', label: 'Incident', hidden: session.role === 'COMMUNITY_MEMBER' },
    { key: 'conflict', label: 'Conflict' },
    { key: 'history', label: 'History' },
  ];

  const refreshHistory = () => {
    incidents.refresh();
    conflicts.refresh();
  };

  return (
    <Stack>
      <SectionTitle title="Reports" subtitle="Submit a new report or check previous status." />
      <View className="flex-row flex-wrap gap-2">
        {tabs
          .filter((tab) => !tab.hidden)
          .map((tab) => {
            const selected = tab.key === activeTab;

            return (
              <Pressable
                accessibilityRole="button"
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                className={cx('rounded-md px-3 py-2', selected ? 'bg-forest-600' : 'bg-white')}
              >
                <Text className={cx('text-sm font-bold', selected ? 'text-white' : 'text-slate-700')}>
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
      </View>

      {activeTab === 'incident' ? (
        <ReportIncidentScreen session={session} onSubmitted={refreshHistory} />
      ) : null}

      {activeTab === 'conflict' ? (
        <ConflictReportScreen session={session} onSubmitted={refreshHistory} />
      ) : null}

      {activeTab === 'history' ? (
        <Stack>
          {(incidents.loading || conflicts.loading) && <LoadingBlock label="Loading report history" />}
          {incidents.error ? <ErrorBlock message={incidents.error} onRetry={incidents.refresh} /> : null}
          {conflicts.error ? <ErrorBlock message={conflicts.error} onRetry={conflicts.refresh} /> : null}

          {incidents.data?.map((incident) => (
            <DataCard
              key={`incident-${incident.id}`}
              title={formatLabel(incident.incidentType)}
              subtitle={incident.description}
              status={incident.status}
              rows={[
                { label: 'Reported', value: formatDate(incident.reportedAt) },
                { label: 'Evidence', value: incident.photoUrls.length },
              ]}
            />
          ))}

          {conflicts.data?.map((report) => (
            <DataCard
              key={`conflict-${report.reportId}`}
              title={formatLabel(report.conflictType)}
              subtitle={report.description}
              status={report.status}
              rows={[
                { label: 'Severity', value: report.severity },
                { label: 'Reported', value: formatDate(report.reportedAt) },
                { label: 'Community liaison', value: report.assignedRanger ?? 'Not assigned' },
              ]}
            />
          ))}

          {!incidents.loading &&
          !conflicts.loading &&
          !incidents.error &&
          !conflicts.error &&
          !incidents.data?.length &&
          !conflicts.data?.length ? (
            <EmptyBlock title="No reports yet" detail="Submitted reports will appear here." />
          ) : null}
        </Stack>
      ) : null}
    </Stack>
  );
}
