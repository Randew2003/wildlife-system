import { useEffect, useState } from 'react';

import {
  alertApi,
  nextAlertAction,
} from '@/services/api';
import type { AuthSession, RiskAlert } from '@/types/domain';
import { formatDate, locationSummary } from '@/features/app/helpers';
import { useResource } from '@/features/app/hooks';
import {
  Button,
  EmptyBlock,
  ErrorBlock,
  LoadingBlock,
  MessageBanner,
  MiniMap,
  NotificationCard,
  Panel,
  SectionTitle,
  Stack,
} from '@/features/app/native-ui';

function actionLabel(alert: RiskAlert) {
  const nextAction = nextAlertAction(alert.status);

  if (nextAction === 'accept') {
    return 'Accept';
  }

  if (nextAction === 'respond') {
    return 'Start Trip';
  }

  if (nextAction === 'resolve') {
    return 'Resolved';
  }

  return null;
}

export function RiskAlertsScreen({ session }: { session: AuthSession }) {
  const alerts = useResource(() => alertApi.all(session.token), [session.token]);
  const [busyAlert, setBusyAlert] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const canRespond = session.role === 'RANGER' || session.role === 'COMMUNITY_LIAISON_OFFICER';

  const alertFeed = [...(alerts.data ?? [])].sort(
    (first, second) => new Date(second.detectedAt).getTime() - new Date(first.detectedAt).getTime(),
  );
  const refreshAlerts = alerts.refresh;
  const openAlerts = alertFeed.filter((alert) => alert.status !== 'RESOLVED');
  const latestAlert = openAlerts[0] ?? alertFeed[0];

  useEffect(() => {
    const timer = setInterval(() => {
      refreshAlerts();
    }, 10000);

    return () => clearInterval(timer);
  }, [refreshAlerts]);

  const performAction = async (alert: RiskAlert) => {
    const nextAction = nextAlertAction(alert.status);

    if (!nextAction) {
      return;
    }

    setBusyAlert(alert.alertId);
    setMessage(null);

    try {
      if (nextAction === 'accept') {
        await alertApi.accept(session.token, alert.alertId, session.rangerId ?? session.email);
      } else if (nextAction === 'respond') {
        await alertApi.respond(session.token, alert.alertId);
      } else {
        await alertApi.resolve(session.token, alert.alertId);
      }

      await alerts.refresh();
      setMessage('Risk alert status updated.');
    } catch (exception) {
      setMessage(exception instanceof Error ? exception.message : 'Unable to update risk alert.');
    } finally {
      setBusyAlert(null);
    }
  };

  return (
    <Stack>
      <SectionTitle
        title="Notifications"
        subtitle={canRespond ? 'Urgent animal movement alerts for field response.' : 'Safety updates from park monitoring.'}
        action={<Button label="Refresh" onPress={alerts.refresh} variant="secondary" />}
      />

      <MessageBanner message={message} tone={message?.toLowerCase().includes('unable') ? 'red' : 'sky'} />

      <Panel>
        <Stack>
          <SectionTitle title="Latest Alert" subtitle={latestAlert ? `${openAlerts.length} active notification(s)` : undefined} />
          {latestAlert ? (
            <>
              <NotificationCard
                title={canRespond ? 'High-risk animal nearby' : 'Stay away from this area'}
                subtitle={`${latestAlert.animalName} near ${latestAlert.riskZoneName ?? `Zone ${latestAlert.riskZoneId}`}`}
                status={latestAlert.status}
                time={formatDate(latestAlert.detectedAt)}
                detail={
                  canRespond
                    ? 'Open this alert, accept it if you can attend, then update the status.'
                    : 'Please avoid the place until park staff mark the alert resolved.'
                }
                rows={[
                  { label: 'Place', value: locationSummary(latestAlert.latitude, latestAlert.longitude) },
                  { label: 'Responder', value: latestAlert.assignedResponder ?? 'Waiting' },
                ]}
                tone={latestAlert.status === 'RESOLVED' ? 'green' : 'red'}
              />
              <MiniMap
                latitude={latestAlert.latitude}
                longitude={latestAlert.longitude}
                title={locationSummary(latestAlert.latitude, latestAlert.longitude)}
              />
            </>
          ) : (
            <EmptyBlock title="No notifications" detail="When a collar enters a risk zone, the alert appears here." />
          )}
        </Stack>
      </Panel>

      <Panel>
        <Stack>
          <SectionTitle title={canRespond ? 'Response Feed' : 'Safety Feed'} />
          {alerts.loading ? <LoadingBlock label="Loading risk alerts" /> : null}
          {alerts.error ? <ErrorBlock message={alerts.error} onRetry={alerts.refresh} /> : null}
          {!alerts.loading && !alerts.error && !alerts.data?.length ? (
            <EmptyBlock title="No notifications yet" detail="New high-risk movement alerts will appear like a notification list." />
          ) : null}
          {alertFeed.map((alert) => {
            const label = canRespond ? actionLabel(alert) : null;

            return (
              <NotificationCard
                key={alert.alertId}
                title={canRespond ? alert.animalName : 'Community safety alert'}
                subtitle={locationSummary(alert.latitude, alert.longitude)}
                status={alert.status}
                time={formatDate(alert.detectedAt)}
                detail={
                  canRespond
                    ? `${alert.riskZoneName ?? `Zone ${alert.riskZoneId}`} needs field response.`
                    : 'Avoid the area and wait for ranger updates.'
                }
                rows={[
                  { label: 'Area', value: alert.riskZoneName ?? `Zone ${alert.riskZoneId}` },
                  { label: 'Responder', value: canRespond ? alert.assignedResponder ?? 'Available' : 'Park team notified' },
                ]}
                tone={alert.status === 'RESOLVED' ? 'green' : alert.status === 'RESPONDING' ? 'amber' : 'red'}
                actions={
                  label ? (
                    <Button
                      label={label}
                      onPress={() => performAction(alert)}
                      busy={busyAlert === alert.alertId}
                      variant={alert.status === 'DETECTED' ? 'primary' : 'secondary'}
                    />
                  ) : undefined
                }
              />
            );
          })}
        </Stack>
      </Panel>
    </Stack>
  );
}
