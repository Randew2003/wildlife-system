import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import {
  alertApi,
  animalApi,
  API_BASE_URL,
  conflictApi,
  incidentApi,
  nextAlertAction,
  patrolApi,
  patrolRouteApi,
  rangerApi,
  riskZoneApi,
} from '@/services/api';
import { enqueueOffline, flushOfflineQueue, getNetworkStatus, getOfflineQueue } from '@/services/offline';
import { useAuth } from '@/context/AuthContext';
import {
  AppSafeArea,
  BottomNavigation,
  Button,
  Card,
  compactCoordinate,
  ConfirmationDialog,
  DataGrid,
  DetailRow,
  EmptyState,
  ErrorState,
  formatDate,
  formatLabel,
  Input,
  LoadingState,
  MapCard,
  MetricCard,
  palette,
  QueueSummary,
  Screen,
  SectionHeader,
  Select,
  Sidebar,
  spacing,
  StatusBadge,
  ToastMessage,
  TopHeader,
} from '@/components/system';
import type {
  Animal,
  AuthSession,
  ConflictReport,
  ConflictReportPayload,
  ConflictReportStatus,
  GPSLocation,
  IncidentType,
  OfflineQueueItem,
  Patrol,
  PatrolLocation,
  Ranger,
  RiskAlert,
  RiskZone,
  UserRole,
  Waypoint,
  WildlifeIncident,
  WildlifeIncidentPayload,
} from '@/types/domain';

type MobileTab = 'home' | 'patrols' | 'alerts' | 'reports' | 'profile';
type ReportMode = 'incident' | 'conflict' | 'history';
type DashboardTab =
  | 'overview'
  | 'patrols'
  | 'monitoring'
  | 'alerts'
  | 'conflicts'
  | 'incidents'
  | 'animals'
  | 'zones'
  | 'rangers'
  | 'profile'
  | 'settings';

const incidentOptions: { label: string; value: IncidentType }[] = [
  { label: 'Snare', value: 'SNARE' },
  { label: 'Carcass', value: 'ANIMAL_CARCASS' },
  { label: 'Illegal camp', value: 'ILLEGAL_CAMPSITE' },
  { label: 'Footprints', value: 'ANIMAL_FOOTPRINTS' },
  { label: 'Other', value: 'OTHER' },
];

const roleOptions: { label: string; value: UserRole }[] = [
  { label: 'Ranger', value: 'RANGER' },
  { label: 'Community', value: 'COMMUNITY_MEMBER' },
  { label: 'Park Manager', value: 'PARK_MANAGER' },
];

const severityOptions = [
  { label: 'Low', value: 'LOW' },
  { label: 'Medium', value: 'MEDIUM' },
  { label: 'High', value: 'HIGH' },
] as const;

const mobileNavItems: { key: MobileTab; label: string; icon: string; roles?: UserRole[] }[] = [
  { key: 'home', label: 'Home', icon: 'H' },
  { key: 'patrols', label: 'Patrols', icon: 'P', roles: ['RANGER'] },
  { key: 'alerts', label: 'Alerts', icon: 'A', roles: ['RANGER'] },
  { key: 'reports', label: 'Reports', icon: 'R' },
  { key: 'profile', label: 'Profile', icon: 'U' },
];

const dashboardNavItems: { key: DashboardTab; label: string; icon: string }[] = [
  { key: 'overview', label: 'Overview', icon: 'O' },
  { key: 'patrols', label: 'Patrols', icon: 'P' },
  { key: 'monitoring', label: 'Live Monitoring', icon: 'M' },
  { key: 'alerts', label: 'Risk Alerts', icon: 'A' },
  { key: 'conflicts', label: 'Conflict Reports', icon: 'C' },
  { key: 'incidents', label: 'Wildlife Incidents', icon: 'I' },
  { key: 'animals', label: 'Animals', icon: 'N' },
  { key: 'zones', label: 'Risk Zones', icon: 'Z' },
  { key: 'rangers', label: 'Rangers', icon: 'G' },
  { key: 'profile', label: 'Profile', icon: 'U' },
  { key: 'settings', label: 'Settings', icon: 'S' },
];

type ResourceState<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  setData: (value: T) => void;
};

function useResource<T>(loader: () => Promise<T>, dependencies: unknown[]): ResourceState<T> {
  const dependencyKey = dependencies.map((value) => String(value ?? '')).join('|');
  const loaderRef = useRef(loader);
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loaderRef.current = loader;
  }, [loader]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      setData(await loaderRef.current());
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'Unable to load data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    Promise.resolve().then(async () => {
      setLoading(true);
      setError(null);

      try {
        const nextData = await loaderRef.current();

        if (mounted) {
          setData(nextData);
        }
      } catch (exception) {
        if (mounted) {
          setError(exception instanceof Error ? exception.message : 'Unable to load data.');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    });

    return () => {
      mounted = false;
    };
  }, [dependencyKey]);

  return { data, loading, error, refresh, setData };
}

