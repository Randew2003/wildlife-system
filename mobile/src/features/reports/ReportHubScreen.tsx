import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { ConflictReportScreen } from '@/features/conflicts/ConflictReportScreen';
import { ReportIncidentScreen } from '@/features/incidents/ReportIncidentScreen';
import { formatDate, formatLabel } from '@/features/app/helpers';
import { incidentOptions } from '@/features/app/constants';
import { useResource } from '@/features/app/hooks';
import {
  Button,
  cx,
  DataCard,
  EmptyBlock,
  ErrorBlock,
  LoadingBlock,
  MessageBanner,
  SectionTitle,
  Stack,
} from '@/features/app/native-ui';
import { conflictApi, incidentApi } from '@/services/api';
import { flushOfflineQueue, getOfflineQueue } from '@/services/offline';
import type { AuthSession, OfflineQueueItem, WildlifeIncidentPayload } from '@/types/domain';

type ReportTab = 'incident' | 'conflict' | 'history';
type QueuedIncident = OfflineQueueItem & { body: WildlifeIncidentPayload };

function isQueuedIncident(item: OfflineQueueItem): item is QueuedIncident {
  if (
    item.endpoint !== '/api/v1/incidents' ||
    item.method !== 'POST' ||
    typeof item.body !== 'object' ||
    item.body === null
  ) {
    return false;
  }

  const body = item.body as Record<string, unknown>;

  return (
    incidentOptions.some((option) => option.value === body.incidentType) &&
    typeof body.latitude === 'number' &&
    Number.isFinite(body.latitude) &&
    typeof body.longitude === 'number' &&
    Number.isFinite(body.longitude) &&
    typeof body.description === 'string' &&
    Array.isArray(body.photoUrls) &&
    body.photoUrls.every((photoUrl) => typeof photoUrl === 'string')
  );
}

