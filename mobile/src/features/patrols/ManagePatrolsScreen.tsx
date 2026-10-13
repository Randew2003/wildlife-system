import * as Location from 'expo-location';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { sampleParkLocation } from '@/features/app/constants';
import {
  describeLocation,
  formatDate,
  formatLabel,
} from '@/features/app/helpers';
import { useResource } from '@/features/app/hooks';
import {
  Button,
  cx,
  DataCard,
  EmptyBlock,
  ErrorBlock,
  Field,
  LoadingBlock,
  MessageBanner,
  Panel,
  Row,
  RouteMap,
  SectionTitle,
  Stack,
  StatusPill,
} from '@/features/app/native-ui';
import { patrolApi } from '@/services/api';
import { enqueueOffline, getNetworkStatus } from '@/services/offline';
import type { AuthSession, Patrol } from '@/types/domain';

type PatrolAction = 'start' | 'complete' | 'gps' | 'waypoint' | 'demo';

type FieldPoint = {
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  recordedAt: string;
};

function preferredPatrol(patrols?: Patrol[], selectedReference?: string) {
  if (!patrols?.length) {
    return null;
  }

  return (
    patrols.find((patrol) => patrol.patrolReference === selectedReference) ??
    patrols.find((patrol) => patrol.status === 'IN_PROGRESS') ??
    patrols.find((patrol) => patrol.status === 'ASSIGNED') ??
    patrols[0]
  );
}

function initialPointForPatrol(patrol?: Patrol | null): FieldPoint {
  return {
    latitude: patrol?.routeStartLatitude ?? sampleParkLocation.latitude,
    longitude: patrol?.routeStartLongitude ?? sampleParkLocation.longitude,
    accuracy: null,
    recordedAt: new Date().toISOString(),
  };
}

function patrolProgressLabel(status?: string) {
  if (status === 'ASSIGNED') {
    return 'Ready to start';
  }

  if (status === 'IN_PROGRESS') {
    return 'Tracking active route';
  }

  if (status === 'COMPLETED') {
    return 'Patrol completed';
  }

  return 'Waiting for assignment';
}