function useOfflineQueueState(token?: string) {
  const [queue, setQueue] = useState<OfflineQueueItem[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const refreshQueue = useCallback(async () => {
    setQueue(await getOfflineQueue());
  }, []);

  useEffect(() => {
    let mounted = true;

    getOfflineQueue().then((nextQueue) => {
      if (mounted) {
        setQueue(nextQueue);
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  const syncNow = useCallback(async () => {
    if (!token) {
      return;
    }

    setSyncing(true);

    try {
      const result = await flushOfflineQueue(token);
      setQueue(result.remaining);
      setMessage(`${result.synced.length} pending item(s) synchronized.`);
    } finally {
      setSyncing(false);
    }
  }, [token]);

  return {
    queue,
    syncing,
    message,
    refreshQueue,
    syncNow,
    clearMessage: () => setMessage(null),
  };
}

export function WildlifeApp() {
  return (
    <AppSafeArea>
      <RootExperience />
    </AppSafeArea>
  );
}

function RootExperience() {
  const auth = useAuth();

  if (auth.initializing) {
    return <LoadingState message="Restoring secure session..." />;
  }

  if (!auth.session) {
    return <AuthScreen />;
  }

  return <AuthenticatedExperience session={auth.session} />;
}

function AuthScreen() {
  const auth = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<UserRole>('RANGER');
  const [rangerId, setRangerId] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const validate = () => {
    if (!email.trim() || !email.includes('@')) {
      return 'Enter a valid email address.';
    }

    if (mode === 'forgot') {
      return null;
    }

    if (mode === 'signup' && !fullName.trim()) {
      return 'Full name is required.';
    }

    if (password.length < 8) {
      return 'Password must be at least 8 characters.';
    }

    return null;
  };

  const submit = async () => {
    const validation = validate();
    setLocalError(validation);
    setSuccess(null);

    if (validation) {
      return;
    }

    try {
      if (mode === 'signin') {
        await auth.login({ email: email.trim(), password });
      } else if (mode === 'signup') {
        await auth.register({
          fullName: fullName.trim(),
          email: email.trim(),
          password,
          role,
          rangerId: rangerId.trim() || undefined,
        });
      } else {
        const message = await auth.forgotPassword(email.trim());
        setSuccess(message);
      }
    } catch {
      // Auth context exposes the final error message.
    }
  };

  return (
    <ScrollView style={localStyles.authScreen} contentContainerStyle={localStyles.authContent}>
      <View style={localStyles.authHero}>
        <Text style={localStyles.brandMark}>Wildlife Ops</Text>
        <Text style={localStyles.authTitle}>Smart Conservation Monitoring</Text>
        <Text style={localStyles.authSubtitle}>
          Sign in to coordinate patrols, risk alerts, animal monitoring, and community reports.
        </Text>
      </View>

      <Card style={localStyles.authCard}>
        <Select
          compact
          value={mode}
          onChange={setMode}
          options={[
            { label: 'Sign In', value: 'signin' },
            { label: 'Sign Up', value: 'signup' },
            { label: 'Forgot', value: 'forgot' },
          ]}
        />

        {mode === 'signup' ? (
          <>
            <Input label="Full name" value={fullName} onChangeText={setFullName} placeholder="Nimali Perera" />
            <Select label="Access role" value={role} onChange={setRole} options={roleOptions} />
            {role === 'RANGER' ? (
              <Input
                label="Ranger code"
                value={rangerId}
                onChangeText={setRangerId}
                placeholder="RGR-001"
              />
            ) : null}
          </>
        ) : null}

        <Input
          keyboardType="email-address"
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
        />

        {mode !== 'forgot' ? (
          <Input
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Minimum 8 characters"
            secureTextEntry={!showPassword}
            right={
              <Pressable onPress={() => setShowPassword((current) => !current)} style={localStyles.passwordToggle}>
                <Text style={localStyles.passwordToggleText}>{showPassword ? 'Hide' : 'Show'}</Text>
              </Pressable>
            }
          />
        ) : null}

        <ToastMessage message={localError ?? auth.error} tone="error" />
        <ToastMessage message={success} tone="success" />

        <Button loading={auth.loading} onPress={submit}>
          {mode === 'signin' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Send Reset Instructions'}
        </Button>
      </Card>
    </ScrollView>
  );
}

function AuthenticatedExperience({ session }: { session: AuthSession }) {
  const { width } = useWindowDimensions();
  const isManager = session.role === 'PARK_MANAGER' || session.role === 'SUPERVISOR';

  if (isManager || Platform.OS === 'web') {
    return <ManagerDashboard session={session} compact={width < 900} />;
  }

  return <MobileShell session={session} />;
}

function MobileShell({ session }: { session: AuthSession }) {
  const [activeTab, setActiveTab] = useState<MobileTab>('home');
  const queueState = useOfflineQueueState(session.token);
  const items = mobileNavItems.filter((item) => !item.roles || item.roles.includes(session.role));
  const visibleActiveTab = items.some((item) => item.key === activeTab) ? activeTab : 'home';

  return (
    <View style={localStyles.appRoot}>
      {visibleActiveTab === 'home' ? <MobileHome session={session} queue={queueState.queue} /> : null}
      {visibleActiveTab === 'patrols' ? (
        <MobilePatrols session={session} refreshQueue={queueState.refreshQueue} />
      ) : null}
      {visibleActiveTab === 'alerts' ? <MobileAlerts session={session} /> : null}
      {visibleActiveTab === 'reports' ? (
        <MobileReports session={session} queueState={queueState} />
      ) : null}
      {visibleActiveTab === 'profile' ? <ProfileScreen session={session} queueState={queueState} /> : null}
      <BottomNavigation items={items} active={visibleActiveTab} onChange={setActiveTab} />
    </View>
  );
}

function MobileHome({ session, queue }: { session: AuthSession; queue: OfflineQueueItem[] }) {
  const assigned = useResource(
    () =>
      session.role === 'RANGER' && session.rangerDatabaseId
        ? patrolApi.assigned(session.token, session.rangerDatabaseId)
        : Promise.resolve([]),
    [session.token, session.role, session.rangerDatabaseId],
  );
  const alerts = useResource(() => alertApi.all(session.token), [session.token]);
  const online = getNetworkStatus();
  const currentPatrol = assigned.data?.find((patrol) => patrol.status === 'IN_PROGRESS');

  return (
    <Screen
      title={`Hello, ${session.fullName.split(' ')[0] || 'Ranger'}`}
      subtitle="Field operations overview">
      <DataGrid>
        <MetricCard label="Current Patrol" value={currentPatrol ? currentPatrol.patrolReference : 'None'} />
        <MetricCard
          label="Active Alerts"
          value={(alerts.data ?? []).filter((alert) => alert.status !== 'RESOLVED').length}
          tone="danger"
        />
        <MetricCard label="Pending Sync" value={queue.length} tone={queue.length ? 'warning' : 'success'} />
      </DataGrid>

      <Card>
        <SectionHeader title="Operational Status" />
        <DetailRow label="Network" value={online ? 'Available' : 'Unavailable'} />
        <DetailRow
          label="GPS"
          value={hasGeolocation() ? 'Available when permission is granted' : 'Manual location required'}
        />
        <DetailRow label="API" value={API_BASE_URL} />
      </Card>

      {assigned.loading || alerts.loading ? <LoadingState /> : null}
      {assigned.error ? <ErrorState message={assigned.error} onRetry={assigned.refresh} /> : null}

      {currentPatrol ? (
        <PatrolCard patrol={currentPatrol} />
      ) : (
        <EmptyState
          title="No patrol in progress"
          message="Start an assigned patrol from the Patrols tab when you reach the route."
        />
      )}

      <SectionHeader title="Active Alerts" subtitle="Urgent movement and high-risk zone events" />
      {(alerts.data ?? [])
        .filter((alert) => alert.status !== 'RESOLVED')
        .slice(0, 3)
        .map((alert) => (
          <AlertCard key={alert.alertId} alert={alert} />
        ))}
      {alerts.data?.length === 0 ? (
        <EmptyState title="No active alerts" message="Risk alerts will appear here when animal movement is detected." />
      ) : null}
    </Screen>
  );
}

function MobilePatrols({
  session,
  refreshQueue,
}: {
  session: AuthSession;
  refreshQueue: () => Promise<void>;
}) {
  const [selectedRef, setSelectedRef] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const patrols = useResource(
    () =>
      session.rangerDatabaseId
        ? patrolApi.assigned(session.token, session.rangerDatabaseId)
        : Promise.resolve([]),
    [session.token, session.rangerDatabaseId],
  );
  const selectedPatrol = patrols.data?.find((patrol) => patrol.patrolReference === selectedRef) ?? null;

  const runAction = async (action: () => Promise<void>) => {
    setError(null);
    setMessage(null);

    try {
      await action();
      await patrols.refresh();
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'Patrol action failed.');
    }
  };

  if (!session.rangerDatabaseId) {
    return (
      <Screen title="Patrols" subtitle="Assigned route operations">
        <EmptyState
          title="No ranger profile linked"
          message="Sign up with a ranger code or ask a manager to link this account to a ranger record."
        />
      </Screen>
    );
  }

  if (selectedPatrol) {
    return (
      <PatrolDetail
        patrol={selectedPatrol}
        token={session.token}
        onBack={() => setSelectedRef(null)}
        onPatrolChanged={patrols.refresh}
        refreshQueue={refreshQueue}
      />
    );
  }

  return (
    <Screen title="Patrols" subtitle="Assigned patrol list and route status">
      <ToastMessage message={message} tone="success" />
      <ToastMessage message={error} tone="error" />
      {patrols.loading ? <LoadingState /> : null}
      {patrols.error ? <ErrorState message={patrols.error} onRetry={patrols.refresh} /> : null}
      {patrols.data?.length === 0 ? (
        <EmptyState title="No assigned patrols" message="Assigned patrols from the backend will appear here." />
      ) : null}
      {patrols.data?.map((patrol) => (
        <PatrolCard key={patrol.patrolReference} patrol={patrol} onPress={() => setSelectedRef(patrol.patrolReference)}>
          <View style={localStyles.rowActions}>
            {patrol.status === 'ASSIGNED' ? (
              <Button
                onPress={() =>
                  runAction(async () => {
                    await patrolApi.start(session.token, patrol.patrolReference);
                    setMessage('Patrol started.');
                  })
                }>
                Start Patrol
              </Button>
            ) : null}
            {patrol.status === 'IN_PROGRESS' ? (
              <Button
                onPress={() =>
                  runAction(async () => {
                    await patrolApi.complete(session.token, patrol.patrolReference);
                    setMessage('Patrol completed.');
                  })
                }>
                Complete
              </Button>
            ) : null}
          </View>
        </PatrolCard>
      ))}
    </Screen>
  );
}

function PatrolDetail({
  patrol,
  token,
  onBack,
  onPatrolChanged,
  refreshQueue,
}: {
  patrol: Patrol;
  token: string;
  onBack: () => void;
  onPatrolChanged: () => Promise<void>;
  refreshQueue: () => Promise<void>;
}) {
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [note, setNote] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const locations = useResource(() => patrolApi.locations(token, patrol.patrolReference), [
    token,
    patrol.patrolReference,
  ]);
  const waypoints = useResource(() => patrolApi.waypoints(token, patrol.patrolReference), [
    token,
    patrol.patrolReference,
  ]);

  const useGps = async () => {
    setError(null);

    try {
      const position = await getCurrentPosition();
      setLatitude(String(position.latitude));
      setLongitude(String(position.longitude));
      setMessage('GPS location captured.');
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'GPS is unavailable. Enter location manually.');
    }
  };

  const parseCoordinates = () => {
    const lat = Number(latitude);
    const lng = Number(longitude);

    if (Number.isNaN(lat) || lat < -90 || lat > 90) {
      throw new Error('Latitude must be between -90 and 90.');
    }

    if (Number.isNaN(lng) || lng < -180 || lng > 180) {
      throw new Error('Longitude must be between -180 and 180.');
    }

    return { lat, lng };
  };

  const saveLocation = async () => {
    setError(null);
    setMessage(null);

    try {
      const coords = parseCoordinates();
      await patrolApi.recordLocation(token, patrol.patrolReference, coords.lat, coords.lng);
      await locations.refresh();
      setMessage('Location recorded and synchronized.');
    } catch {
      try {
        const coords = parseCoordinates();
        await enqueueOffline({
          label: `Patrol location ${patrol.patrolReference}`,
          endpoint: `/api/patrols/${patrol.patrolReference}/locations`,
          method: 'POST',
          body: { latitude: coords.lat, longitude: coords.lng },
        });
        await refreshQueue();
        setMessage('Location saved as Pending Sync.');
      } catch (queueError) {
        setError(queueError instanceof Error ? queueError.message : 'Unable to save location.');
      }
    }
  };

  const saveWaypoint = async () => {
    setError(null);
    setMessage(null);

    try {
      const coords = parseCoordinates();
      const payload = { latitude: coords.lat, longitude: coords.lng, note: note.trim() || undefined };
      await patrolApi.addWaypoint(token, patrol.patrolReference, payload);
      await waypoints.refresh();
      setNote('');
      setMessage('Waypoint marked and synchronized.');
    } catch {
      try {
        const coords = parseCoordinates();
        await enqueueOffline({
          label: `Waypoint ${patrol.patrolReference}`,
          endpoint: `/api/patrols/${patrol.patrolReference}/waypoints`,
          method: 'POST',
          body: { latitude: coords.lat, longitude: coords.lng, note: note.trim() || undefined },
        });
        await refreshQueue();
        setMessage('Waypoint saved as Pending Sync.');
      } catch (queueError) {
        setError(queueError instanceof Error ? queueError.message : 'Unable to save waypoint.');
      }
    }
  };

  const startOrComplete = async () => {
    setError(null);
    setMessage(null);

    try {
      if (patrol.status === 'ASSIGNED') {
        await patrolApi.start(token, patrol.patrolReference);
        setMessage('Patrol started.');
      } else if (patrol.status === 'IN_PROGRESS') {
        await patrolApi.complete(token, patrol.patrolReference);
        setMessage('Patrol completed.');
      }

      await onPatrolChanged();
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'Unable to update patrol status.');
    }
  };

  return (
    <Screen
      title={patrol.patrolReference}
      subtitle={`${patrol.routeName} -> ${formatLabel(patrol.status)}`}
      action={<Button variant="secondary" onPress={onBack}>Back</Button>}>
      <ToastMessage message={message} tone="success" />
      <ToastMessage message={error} tone="error" />

      <Card>
        <SectionHeader title="Patrol Details" action={<StatusBadge value={patrol.status} />} />
        <DetailRow label="Ranger" value={patrol.rangerName} />
        <DetailRow label="Route" value={`${patrol.routeId} - ${patrol.routeName}`} />
        <DetailRow label="Started" value={formatDate(patrol.startTime)} />
        <DetailRow label="Completed" value={formatDate(patrol.endTime)} />
        {patrol.status !== 'COMPLETED' ? (
          <Button onPress={startOrComplete}>
            {patrol.status === 'ASSIGNED' ? 'Start Patrol' : 'Complete Patrol'}
          </Button>
        ) : null}
      </Card>

      <Card>
        <SectionHeader title="Active Patrol + GPS" subtitle="Record trail points and waypoint notes." />
        <View style={localStyles.formGrid}>
          <Input label="Latitude" value={latitude} onChangeText={setLatitude} keyboardType="numeric" />
          <Input label="Longitude" value={longitude} onChangeText={setLongitude} keyboardType="numeric" />
        </View>
        <Input label="Waypoint note" value={note} onChangeText={setNote} placeholder="Optional note" />
        <View style={localStyles.rowActions}>
          <Button variant="secondary" onPress={useGps}>Use GPS</Button>
          <Button onPress={saveLocation}>Record Location</Button>
          <Button variant="secondary" onPress={saveWaypoint}>Mark Waypoint</Button>
        </View>
        {!hasGeolocation() ? (
          <Text style={localStyles.helperText}>GPS is unavailable in this runtime. Manual location remains enabled.</Text>
        ) : null}
      </Card>

      <MapCard
        title="Patrol Route"
        points={[
          ...(locations.data ?? []).map((location) => ({
            id: `location-${location.id}`,
            label: 'L',
            latitude: location.latitude,
            longitude: location.longitude,
          })),
          ...(waypoints.data ?? []).map((waypoint) => ({
            id: `waypoint-${waypoint.id}`,
            label: 'W',
            latitude: waypoint.latitude,
            longitude: waypoint.longitude,
            tone: 'warning',
          })),
        ]}
      />

      <HistoryList title="Location History" loading={locations.loading} items={locations.data ?? []} />
      <WaypointList loading={waypoints.loading} items={waypoints.data ?? []} />
    </Screen>
  );
}

function MobileAlerts({ session }: { session: AuthSession }) {
  const alerts = useResource(() => alertApi.all(session.token), [session.token]);
  const animals = useResource(() => animalApi.all(session.token), [session.token]);
  const [selectedAnimalId, setSelectedAnimalId] = useState<string | null>(null);
  const [animalLocations, setAnimalLocations] = useState<GPSLocation[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedAnimal = animals.data?.find((animal) => animal.animalId === selectedAnimalId);

  useEffect(() => {
    let mounted = true;

    async function loadLocations() {
      if (!selectedAnimalId) {
        setAnimalLocations([]);
        return;
      }

      try {
        const data = await animalApi.locations(session.token, selectedAnimalId);

        if (mounted) {
          setAnimalLocations(data);
        }
      } catch {
        if (mounted) {
          setAnimalLocations([]);
        }
      }
    }

    loadLocations();

    return () => {
      mounted = false;
    };
  }, [selectedAnimalId, session.token]);

  const runAlertAction = async (alert: RiskAlert) => {
    const action = nextAlertAction(alert.status);

    if (!action) {
      return;
    }

    setError(null);
    setMessage(null);

    try {
      if (action === 'accept') {
        await alertApi.accept(session.token, alert.alertId);
      } else if (action === 'respond') {
        await alertApi.respond(session.token, alert.alertId);
      } else {
        await alertApi.resolve(session.token, alert.alertId);
      }

      await alerts.refresh();
      setMessage('Alert status updated.');
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'Unable to update alert.');
    }
  };

  return (
    <Screen title="Alerts" subtitle="GPS-collared animal monitoring and risk events">
      <ToastMessage message={message} tone="success" />
      <ToastMessage message={error} tone="error" />

      {alerts.loading || animals.loading ? <LoadingState /> : null}
      {alerts.error ? <ErrorState message={alerts.error} onRetry={alerts.refresh} /> : null}

      <MapCard
        title="Animal Alert Map"
        points={(alerts.data ?? []).map((alert) => ({
          id: alert.alertId,
          label: alert.animalName.slice(0, 3).toUpperCase(),
          latitude: alert.latitude,
          longitude: alert.longitude,
          tone: alert.status === 'RESOLVED' ? 'success' : 'danger',
        }))}
      />

      <SectionHeader title="Risk Alerts" />
      {(alerts.data ?? []).map((alert) => (
        <AlertCard key={alert.alertId} alert={alert}>
          {nextAlertAction(alert.status) ? (
            <Button onPress={() => runAlertAction(alert)}>{formatLabel(nextAlertAction(alert.status) ?? '')}</Button>
          ) : null}
        </AlertCard>
      ))}
      {alerts.data?.length === 0 ? (
        <EmptyState title="No alerts" message="Risk alerts will appear after GPS locations enter active zones." />
      ) : null}

      <SectionHeader title="Animal Monitoring" />
      {(animals.data ?? []).map((animal) => (
        <AnimalCard key={animal.animalId} animal={animal} onPress={() => setSelectedAnimalId(animal.animalId)} />
      ))}
      {selectedAnimal ? (
        <Card>
          <SectionHeader title={selectedAnimal.name} action={<StatusBadge value={selectedAnimal.collarActive} />} />
          <DetailRow label="Animal ID" value={selectedAnimal.animalId} />
          <DetailRow label="Species" value={selectedAnimal.species} />
          <DetailRow label="Last update" value={formatDate(animalLocations[0]?.recordedAt)} />
          <DetailRow label="Latitude" value={compactCoordinate(animalLocations[0]?.latitude)} />
          <DetailRow label="Longitude" value={compactCoordinate(animalLocations[0]?.longitude)} />
        </Card>
      ) : null}
    </Screen>
  );
}

function MobileReports({
  session,
  queueState,
}: {
  session: AuthSession;
  queueState: ReturnType<typeof useOfflineQueueState>;
}) {
  const [mode, setMode] = useState<ReportMode>(session.role === 'COMMUNITY_MEMBER' ? 'conflict' : 'incident');

  return (
    <Screen title="Reports" subtitle="Step-based reporting with offline protection">
      <Select
        value={mode}
        onChange={setMode}
        options={[
          ...(session.role === 'COMMUNITY_MEMBER' ? [] : [{ label: 'Incident', value: 'incident' as ReportMode }]),
          { label: 'Conflict', value: 'conflict' as ReportMode },
          { label: 'History', value: 'history' as ReportMode },
        ]}
      />
      {mode === 'incident' ? <IncidentWizard session={session} refreshQueue={queueState.refreshQueue} /> : null}
      {mode === 'conflict' ? <ConflictWizard session={session} refreshQueue={queueState.refreshQueue} /> : null}
      {mode === 'history' ? <ReportHistory session={session} queue={queueState.queue} /> : null}
    </Screen>
  );
}

function IncidentWizard({
  session,
  refreshQueue,
}: {
  session: AuthSession;
  refreshQueue: () => Promise<void>;
}) {
  const [step, setStep] = useState(0);
  const [incidentType, setIncidentType] = useState<IncidentType>('SNARE');
  const [photoUrls, setPhotoUrls] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [description, setDescription] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const steps = ['Incident Type', 'Evidence', 'Location', 'Description', 'Review'];

  const payload = (): WildlifeIncidentPayload => {
    const lat = Number(latitude);
    const lng = Number(longitude);

    if (Number.isNaN(lat) || lat < -90 || lat > 90) {
      throw new Error('Latitude must be between -90 and 90.');
    }

    if (Number.isNaN(lng) || lng < -180 || lng > 180) {
      throw new Error('Longitude must be between -180 and 180.');
    }

    if (!description.trim()) {
      throw new Error('Description is required.');
    }

    return {
      incidentType,
      latitude: lat,
      longitude: lng,
      description: description.trim(),
      photoUrls: photoUrls
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean),
    };
  };

  const captureGps = async () => {
    setError(null);

    try {
      const position = await getCurrentPosition();
      setLatitude(String(position.latitude));
      setLongitude(String(position.longitude));
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'GPS unavailable. Enter location manually.');
    }
  };

  const submit = async () => {
    setMessage(null);
    setError(null);

    try {
      const body = payload();
      await incidentApi.create(session.token, body);
      setMessage('Incident submitted and synchronized.');
      setStep(0);
      setDescription('');
      setPhotoUrls('');
    } catch {
      try {
        const body = payload();
        await enqueueOffline({
          label: `Wildlife incident ${formatLabel(body.incidentType)}`,
          endpoint: '/api/v1/incidents',
          method: 'POST',
          body,
        });
        await refreshQueue();
        setMessage('Incident saved as Pending Sync.');
      } catch (queueError) {
        setError(queueError instanceof Error ? queueError.message : 'Unable to submit incident.');
      }
    }
  };

  return (
    <Card>
      <WizardHeader steps={steps} step={step} />
      <ToastMessage message={message} tone="success" />
      <ToastMessage message={error} tone="error" />

      {step === 0 ? <Select label="Incident type" value={incidentType} onChange={setIncidentType} options={incidentOptions} /> : null}
      {step === 1 ? (
        <Input
          label="Photo/evidence URLs"
          value={photoUrls}
          onChangeText={setPhotoUrls}
          placeholder="Comma-separated evidence URLs"
        />
      ) : null}
      {step === 2 ? (
        <>
          <View style={localStyles.formGrid}>
            <Input label="Latitude" value={latitude} onChangeText={setLatitude} keyboardType="numeric" />
            <Input label="Longitude" value={longitude} onChangeText={setLongitude} keyboardType="numeric" />
          </View>
          <Button variant="secondary" onPress={captureGps}>Use Current GPS</Button>
        </>
      ) : null}
      {step === 3 ? (
        <Input
          multiline
          label="Description"
          value={description}
          onChangeText={setDescription}
          placeholder="Describe the scene, evidence, and urgency."
        />
      ) : null}
      {step === 4 ? (
        <ReviewPanel
          rows={[
            ['Type', formatLabel(incidentType)],
            ['Location', `${latitude || 'Unknown'}, ${longitude || 'Unknown'}`],
            ['Evidence', photoUrls || 'None'],
            ['Description', description || 'Not provided'],
          ]}
        />
      ) : null}

      <WizardActions step={step} maxStep={steps.length - 1} setStep={setStep} onSubmit={submit} />
    </Card>
  );
}

function ConflictWizard({
  session,
  refreshQueue,
}: {
  session: AuthSession;
  refreshQueue: () => Promise<void>;
}) {
  const [step, setStep] = useState(0);
  const [conflictType, setConflictType] = useState('Crop damage');
  const [description, setDescription] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [severity, setSeverity] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
  const [photoUrl, setPhotoUrl] = useState('');
  const [locationSource, setLocationSource] = useState<'GPS' | 'MANUAL'>('MANUAL');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const steps = ['Conflict Type', 'Description', 'Location', 'Evidence', 'Review'];

  const payload = (): ConflictReportPayload => {
    const lat = Number(latitude);
    const lng = Number(longitude);

    if (!conflictType.trim()) {
      throw new Error('Conflict type is required.');
    }

    if (!description.trim()) {
      throw new Error('Description is required.');
    }

    if (Number.isNaN(lat) || lat < -90 || lat > 90) {
      throw new Error('Latitude must be between -90 and 90.');
    }

    if (Number.isNaN(lng) || lng < -180 || lng > 180) {
      throw new Error('Longitude must be between -180 and 180.');
    }

    return {
      conflictType: conflictType.trim(),
      description: description.trim(),
      latitude: lat,
      longitude: lng,
      locationSource,
      severity,
      photoUrl: photoUrl.trim() || undefined,
    };
  };

  const captureGps = async () => {
    setError(null);

    try {
      const position = await getCurrentPosition();
      setLatitude(String(position.latitude));
      setLongitude(String(position.longitude));
      setLocationSource('GPS');
    } catch (exception) {
      setLocationSource('MANUAL');
      setError(exception instanceof Error ? exception.message : 'GPS unavailable. Enter location manually.');
    }
  };

  const submit = async () => {
    setMessage(null);
    setError(null);

    try {
      const body = payload();
      await conflictApi.create(session.token, body);
      setMessage('Conflict report submitted and synchronized.');
      setStep(0);
      setDescription('');
      setPhotoUrl('');
    } catch {
      try {
        const body = payload();
        await enqueueOffline({
          label: `Conflict report ${body.conflictType}`,
          endpoint: '/api/conflict-reports/offline',
          method: 'POST',
          body,
        });
        await refreshQueue();
        setMessage('Conflict report saved as Pending Sync.');
      } catch (queueError) {
        setError(queueError instanceof Error ? queueError.message : 'Unable to submit conflict report.');
      }
    }
  };

  return (
    <Card>
      <WizardHeader steps={steps} step={step} />
      <ToastMessage message={message} tone="success" />
      <ToastMessage message={error} tone="error" />

      {step === 0 ? (
        <>
          <Input label="Conflict type" value={conflictType} onChangeText={setConflictType} />
          <Select label="Severity" value={severity} onChange={setSeverity} options={[...severityOptions]} />
        </>
      ) : null}
      {step === 1 ? (
        <Input
          multiline
          label="Description"
          value={description}
          onChangeText={setDescription}
          placeholder="Describe people, crops, livestock, animal signs, and immediate risk."
        />
      ) : null}
      {step === 2 ? (
        <>
          <Select
            label="Location source"
            value={locationSource}
            onChange={setLocationSource}
            options={[
              { label: 'GPS', value: 'GPS' },
              { label: 'Manual', value: 'MANUAL' },
            ]}
          />
          <View style={localStyles.formGrid}>
            <Input label="Latitude" value={latitude} onChangeText={setLatitude} keyboardType="numeric" />
            <Input label="Longitude" value={longitude} onChangeText={setLongitude} keyboardType="numeric" />
          </View>
          <Button variant="secondary" onPress={captureGps}>Use Current GPS</Button>
        </>
      ) : null}
      {step === 3 ? (
        <Input label="Optional photo URL" value={photoUrl} onChangeText={setPhotoUrl} placeholder="Evidence image URL" />
      ) : null}
      {step === 4 ? (
        <ReviewPanel
          rows={[
            ['Type', conflictType],
            ['Severity', severity],
            ['Location', `${latitude || 'Unknown'}, ${longitude || 'Unknown'} (${locationSource})`],
            ['Photo', photoUrl || 'None'],
            ['Description', description || 'Not provided'],
          ]}
        />
      ) : null}

      <WizardActions step={step} maxStep={steps.length - 1} setStep={setStep} onSubmit={submit} />
    </Card>
  );
}

function ReportHistory({ session, queue }: { session: AuthSession; queue: OfflineQueueItem[] }) {
  const incidents = useResource(
    () => (session.role === 'COMMUNITY_MEMBER' ? Promise.resolve([]) : incidentApi.all(session.token)),
    [session.token, session.role],
  );
  const conflicts = useResource(() => conflictApi.all(session.token), [session.token]);

  return (
    <View style={localStyles.stack}>
      <Card>
        <SectionHeader title="Pending Sync" />
        <QueueSummary queue={queue} />
      </Card>
      {incidents.loading || conflicts.loading ? <LoadingState /> : null}
      {incidents.error ? <ErrorState message={incidents.error} onRetry={incidents.refresh} /> : null}
      {conflicts.error ? <ErrorState message={conflicts.error} onRetry={conflicts.refresh} /> : null}
      {session.role !== 'COMMUNITY_MEMBER' ? (
        <>
          <SectionHeader title="Wildlife Incidents" />
          {(incidents.data ?? []).map((incident) => (
            <IncidentCard key={incident.id} incident={incident} />
          ))}
        </>
      ) : null}
      <SectionHeader title="Conflict Reports" />
      {(conflicts.data ?? []).map((report) => (
        <ConflictCard key={report.reportId} report={report} />
      ))}
    </View>
  );
}

function ProfileScreen({
  session,
  queueState,
}: {
  session: AuthSession;
  queueState: ReturnType<typeof useOfflineQueueState>;
}) {
  const auth = useAuth();

  return (
    <Screen title="Profile" subtitle="Session, role, and synchronization controls">
      <ToastMessage message={queueState.message} tone="success" />
      <Card>
        <SectionHeader title={session.fullName} action={<StatusBadge value={session.role} />} />
        <DetailRow label="Email" value={session.email} />
        <DetailRow label="Ranger code" value={session.rangerId ?? 'Not linked'} />
        <DetailRow label="Ranger database ID" value={session.rangerDatabaseId ?? 'Not linked'} />
        <DetailRow label="API base URL" value={API_BASE_URL} />
      </Card>
      <Card>
        <SectionHeader
          title="Offline Queue"
          action={
            <Button loading={queueState.syncing} variant="secondary" onPress={queueState.syncNow}>
              Synchronize
            </Button>
          }
        />
        <QueueSummary queue={queueState.queue} />
      </Card>
      <Button variant="danger" onPress={auth.logout}>Logout</Button>
    </Screen>
  );
}

function ManagerDashboard({ session, compact }: { session: AuthSession; compact: boolean }) {
  const auth = useAuth();
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const queueState = useOfflineQueueState(session.token);
  const title = dashboardNavItems.find((item) => item.key === activeTab)?.label ?? 'Dashboard';

  const body = (
    <>
      <TopHeader
        title={title}
        subtitle={`${session.role === 'SUPERVISOR' ? 'Supervisor' : 'Park Manager'} operations dashboard`}
        right={<Button variant="secondary" onPress={auth.logout}>Logout</Button>}
      />
      <View style={localStyles.dashboardContent}>
        {compact ? <CompactDashboardNav active={activeTab} onChange={setActiveTab} /> : null}
        {activeTab === 'overview' ? <ManagerOverview token={session.token} /> : null}
        {activeTab === 'patrols' ? <ManagerPatrols token={session.token} /> : null}
        {activeTab === 'monitoring' ? <ManagerMonitoring token={session.token} /> : null}
        {activeTab === 'alerts' ? <ManagerAlerts token={session.token} /> : null}
        {activeTab === 'conflicts' ? <ManagerConflicts token={session.token} /> : null}
        {activeTab === 'incidents' ? <ManagerIncidents token={session.token} /> : null}
        {activeTab === 'animals' ? <ManagerAnimals token={session.token} /> : null}
        {activeTab === 'zones' ? <ManagerRiskZones token={session.token} /> : null}
        {activeTab === 'rangers' ? <ManagerRangers token={session.token} /> : null}
        {activeTab === 'profile' ? <ProfileScreen session={session} queueState={queueState} /> : null}
        {activeTab === 'settings' ? <ManagerSettings queueState={queueState} /> : null}
      </View>
    </>
  );

  if (compact) {
    return <View style={localStyles.dashboardRootCompact}>{body}</View>;
  }

  return (
    <View style={localStyles.dashboardRoot}>
      <Sidebar
        brand="Wildlife Ops"
        items={dashboardNavItems}
        active={activeTab}
        onChange={setActiveTab}
        footer={<Text style={localStyles.sidebarUser}>{session.fullName}</Text>}
      />
      <View style={localStyles.dashboardMain}>{body}</View>
    </View>
  );
}

function CompactDashboardNav({
  active,
  onChange,
}: {
  active: DashboardTab;
  onChange: (tab: DashboardTab) => void;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={localStyles.compactNav}>
      {dashboardNavItems.map((item) => (
        <Pressable
          key={item.key}
          onPress={() => onChange(item.key)}
          style={[localStyles.compactNavItem, item.key === active && localStyles.compactNavItemActive]}>
          <Text style={[localStyles.compactNavText, item.key === active && localStyles.compactNavTextActive]}>
            {item.label}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

function ManagerOverview({ token }: { token: string }) {
  const overview = useResource(
    async () => {
      const [patrols, alerts, conflicts, incidents, animals, zones] = await Promise.all([
        patrolApi.all(token),
        alertApi.all(token),
        conflictApi.all(token),
        incidentApi.all(token),
        animalApi.all(token),
        riskZoneApi.all(token),
      ]);

      return { patrols, alerts, conflicts, incidents, animals, zones };
    },
    [token],
  );

  if (overview.loading) {
    return <LoadingState />;
  }

  if (overview.error || !overview.data) {
    return <ErrorState message={overview.error ?? 'Unable to load overview.'} onRetry={overview.refresh} />;
  }

  const { patrols, alerts, conflicts, incidents, animals, zones } = overview.data;

  return (
    <ScrollView contentContainerStyle={localStyles.dashboardScroll}>
      <DataGrid>
        <MetricCard label="Active Patrols" value={patrols.filter((patrol) => patrol.status === 'IN_PROGRESS').length} />
        <MetricCard label="Completed Patrols" value={patrols.filter((patrol) => patrol.status === 'COMPLETED').length} tone="success" />
        <MetricCard label="Active Alerts" value={alerts.filter((alert) => alert.status !== 'RESOLVED').length} tone="danger" />
        <MetricCard label="Unresolved Conflicts" value={conflicts.filter((report) => !['RESOLVED', 'CLOSED'].includes(report.status)).length} tone="warning" />
        <MetricCard label="Monitored Animals" value={animals.length} tone="info" />
      </DataGrid>
      <MapCard
        title="Operational Map"
        points={[
          ...alerts.map((alert) => ({
            id: alert.alertId,
            label: alert.animalName.slice(0, 3).toUpperCase(),
            latitude: alert.latitude,
            longitude: alert.longitude,
            tone: alert.status === 'RESOLVED' ? 'success' : 'danger',
          })),
          ...incidents.map((incident) => ({
            id: `incident-${incident.id}`,
            label: 'INC',
            latitude: incident.latitude,
            longitude: incident.longitude,
            tone: 'warning',
          })),
          ...conflicts.map((report) => ({
            id: report.reportId,
            label: 'CON',
            latitude: report.latitude,
            longitude: report.longitude,
          })),
        ]}
        zones={zones.map((zone) => ({
          id: String(zone.id),
          label: zone.zoneName,
          latitude: zone.centerLatitude,
          longitude: zone.centerLongitude,
          radius: zone.radiusMeters,
          active: zone.active,
        }))}
      />
      <View style={localStyles.dashboardColumns}>
        <Card style={localStyles.dashboardColumn}>
          <SectionHeader title="Recent Incidents" />
          {incidents.slice(0, 5).map((incident) => (
            <IncidentCard key={incident.id} incident={incident} compact />
          ))}
          {!incidents.length ? <EmptyState title="No incidents" message="Incident submissions will appear here." /> : null}
        </Card>
        <Card style={localStyles.dashboardColumn}>
          <SectionHeader title="Recent Activity" />
          {[...alerts.slice(0, 3), ...conflicts.slice(0, 3)].map((item) =>
            'alertId' in item ? (
              <AlertCard key={item.alertId} alert={item} compact />
            ) : (
              <ConflictCard key={item.reportId} report={item} compact />
            ),
          )}
        </Card>
      </View>
    </ScrollView>
  );
}

function ManagerPatrols({ token }: { token: string }) {
  const data = useResource(
    async () => {
      const [patrols, rangers, routes] = await Promise.all([
        patrolApi.all(token),
        rangerApi.all(token),
        patrolRouteApi.all(token),
      ]);
      return { patrols, rangers, routes };
    },
    [token],
  );
  const [selectedRef, setSelectedRef] = useState<string | null>(null);
  const [rangerId, setRangerId] = useState('');
  const [routeId, setRouteId] = useState('');
  const [patrolReference, setPatrolReference] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedPatrol = data.data?.patrols.find((patrol) => patrol.patrolReference === selectedRef);

  const assignPatrol = async () => {
    setMessage(null);
    setError(null);

    try {
      await patrolApi.assign(token, {
        patrolReference: patrolReference.trim() || undefined,
        rangerId: rangerId.trim(),
        routeId: routeId.trim(),
      });
      setMessage('Patrol assigned.');
      setPatrolReference('');
      await data.refresh();
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'Unable to assign patrol.');
    }
  };

  if (data.loading) {
    return <LoadingState />;
  }

  if (data.error || !data.data) {
    return <ErrorState message={data.error ?? 'Unable to load patrols.'} onRetry={data.refresh} />;
  }

  return (
    <ScrollView contentContainerStyle={localStyles.dashboardScroll}>
      <ToastMessage message={message} tone="success" />
      <ToastMessage message={error} tone="error" />
      <DataGrid>
        <MetricCard label="Assigned" value={data.data.patrols.filter((patrol) => patrol.status === 'ASSIGNED').length} />
        <MetricCard label="In Progress" value={data.data.patrols.filter((patrol) => patrol.status === 'IN_PROGRESS').length} tone="warning" />
        <MetricCard label="Completed" value={data.data.patrols.filter((patrol) => patrol.status === 'COMPLETED').length} tone="success" />
      </DataGrid>
      <Card>
        <SectionHeader title="Assign Patrol" subtitle="Uses existing ranger and route records." />
        <View style={localStyles.formGrid}>
          <Input label="Ranger ID" value={rangerId} onChangeText={setRangerId} placeholder={data.data.rangers[0]?.rangerId ?? 'RGR-001'} />
          <Input label="Route ID" value={routeId} onChangeText={setRouteId} placeholder={data.data.routes[0]?.routeId ?? 'ROUTE-001'} />
          <Input label="Patrol reference" value={patrolReference} onChangeText={setPatrolReference} placeholder="Optional" />
        </View>
        <Button onPress={assignPatrol}>Assign Patrol</Button>
      </Card>
      <View style={localStyles.dashboardColumns}>
        <View style={localStyles.dashboardColumn}>
          <SectionHeader title="All Patrols" />
          {data.data.patrols.map((patrol) => (
            <PatrolCard key={patrol.patrolReference} patrol={patrol} onPress={() => setSelectedRef(patrol.patrolReference)} />
          ))}
          {!data.data.patrols.length ? <EmptyState title="No patrols" message="Create assigned patrols from this dashboard." /> : null}
        </View>
        <View style={localStyles.dashboardColumn}>
          {selectedPatrol ? (
            <PatrolInspector token={token} patrol={selectedPatrol} />
          ) : (
            <EmptyState title="Select a patrol" message="Patrol route, location history, and waypoints appear here." />
          )}
        </View>
      </View>
    </ScrollView>
  );
}

function PatrolInspector({ token, patrol }: { token: string; patrol: Patrol }) {
  const locations = useResource(() => patrolApi.locations(token, patrol.patrolReference), [token, patrol.patrolReference]);
  const waypoints = useResource(() => patrolApi.waypoints(token, patrol.patrolReference), [token, patrol.patrolReference]);

  return (
    <View style={localStyles.stack}>
      <Card>
        <SectionHeader title={patrol.patrolReference} action={<StatusBadge value={patrol.status} />} />
        <DetailRow label="Ranger" value={patrol.rangerName} />
        <DetailRow label="Route" value={patrol.routeName} />
        <DetailRow label="Start" value={formatDate(patrol.startTime)} />
        <DetailRow label="End" value={formatDate(patrol.endTime)} />
      </Card>
      <MapCard
        title="Patrol Trail"
        points={[
          ...(locations.data ?? []).map((location) => ({
            id: `loc-${location.id}`,
            label: 'L',
            latitude: location.latitude,
            longitude: location.longitude,
          })),
          ...(waypoints.data ?? []).map((waypoint) => ({
            id: `way-${waypoint.id}`,
            label: 'W',
            latitude: waypoint.latitude,
            longitude: waypoint.longitude,
            tone: 'warning',
          })),
        ]}
      />
      <HistoryList title="Location History" loading={locations.loading} items={locations.data ?? []} />
      <WaypointList loading={waypoints.loading} items={waypoints.data ?? []} />
    </View>
  );
}

function ManagerMonitoring({ token }: { token: string }) {
  const data = useResource(
    async () => {
      const [animals, alerts, zones] = await Promise.all([animalApi.all(token), alertApi.all(token), riskZoneApi.all(token)]);
      return { animals, alerts, zones };
    },
    [token],
  );
  const [selectedAnimalId, setSelectedAnimalId] = useState<string | null>(null);
  const [locations, setLocations] = useState<GPSLocation[]>([]);
  const selectedAnimal = data.data?.animals.find((animal) => animal.animalId === selectedAnimalId);

  useEffect(() => {
    let mounted = true;

    async function loadLocations() {
      if (!selectedAnimalId) {
        setLocations([]);
        return;
      }

      try {
        const response = await animalApi.locations(token, selectedAnimalId);
        if (mounted) {
          setLocations(response);
        }
      } catch {
        if (mounted) {
          setLocations([]);
        }
      }
    }

    loadLocations();

    return () => {
      mounted = false;
    };
  }, [selectedAnimalId, token]);

  if (data.loading) {
    return <LoadingState />;
  }

  if (data.error || !data.data) {
    return <ErrorState message={data.error ?? 'Unable to load monitoring data.'} onRetry={data.refresh} />;
  }

  return (
    <ScrollView contentContainerStyle={localStyles.dashboardScroll}>
      <MapCard
        title="Live Monitoring Map"
        points={[
          ...data.data.alerts.map((alert) => ({
            id: alert.alertId,
            label: alert.animalName.slice(0, 3).toUpperCase(),
            latitude: alert.latitude,
            longitude: alert.longitude,
            tone: alert.status === 'RESOLVED' ? 'success' : 'danger',
          })),
          ...locations.map((location) => ({
            id: `animal-location-${location.id}`,
            label: selectedAnimal?.name.slice(0, 3).toUpperCase() ?? 'GPS',
            latitude: location.latitude,
            longitude: location.longitude,
          })),
        ]}
        zones={data.data.zones.map((zone) => ({
          id: String(zone.id),
          label: zone.zoneName,
          latitude: zone.centerLatitude,
          longitude: zone.centerLongitude,
          radius: zone.radiusMeters,
          active: zone.active,
        }))}
      />
      <View style={localStyles.dashboardColumns}>
        <View style={localStyles.dashboardColumn}>
          <SectionHeader title="Animals" />
          {data.data.animals.map((animal) => (
            <AnimalCard key={animal.animalId} animal={animal} onPress={() => setSelectedAnimalId(animal.animalId)} />
          ))}
        </View>
        <View style={localStyles.dashboardColumn}>
          {selectedAnimal ? (
            <Card>
              <SectionHeader title={selectedAnimal.name} action={<StatusBadge value={selectedAnimal.collarActive} />} />
              <DetailRow label="Animal ID" value={selectedAnimal.animalId} />
              <DetailRow label="Species" value={selectedAnimal.species} />
              <DetailRow label="Last known latitude" value={compactCoordinate(locations[0]?.latitude)} />
              <DetailRow label="Last known longitude" value={compactCoordinate(locations[0]?.longitude)} />
              <DetailRow label="Last update" value={formatDate(locations[0]?.recordedAt)} />
            </Card>
          ) : (
            <EmptyState title="Select an animal" message="Current location and recent GPS history will appear here." />
          )}
          <SectionHeader title="Open Alerts" />
          {data.data.alerts
            .filter((alert) => alert.status !== 'RESOLVED')
            .map((alert) => (
              <AlertCard key={alert.alertId} alert={alert} />
            ))}
        </View>
      </View>
    </ScrollView>
  );
}

function ManagerAlerts({ token }: { token: string }) {
  const alerts = useResource(() => alertApi.all(token), [token]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const updateAlert = async (alert: RiskAlert) => {
    const action = nextAlertAction(alert.status);

    if (!action) {
      return;
    }

    setError(null);
    setMessage(null);

    try {
      if (action === 'accept') {
        await alertApi.accept(token, alert.alertId);
      } else if (action === 'respond') {
        await alertApi.respond(token, alert.alertId);
      } else {
        await alertApi.resolve(token, alert.alertId);
      }
      await alerts.refresh();
      setMessage('Alert updated.');
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'Unable to update alert.');
    }
  };

  if (alerts.loading) {
    return <LoadingState />;
  }

  if (alerts.error) {
    return <ErrorState message={alerts.error} onRetry={alerts.refresh} />;
  }

  return (
    <ScrollView contentContainerStyle={localStyles.dashboardScroll}>
      <ToastMessage message={message} tone="success" />
      <ToastMessage message={error} tone="error" />
      <MapCard
        title="Risk Alert Map"
        points={(alerts.data ?? []).map((alert) => ({
          id: alert.alertId,
          label: alert.animalName.slice(0, 3).toUpperCase(),
          latitude: alert.latitude,
          longitude: alert.longitude,
          tone: alert.status === 'RESOLVED' ? 'success' : 'danger',
        }))}
      />
      {(alerts.data ?? []).map((alert) => (
        <AlertCard key={alert.alertId} alert={alert}>
          <DetailRow label="Risk zone" value={alert.riskZoneName ?? alert.riskZoneId} />
          <DetailRow label="Detected" value={formatDate(alert.detectedAt)} />
          {nextAlertAction(alert.status) ? (
            <Button onPress={() => updateAlert(alert)}>{formatLabel(nextAlertAction(alert.status) ?? '')}</Button>
          ) : null}
        </AlertCard>
      ))}
      {alerts.data?.length === 0 ? <EmptyState title="No risk alerts" message="Alerts are created by GPS locations inside active risk zones." /> : null}
    </ScrollView>
  );
}

function ManagerConflicts({ token }: { token: string }) {
  const reports = useResource(() => conflictApi.all(token), [token]);
  const [statusFilter, setStatusFilter] = useState<'ALL' | ConflictReportStatus>('ALL');
  const [ranger, setRanger] = useState('');
  const [notes, setNotes] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const filteredReports = (reports.data ?? []).filter(
    (report) => statusFilter === 'ALL' || report.status === statusFilter,
  );

  const transition = async (report: ConflictReport, action: string) => {
    setError(null);
    setMessage(null);

    try {
      if (action === 'review') {
        await conflictApi.review(token, report.reportId);
      } else if (action === 'assign') {
        await conflictApi.assign(token, report.reportId, ranger.trim());
      } else if (action === 'respond') {
        await conflictApi.respond(token, report.reportId);
      } else if (action === 'resolve') {
        await conflictApi.resolve(token, report.reportId, notes.trim() || undefined);
      } else if (action === 'close') {
        await conflictApi.close(token, report.reportId);
      } else if (action === 'sync') {
        await conflictApi.sync(token, report.reportId);
      }
      await reports.refresh();
      setMessage('Conflict report updated.');
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'Unable to update report.');
    }
  };

  if (reports.loading) {
    return <LoadingState />;
  }

  if (reports.error) {
    return <ErrorState message={reports.error} onRetry={reports.refresh} />;
  }

  return (
    <ScrollView contentContainerStyle={localStyles.dashboardScroll}>
      <ToastMessage message={message} tone="success" />
      <ToastMessage message={error} tone="error" />
      <Card>
        <SectionHeader title="Filters" />
        <Select
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { label: 'All', value: 'ALL' },
            { label: 'Submitted', value: 'SUBMITTED' },
            { label: 'Review', value: 'UNDER_REVIEW' },
            { label: 'Assigned', value: 'ASSIGNED' },
            { label: 'Responding', value: 'RESPONDING' },
            { label: 'Resolved', value: 'RESOLVED' },
            { label: 'Closed', value: 'CLOSED' },
          ]}
        />
        <View style={localStyles.formGrid}>
          <Input label="Ranger assignment" value={ranger} onChangeText={setRanger} placeholder="RGR-001" />
          <Input label="Response notes" value={notes} onChangeText={setNotes} placeholder="Optional resolve notes" />
        </View>
      </Card>
      {filteredReports.map((report) => (
        <ConflictCard key={report.reportId} report={report}>
          <ConflictActions report={report} onAction={(action) => transition(report, action)} />
        </ConflictCard>
      ))}
      {!filteredReports.length ? <EmptyState title="No reports match filters" message="Try a different status filter." /> : null}
    </ScrollView>
  );
}

function ManagerIncidents({ token }: { token: string }) {
  const incidents = useResource(() => incidentApi.all(token), [token]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const retry = async (incident: WildlifeIncident) => {
    setMessage(null);
    setError(null);

    try {
      await incidentApi.retrySync(token, incident.id);
      await incidents.refresh();
      setMessage('Incident synchronized.');
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'Unable to retry sync.');
    }
  };

  if (incidents.loading) {
    return <LoadingState />;
  }

  if (incidents.error) {
    return <ErrorState message={incidents.error} onRetry={incidents.refresh} />;
  }

  return (
    <ScrollView contentContainerStyle={localStyles.dashboardScroll}>
      <ToastMessage message={message} tone="success" />
      <ToastMessage message={error} tone="error" />
      {(incidents.data ?? []).map((incident) => (
        <IncidentCard key={incident.id} incident={incident}>
          <DetailRow label="Evidence" value={incident.photoUrls?.length ? `${incident.photoUrls.length} photo URL(s)` : 'None'} />
          {incident.status !== 'SYNCED' ? <Button onPress={() => retry(incident)}>Retry Sync</Button> : null}
        </IncidentCard>
      ))}
      {incidents.data?.length === 0 ? <EmptyState title="No incidents" message="Wildlife incidents submitted by rangers appear here." /> : null}
    </ScrollView>
  );
}

function ManagerAnimals({ token }: { token: string }) {
  const animals = useResource(() => animalApi.all(token), [token]);
  const [animalId, setAnimalId] = useState('');
  const [name, setName] = useState('');
  const [species, setSpecies] = useState('');
  const [collarActive, setCollarActive] = useState<'true' | 'false'>('true');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Animal | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setAnimalId('');
    setName('');
    setSpecies('');
    setCollarActive('true');
    setEditingId(null);
  };

  const save = async () => {
    setMessage(null);
    setError(null);

    try {
      const payload: Animal = {
        animalId: animalId.trim(),
        name: name.trim(),
        species: species.trim(),
        collarActive: collarActive === 'true',
      };

      if (!payload.animalId || !payload.name || !payload.species) {
        throw new Error('Animal ID, name, and species are required.');
      }

      if (editingId) {
        await animalApi.update(token, editingId, payload);
      } else {
        await animalApi.create(token, payload);
      }

      resetForm();
      await animals.refresh();
      setMessage(editingId ? 'Animal updated.' : 'Animal created.');
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'Unable to save animal.');
    }
  };

  const edit = (animal: Animal) => {
    setEditingId(animal.animalId);
    setAnimalId(animal.animalId);
    setName(animal.name);
    setSpecies(animal.species);
    setCollarActive(animal.collarActive ? 'true' : 'false');
  };

  const remove = async () => {
    if (!deleteTarget) {
      return;
    }

    try {
      await animalApi.remove(token, deleteTarget.animalId);
      setDeleteTarget(null);
      await animals.refresh();
      setMessage('Animal deleted.');
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'Unable to delete animal.');
    }
  };

  if (animals.loading) {
    return <LoadingState />;
  }

  if (animals.error) {
    return <ErrorState message={animals.error} onRetry={animals.refresh} />;
  }

  return (
    <ScrollView contentContainerStyle={localStyles.dashboardScroll}>
      <ToastMessage message={message} tone="success" />
      <ToastMessage message={error} tone="error" />
      <Card>
        <SectionHeader title={editingId ? 'Edit Animal' : 'Create Animal'} />
        <View style={localStyles.formGrid}>
          <Input label="Animal ID" value={animalId} onChangeText={setAnimalId} placeholder="ANM-001" />
          <Input label="Name" value={name} onChangeText={setName} placeholder="Nala" />
          <Input label="Species" value={species} onChangeText={setSpecies} placeholder="Elephant" />
        </View>
        <Select
          label="Collar status"
          value={collarActive}
          onChange={setCollarActive}
          options={[
            { label: 'Active', value: 'true' },
            { label: 'Inactive', value: 'false' },
          ]}
        />
        <View style={localStyles.rowActions}>
          <Button onPress={save}>{editingId ? 'Update Animal' : 'Create Animal'}</Button>
          {editingId ? <Button variant="secondary" onPress={resetForm}>Cancel</Button> : null}
        </View>
      </Card>
      {(animals.data ?? []).map((animal) => (
        <AnimalCard key={animal.animalId} animal={animal}>
          <View style={localStyles.rowActions}>
            <Button variant="secondary" onPress={() => edit(animal)}>Edit</Button>
            <Button variant="danger" onPress={() => setDeleteTarget(animal)}>Delete</Button>
          </View>
        </AnimalCard>
      ))}
      <ConfirmationDialog
        visible={!!deleteTarget}
        title="Delete animal"
        message={`Delete ${deleteTarget?.name ?? 'this animal'} from monitoring records?`}
        confirmLabel="Delete"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={remove}
      />
    </ScrollView>
  );
}

