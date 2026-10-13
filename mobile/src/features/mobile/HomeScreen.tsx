import { useEffect } from 'react';

import { alertApi, conflictApi, incidentApi, patrolApi } from '@/services/api';
import type { AuthSession } from '@/types/domain';
import { formatDate, isManagerRole, locationSummary } from '@/features/app/helpers';
import { useResource } from '@/features/app/hooks';
import {
  ActionTile,
  Button,
  DataCard,
  EmptyBlock,
  ErrorBlock,
  LoadingBlock,
  MessageBanner,
  MetricTile,
  NotificationCard,
  Panel,
  Row,
  SectionTitle,
  Stack,
} from '@/features/app/native-ui';
import type { MobileTab } from '@/features/mobile/types';

type HomeScreenProps = {
  session: AuthSession;
  onNavigate: (tab: MobileTab) => void;
};

export function HomeScreen({ session, onNavigate }: HomeScreenProps) {
  const isRanger = session.role === 'RANGER';
  const isCommunityMember = session.role === 'COMMUNITY_MEMBER';
  const isCommunityLiaison = session.role === 'COMMUNITY_LIAISON_OFFICER';
  const canReceiveRiskAlerts = isRanger || isCommunityLiaison || isCommunityMember;
  const showManagerHint = isManagerRole(session.role);
  const patrols = useResource(
    () =>
      isRanger && session.rangerDatabaseId
        ? patrolApi.assigned(session.token, session.rangerDatabaseId)
        : Promise.resolve([]),
    [session.token, session.rangerDatabaseId, session.role],
  );
  const alerts = useResource(
    () => (canReceiveRiskAlerts ? alertApi.all(session.token) : Promise.resolve([])),
    [session.token, session.role],
  );
  const incidents = useResource(
    () => (isRanger ? incidentApi.all(session.token) : Promise.resolve([])),
    [session.token, session.role],
  );
  const conflicts = useResource(
    () =>
      session.role === 'COMMUNITY_MEMBER' || isCommunityLiaison
        ? conflictApi.all(session.token)
        : Promise.resolve([]),
    [session.token, session.role],
  );

  const assignedCount = patrols.data?.filter((patrol) => patrol.status !== 'COMPLETED').length ?? 0;
  const activeAlerts = alerts.data?.filter((alert) => alert.status !== 'RESOLVED').length ?? 0;
  const pendingIncidents = incidents.data?.filter((incident) => incident.status !== 'SYNCED').length ?? 0;
  const openConflicts = conflicts.data?.filter((report) => !['RESOLVED', 'CLOSED'].includes(report.status)).length ?? 0;
  const alertFeed = [...(alerts.data ?? [])].sort(
    (first, second) => new Date(second.detectedAt).getTime() - new Date(first.detectedAt).getTime(),
  );
  const refreshAlerts = alerts.refresh;
  const latestAlert = alertFeed.find((alert) => alert.status !== 'RESOLVED') ?? alertFeed[0];
  const nextPatrol = patrols.data?.find((patrol) => patrol.status !== 'COMPLETED');
  const latestConflict = conflicts.data?.[0];

  useEffect(() => {
    if (!canReceiveRiskAlerts) {
      return undefined;
    }

    const timer = setInterval(() => {
      refreshAlerts();
    }, 10000);

    return () => clearInterval(timer);
  }, [refreshAlerts, canReceiveRiskAlerts]);

  return (
    <Stack>
      <SectionTitle
        title={`Hi ${session.fullName}`}
        subtitle={showManagerHint ? 'Use the web dashboard for manager controls.' : 'Only the important field work is shown here.'}
      />

      {canReceiveRiskAlerts && latestAlert ? (
        <NotificationCard
          title={isCommunityMember ? 'Safety alert near your area' : 'High-risk animal movement'}
          subtitle={`${latestAlert.animalName} near ${latestAlert.riskZoneName ?? `Zone ${latestAlert.riskZoneId}`}`}
          status={latestAlert.status}
          time={formatDate(latestAlert.detectedAt)}
          detail={
            isCommunityMember
              ? 'Stay away from the area and wait for ranger instructions.'
              : 'Open Notifications to accept or update the response.'
          }
          tone={latestAlert.status === 'RESOLVED' ? 'green' : 'red'}
          actions={<Button label="Open Notifications" onPress={() => onNavigate('alerts')} />}
        />
      ) : null}

      <Panel>
        <Stack>
          <SectionTitle title="Quick Actions" subtitle="Choose the next task." />
          <Row>
            {isRanger ? (
              <>
                <ActionTile title="Patrol" detail="Start or complete route" onPress={() => onNavigate('patrols')} />
                <ActionTile title="Notifications" detail={`${activeAlerts} active risk alerts`} onPress={() => onNavigate('alerts')} tone="red" />
                <ActionTile title="Report" detail="Wildlife incident" onPress={() => onNavigate('reports')} tone="sky" />
              </>
            ) : isCommunityLiaison ? (
              <>
                <ActionTile title="Cases" detail={`${openConflicts} active cases`} onPress={() => onNavigate('cases')} tone="amber" />
                <ActionTile title="Notifications" detail={`${activeAlerts} safety alerts`} onPress={() => onNavigate('alerts')} tone="red" />
              </>
            ) : (
              <>
                <ActionTile title="Report" detail="Ask for help quickly" onPress={() => onNavigate('reports')} tone="green" />
                <ActionTile title="Notifications" detail={`${activeAlerts} safety alerts`} onPress={() => onNavigate('alerts')} tone="red" />
              </>
            )}
          </Row>
        </Stack>
      </Panel>

      <Panel>
        <Stack>
          <SectionTitle title={isRanger ? 'Today' : isCommunityLiaison ? 'Case Summary' : 'My Community Status'} />
          <Row>
            {isRanger ? (
              <>
                <MetricTile label="Patrols" value={assignedCount} detail="To finish" tone="green" />
                <MetricTile label="Alerts" value={activeAlerts} detail="Need attention" tone="red" />
                <MetricTile label="Drafts" value={pendingIncidents} detail="Sync later" tone="sky" />
              </>
            ) : isCommunityLiaison ? (
              <>
                <MetricTile label="Cases" value={openConflicts} detail="Need field action" tone="amber" />
                <MetricTile label="Alerts" value={activeAlerts} detail="Safety updates" tone="red" />
              </>
            ) : (
              <>
                <MetricTile label="Reports" value={openConflicts} detail="Open conflict reports" tone="amber" />
                <MetricTile label="Alerts" value={activeAlerts} detail="Safety notifications" tone="red" />
              </>
            )}
          </Row>
          {isRanger && nextPatrol ? (
            <DataCard
              title="Next patrol"
              subtitle={nextPatrol.routeName}
              status={nextPatrol.status}
              rows={[
                { label: 'Ranger', value: nextPatrol.rangerName },
                { label: 'Route', value: nextPatrol.routeId },
              ]}
              actions={<Button label="Open Patrol" onPress={() => onNavigate('patrols')} />}
            />
          ) : null}
          {isCommunityMember && latestConflict ? (
            <DataCard
              title="Latest report"
              subtitle={latestConflict.description}
              status={latestConflict.status}
              rows={[
                { label: 'Type', value: latestConflict.conflictType },
                { label: 'Liaison officer', value: latestConflict.assignedRanger ?? 'Not assigned yet' },
              ]}
            />
          ) : null}
        </Stack>
      </Panel>

      {canReceiveRiskAlerts ? (
        <Panel>
          <Stack>
            <SectionTitle
              title="Notification Feed"
              subtitle={isCommunityMember ? 'Community safety updates appear here.' : 'Latest high-risk movement updates.'}
            />
            {alerts.loading ? <LoadingBlock label="Loading alerts" /> : null}
            {alerts.error ? <ErrorBlock message={alerts.error} onRetry={alerts.refresh} /> : null}
            {!alerts.loading && !alerts.error && alertFeed.slice(0, 3).map((alert) => (
              <NotificationCard
                key={alert.alertId}
                title={isCommunityMember ? 'Safety notification' : alert.animalName}
                subtitle={locationSummary(alert.latitude, alert.longitude)}
                status={alert.status}
                time={formatDate(alert.detectedAt)}
                detail={
                  isCommunityMember
                    ? 'Avoid this area until the park team resolves the alert.'
                    : `${alert.riskZoneName ?? `Zone ${alert.riskZoneId}`} needs attention.`
                }
                tone={alert.status === 'RESOLVED' ? 'green' : 'red'}
                actions={
                  <Button
                    label={isCommunityMember ? 'View Alert' : 'Respond'}
                    onPress={() => onNavigate('alerts')}
                    variant={alert.status === 'RESOLVED' ? 'secondary' : 'primary'}
                  />
                }
              />
            ))}
            {!alerts.loading && !alerts.error && !latestAlert ? (
              <EmptyBlock title="No active risk alerts" detail="New animal movement alerts will appear like notifications." />
            ) : null}
          </Stack>
        </Panel>
      ) : null}

      {!canReceiveRiskAlerts ? (
        <MessageBanner
          message="Open the web dashboard for full manager monitoring and assignments."
          tone="green"
        />
      ) : null}

      {isCommunityMember ? (
        <Panel>
          <Stack>
            <SectionTitle title="My Reports" />
            {conflicts.loading ? <LoadingBlock label="Loading reports" /> : null}
            {conflicts.error ? <ErrorBlock message={conflicts.error} onRetry={conflicts.refresh} /> : null}
            {!conflicts.loading && !conflicts.error && conflicts.data?.length ? (
              conflicts.data.slice(0, 2).map((report) => (
                <DataCard
                  key={report.reportId}
                  title={report.conflictType}
                  subtitle={report.description}
                  status={report.status}
                  rows={[
                    { label: 'Severity', value: report.severity },
                    { label: 'Liaison officer', value: report.assignedRanger ?? 'Not assigned yet' },
                  ]}
                />
              ))
            ) : null}
            {!conflicts.loading && !conflicts.error && !conflicts.data?.length ? (
              <EmptyBlock title="No reports yet" detail="Your submitted reports will be tracked here." />
            ) : null}
          </Stack>
        </Panel>
      ) : null}

      {patrols.error || incidents.error ? (
        <MessageBanner
          message="Some data could not be loaded. Use Refresh after the backend is running."
          tone="amber"
        />
      ) : null}
    </Stack>
  );
}