export function ManagePatrolsScreen({ session }: { session: AuthSession }) {
  const patrols = useResource(
    () =>
      session.rangerDatabaseId
        ? patrolApi.assigned(session.token, session.rangerDatabaseId)
        : Promise.resolve([]),
    [session.token, session.rangerDatabaseId],
  );
  const [selectedReference, setSelectedReference] = useState('');
  const [waypointNote, setWaypointNote] = useState('');
  const [fieldPoint, setFieldPoint] = useState<FieldPoint | null>(null);
  const [tracking, setTracking] = useState(false);
  const [gpsStatus, setGpsStatus] = useState('GPS is ready.');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<PatrolAction | null>(null);
  const watchSubscriptionRef = useRef<Location.LocationSubscription | null>(null);
  const activeReferenceRef = useRef('');

  const selectedPatrol = useMemo(
    () => preferredPatrol(patrols.data ?? undefined, selectedReference),
    [patrols.data, selectedReference],
  );
  const activeReference = selectedPatrol?.patrolReference ?? '';

  const locations = useResource(
    () => (activeReference ? patrolApi.locations(session.token, activeReference) : Promise.resolve([])),
    [session.token, activeReference],
  );
  const waypoints = useResource(
    () => (activeReference ? patrolApi.waypoints(session.token, activeReference) : Promise.resolve([])),
    [session.token, activeReference],
  );

  const visiblePoint = fieldPoint ?? initialPointForPatrol(selectedPatrol);
  const currentArea = describeLocation(visiblePoint.latitude, visiblePoint.longitude);
  const latestWaypoint = waypoints.data?.[0];
  const latestLocation = locations.data?.[0];

  useEffect(() => {
    activeReferenceRef.current = activeReference;
  }, [activeReference]);

  useEffect(
    () => () => {
      watchSubscriptionRef.current?.remove();
    },
    [],
  );

  const clearMessages = () => {
    setMessage(null);
    setError(null);
  };

  const savePatrolState = async (action: 'start' | 'complete') => {
    if (!activeReference) {
      setError('Select an assigned patrol first.');
      return false;
    }

    setBusyAction(action);
    clearMessages();

    try {
      if (!getNetworkStatus()) {
        throw new Error('Network unavailable.');
      }

      if (action === 'start') {
        await patrolApi.start(session.token, activeReference);
      } else {
        await patrolApi.complete(session.token, activeReference);
      }

      await patrols.refresh();
      setMessage(action === 'start' ? 'Patrol started.' : 'Patrol completed.');
      return true;
    } catch {
      await enqueueOffline({
        label: `${action.toUpperCase()} ${activeReference}`,
        endpoint: `/api/patrols/${activeReference}/${action}`,
        method: 'POST',
      });
      setMessage(`${formatLabel(action)} saved locally for synchronization.`);
      return true;
    } finally {
      setBusyAction(null);
    }
  };

  const requestGpsPoint = async () => {
    const permission = await Location.requestForegroundPermissionsAsync();

    if (permission.status !== 'granted') {
      throw new Error('Location permission denied. Use Demo Move for viva testing, or allow GPS permission.');
    }

    try {
      await Location.enableNetworkProviderAsync();
    } catch {
      // Some Android devices skip this prompt; normal foreground GPS still works.
    }

    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      recordedAt: new Date().toISOString(),
    };
  };

  const recordGpsPoint = async (point: FieldPoint, statusText = 'Location saved.') => {
    const patrolReference = activeReferenceRef.current;

    setFieldPoint(point);

    if (!patrolReference) {
      return;
    }

    try {
      await patrolApi.recordLocation(session.token, patrolReference, point.latitude, point.longitude);
      await locations.refresh();
      setGpsStatus(statusText);
    } catch {
      await enqueueOffline({
        label: `GPS ${patrolReference}`,
        endpoint: `/api/patrols/${patrolReference}/locations`,
        method: 'POST',
        body: {
          latitude: point.latitude,
          longitude: point.longitude,
        },
      });
      setGpsStatus('Location saved locally for synchronization.');
    }
  };

  const startLiveGps = async () => {
    if (!activeReference) {
      setError('Select an assigned patrol first.');
      return;
    }

    if (selectedPatrol?.status === 'COMPLETED') {
      setError('This patrol is already completed.');
      return;
    }

    if (watchSubscriptionRef.current) {
      setTracking(true);
      setGpsStatus('GPS tracking is already active.');
      return;
    }

    setBusyAction('gps');
    clearMessages();

    try {
      const firstPoint = await requestGpsPoint();
      await recordGpsPoint(firstPoint, 'Live GPS started.');

      watchSubscriptionRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          distanceInterval: 10,
          timeInterval: 8000,
        },
        (position) => {
          recordGpsPoint(
            {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              recordedAt: new Date().toISOString(),
            },
            'Live GPS point saved.',
          );
        },
        (gpsError) => {
          setGpsStatus(gpsError);
        },
      );

      setTracking(true);
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'Unable to start GPS tracking.');
    } finally {
      setBusyAction(null);
    }
  };

  const stopLiveGps = () => {
    watchSubscriptionRef.current?.remove();
    watchSubscriptionRef.current = null;
    setTracking(false);
    setGpsStatus('GPS tracking stopped.');
  };

  const startPatrol = async () => {
    const saved = await savePatrolState('start');

    if (saved) {
      await startLiveGps();
    }
  };

  const completePatrol = async () => {
    const saved = await savePatrolState('complete');

    if (saved) {
      stopLiveGps();
    }
  };

  const markWaypoint = async () => {
    if (!activeReference) {
      setError('Select an assigned patrol first.');
      return;
    }

    setBusyAction('waypoint');
    clearMessages();

    let point = fieldPoint ?? initialPointForPatrol(selectedPatrol);

    try {
      point = await requestGpsPoint();
      setFieldPoint(point);
    } catch {
      setGpsStatus('GPS unavailable. Waypoint uses the last known field location.');
    }

    try {
      if (!getNetworkStatus()) {
        throw new Error('Network unavailable.');
      }

      await patrolApi.addWaypoint(session.token, activeReference, {
        latitude: point.latitude,
        longitude: point.longitude,
        note: waypointNote.trim() || currentArea,
      });
      await waypoints.refresh();
      setWaypointNote('');
      setMessage('Waypoint marked.');
    } catch {
      await enqueueOffline({
        label: `Waypoint ${activeReference}`,
        endpoint: `/api/patrols/${activeReference}/waypoints`,
        method: 'POST',
        body: {
          latitude: point.latitude,
          longitude: point.longitude,
          note: waypointNote.trim() || currentArea,
        },
      });
      setMessage('Waypoint saved locally for synchronization.');
    } finally {
      setBusyAction(null);
    }
  };

  const recordDemoMove = async () => {
    if (!selectedPatrol) {
      setError('Select an assigned patrol first.');
      return;
    }

    setBusyAction('demo');
    clearMessages();

    const recordedCount = locations.data?.length ?? 0;
    const startLatitude = selectedPatrol.routeStartLatitude ?? sampleParkLocation.latitude;
    const startLongitude = selectedPatrol.routeStartLongitude ?? sampleParkLocation.longitude;
    const endLatitude = selectedPatrol.routeEndLatitude ?? startLatitude + 0.006;
    const endLongitude = selectedPatrol.routeEndLongitude ?? startLongitude + 0.006;
    const progress = Math.min(1, (recordedCount + 1) / 8);
    const drift = (Math.random() - 0.5) / 2500;

    await recordGpsPoint(
      {
        latitude: Number((startLatitude + (endLatitude - startLatitude) * progress + drift).toFixed(6)),
        longitude: Number((startLongitude + (endLongitude - startLongitude) * progress + drift).toFixed(6)),
        accuracy: 8,
        recordedAt: new Date().toISOString(),
      },
      'Demo movement point saved.',
    );

    setMessage('Demo movement added to the patrol map.');
    setBusyAction(null);
  };

  return (
    <Stack>
      <SectionTitle
        title="My Patrol"
        subtitle="Start, mark important places, then complete the assigned route."
        action={<Button label="Refresh" onPress={patrols.refresh} variant="secondary" />}
      />

      <MessageBanner message={message} tone="sky" />
      <MessageBanner message={error} tone="red" />

      {patrols.loading ? <LoadingBlock label="Loading assigned patrols" /> : null}
      {patrols.error ? <ErrorBlock message={patrols.error} onRetry={patrols.refresh} /> : null}

      {!session.rangerDatabaseId ? (
        <EmptyBlock
          title="Ranger profile not linked"
          detail="Sign in with a ranger account that has a ranger ID."
        />
      ) : null}

      {!patrols.loading && !patrols.error && !patrols.data?.length ? (
        <EmptyBlock title="No assigned patrols" detail="A park manager can assign patrols from the web dashboard." />
      ) : null}

      {patrols.data && patrols.data.length > 1 ? (
        <Panel>
          <Stack>
            <SectionTitle title="Other Assigned Routes" subtitle="Tap another route only if the manager assigned more than one." />
            <View className="gap-2">
              {patrols.data.map((patrol) => {
                const selected = patrol.patrolReference === activeReference;

                return (
                  <Pressable
                    accessibilityRole="button"
                    key={patrol.patrolReference}
                    onPress={() => {
                      setSelectedReference(patrol.patrolReference);
                      if (!tracking) {
                        setFieldPoint(initialPointForPatrol(patrol));
                      }
                      clearMessages();
                    }}
                    className={cx(
                      'rounded-lg border p-3',
                      selected ? 'border-forest-600 bg-forest-50' : 'border-slate-200 bg-white',
                    )}
                  >
                    <View className="flex-row items-start justify-between gap-3">
                      <View className="min-w-0 flex-1">
                        <Text className="text-base font-bold text-slate-950">{patrol.routeName}</Text>
                        <Text className="mt-1 text-sm text-slate-600">{patrolProgressLabel(patrol.status)}</Text>
                      </View>
                      <StatusPill status={patrol.status} />
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </Stack>
        </Panel>
      ) : null}

      {selectedPatrol ? (
        <>
          <Panel>
            <Stack>
              <SectionTitle title="Today's Route" subtitle={selectedPatrol.routeName} />
              <RouteMap
                title={currentArea}
                routeSummary={`${describeLocation(
                  selectedPatrol.routeStartLatitude,
                  selectedPatrol.routeStartLongitude,
                )} to ${describeLocation(selectedPatrol.routeEndLatitude, selectedPatrol.routeEndLongitude)}`}
                startLatitude={selectedPatrol.routeStartLatitude}
                startLongitude={selectedPatrol.routeStartLongitude}
                endLatitude={selectedPatrol.routeEndLatitude}
                endLongitude={selectedPatrol.routeEndLongitude}
                currentLatitude={visiblePoint.latitude}
                currentLongitude={visiblePoint.longitude}
                recordedLocations={locations.data ?? []}
              />
              <DataCard
                title={patrolProgressLabel(selectedPatrol.status)}
                subtitle={gpsStatus}
                status={tracking ? 'Live GPS' : selectedPatrol.status}
                rows={[
                  { label: 'Track points', value: locations.data?.length ?? 0 },
                  { label: 'Waypoints', value: waypoints.data?.length ?? 0 },
                  { label: 'Current area', value: currentArea },
                ]}
              />
            </Stack>
          </Panel>

          <Panel>
            <Stack>
              <SectionTitle title="Field Actions" subtitle="Use these three buttons during the patrol." />
              <Row>
                <Button
                  label="Start"
                  onPress={startPatrol}
                  busy={busyAction === 'start' || busyAction === 'gps'}
                  disabled={selectedPatrol.status !== 'ASSIGNED'}
                  className="flex-1"
                />
                <Button
                  label="Complete"
                  onPress={completePatrol}
                  busy={busyAction === 'complete'}
                  disabled={selectedPatrol.status !== 'IN_PROGRESS'}
                  variant="secondary"
                  className="flex-1"
                />
              </Row>
              <Field
                label="Waypoint note"
                value={waypointNote}
                onChangeText={setWaypointNote}
                placeholder="Example: blocked track, footprints, damaged fence"
              />
              <Row>
                <Button
                  label="Mark Waypoint"
                  onPress={markWaypoint}
                  busy={busyAction === 'waypoint'}
                  disabled={selectedPatrol.status === 'COMPLETED'}
                  className="flex-1"
                />
                <Button
                  label="Demo GPS Move"
                  onPress={recordDemoMove}
                  busy={busyAction === 'demo'}
                  disabled={selectedPatrol.status === 'COMPLETED'}
                  variant="ghost"
                  className="flex-1"
                />
              </Row>
              <Text className="text-xs leading-5 text-slate-500">
                Demo GPS Move adds a sample track point for viva testing when you are not inside a real park.
              </Text>
            </Stack>
          </Panel>

          <Panel>
            <Stack>
              <SectionTitle title="Saved Records" subtitle="Proof that the patrol is being recorded." />
              <DataCard
                title="Current location"
                subtitle={currentArea}
                status={tracking ? 'Live' : selectedPatrol.status}
                rows={[
                  {
                    label: 'GPS accuracy',
                    value: visiblePoint.accuracy ? `${Math.round(visiblePoint.accuracy)}m` : 'Not available',
                  },
                  { label: 'Last update', value: formatDate(visiblePoint.recordedAt) },
                ]}
              />
              {latestLocation ? (
                <DataCard
                  title="Last recorded track point"
                  subtitle={describeLocation(latestLocation.latitude, latestLocation.longitude)}
                  status="Location"
                  rows={[{ label: 'Recorded', value: formatDate(latestLocation.recordedAt) }]}
                />
              ) : null}
              {latestWaypoint ? (
                <DataCard
                  title={latestWaypoint.note || 'Waypoint'}
                  subtitle={describeLocation(latestWaypoint.latitude, latestWaypoint.longitude)}
                  status="Waypoint"
                  rows={[
                    { label: 'Recorded', value: formatDate(latestWaypoint.recordedAt) },
                    { label: 'Area', value: describeLocation(latestWaypoint.latitude, latestWaypoint.longitude) },
                  ]}
                />
              ) : null}
              {!latestLocation && !latestWaypoint ? (
                <EmptyBlock title="No records yet" detail="Start or use Demo GPS Move to begin recording patrol coverage." />
              ) : null}
            </Stack>
          </Panel>
        </>
      ) : null}
    </Stack>
  );
}