function ManagerRiskZones({ token }: { token: string }) {
  const zones = useResource(() => riskZoneApi.all(token), [token]);
  const [zoneName, setZoneName] = useState('');
  const [centerLatitude, setCenterLatitude] = useState('');
  const [centerLongitude, setCenterLongitude] = useState('');
  const [radiusMeters, setRadiusMeters] = useState('');
  const [active, setActive] = useState<'true' | 'false'>('true');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RiskZone | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setZoneName('');
    setCenterLatitude('');
    setCenterLongitude('');
    setRadiusMeters('');
    setActive('true');
    setEditingId(null);
  };

  const buildPayload = (): RiskZone => {
    const latitude = Number(centerLatitude);
    const longitude = Number(centerLongitude);
    const radius = Number(radiusMeters);

    if (!zoneName.trim()) {
      throw new Error('Zone name is required.');
    }

    if (Number.isNaN(latitude) || latitude < -90 || latitude > 90) {
      throw new Error('Latitude must be between -90 and 90.');
    }

    if (Number.isNaN(longitude) || longitude < -180 || longitude > 180) {
      throw new Error('Longitude must be between -180 and 180.');
    }

    if (Number.isNaN(radius) || radius <= 0) {
      throw new Error('Radius must be greater than 0.');
    }

    return {
      zoneName: zoneName.trim(),
      centerLatitude: latitude,
      centerLongitude: longitude,
      radiusMeters: radius,
      active: active === 'true',
    };
  };

  const save = async () => {
    setMessage(null);
    setError(null);

    try {
      const payload = buildPayload();

      if (editingId) {
        await riskZoneApi.update(token, editingId, payload);
      } else {
        await riskZoneApi.create(token, payload);
      }

      resetForm();
      await zones.refresh();
      setMessage(editingId ? 'Risk zone updated.' : 'Risk zone created.');
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'Unable to save risk zone.');
    }
  };

  const edit = (zone: RiskZone) => {
    setEditingId(zone.id ?? null);
    setZoneName(zone.zoneName);
    setCenterLatitude(String(zone.centerLatitude));
    setCenterLongitude(String(zone.centerLongitude));
    setRadiusMeters(String(zone.radiusMeters));
    setActive(zone.active ? 'true' : 'false');
  };

  const remove = async () => {
    if (!deleteTarget?.id) {
      return;
    }

    try {
      await riskZoneApi.remove(token, deleteTarget.id);
      setDeleteTarget(null);
      await zones.refresh();
      setMessage('Risk zone deleted.');
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'Unable to delete risk zone.');
    }
  };

  if (zones.loading) {
    return <LoadingState />;
  }

  if (zones.error) {
    return <ErrorState message={zones.error} onRetry={zones.refresh} />;
  }

  return (
    <ScrollView contentContainerStyle={localStyles.dashboardScroll}>
      <ToastMessage message={message} tone="success" />
      <ToastMessage message={error} tone="error" />
      <MapCard
        title="Risk Zone Map"
        points={[]}
        zones={(zones.data ?? []).map((zone) => ({
          id: String(zone.id),
          label: zone.zoneName,
          latitude: zone.centerLatitude,
          longitude: zone.centerLongitude,
          radius: zone.radiusMeters,
          active: zone.active,
        }))}
      />
      <Card>
        <SectionHeader title={editingId ? 'Edit Risk Zone' : 'Create Risk Zone'} />
        <View style={localStyles.formGrid}>
          <Input label="Zone name" value={zoneName} onChangeText={setZoneName} placeholder="Northern boundary" />
          <Input label="Latitude" value={centerLatitude} onChangeText={setCenterLatitude} keyboardType="numeric" />
          <Input label="Longitude" value={centerLongitude} onChangeText={setCenterLongitude} keyboardType="numeric" />
          <Input label="Radius meters" value={radiusMeters} onChangeText={setRadiusMeters} keyboardType="numeric" />
        </View>
        <Select
          label="Zone status"
          value={active}
          onChange={setActive}
          options={[
            { label: 'Active', value: 'true' },
            { label: 'Inactive', value: 'false' },
          ]}
        />
        <View style={localStyles.rowActions}>
          <Button onPress={save}>{editingId ? 'Update Zone' : 'Create Zone'}</Button>
          {editingId ? <Button variant="secondary" onPress={resetForm}>Cancel</Button> : null}
        </View>
      </Card>
      {(zones.data ?? []).map((zone) => (
        <Card key={zone.id}>
          <SectionHeader title={zone.zoneName} action={<StatusBadge value={zone.active} />} />
          <DetailRow label="Center" value={`${compactCoordinate(zone.centerLatitude)}, ${compactCoordinate(zone.centerLongitude)}`} />
          <DetailRow label="Radius" value={`${zone.radiusMeters}m`} />
          <View style={localStyles.rowActions}>
            <Button variant="secondary" onPress={() => edit(zone)}>Edit</Button>
            <Button variant="danger" onPress={() => setDeleteTarget(zone)}>Delete</Button>
          </View>
        </Card>
      ))}
      <ConfirmationDialog
        visible={!!deleteTarget}
        title="Delete risk zone"
        message={`Delete ${deleteTarget?.zoneName ?? 'this zone'}?`}
        confirmLabel="Delete"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={remove}
      />
    </ScrollView>
  );
}

