import { useEffect, useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native';

import {
  alertApi,
  animalApi,
  conflictApi,
  incidentApi,
  nextAlertAction,
  patrolApi,
  patrolRouteApi,
  rangerApi,
  responderApi,
  riskZoneApi,
} from '@/services/api';
import type {
  AuthSession,
  ConflictReport,
  IncidentType,
  OfflineQueueItem,
  RiskAlert,
  WildlifeIncidentPayload,
} from '@/types/domain';
import { useAuth } from '@/context/AuthContext';
import {
  compactCoordinate,
  demoRouteId,
  formatDate,
  formatLabel,
  locationSummary,
  parseNumber,
  routeCoordinateFromSeed,
  todayReference,
  validateLatitude,
  validateLongitude,
} from '@/features/app/helpers';
import type { FormErrors } from '@/features/app/helpers';
import { useOfflineQueueState, useResource } from '@/features/app/hooks';
import {
  ActionTile,
  AppFrame,
  Button,
  ChoiceGroup,
  cx,
  DataCard,
  EmptyBlock,
  ErrorBlock,
  Field,
  LoadingBlock,
  MessageBanner,
  MetricTile,
  MiniMap,
  NotificationCard,
  Panel,
  Row,
  SectionTitle,
  Stack,
  StatusPill,
  ValidationBlock,
} from '@/features/app/native-ui';
import { sampleParkLocation } from '@/features/app/constants';

const managerHeroImage = require('@/assets/images/manager-hero.png');

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

const dashboardTabs: { key: DashboardTab; label: string }[] = [
  { key: 'overview', label: 'Home' },
  { key: 'patrols', label: 'Patrols' },
  { key: 'monitoring', label: 'Demo Alert' },
  { key: 'alerts', label: 'Notifications' },
  { key: 'conflicts', label: 'Conflicts' },
  { key: 'incidents', label: 'Incidents' },
  { key: 'animals', label: 'Animals' },
  { key: 'zones', label: 'Risk Zones' },
  { key: 'rangers', label: 'People' },
  { key: 'profile', label: 'Profile' },
  { key: 'settings', label: 'Settings' },
];

const incidentTypes: IncidentType[] = [
  'SNARE',
  'ANIMAL_CARCASS',
  'ILLEGAL_CAMPSITE',
  'ANIMAL_FOOTPRINTS',
  'OTHER',
];

function isQueuedIncident(
  item: OfflineQueueItem,
): item is OfflineQueueItem & { body: WildlifeIncidentPayload } {
  if (
    item.endpoint !== '/api/v1/incidents' ||
    item.method !== 'POST' ||
    !item.body ||
    typeof item.body !== 'object' ||
    Array.isArray(item.body)
  ) {
    return false;
  }

  const body = item.body as Record<string, unknown>;

  return (
    typeof body.incidentType === 'string' &&
    incidentTypes.includes(body.incidentType as IncidentType) &&
    typeof body.latitude === 'number' &&
    typeof body.longitude === 'number' &&
    typeof body.description === 'string' &&
    Array.isArray(body.photoUrls) &&
    body.photoUrls.every((photoUrl) => typeof photoUrl === 'string')
  );
}

function fieldOptions(items: { label: string; value: string }[]) {
  return items.length ? items : [{ label: 'No data', value: '' }];
}

function alertButtonLabel(alert: RiskAlert) {
  const nextAction = nextAlertAction(alert.status);

  if (nextAction === 'accept') {
    return 'Acknowledge';
  }

  if (nextAction === 'respond') {
    return 'Start Response';
  }

  if (nextAction === 'resolve') {
    return 'Resolve';
  }

  return null;
}

function conflictProgressMessage(report: ConflictReport) {
  if (report.status === 'SUBMITTED') {
    return 'New report is waiting for manager review.';
  }

  if (report.status === 'UNDER_REVIEW') {
    return 'Manager has reviewed this case. Assign a community liaison officer.';
  }

  if (report.status === 'ASSIGNED') {
    return 'Community liaison officer is assigned. Notify the community member and start response.';
  }

  if (report.status === 'RESPONDING') {
    return 'Community liaison officer is handling the incident in the field.';
  }

  if (report.status === 'RESOLVED') {
    return 'Field result has been submitted by the liaison officer.';
  }

  if (report.status === 'CLOSED') {
    return 'This conflict case is closed.';
  }

  return 'Report is pending synchronization from the mobile device.';
}

function canAssignConflict(report: ConflictReport) {
  return report.status === 'SUBMITTED' || report.status === 'UNDER_REVIEW';
}

function canNotifyConflictResponse(report: ConflictReport) {
  return report.status === 'ASSIGNED';
}


export function ManagerDashboard({ session }: { session: AuthSession }) {
  const { width } = useWindowDimensions();
  const { logout } = useAuth();

  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');

  // Banner width for responsive image sizing
  const [bannerWidth, setBannerWidth] = useState(0);

  const queue = useOfflineQueueState(session.token);


  const patrols = useResource(() => patrolApi.all(session.token), [session.token]);
  const rangers = useResource(() => rangerApi.all(session.token), [session.token]);
  const routes = useResource(() => patrolRouteApi.all(session.token), [session.token]);
  const responders = useResource(() => responderApi.all(session.token), [session.token]);
  const alerts = useResource(() => alertApi.all(session.token), [session.token]);
  const conflicts = useResource(() => conflictApi.all(session.token), [session.token]);
  const incidents = useResource(() => incidentApi.all(session.token), [session.token]);
  const animals = useResource(() => animalApi.all(session.token), [session.token]);
  const zones = useResource(() => riskZoneApi.all(session.token), [session.token]);

  const rangerOptions = useMemo(
    () => fieldOptions(rangers.data?.map((ranger) => ({ label: `${ranger.name} (${ranger.rangerId})`, value: ranger.rangerId })) ?? []),
    [rangers.data],
  );
  const responderOptions = useMemo(
    () =>
      fieldOptions(
        responders.data?.map((responder) => ({
          label: `${responder.fullName} - ${formatLabel(responder.role)}`,
          value: responder.responderId,
        })) ?? [],
      ),
    [responders.data],
  );
  const routeOptions = useMemo(
    () => fieldOptions(routes.data?.map((route) => ({ label: `${route.routeName} (${route.routeId})`, value: route.routeId })) ?? []),
    [routes.data],
  );
  const animalOptions = useMemo(
    () => fieldOptions(animals.data?.map((animal) => ({ label: `${animal.name} (${animal.animalId})`, value: animal.animalId })) ?? []),
    [animals.data],
  );
  const zoneOptions = useMemo(
    () =>
      fieldOptions(
        zones.data?.map((zone) => ({
          label: `${zone.zoneName} (${zone.radiusMeters}m)`,
          value: String(zone.id ?? ''),
        })) ?? [],
      ),
    [zones.data],
  );

  const [assignReference, setAssignReference] = useState(todayReference('PATROL'));
  const [assignRangerId, setAssignRangerId] = useState('');
  const [assignRouteId, setAssignRouteId] = useState('');
  const [assignmentErrors, setAssignmentErrors] = useState<FormErrors>({});
  const [assignmentBusy, setAssignmentBusy] = useState(false);

  const initialRouteId = useMemo(() => demoRouteId(), []);
  const initialRouteStart = useMemo(() => routeCoordinateFromSeed(initialRouteId, 0), [initialRouteId]);
  const initialRouteEnd = useMemo(() => routeCoordinateFromSeed(initialRouteId, 0.006), [initialRouteId]);
  const [routeId, setRouteId] = useState(initialRouteId);
  const [routeName, setRouteName] = useState('North Boundary Patrol');
  const [routeDescription, setRouteDescription] = useState('Demo route through forest edge and village boundary.');
  const [routeStartLatitude, setRouteStartLatitude] = useState(String(initialRouteStart.latitude));
  const [routeStartLongitude, setRouteStartLongitude] = useState(String(initialRouteStart.longitude));
  const [routeEndLatitude, setRouteEndLatitude] = useState(String(initialRouteEnd.latitude));
  const [routeEndLongitude, setRouteEndLongitude] = useState(String(initialRouteEnd.longitude));
  const [routeErrors, setRouteErrors] = useState<FormErrors>({});
  const [routeBusy, setRouteBusy] = useState(false);

  const [selectedAnimalId, setSelectedAnimalId] = useState('');
  const [selectedRiskZoneId, setSelectedRiskZoneId] = useState('');
  const [collarLatitude, setCollarLatitude] = useState(String(sampleParkLocation.latitude));
  const [collarLongitude, setCollarLongitude] = useState(String(sampleParkLocation.longitude));
  const [collarBusy, setCollarBusy] = useState(false);
  const [simulationBusy, setSimulationBusy] = useState(false);
  const [collarErrors, setCollarErrors] = useState<FormErrors>({});

  const [animalId, setAnimalId] = useState('');
  const [animalName, setAnimalName] = useState('');
  const [animalSpecies, setAnimalSpecies] = useState('');
  const [collarActive, setCollarActive] = useState(true);
  const [animalBusy, setAnimalBusy] = useState(false);
  const [animalErrors, setAnimalErrors] = useState<FormErrors>({});

  const [zoneName, setZoneName] = useState('');
  const [zoneLatitude, setZoneLatitude] = useState(String(sampleParkLocation.latitude));
  const [zoneLongitude, setZoneLongitude] = useState(String(sampleParkLocation.longitude));
  const [zoneRadius, setZoneRadius] = useState('500');
  const [zoneBusy, setZoneBusy] = useState(false);
  const [zoneErrors, setZoneErrors] = useState<FormErrors>({});

  const [selectedConflictResponder, setSelectedConflictResponder] = useState('');
  const [reviewedConflictId, setReviewedConflictId] = useState<string | null>(null);
  const [assigningConflictId, setAssigningConflictId] = useState<string | null>(null);
  const [busyRecord, setBusyRecord] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const effectiveAssignRangerId = assignRangerId || rangers.data?.[0]?.rangerId || '';
  const effectiveAssignRouteId = assignRouteId || routes.data?.[0]?.routeId || '';
  const validSelectedConflictResponder = responders.data?.some(
    (responder) => responder.responderId === selectedConflictResponder,
  )
    ? selectedConflictResponder
    : '';
  const effectiveConflictResponder =
    validSelectedConflictResponder || responders.data?.[0]?.responderId || '';
  const effectiveAnimalId = selectedAnimalId || animals.data?.[0]?.animalId || '';
  const effectiveRiskZoneId = selectedRiskZoneId || String(zones.data?.[0]?.id ?? '');

  const refreshOperations = async () => {
    await Promise.all([
      patrols.refresh(),
      rangers.refresh(),
      responders.refresh(),
      routes.refresh(),
      alerts.refresh(),
      conflicts.refresh(),
      incidents.refresh(),
      animals.refresh(),
      zones.refresh(),
    ]);
  };

  const assignPatrol = async () => {
    const nextErrors: FormErrors = {};

    if (!effectiveAssignRangerId) {
      nextErrors.ranger = 'Select a ranger.';
    }

    if (!effectiveAssignRouteId) {
      nextErrors.route = 'Select a route.';
    }

    setAssignmentErrors(nextErrors);

    if (Object.keys(nextErrors).length) {
      return;
    }

    setAssignmentBusy(true);
    setNotice(null);

    try {
      await patrolApi.assign(session.token, {
        patrolReference: assignReference.trim() || undefined,
        rangerId: effectiveAssignRangerId,
        routeId: effectiveAssignRouteId,
      });
      setAssignReference(todayReference('PATROL'));
      await patrols.refresh();
      setNotice('Patrol assigned to ranger.');
    } catch (exception) {
      setNotice(exception instanceof Error ? exception.message : 'Unable to assign patrol.');
    } finally {
      setAssignmentBusy(false);
    }
  };

  const generateDemoRoute = () => {
    const nextRouteId = demoRouteId();
    const start = routeCoordinateFromSeed(nextRouteId, 0);
    const end = routeCoordinateFromSeed(nextRouteId, 0.006);

    setRouteId(nextRouteId);
    setRouteName('Forest Boundary Patrol');
    setRouteDescription('Demo route with safe start and end points for assignment testing.');
    setRouteStartLatitude(String(start.latitude));
    setRouteStartLongitude(String(start.longitude));
    setRouteEndLatitude(String(end.latitude));
    setRouteEndLongitude(String(end.longitude));
    setRouteErrors({});
  };

  const createRoute = async () => {
    const nextErrors: FormErrors = {};
    const startLatitudeError = validateLatitude(routeStartLatitude);
    const startLongitudeError = validateLongitude(routeStartLongitude);
    const endLatitudeError = validateLatitude(routeEndLatitude);
    const endLongitudeError = validateLongitude(routeEndLongitude);

    if (!routeId.trim()) {
      nextErrors.routeId = 'Route ID is required.';
    }

    if (!routeName.trim()) {
      nextErrors.routeName = 'Route name is required.';
    }

    if (startLatitudeError) {
      nextErrors.startLatitude = startLatitudeError;
    }

    if (startLongitudeError) {
      nextErrors.startLongitude = startLongitudeError;
    }

    if (endLatitudeError) {
      nextErrors.endLatitude = endLatitudeError;
    }

    if (endLongitudeError) {
      nextErrors.endLongitude = endLongitudeError;
    }

    setRouteErrors(nextErrors);

    if (Object.keys(nextErrors).length) {
      return;
    }

    setRouteBusy(true);
    setNotice(null);

    try {
      const createdRoute = await patrolRouteApi.create(session.token, {
        routeId: routeId.trim(),
        routeName: routeName.trim(),
        description: routeDescription.trim() || undefined,
        startLatitude: parseNumber(routeStartLatitude) ?? sampleParkLocation.latitude,
        startLongitude: parseNumber(routeStartLongitude) ?? sampleParkLocation.longitude,
        endLatitude: parseNumber(routeEndLatitude) ?? sampleParkLocation.latitude,
        endLongitude: parseNumber(routeEndLongitude) ?? sampleParkLocation.longitude,
      });

      setAssignRouteId(createdRoute.routeId);
      await routes.refresh();
      setNotice('Patrol route created. You can assign it to a ranger now.');
      generateDemoRoute();
    } catch (exception) {
      setNotice(exception instanceof Error ? exception.message : 'Unable to create route.');
    } finally {
      setRouteBusy(false);
    }
  };

  const updateAlert = async (alert: RiskAlert) => {
    const nextAction = nextAlertAction(alert.status);

    if (!nextAction) {
      return;
    }

    setBusyRecord(alert.alertId);
    setNotice(null);

    try {
      if (nextAction === 'accept') {
        await alertApi.accept(session.token, alert.alertId, session.email);
      } else if (nextAction === 'respond') {
        await alertApi.respond(session.token, alert.alertId);
      } else {
        await alertApi.resolve(session.token, alert.alertId);
      }

      await alerts.refresh();
      setNotice('Risk alert updated.');
    } catch (exception) {
      setNotice(exception instanceof Error ? exception.message : 'Unable to update alert.');
    } finally {
      setBusyRecord(null);
    }
  };

  const updateConflict = async (report: ConflictReport, action: 'review' | 'assign' | 'respond') => {
    setBusyRecord(`${report.reportId}-${action}`);
    setNotice(null);

    try {
      if (action === 'review') {
        setReviewedConflictId(report.reportId);
        setAssigningConflictId(null);

        if (report.status === 'SUBMITTED') {
          await conflictApi.review(session.token, report.reportId);
          await conflicts.refresh();
          setNotice('Conflict report moved to manager review.');
          return;
        }

        setNotice('Conflict progress opened.');
        return;
      } else if (action === 'assign') {
        setReviewedConflictId(report.reportId);

        if (assigningConflictId !== report.reportId) {
          setAssigningConflictId(report.reportId);
          setNotice('Choose a community liaison officer for this conflict report.');
          return;
        }

        if (!effectiveConflictResponder) {
          throw new Error('Create a community liaison officer account before assigning conflict reports.');
        }

        await conflictApi.assign(session.token, report.reportId, effectiveConflictResponder);
        setAssigningConflictId(null);
      } else if (action === 'respond') {
        if (!canNotifyConflictResponse(report)) {
          throw new Error('Assign a community liaison officer before sending the response notification.');
        }

        await conflictApi.respond(session.token, report.reportId);
      }

      await conflicts.refresh();
      setReviewedConflictId(report.reportId);
      setNotice(
        action === 'assign'
          ? 'Community liaison officer assigned.'
          : 'Community member notification recorded and liaison response started.',
      );
    } catch (exception) {
      setNotice(exception instanceof Error ? exception.message : 'Unable to update conflict report.');
    } finally {
      setBusyRecord(null);
    }
  };

  const recordCollarLocation = async () => {
    const nextErrors: FormErrors = {};
    const latitudeError = validateLatitude(collarLatitude);
    const longitudeError = validateLongitude(collarLongitude);

    if (!effectiveAnimalId) {
      nextErrors.animal = 'Select an animal.';
    }

    if (latitudeError) {
      nextErrors.latitude = latitudeError;
    }

    if (longitudeError) {
      nextErrors.longitude = longitudeError;
    }

    setCollarErrors(nextErrors);

    if (Object.keys(nextErrors).length) {
      return;
    }

    setCollarBusy(true);
    setNotice(null);

    try {
      await animalApi.recordLocation(session.token, effectiveAnimalId, {
        latitude: parseNumber(collarLatitude) ?? sampleParkLocation.latitude,
        longitude: parseNumber(collarLongitude) ?? sampleParkLocation.longitude,
        recordedAt: new Date().toISOString(),
      });
      await Promise.all([alerts.refresh(), animals.refresh()]);
      setNotice('GPS collar location recorded.');
    } catch (exception) {
      setNotice(exception instanceof Error ? exception.message : 'Unable to record collar location.');
    } finally {
      setCollarBusy(false);
    }
  };

  const simulateHighRiskMovement = async () => {
    setSimulationBusy(true);
    setNotice(null);

    try {
      let animalIdForSimulation = effectiveAnimalId;
      let zoneForSimulation =
        zones.data?.find((zone) => String(zone.id ?? '') === effectiveRiskZoneId) ?? zones.data?.[0];

      if (!animalIdForSimulation) {
        const suffix = Math.random().toString(16).slice(2, 6).toUpperCase();
        const createdAnimal = await animalApi.create(session.token, {
          animalId: `DEMO-ELE-${suffix}`,
          name: `Demo Elephant ${suffix}`,
          species: 'Elephant',
          collarActive: true,
        });

        animalIdForSimulation = createdAnimal.animalId;
        setSelectedAnimalId(createdAnimal.animalId);
      }

      if (!zoneForSimulation) {
        zoneForSimulation = await riskZoneApi.create(session.token, {
          zoneName: 'Demo Village Boundary',
          centerLatitude: sampleParkLocation.latitude,
          centerLongitude: sampleParkLocation.longitude,
          radiusMeters: 800,
          active: true,
        });

        setSelectedRiskZoneId(String(zoneForSimulation.id ?? ''));
      }

      await animalApi.recordLocation(session.token, animalIdForSimulation, {
        latitude: zoneForSimulation.centerLatitude,
        longitude: zoneForSimulation.centerLongitude,
        recordedAt: new Date().toISOString(),
      });

      setCollarLatitude(String(zoneForSimulation.centerLatitude));
      setCollarLongitude(String(zoneForSimulation.centerLongitude));
      await Promise.all([alerts.refresh(), animals.refresh(), zones.refresh()]);
      setNotice('High-risk movement simulated. Park manager, rangers, liaison officers, and community members can see it in Notifications.');
    } catch (exception) {
      setNotice(exception instanceof Error ? exception.message : 'Unable to simulate high-risk movement.');
    } finally {
      setSimulationBusy(false);
    }
  };

  const createAnimal = async () => {
    const nextErrors: FormErrors = {};

    if (!animalId.trim()) {
      nextErrors.animalId = 'Animal ID is required.';
    }

    if (!animalName.trim()) {
      nextErrors.animalName = 'Animal name is required.';
    }

    if (!animalSpecies.trim()) {
      nextErrors.animalSpecies = 'Species is required.';
    }

    setAnimalErrors(nextErrors);

    if (Object.keys(nextErrors).length) {
      return;
    }

    setAnimalBusy(true);
    setNotice(null);

    try {
      await animalApi.create(session.token, {
        animalId: animalId.trim(),
        name: animalName.trim(),
        species: animalSpecies.trim(),
        collarActive,
      });
      setAnimalId('');
      setAnimalName('');
      setAnimalSpecies('');
      await animals.refresh();
      setNotice('Animal registered.');
    } catch (exception) {
      setNotice(exception instanceof Error ? exception.message : 'Unable to register animal.');
    } finally {
      setAnimalBusy(false);
    }
  };

  const createZone = async () => {
    const nextErrors: FormErrors = {};
    const latitudeError = validateLatitude(zoneLatitude);
    const longitudeError = validateLongitude(zoneLongitude);
    const radius = parseNumber(zoneRadius);

    if (!zoneName.trim()) {
      nextErrors.zoneName = 'Zone name is required.';
    }

    if (latitudeError) {
      nextErrors.latitude = latitudeError;
    }

    if (longitudeError) {
      nextErrors.longitude = longitudeError;
    }

    if (radius === null || radius <= 0) {
      nextErrors.radius = 'Radius must be greater than zero.';
    }

    setZoneErrors(nextErrors);

    if (Object.keys(nextErrors).length) {
      return;
    }

    setZoneBusy(true);
    setNotice(null);

    try {
      await riskZoneApi.create(session.token, {
        zoneName: zoneName.trim(),
        centerLatitude: parseNumber(zoneLatitude) ?? sampleParkLocation.latitude,
        centerLongitude: parseNumber(zoneLongitude) ?? sampleParkLocation.longitude,
        radiusMeters: radius ?? 500,
        active: true,
      });
      setZoneName('');
      await zones.refresh();
      setNotice('Risk zone created.');
    } catch (exception) {
      setNotice(exception instanceof Error ? exception.message : 'Unable to create risk zone.');
    } finally {
      setZoneBusy(false);
    }
  };

  const retryIncidentSync = async (id: number) => {
    setBusyRecord(`incident-${id}`);
    setNotice(null);

    try {
      await incidentApi.retrySync(session.token, id);
      await incidents.refresh();
      setNotice('Incident synchronization retried.');
    } catch (exception) {
      setNotice(exception instanceof Error ? exception.message : 'Unable to retry incident synchronization.');
    } finally {
      setBusyRecord(null);
    }
  };

  const openPatrols = patrols.data?.filter((patrol) => patrol.status !== 'COMPLETED') ?? [];
  const openAlerts = alerts.data?.filter((alert) => alert.status !== 'RESOLVED') ?? [];
  const openConflicts = conflicts.data?.filter((report) => !['RESOLVED', 'CLOSED'].includes(report.status)) ?? [];
  const pendingIncidents = incidents.data?.filter((incident) => incident.status !== 'SYNCED') ?? [];
  const latestAlert = openAlerts[0] ?? alerts.data?.[0];
  const refreshAlerts = alerts.refresh;
  const refreshConflicts = conflicts.refresh;
  const refreshIncidents = incidents.refresh;

  useEffect(() => {
    const timer = setInterval(() => {
      refreshAlerts();
      refreshConflicts();
      refreshIncidents();
    }, 12000);

    return () => clearInterval(timer);
  }, [refreshAlerts, refreshConflicts, refreshIncidents]);

  const renderNotice = () =>
    notice ? (
      <MessageBanner
        message={notice}
        tone={notice.toLowerCase().includes('unable') || notice.toLowerCase().includes('error') ? 'red' : 'sky'}
      />
    ) : null;

  const renderOverview = () => (
    <Stack>
      {latestAlert ? (
        <NotificationCard
          title="Urgent animal movement"
          subtitle={`${latestAlert.animalName} entered ${latestAlert.riskZoneName ?? `Zone ${latestAlert.riskZoneId}`}`}
          status={latestAlert.status}
          time={formatDate(latestAlert.detectedAt)}
          detail="This notification is visible to the park manager, rangers, liaison officers, and community members."
          rows={[
            { label: 'Place', value: locationSummary(latestAlert.latitude, latestAlert.longitude) },
            { label: 'Responder', value: latestAlert.assignedResponder ?? 'Waiting for acceptance' },
          ]}
          tone={latestAlert.status === 'RESOLVED' ? 'green' : 'red'}
          actions={<Button label="Open Notifications" onPress={() => setActiveTab('alerts')} />}
        />
      ) : null}

      <Row>
        <MetricTile label="Open patrols" value={openPatrols.length} detail="Assigned or in progress" tone="green" />
        <MetricTile label="Risk alerts" value={openAlerts.length} detail="Not resolved" tone="amber" />
        <MetricTile label="Conflict cases" value={openConflicts.length} detail="Need operations follow-up" tone="red" />
        <MetricTile label="Pending sync" value={queue.queue.length + pendingIncidents.length} detail="Offline records" tone="sky" />
      </Row>

      <Panel>
        <Stack>
          <SectionTitle
            title="Today at a Glance"
            subtitle="Use these shortcuts for the main manager work."
            action={<Button label="Refresh All" onPress={refreshOperations} variant="secondary" />}
          />
          <Row>
            <ActionTile title="Assign Patrol" detail="Send route to ranger" onPress={() => setActiveTab('patrols')} />
            <ActionTile title="Demo Alert" detail="Simulate collar entering zone" onPress={() => setActiveTab('monitoring')} tone="red" />
            <ActionTile title="Conflicts" detail="Assign liaison officer" onPress={() => setActiveTab('conflicts')} tone="amber" />
          </Row>
          <MiniMap latitude={latestAlert?.latitude} longitude={latestAlert?.longitude} title={latestAlert?.animalName ?? 'Park overview'} />
        </Stack>
      </Panel>

      <Panel>
        <Stack>
          <SectionTitle title="Manager Notification Feed" subtitle="Latest alerts and community reports for follow-up." />
          {openAlerts.slice(0, 3).map((alert) => (
            <NotificationCard
              key={`notify-alert-${alert.alertId}`}
              title={`High-risk movement: ${alert.animalName}`}
              subtitle={locationSummary(alert.latitude, alert.longitude)}
              status={alert.status}
              time={formatDate(alert.detectedAt)}
              detail={alert.riskZoneName ?? `Zone ${alert.riskZoneId}`}
              rows={[
                { label: 'Responder', value: alert.assignedResponder ?? 'Waiting' },
              ]}
              tone={alert.status === 'RESPONDING' ? 'amber' : 'red'}
            />
          ))}
          {openConflicts.slice(0, 3).map((report) => (
            <DataCard
              key={`notify-conflict-${report.reportId}`}
              title={`Community conflict: ${formatLabel(report.conflictType)}`}
              subtitle={locationSummary(report.latitude, report.longitude)}
              status={report.status}
              rows={[
                { label: 'Severity', value: report.severity },
                { label: 'Community liaison', value: report.assignedRanger ?? 'Not assigned' },
              ]}
            />
          ))}
          {!openAlerts.length && !openConflicts.length ? (
            <EmptyBlock title="No active notifications" detail="New animal risk and conflict cases will appear here." />
          ) : null}
        </Stack>
      </Panel>

      <Panel>
        <Stack>
          <SectionTitle title="Latest Workload" />
          {openPatrols.slice(0, 3).map((patrol) => (
            <DataCard
              key={patrol.patrolReference}
              title={patrol.routeName}
              subtitle={`${patrol.rangerName} - ${patrol.patrolReference}`}
              status={patrol.status}
            />
          ))}
          {openConflicts.slice(0, 3).map((report) => (
            <DataCard
              key={report.reportId}
              title={formatLabel(report.conflictType)}
              subtitle={locationSummary(report.latitude, report.longitude)}
              status={report.status}
              rows={[
                { label: 'Details', value: report.description },
                { label: 'Community liaison', value: report.assignedRanger ?? 'Not assigned' },
              ]}
            />
          ))}
        </Stack>
      </Panel>
    </Stack>
  );

  const renderPatrols = () => (
    <Stack>
      <Panel>
        <Stack>
          <SectionTitle
            title="1. Create Patrol Route"
            subtitle="Use demo coordinates when real park GIS data is unavailable."
          />
          <Row>
            <Field label="Route ID" value={routeId} onChangeText={setRouteId} error={routeErrors.routeId} />
            <Field label="Route name" value={routeName} onChangeText={setRouteName} error={routeErrors.routeName} />
          </Row>
          <Field
            label="Route description"
            value={routeDescription}
            onChangeText={setRouteDescription}
            placeholder="Checkpoint notes, terrain, known risk areas"
          />
          <Row>
            <Field
              label="Start latitude"
              value={routeStartLatitude}
              onChangeText={setRouteStartLatitude}
              error={routeErrors.startLatitude}
              keyboard="numeric"
            />
            <Field
              label="Start longitude"
              value={routeStartLongitude}
              onChangeText={setRouteStartLongitude}
              error={routeErrors.startLongitude}
              keyboard="numeric"
            />
          </Row>
          <Row>
            <Field
              label="End latitude"
              value={routeEndLatitude}
              onChangeText={setRouteEndLatitude}
              error={routeErrors.endLatitude}
              keyboard="numeric"
            />
            <Field
              label="End longitude"
              value={routeEndLongitude}
              onChangeText={setRouteEndLongitude}
              error={routeErrors.endLongitude}
              keyboard="numeric"
            />
          </Row>
          <MiniMap
            latitude={parseNumber(routeStartLatitude)}
            longitude={parseNumber(routeStartLongitude)}
            title={routeName || 'New route'}
          />
          <ValidationBlock errors={Object.values(routeErrors)} />
          <Row>
            <Button label="Generate Dummy Route" onPress={generateDemoRoute} variant="ghost" />
            <Button label="Save Route" onPress={createRoute} busy={routeBusy} />
          </Row>
        </Stack>
      </Panel>

      <Panel>
        <Stack>
          <SectionTitle title="2. Assign Patrol to Ranger" subtitle="Choose one ranger and one saved route." />
          <Field label="Patrol reference" value={assignReference} onChangeText={setAssignReference} />
          <ChoiceGroup label="Ranger" value={effectiveAssignRangerId} options={rangerOptions} onChange={setAssignRangerId} />
          <ChoiceGroup label="Route" value={effectiveAssignRouteId} options={routeOptions} onChange={setAssignRouteId} />
          <ValidationBlock errors={Object.values(assignmentErrors)} />
          <Row>
            <Button label="Generate Reference" onPress={() => setAssignReference(todayReference('PATROL'))} variant="ghost" />
            <Button label="Assign Patrol" onPress={assignPatrol} busy={assignmentBusy} />
          </Row>
        </Stack>
      </Panel>

      <Panel>
        <Stack>
          <SectionTitle title="3. Patrol Board" action={<Button label="Refresh" onPress={patrols.refresh} variant="secondary" />} />
          {patrols.loading ? <LoadingBlock label="Loading patrols" /> : null}
          {patrols.error ? <ErrorBlock message={patrols.error} onRetry={patrols.refresh} /> : null}
          {!patrols.loading && !patrols.error && !patrols.data?.length ? <EmptyBlock title="No patrols assigned" /> : null}
          {patrols.data?.map((patrol) => (
            <DataCard
              key={patrol.patrolReference}
              title={patrol.routeName}
              subtitle={patrol.patrolReference}
              status={patrol.status}
              rows={[
                { label: 'Ranger', value: `${patrol.rangerName} (${patrol.rangerId})` },
                { label: 'Started', value: formatDate(patrol.startTime) },
                { label: 'Completed', value: formatDate(patrol.endTime) },
              ]}
            />
          ))}
        </Stack>
      </Panel>
    </Stack>
  );

  const renderMonitoring = () => (
    <Stack>
      <Panel>
        <Stack>
          <SectionTitle
            title="1. Demo Risk Notification"
            subtitle="Select an animal and a risk zone, then generate the same alert users will see."
          />
          <ChoiceGroup label="Animal" value={effectiveAnimalId} options={animalOptions} onChange={setSelectedAnimalId} />
          <ChoiceGroup label="Risk zone" value={effectiveRiskZoneId} options={zoneOptions} onChange={setSelectedRiskZoneId} />
          <Button label="Generate Risk Alert" onPress={simulateHighRiskMovement} busy={simulationBusy} />
        </Stack>
      </Panel>

      <Panel>
        <Stack>
          <SectionTitle title="2. Manual Collar Update" subtitle="Optional: enter exact test coordinates for a collar transmission." />
          <ChoiceGroup label="Animal" value={effectiveAnimalId} options={animalOptions} onChange={setSelectedAnimalId} />
          <MiniMap latitude={parseNumber(collarLatitude)} longitude={parseNumber(collarLongitude)} title={effectiveAnimalId || 'Collar update'} />
          <Row>
            <Field label="Latitude" value={collarLatitude} onChangeText={setCollarLatitude} error={collarErrors.latitude} keyboard="numeric" />
            <Field label="Longitude" value={collarLongitude} onChangeText={setCollarLongitude} error={collarErrors.longitude} keyboard="numeric" />
          </Row>
          <ValidationBlock errors={Object.values(collarErrors)} />
          <Button label="Save Collar Location" onPress={recordCollarLocation} busy={collarBusy} />
        </Stack>
      </Panel>

      <Panel>
        <Stack>
          <SectionTitle title="3. Monitoring Summary" />
          <Row>
            <MetricTile label="Registered animals" value={animals.data?.length ?? 0} tone="green" />
            <MetricTile label="Active zones" value={zones.data?.filter((zone) => zone.active).length ?? 0} tone="sky" />
            <MetricTile label="Generated alerts" value={alerts.data?.length ?? 0} tone="amber" />
          </Row>
          {animals.data?.map((animal) => (
            <DataCard
              key={animal.animalId}
              title={animal.name}
              subtitle={`${formatLabel(animal.species)} - ${animal.animalId}`}
              status={animal.collarActive ? 'Active' : 'Inactive'}
            />
          ))}
        </Stack>
      </Panel>
    </Stack>
  );

  const renderAlerts = () => (
    <Panel>
      <Stack>
        <SectionTitle
          title="Notifications"
          subtitle="Urgent animal movement alerts and responder status."
          action={<Button label="Refresh" onPress={alerts.refresh} variant="secondary" />}
        />
        {alerts.loading ? <LoadingBlock label="Loading alerts" /> : null}
        {alerts.error ? <ErrorBlock message={alerts.error} onRetry={alerts.refresh} /> : null}
        {!alerts.loading && !alerts.error && !alerts.data?.length ? <EmptyBlock title="No notifications" /> : null}
        {alerts.data?.map((alert) => {
          const label = alertButtonLabel(alert);

          return (
            <NotificationCard
              key={alert.alertId}
              title={alert.status === 'RESOLVED' ? `${alert.animalName} alert resolved` : `Urgent: ${alert.animalName}`}
              subtitle={locationSummary(alert.latitude, alert.longitude)}
              status={alert.status}
              time={formatDate(alert.detectedAt)}
              detail={alert.riskZoneName ?? `Zone ${alert.riskZoneId}`}
              rows={[
                { label: 'Responder', value: alert.assignedResponder ?? 'Available to accept' },
              ]}
              tone={alert.status === 'RESOLVED' ? 'green' : alert.status === 'RESPONDING' ? 'amber' : 'red'}
              actions={
                label ? (
                  <Button
                    label={label}
                    onPress={() => updateAlert(alert)}
                    busy={busyRecord === alert.alertId}
                    variant={alert.status === 'DETECTED' ? 'primary' : 'secondary'}
                  />
                ) : undefined
              }
            />
          );
        })}
      </Stack>
    </Panel>
  );

  const renderConflicts = () => (
    <Stack>
      <Panel>
        <Stack>
          <SectionTitle
            title="Conflict Reports"
            subtitle="Review, assign a community liaison officer, then send response."
            action={<Button label="Refresh" onPress={conflicts.refresh} variant="secondary" />}
          />
          {conflicts.loading ? <LoadingBlock label="Loading conflict reports" /> : null}
          {conflicts.error ? <ErrorBlock message={conflicts.error} onRetry={conflicts.refresh} /> : null}
          {!conflicts.loading && !conflicts.error && !conflicts.data?.length ? <EmptyBlock title="No conflict reports" /> : null}
          {conflicts.data?.map((report) => {
            const assigningThisReport = assigningConflictId === report.reportId;
            const reviewingThisReport = reviewedConflictId === report.reportId;

            return (
              <View className="gap-3" key={report.reportId}>
                <DataCard
                  title={`Community report: ${formatLabel(report.conflictType)}`}
                  subtitle={locationSummary(report.latitude, report.longitude)}
                  status={report.status}
                  rows={[
                    { label: 'Severity', value: report.severity },
                    { label: 'Liaison officer', value: report.assignedRanger ?? 'Not assigned yet' },
                    { label: 'Reported', value: formatDate(report.reportedAt) },
                    { label: 'Need', value: report.description },
                  ]}
                  actions={
                    <>
                      <Button
                        label="Review"
                        onPress={() => updateConflict(report, 'review')}
                        busy={busyRecord === `${report.reportId}-review`}
                        variant="secondary"
                      />
                      <Button
                        label={assigningThisReport ? 'Confirm Assign' : 'Assign'}
                        onPress={() => updateConflict(report, 'assign')}
                        busy={busyRecord === `${report.reportId}-assign`}
                        disabled={!canAssignConflict(report)}
                      />
                      <Button
                        label="Respond"
                        onPress={() => updateConflict(report, 'respond')}
                        busy={busyRecord === `${report.reportId}-respond`}
                        disabled={!canNotifyConflictResponse(report)}
                        variant="secondary"
                      />
                    </>
                  }
                />

                {assigningThisReport ? (
                  <View className="gap-3 rounded-lg border border-forest-200 bg-forest-50 p-3">
                    <SectionTitle
                      title="Choose Liaison Officer"
                      subtitle="This officer will visit the place and submit the result."
                    />
                    {responders.loading ? <LoadingBlock label="Loading liaison officers" /> : null}
                    {responders.error ? <ErrorBlock message={responders.error} onRetry={responders.refresh} /> : null}
                    {!responders.loading && !responders.error ? (
                      <ChoiceGroup
                        label="Community liaison officer"
                        value={effectiveConflictResponder}
                        options={responderOptions}
                        onChange={setSelectedConflictResponder}
                      />
                    ) : null}
                  </View>
                ) : null}

                {reviewingThisReport ? (
                  <View className="gap-3 rounded-lg border border-sky-200 bg-sky-50 p-3">
                    <SectionTitle title="Case Progress" subtitle={conflictProgressMessage(report)} />
                    <DataCard
                      title="Progress Update"
                      subtitle={report.responseNotes ?? 'Waiting for community liaison officer field result.'}
                      status={report.responseOutcome ? formatLabel(report.responseOutcome) : report.status}
                      rows={[
                        { label: 'Liaison officer', value: report.assignedRanger ?? 'Not assigned' },
                        { label: 'Duplicate check', value: report.possibleDuplicate ? 'Possible duplicate' : 'No duplicate' },
                        { label: 'Resolved at', value: formatDate(report.resolvedAt) },
                      ]}
                    />
                  </View>
                ) : null}
              </View>
            );
          })}
        </Stack>
      </Panel>
    </Stack>
  );

  const renderIncidents = () => (
    <Panel>
      <Stack>
        <SectionTitle title="Wildlife Incident Reports" action={<Button label="Refresh" onPress={incidents.refresh} variant="secondary" />} />
        {incidents.loading ? <LoadingBlock label="Loading incidents" /> : null}
        {incidents.error ? <ErrorBlock message={incidents.error} onRetry={incidents.refresh} /> : null}
        {!incidents.loading &&
        !incidents.error &&
        !incidents.data?.length &&
        !queue.queue.some(isQueuedIncident) ? (
          <EmptyBlock title="No incident reports" />
        ) : null}
        {queue.queue.filter(isQueuedIncident).map((item) => (
          <DataCard
            key={`queued-${item.id}`}
            title={formatLabel(item.body.incidentType)}
            subtitle={`${item.body.description} (saved on this device; awaiting synchronization)`}
            status="PENDING_SYNC"
            rows={[
              { label: 'Reported', value: formatDate(item.createdAt) },
              { label: 'Coordinates', value: compactCoordinate(item.body.latitude, item.body.longitude) },
              { label: 'Photos', value: item.body.photoUrls.length },
            ]}
            actions={
              <Button
                label="Sync Offline Queue"
                onPress={queue.syncNow}
                busy={queue.syncing}
                variant="secondary"
              />
            }
          />
        ))}
        {incidents.data?.map((incident) => (
          <DataCard
            key={incident.id}
            title={formatLabel(incident.incidentType)}
            subtitle={incident.description}
            status={incident.status}
            rows={[
              { label: 'Reported', value: formatDate(incident.reportedAt) },
              { label: 'Coordinates', value: compactCoordinate(incident.latitude, incident.longitude) },
              { label: 'Photos', value: incident.photoUrls.length },
            ]}
            actions={
              incident.status !== 'SYNCED' ? (
                <Button
                  label="Retry Sync"
                  onPress={() => retryIncidentSync(incident.id)}
                  busy={busyRecord === `incident-${incident.id}`}
                  variant="secondary"
                />
              ) : undefined
            }
          />
        ))}
      </Stack>
    </Panel>
  );

  const renderAnimals = () => (
    <Stack>
      <Panel>
        <Stack>
          <SectionTitle title="Register Collared Animal" />
          <Field label="Animal ID" value={animalId} onChangeText={setAnimalId} error={animalErrors.animalId} placeholder="ELE-001" />
          <Field label="Name" value={animalName} onChangeText={setAnimalName} error={animalErrors.animalName} placeholder="Mali" />
          <Field label="Species" value={animalSpecies} onChangeText={setAnimalSpecies} error={animalErrors.animalSpecies} placeholder="Elephant" />
          <ChoiceGroup
            label="Collar status"
            value={collarActive ? 'ACTIVE' : 'INACTIVE'}
            options={[
              { label: 'Active', value: 'ACTIVE' },
              { label: 'Inactive', value: 'INACTIVE' },
            ]}
            onChange={(value) => setCollarActive(value === 'ACTIVE')}
          />
          <ValidationBlock errors={Object.values(animalErrors)} />
          <Button label="Register Animal" onPress={createAnimal} busy={animalBusy} />
        </Stack>
      </Panel>

      <Panel>
        <Stack>
          <SectionTitle title="Animals" action={<Button label="Refresh" onPress={animals.refresh} variant="secondary" />} />
          {animals.data?.map((animal) => (
            <DataCard
              key={animal.animalId}
              title={animal.name}
              subtitle={`${formatLabel(animal.species)} - ${animal.animalId}`}
              status={animal.collarActive ? 'Active' : 'Inactive'}
            />
          ))}
        </Stack>
      </Panel>
    </Stack>
  );

  const renderZones = () => (
    <Stack>
      <Panel>
        <Stack>
          <SectionTitle title="Create High-Risk Zone" />
          <Field label="Zone name" value={zoneName} onChangeText={setZoneName} error={zoneErrors.zoneName} placeholder="Village boundary north" />
          <Row>
            <Field label="Latitude" value={zoneLatitude} onChangeText={setZoneLatitude} error={zoneErrors.latitude} keyboard="numeric" />
            <Field label="Longitude" value={zoneLongitude} onChangeText={setZoneLongitude} error={zoneErrors.longitude} keyboard="numeric" />
          </Row>
          <Field label="Radius meters" value={zoneRadius} onChangeText={setZoneRadius} error={zoneErrors.radius} keyboard="numeric" />
          <ValidationBlock errors={Object.values(zoneErrors)} />
          <Button label="Create Risk Zone" onPress={createZone} busy={zoneBusy} />
        </Stack>
      </Panel>

      <Panel>
        <Stack>
          <SectionTitle title="Risk Zones" action={<Button label="Refresh" onPress={zones.refresh} variant="secondary" />} />
          {zones.data?.map((zone) => (
            <DataCard
              key={zone.id ?? zone.zoneName}
              title={zone.zoneName}
              subtitle={compactCoordinate(zone.centerLatitude, zone.centerLongitude)}
              status={zone.active ? 'Active' : 'Inactive'}
              rows={[{ label: 'Radius', value: `${zone.radiusMeters}m` }]}
            />
          ))}
        </Stack>
      </Panel>
    </Stack>
  );

  const renderRangers = () => (
    <Stack>
      <Panel>
        <Stack>
          <SectionTitle title="Rangers" action={<Button label="Refresh" onPress={rangers.refresh} variant="secondary" />} />
          {rangers.data?.map((ranger) => (
            <DataCard
              key={ranger.rangerId}
              title={ranger.name}
              subtitle={ranger.rangerId}
              status="Available"
              rows={[{ label: 'Database ID', value: ranger.id }]}
            />
          ))}
        </Stack>
      </Panel>
      <Panel>
        <Stack>
          <SectionTitle title="Patrol Routes" action={<Button label="Refresh" onPress={routes.refresh} variant="secondary" />} />
          {routes.data?.map((route) => (
            <DataCard
              key={route.routeId}
              title={route.routeName}
              subtitle={route.routeId}
              rows={[
                { label: 'Description', value: route.description ?? 'No description' },
                { label: 'Start', value: compactCoordinate(route.startLatitude, route.startLongitude) },
                { label: 'End', value: compactCoordinate(route.endLatitude, route.endLongitude) },
              ]}
            />
          ))}
        </Stack>
      </Panel>
    </Stack>
  );

  const renderProfile = () => (
    <Panel>
      <Stack>
        <SectionTitle title="Manager Profile" subtitle={session.email} />
        <Row>
          <StatusPill status={formatLabel(session.role)} />
          <StatusPill status={`${queue.queue.length} pending sync`} />
        </Row>
        <DataCard
          title={session.fullName}
          subtitle="Park operations account"
          rows={[
            { label: 'User ID', value: session.userId },
            { label: 'Role', value: formatLabel(session.role) },
          ]}
        />
        <Row>
          <Button label="Sync Offline Queue" onPress={queue.syncNow} busy={queue.syncing} disabled={!queue.queue.length} variant="secondary" />
          <Button label="Sign Out" onPress={logout} variant="danger" />
        </Row>
      </Stack>
    </Panel>
  );

  const renderSettings = () => (
    <Stack>
      <Panel>
        <Stack>
          <SectionTitle title="Dashboard Settings" />
          <DataCard
            title="Backend connection"
            subtitle="Set EXPO_PUBLIC_API_BASE_URL when testing from another device."
            rows={[
              { label: 'Role', value: formatLabel(session.role) },
              { label: 'Offline queue', value: queue.queue.length },
            ]}
          />
          {queue.queue.map((item) => (
            <DataCard
              key={item.id}
              title={item.label}
              subtitle={item.endpoint}
              status="Pending Sync"
              rows={[
                { label: 'Attempts', value: item.attempts },
                { label: 'Created', value: formatDate(item.createdAt) },
              ]}
            />
          ))}
        </Stack>
      </Panel>
    </Stack>
  );

  const renderActiveTab = () => {
    if (activeTab === 'patrols') {
      return renderPatrols();
    }

    if (activeTab === 'monitoring') {
      return renderMonitoring();
    }

    if (activeTab === 'alerts') {
      return renderAlerts();
    }

    if (activeTab === 'conflicts') {
      return renderConflicts();
    }

    if (activeTab === 'incidents') {
      return renderIncidents();
    }

    if (activeTab === 'animals') {
      return renderAnimals();
    }

    if (activeTab === 'zones') {
      return renderZones();
    }

    if (activeTab === 'rangers') {
      return renderRangers();
    }

    if (activeTab === 'profile') {
      return renderProfile();
    }

    if (activeTab === 'settings') {
      return renderSettings();
    }

    return renderOverview();
  };

  const isWide = width >= 900;

  return (
    <AppFrame>
      <View className={cx('flex-1', isWide && 'flex-row')}>
        <View className={cx('border-slate-200 bg-white', isWide ? 'w-72 border-r p-4' : 'border-b p-3')}>
          <Text className="text-xs font-semibold uppercase text-forest-700">Park Manager</Text>
          <Text className="mt-1 text-xl font-bold text-slate-950">Operations Dashboard</Text>
          <View className={cx('mt-4 gap-2', !isWide && 'flex-row flex-wrap')}>
            {dashboardTabs.map((tab) => {
              const selected = tab.key === activeTab;

              return (
                <Pressable
                  accessibilityRole="button"
                  key={tab.key}
                  onPress={() => setActiveTab(tab.key)}
                  className={cx(
                    'rounded-md px-3 py-2',
                    selected ? 'bg-forest-600' : 'bg-slate-50',
                    !isWide && 'min-w-28',
                  )}
                >
                  <Text className={cx('text-sm font-bold', selected ? 'text-white' : 'text-slate-700')}>
                    {tab.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <ScrollView className="flex-1">
          

{activeTab === 'overview' ? (
  <View
    className="w-full bg-forest-900"
    onLayout={(event) => {
      setBannerWidth(event.nativeEvent.layout.width);
    }}
  >
    <Image
      source={managerHeroImage}
      resizeMode="stretch"
      style={{
        width: '100%',
        height: bannerWidth * (462 / 2048),
      }}
    />
  </View>
) : null}


          <View className="mx-auto w-full max-w-6xl gap-4 p-4 pb-10">
            <View className="flex-row flex-wrap items-start justify-between gap-3">
              <View>
                <Text className="text-2xl font-bold text-slate-950">{dashboardTabs.find((tab) => tab.key === activeTab)?.label}</Text>
                <Text className="mt-1 text-sm text-slate-600">{session.fullName}</Text>
              </View>
              <Button label="Refresh All" onPress={refreshOperations} variant="secondary" />
            </View>
            {renderNotice()}
            {renderActiveTab()}
          </View>
        </ScrollView>
      </View>
    </AppFrame>
  );
}