export function ReportHubScreen({ session }: { session: AuthSession }) {
  const [activeTab, setActiveTab] = useState<ReportTab>(
    session.role === 'COMMUNITY_MEMBER' ? 'conflict' : 'incident',
  );
  const [retryingIncidentReference, setRetryingIncidentReference] = useState<string | null>(null);
  const [incidentSyncError, setIncidentSyncError] = useState<string | null>(null);
  const [queuedIncidents, setQueuedIncidents] = useState<QueuedIncident[]>([]);
  const [queueError, setQueueError] = useState<string | null>(null);
  const [syncSuccessMessage, setSyncSuccessMessage] = useState<string | null>(null);
  const incidents = useResource(
    () => (session.role === 'RANGER' ? incidentApi.all(session.token) : Promise.resolve([])),
    [session.token, session.role],
  );
  const conflicts = useResource(() => conflictApi.all(session.token), [session.token]);
  const refreshIncidents = incidents.refresh;
  const refreshConflicts = conflicts.refresh;
  const previousQueuedReferences = useRef<Set<string>>(new Set());
  const refreshQueuedIncidents = useCallback(async () => {
    try {
      setQueueError(null);
      const nextQueued = (await getOfflineQueue()).filter(isQueuedIncident);
      const nextReferences = new Set(nextQueued.map((incident) => incident.id));
      const removedReferences = [...previousQueuedReferences.current].filter(
        (reference) => !nextReferences.has(reference),
      );

      if (removedReferences.length) {
        void refreshIncidents();
        if (activeTab === 'history') {
          setSyncSuccessMessage(
            removedReferences.length > 1
              ? 'Offline incidents synced successfully.'
              : 'Incident synced successfully. Your offline report is now saved on the server.',
          );
        }
      }

      if (activeTab === 'history') {
        void refreshConflicts();
      }

      previousQueuedReferences.current = nextReferences;
      setQueuedIncidents(nextQueued);
    } catch (exception) {
      setQueueError(exception instanceof Error ? exception.message : 'Unable to load queued incidents.');
    }
  }, [activeTab, refreshConflicts, refreshIncidents]);

  useEffect(() => {
    if (!syncSuccessMessage) {
      return undefined;
    }

    const timeout = setTimeout(() => setSyncSuccessMessage(null), 4000);

    return () => clearTimeout(timeout);
  }, [syncSuccessMessage]);

  useEffect(() => {
    if (activeTab !== 'history') {
      return undefined;
    }

    const timer = setInterval(() => void refreshQueuedIncidents(), 5000);

    return () => clearInterval(timer);
  }, [activeTab, refreshQueuedIncidents]);

  const tabs: { key: ReportTab; label: string; hidden?: boolean }[] = [
    { key: 'incident', label: 'Incident', hidden: session.role === 'COMMUNITY_MEMBER' },
    { key: 'conflict', label: 'Conflict' },
    { key: 'history', label: 'History' },
  ];

  const refreshHistory = useCallback(() => {
    void refreshIncidents();
    void refreshConflicts();
    void refreshQueuedIncidents();
  }, [refreshIncidents, refreshConflicts, refreshQueuedIncidents]);

  const retryIncidentSync = async (incidentId: number) => {
    const reference = String(incidentId);
    setRetryingIncidentReference(reference);
    setIncidentSyncError(null);

    try {
      await incidentApi.retrySync(session.token, incidentId);
      await incidents.refresh();
    } catch (exception) {
      setIncidentSyncError(
        exception instanceof Error ? exception.message : 'Unable to retry incident synchronization.',
      );
    } finally {
      setRetryingIncidentReference(null);
    }
  };

  const retryQueuedIncidentSync = async (itemId: string) => {
    setRetryingIncidentReference(itemId);
    setIncidentSyncError(null);

    try {
      const result = await flushOfflineQueue(session.token, itemId, '/api/v1/incidents');

      if (result.remaining.some((item) => item.id === itemId)) {
        setIncidentSyncError('Sync Failed. Check your connection and try again.');
      } else {
        await incidents.refresh();
      }

      await refreshQueuedIncidents();
    } catch (exception) {
      setIncidentSyncError(
        exception instanceof Error ? exception.message : 'Unable to retry incident synchronization.',
      );
    } finally {
      setRetryingIncidentReference(null);
    }
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
                onPress={() => {
                  setActiveTab(tab.key);
                  if (tab.key === 'history') {
                    void refreshQueuedIncidents();
                    void refreshConflicts();
                  }
                }}
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
          <MessageBanner message={syncSuccessMessage} tone="green" />
          {incidentSyncError ? <ErrorBlock message={incidentSyncError} /> : null}
          {queueError ? <ErrorBlock message={queueError} /> : null}
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
                { label: 'Reference', value: incident.id },
                { label: 'Reported', value: formatDate(incident.reportedAt) },
                { label: 'Evidence', value: incident.photoUrls.length },
              ]}
              actions={
                incident.status === 'SYNC_FAILED' ? (
                  <Button
                    label="Retry Sync"
                    onPress={() => void retryIncidentSync(incident.id)}
                    busy={retryingIncidentReference === String(incident.id)}
                    disabled={
                      retryingIncidentReference !== null &&
                      retryingIncidentReference !== String(incident.id)
                    }
                  />
                ) : undefined
              }
            />
          ))}

          {queuedIncidents.map((incident) => (
            <DataCard
              key={`queued-incident-${incident.id}`}
              title={formatLabel(incident.body.incidentType)}
              subtitle={incident.body.description}
              status={incident.attempts > 0 ? 'SYNC_FAILED' : 'PENDING_SYNC'}
              rows={[
                { label: 'Reference', value: incident.id },
                { label: 'Reported', value: formatDate(incident.createdAt) },
                { label: 'Evidence', value: incident.body.photoUrls.length },
              ]}
              actions={
                <Button
                  label="Retry Sync"
                  onPress={() => void retryQueuedIncidentSync(incident.id)}
                  busy={retryingIncidentReference === incident.id}
                  disabled={
                    retryingIncidentReference !== null &&
                    retryingIncidentReference !== incident.id
                  }
                />
              }
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
          !queuedIncidents.length &&
          !conflicts.data?.length ? (
            <EmptyBlock title="No reports yet" detail="Submitted reports will appear here." />
          ) : null}
        </Stack>
      ) : null}
    </Stack>
  );
}