function ManagerRangers({ token }: { token: string }) {
  const data = useResource(
    async () => {
      const [rangers, patrols] = await Promise.all([rangerApi.all(token), patrolApi.all(token)]);
      return { rangers, patrols };
    },
    [token],
  );
  const [selectedRangerId, setSelectedRangerId] = useState<string | null>(null);

  if (data.loading) {
    return <LoadingState />;
  }

  if (data.error || !data.data) {
    return <ErrorState message={data.error ?? 'Unable to load rangers.'} onRetry={data.refresh} />;
  }

  const selectedRanger = data.data.rangers.find((ranger) => ranger.rangerId === selectedRangerId);
  const rangerPatrols = selectedRanger
    ? data.data.patrols.filter((patrol) => patrol.rangerId === selectedRanger.rangerId)
    : [];

  return (
    <ScrollView contentContainerStyle={localStyles.dashboardScroll}>
      <View style={localStyles.dashboardColumns}>
        <View style={localStyles.dashboardColumn}>
          <SectionHeader title="Rangers" />
          {data.data.rangers.map((ranger) => (
            <RangerCard key={ranger.id} ranger={ranger} onPress={() => setSelectedRangerId(ranger.rangerId)} />
          ))}
          {!data.data.rangers.length ? <EmptyState title="No rangers" message="Ranger accounts created during sign-up appear here." /> : null}
        </View>
        <View style={localStyles.dashboardColumn}>
          {selectedRanger ? (
            <Card>
              <SectionHeader title={selectedRanger.name} />
              <DetailRow label="Ranger ID" value={selectedRanger.rangerId} />
              <DetailRow label="Assigned patrols" value={rangerPatrols.length} />
              {rangerPatrols.map((patrol) => (
                <PatrolCard key={patrol.patrolReference} patrol={patrol} />
              ))}
            </Card>
          ) : (
            <EmptyState title="Select a ranger" message="Assigned patrols and operational information appear here." />
          )}
        </View>
      </View>
    </ScrollView>
  );
}

