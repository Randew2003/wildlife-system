export type UserRole =
  | 'RANGER'
  | 'COMMUNITY_MEMBER'
  | 'COMMUNITY_LIAISON_OFFICER'
  | 'PARK_MANAGER'
  | 'SUPERVISOR';

export type PatrolStatus = 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED';

export type AlertStatus = 'DETECTED' | 'ACCEPTED' | 'RESPONDING' | 'RESOLVED';

export type IncidentStatus = 'PENDING_SYNC' | 'SYNCED' | 'SYNC_FAILED';

export type IncidentType =
  | 'SNARE'
  | 'ANIMAL_CARCASS'
  | 'ILLEGAL_CAMPSITE'
  | 'ANIMAL_FOOTPRINTS'
  | 'OTHER';

export type LocationSource = 'GPS' | 'MANUAL';

export type ConflictReportStatus =
  | 'PENDING_SYNC'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'ASSIGNED'
  | 'RESPONDING'
  | 'RESOLVED'
  | 'CLOSED';

export type AuthSession = {
  userId: number;
  fullName: string;
  email: string;
  role: UserRole;
  rangerId?: string | null;
  rangerDatabaseId?: number | null;
  token: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterPayload = LoginPayload & {
  fullName: string;
  role: UserRole;
  rangerId?: string;
};

export type Patrol = {
  patrolReference: string;
  rangerId: string;
  rangerName: string;
  routeId: string;
  routeName: string;
  routeStartLatitude?: number | null;
  routeStartLongitude?: number | null;
  routeEndLatitude?: number | null;
  routeEndLongitude?: number | null;
  status: PatrolStatus;
  startTime?: string | null;
  endTime?: string | null;
};

export type PatrolLocation = {
  id: number;
  latitude: number;
  longitude: number;
  recordedAt: string;
};

export type Waypoint = PatrolLocation & {
  note?: string | null;
};

export type WildlifeIncident = {
  id: number;
  incidentType: IncidentType;
  latitude: number;
  longitude: number;
  description: string;
  reportedAt: string;
  status: IncidentStatus;
  photoUrls: string[];
};

export type WildlifeIncidentPayload = {
  incidentType: IncidentType;
  latitude: number;
  longitude: number;
  description: string;
  photoUrls: string[];
};

export type ConflictReport = {
  reportId: string;
  conflictType: string;
  description: string;
  latitude: number;
  longitude: number;
  locationSource: LocationSource;
  severity: string;
  photoUrl?: string | null;
  status: ConflictReportStatus;
  assignedRanger?: string | null;
  reportedAt: string;
  resolvedAt?: string | null;
  responseNotes?: string | null;
  responseOutcome?: string | null;
  possibleDuplicate: boolean;
};

export type ConflictReportPayload = {
  conflictType: string;
  description: string;
  latitude: number;
  longitude: number;
  locationSource: LocationSource;
  severity: string;
  photoUrl?: string;
};

export type Animal = {
  id?: number;
  animalId: string;
  species: string;
  name: string;
  collarActive: boolean;
};

export type GPSLocation = {
  id: number;
  animalId: string;
  latitude: number;
  longitude: number;
  recordedAt: string;
};

export type RiskAlert = {
  alertId: string;
  animalId: string;
  animalName: string;
  locationId: number;
  riskZoneId: number;
  riskZoneName?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  status: AlertStatus;
  detectedAt: string;
  assignedResponder?: string | null;
};

export type RiskZone = {
  id?: number;
  zoneName: string;
  centerLatitude: number;
  centerLongitude: number;
  radiusMeters: number;
  active: boolean;
};

export type Ranger = {
  id: number;
  rangerId: string;
  name: string;
};

export type Responder = {
  id: number;
  responderId: string;
  fullName: string;
  email: string;
  role: UserRole;
};

export type PatrolRoute = {
  id: number;
  routeId: string;
  routeName: string;
  description?: string | null;
  startLatitude?: number | null;
  startLongitude?: number | null;
  endLatitude?: number | null;
  endLongitude?: number | null;
};

export type OfflineQueueItem = {
  id: string;
  label: string;
  endpoint: string;
  method: 'POST' | 'PUT';
  body?: unknown;
  createdAt: string;
  attempts: number;
};