function ManagerSettings({ queueState }: { queueState: ReturnType<typeof useOfflineQueueState> }) {
  return (
    <ScrollView contentContainerStyle={localStyles.dashboardScroll}>
      <ToastMessage message={queueState.message} tone="success" />
      <Card>
        <SectionHeader title="Environment" />
        <DetailRow label="API base URL" value={API_BASE_URL} />
        <DetailRow label="Network" value={getNetworkStatus() ? 'Available' : 'Unavailable'} />
      </Card>
      <Card>
        <SectionHeader
          title="Offline Synchronization"
          action={<Button loading={queueState.syncing} variant="secondary" onPress={queueState.syncNow}>Synchronize</Button>}
        />
        <QueueSummary queue={queueState.queue} />
      </Card>
    </ScrollView>
  );
}

function PatrolCard({ patrol, children, onPress }: { patrol: Patrol; children?: React.ReactNode; onPress?: () => void }) {
  return (
    <Card onPress={onPress}>
      <SectionHeader title={patrol.patrolReference} action={<StatusBadge value={patrol.status} />} />
      <DetailRow label="Ranger" value={patrol.rangerName} />
      <DetailRow label="Route" value={`${patrol.routeId} - ${patrol.routeName}`} />
      <DetailRow label="Start" value={formatDate(patrol.startTime)} />
      {children}
    </Card>
  );
}

function AlertCard({ alert, children, compact }: { alert: RiskAlert; children?: React.ReactNode; compact?: boolean }) {
  return (
    <Card style={compact && localStyles.compactCard}>
      <SectionHeader title={alert.animalName} action={<StatusBadge value={alert.status} />} />
      <DetailRow label="Alert ID" value={alert.alertId} />
      {!compact ? <DetailRow label="Location" value={`${compactCoordinate(alert.latitude)}, ${compactCoordinate(alert.longitude)}`} /> : null}
      {!compact ? <DetailRow label="Detected" value={formatDate(alert.detectedAt)} /> : null}
      {children}
    </Card>
  );
}

function AnimalCard({ animal, children, onPress }: { animal: Animal; children?: React.ReactNode; onPress?: () => void }) {
  return (
    <Card onPress={onPress}>
      <SectionHeader title={animal.name} action={<StatusBadge value={animal.collarActive} />} />
      <DetailRow label="Animal ID" value={animal.animalId} />
      <DetailRow label="Species" value={animal.species} />
      {children}
    </Card>
  );
}

function ConflictCard({ report, children, compact }: { report: ConflictReport; children?: React.ReactNode; compact?: boolean }) {
  return (
    <Card style={compact && localStyles.compactCard}>
      <SectionHeader title={report.conflictType} action={<StatusBadge value={report.status} />} />
      <DetailRow label="Report ID" value={report.reportId} />
      {!compact ? <DetailRow label="Severity" value={report.severity} /> : null}
      {!compact ? <DetailRow label="Location" value={`${compactCoordinate(report.latitude)}, ${compactCoordinate(report.longitude)}`} /> : null}
      {!compact ? <DetailRow label="Reported" value={formatDate(report.reportedAt)} /> : null}
      {report.possibleDuplicate ? <StatusBadge value="Possible duplicate" /> : null}
      {children}
    </Card>
  );
}

function IncidentCard({ incident, children, compact }: { incident: WildlifeIncident; children?: React.ReactNode; compact?: boolean }) {
  return (
    <Card style={compact && localStyles.compactCard}>
      <SectionHeader title={formatLabel(incident.incidentType)} action={<StatusBadge value={incident.status} />} />
      <DetailRow label="Incident ID" value={incident.id} />
      {!compact ? <DetailRow label="Location" value={`${compactCoordinate(incident.latitude)}, ${compactCoordinate(incident.longitude)}`} /> : null}
      {!compact ? <DetailRow label="Reported" value={formatDate(incident.reportedAt)} /> : null}
      {!compact ? <Text style={localStyles.bodyText}>{incident.description}</Text> : null}
      {children}
    </Card>
  );
}

function RangerCard({ ranger, onPress }: { ranger: Ranger; onPress?: () => void }) {
  return (
    <Card onPress={onPress}>
      <SectionHeader title={ranger.name} />
      <DetailRow label="Ranger ID" value={ranger.rangerId} />
      <DetailRow label="Database ID" value={ranger.id} />
    </Card>
  );
}

function HistoryList({
  title,
  loading,
  items,
}: {
  title: string;
  loading: boolean;
  items: PatrolLocation[];
}) {
  return (
    <Card>
      <SectionHeader title={title} />
      {loading ? <LoadingState /> : null}
      {!loading && !items.length ? <EmptyState title="No location history" message="Recorded GPS points will appear here." /> : null}
      {items.slice(0, 8).map((item) => (
        <DetailRow
          key={item.id}
          label={formatDate(item.recordedAt)}
          value={`${compactCoordinate(item.latitude)}, ${compactCoordinate(item.longitude)}`}
        />
      ))}
    </Card>
  );
}

function WaypointList({ loading, items }: { loading: boolean; items: Waypoint[] }) {
  return (
    <Card>
      <SectionHeader title="Waypoints" />
      {loading ? <LoadingState /> : null}
      {!loading && !items.length ? <EmptyState title="No waypoints" message="Marked waypoints and notes will appear here." /> : null}
      {items.slice(0, 8).map((item) => (
        <DetailRow
          key={item.id}
          label={item.note || formatDate(item.recordedAt)}
          value={`${compactCoordinate(item.latitude)}, ${compactCoordinate(item.longitude)}`}
        />
      ))}
    </Card>
  );
}

function ConflictActions({ report, onAction }: { report: ConflictReport; onAction: (action: string) => void }) {
  const actions: { label: string; action: string }[] = [];

  if (report.status === 'PENDING_SYNC') {
    actions.push({ label: 'Sync', action: 'sync' });
  }

  if (report.status === 'SUBMITTED') {
    actions.push({ label: 'Review', action: 'review' });
  }

  if (report.status === 'UNDER_REVIEW') {
    actions.push({ label: 'Assign', action: 'assign' });
  }

  if (report.status === 'ASSIGNED') {
    actions.push({ label: 'Respond', action: 'respond' });
  }

  if (report.status === 'RESPONDING') {
    actions.push({ label: 'Resolve', action: 'resolve' });
  }

  if (report.status === 'RESOLVED') {
    actions.push({ label: 'Close', action: 'close' });
  }

  if (!actions.length) {
    return null;
  }

  return (
    <View style={localStyles.rowActions}>
      {actions.map((item) => (
        <Button key={item.action} variant="secondary" onPress={() => onAction(item.action)}>
          {item.label}
        </Button>
      ))}
    </View>
  );
}

function WizardHeader({ steps, step }: { steps: string[]; step: number }) {
  return (
    <View style={localStyles.wizardHeader}>
      <Text style={localStyles.wizardTitle}>{steps[step]}</Text>
      <Text style={localStyles.wizardStep}>
        Step {step + 1} of {steps.length}
      </Text>
    </View>
  );
}

function WizardActions({
  step,
  maxStep,
  setStep,
  onSubmit,
}: {
  step: number;
  maxStep: number;
  setStep: (step: number) => void;
  onSubmit: () => Promise<void>;
}) {
  return (
    <View style={localStyles.rowActions}>
      <Button variant="secondary" disabled={step === 0} onPress={() => setStep(Math.max(0, step - 1))}>
        Back
      </Button>
      {step < maxStep ? (
        <Button onPress={() => setStep(Math.min(maxStep, step + 1))}>Continue</Button>
      ) : (
        <Button onPress={onSubmit}>Submit</Button>
      )}
    </View>
  );
}

function ReviewPanel({ rows }: { rows: [string, string][] }) {
  return (
    <View style={localStyles.reviewPanel}>
      {rows.map(([label, value]) => (
        <DetailRow key={label} label={label} value={value} />
      ))}
    </View>
  );
}

function hasGeolocation() {
  const navigatorLike = globalThis as {
    navigator?: {
      geolocation?: unknown;
    };
  };

  return !!navigatorLike.navigator?.geolocation;
}

function getCurrentPosition(): Promise<{ latitude: number; longitude: number }> {
  const navigatorLike = globalThis as {
    navigator?: {
      geolocation?: {
        getCurrentPosition: (
          success: (position: { coords: { latitude: number; longitude: number } }) => void,
          error: (error: { message?: string }) => void,
          options?: { enableHighAccuracy?: boolean; timeout?: number; maximumAge?: number },
        ) => void;
      };
    };
  };

  return new Promise((resolve, reject) => {
    if (!navigatorLike.navigator?.geolocation) {
      reject(new Error('GPS is unavailable in this runtime.'));
      return;
    }

    navigatorLike.navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }),
      (error) => reject(new Error(error.message ?? 'Location permission was denied.')),
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 15000,
      },
    );
  });
}

const localStyles = StyleSheet.create({
  appRoot: {
    flex: 1,
  },
  authScreen: {
    backgroundColor: palette.background,
    flex: 1,
  },
  authContent: {
    alignItems: 'center',
    gap: spacing.xl,
    justifyContent: 'center',
    minHeight: '100%',
    padding: spacing.xl,
  },
  authHero: {
    alignItems: 'center',
    gap: spacing.sm,
    maxWidth: 560,
  },
  brandMark: {
    color: palette.primary,
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
  authTitle: {
    color: palette.text,
    fontSize: 34,
    fontWeight: '900',
    textAlign: 'center',
  },
  authSubtitle: {
    color: palette.muted,
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
  authCard: {
    maxWidth: 520,
    width: '100%',
  },
  passwordToggle: {
    minHeight: 36,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  passwordToggleText: {
    color: palette.primary,
    fontSize: 13,
    fontWeight: '800',
  },
  rowActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  formGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  helperText: {
    color: palette.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  stack: {
    gap: spacing.lg,
  },
  dashboardRoot: {
    backgroundColor: palette.background,
    flex: 1,
    flexDirection: 'row',
  },
  dashboardRootCompact: {
    backgroundColor: palette.background,
    flex: 1,
  },
  dashboardMain: {
    flex: 1,
  },
  dashboardContent: {
    flex: 1,
  },
  dashboardScroll: {
    gap: spacing.lg,
    padding: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  dashboardColumns: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.lg,
  },
  dashboardColumn: {
    flexBasis: 360,
    flexGrow: 1,
    gap: spacing.lg,
  },
  sidebarUser: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  compactNav: {
    gap: spacing.sm,
    padding: spacing.md,
  },
  compactNavItem: {
    backgroundColor: palette.surface,
    borderColor: palette.line,
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 38,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  compactNavItemActive: {
    backgroundColor: palette.primarySoft,
    borderColor: palette.primary,
  },
  compactNavText: {
    color: palette.muted,
    fontSize: 13,
    fontWeight: '800',
  },
  compactNavTextActive: {
    color: palette.primary,
  },
  compactCard: {
    shadowOpacity: 0,
  },
  bodyText: {
    color: palette.text,
    fontSize: 14,
    lineHeight: 21,
  },
  wizardHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  wizardTitle: {
    color: palette.text,
    fontSize: 18,
    fontWeight: '900',
  },
  wizardStep: {
    color: palette.muted,
    fontSize: 13,
    fontWeight: '800',
  },
  reviewPanel: {
    gap: spacing.xs,
  },
});
