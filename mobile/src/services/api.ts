import { Platform } from 'react-native';

import type {
  AlertStatus,
  Animal,
  AuthSession,
  ConflictReport,
  ConflictReportPayload,
  GPSLocation,
  LoginPayload,
  Patrol,
  PatrolLocation,
  PatrolRoute,
  Ranger,
  Responder,
  RegisterPayload,
  RiskAlert,
  RiskZone,
  Waypoint,
  WildlifeIncident,
  WildlifeIncidentPayload,
} from '@/types/domain';

declare const process:
  | {
      env?: Record<string, string | undefined>;
    }
  | undefined;

const env = typeof process !== 'undefined' ? process.env : undefined;

function normalizeBaseUrl(value: string) {
  return value.trim().replace(/^https?:\/\/\s+/, (protocol) => protocol.trim());
}

export const API_BASE_URL = normalizeBaseUrl(
  env?.EXPO_PUBLIC_API_BASE_URL ??
    (Platform.OS === 'android' ? 'http://10.0.2.2:8080' : 'http://localhost:8080'),
);

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

type ApiOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  token?: string;
  body?: unknown;
};

async function parseResponse(response: Response) {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function getErrorMessage(payload: unknown, fallback: string) {
  if (!payload) {
    return fallback;
  }

  if (typeof payload === 'string') {
    return payload;
  }

  if (typeof payload === 'object') {
    const record = payload as Record<string, unknown>;

    if (typeof record.error === 'string') {
      return record.error;
    }

    const messages = Object.values(record)
      .filter((value): value is string => typeof value === 'string')
      .join(' ');

    if (messages) {
      return messages;
    }
  }

  return fallback;
}

export async function apiRequest<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };

  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  const payload = await parseResponse(response);

  if (!response.ok) {
    throw new ApiError(
      getErrorMessage(payload, `Request failed with status ${response.status}`),
      response.status,
      payload,
    );
  }

  return payload as T;
}

function encodeQuery(params: Record<string, string | number | undefined>) {
  const search = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      search.set(key, String(value));
    }
  });

  const query = search.toString();

  return query ? `?${query}` : '';
}

export const authApi = {
  login: (payload: LoginPayload) =>
    apiRequest<AuthSession>('/api/auth/login', {
      method: 'POST',
      body: payload,
    }),
  register: (payload: RegisterPayload) =>
    apiRequest<AuthSession>('/api/auth/register', {
      method: 'POST',
      body: payload,
    }),
  forgotPassword: (email: string) =>
    apiRequest<{ message: string }>('/api/auth/forgot-password', {
      method: 'POST',
      body: { email },
    }),
  me: (token: string) =>
    apiRequest<AuthSession>('/api/auth/me', {
      token,
    }),
};

export const patrolApi = {
  all: (token: string) => apiRequest<Patrol[]>('/api/patrols', { token }),
  assigned: (token: string, rangerDatabaseId: number) =>
    apiRequest<Patrol[]>(`/api/patrols/assigned/${rangerDatabaseId}`, { token }),
  byReference: (token: string, patrolReference: string) =>
    apiRequest<Patrol>(`/api/patrols/${patrolReference}`, { token }),
  assign: (token: string, payload: { patrolReference?: string; rangerId: string; routeId: string }) =>
    apiRequest<Patrol>('/api/patrols', {
      method: 'POST',
      token,
      body: payload,
    }),
  start: (token: string, patrolReference: string) =>
    apiRequest<Patrol>(`/api/patrols/${patrolReference}/start`, {
      method: 'POST',
      token,
    }),
  complete: (token: string, patrolReference: string) =>
    apiRequest<Patrol>(`/api/patrols/${patrolReference}/complete`, {
      method: 'POST',
      token,
    }),
  recordLocation: (token: string, patrolReference: string, latitude: number, longitude: number) =>
    apiRequest<PatrolLocation>(`/api/patrols/${patrolReference}/locations`, {
      method: 'POST',
      token,
      body: { latitude, longitude },
    }),
  locations: (token: string, patrolReference: string) =>
    apiRequest<PatrolLocation[]>(`/api/patrols/${patrolReference}/locations`, { token }),
  addWaypoint: (
    token: string,
    patrolReference: string,
    payload: { latitude: number; longitude: number; note?: string },
  ) =>
    apiRequest<Waypoint>(`/api/patrols/${patrolReference}/waypoints`, {
      method: 'POST',
      token,
      body: payload,
    }),
  waypoints: (token: string, patrolReference: string) =>
    apiRequest<Waypoint[]>(`/api/patrols/${patrolReference}/waypoints`, { token }),
};

export const incidentApi = {
  all: (token: string) => apiRequest<WildlifeIncident[]>('/api/v1/incidents', { token }),
  create: (token: string, payload: WildlifeIncidentPayload) =>
    apiRequest<WildlifeIncident>('/api/v1/incidents', {
      method: 'POST',
      token,
      body: payload,
    }),
  retrySync: (token: string, id: number) =>
    apiRequest<WildlifeIncident>(`/api/v1/incidents/${id}/retry-sync`, {
      method: 'POST',
      token,
    }),
};

export const conflictApi = {
  all: (token: string) => apiRequest<ConflictReport[]>('/api/conflict-reports', { token }),
  create: (token: string, payload: ConflictReportPayload, offline = false) =>
    apiRequest<ConflictReport>(offline ? '/api/conflict-reports/offline' : '/api/conflict-reports', {
      method: 'POST',
      token,
      body: payload,
    }),
  sync: (token: string, reportId: string) =>
    apiRequest<ConflictReport>(`/api/conflict-reports/${reportId}/sync`, {
      method: 'PUT',
      token,
    }),
  review: (token: string, reportId: string) =>
    apiRequest<ConflictReport>(`/api/conflict-reports/${reportId}/review`, {
      method: 'PUT',
      token,
    }),
  assign: (token: string, reportId: string, responder: string) =>
    apiRequest<ConflictReport>(`/api/conflict-reports/${reportId}/assign${encodeQuery({ responder })}`, {
      method: 'PUT',
      token,
    }),
  respond: (token: string, reportId: string) =>
    apiRequest<ConflictReport>(`/api/conflict-reports/${reportId}/respond`, {
      method: 'PUT',
      token,
    }),
  resolve: (token: string, reportId: string, responseNotes?: string, responseOutcome?: string) =>
    apiRequest<ConflictReport>(
      `/api/conflict-reports/${reportId}/resolve${encodeQuery({ responseNotes, responseOutcome })}`,
      {
        method: 'PUT',
        token,
      },
    ),
  close: (token: string, reportId: string) =>
    apiRequest<ConflictReport>(`/api/conflict-reports/${reportId}/close`, {
      method: 'PUT',
      token,
    }),
};

export const animalApi = {
  all: (token: string) => apiRequest<Animal[]>('/api/animals', { token }),
  create: (token: string, payload: Animal) =>
    apiRequest<Animal>('/api/animals', {
      method: 'POST',
      token,
      body: payload,
    }),
  update: (token: string, animalId: string, payload: Animal) =>
    apiRequest<Animal>(`/api/animals/${animalId}`, {
      method: 'PUT',
      token,
      body: payload,
    }),
  remove: (token: string, animalId: string) =>
    apiRequest<void>(`/api/animals/${animalId}`, {
      method: 'DELETE',
      token,
    }),
  locations: (token: string, animalId: string) =>
    apiRequest<GPSLocation[]>(`/api/animals/${animalId}/locations`, { token }),
  recordLocation: (
    token: string,
    animalId: string,
    payload: { latitude: number; longitude: number; recordedAt: string },
  ) =>
    apiRequest<GPSLocation>(`/api/animals/${animalId}/location`, {
      method: 'POST',
      token,
      body: payload,
    }),
};

export const alertApi = {
  all: (token: string) => apiRequest<RiskAlert[]>('/api/alerts', { token }),
  accept: (token: string, alertId: string, responder?: string) =>
    apiRequest<RiskAlert>(`/api/alerts/${alertId}/accept${encodeQuery({ responder })}`, {
      method: 'PUT',
      token,
    }),
  respond: (token: string, alertId: string) =>
    apiRequest<RiskAlert>(`/api/alerts/${alertId}/respond`, {
      method: 'PUT',
      token,
    }),
  resolve: (token: string, alertId: string) =>
    apiRequest<RiskAlert>(`/api/alerts/${alertId}/resolve`, {
      method: 'PUT',
      token,
    }),
};

export const riskZoneApi = {
  all: (token: string) => apiRequest<RiskZone[]>('/api/risk-zones', { token }),
  create: (token: string, payload: RiskZone) =>
    apiRequest<RiskZone>('/api/risk-zones', {
      method: 'POST',
      token,
      body: payload,
    }),
  update: (token: string, id: number, payload: RiskZone) =>
    apiRequest<RiskZone>(`/api/risk-zones/${id}`, {
      method: 'PUT',
      token,
      body: payload,
    }),
  remove: (token: string, id: number) =>
    apiRequest<void>(`/api/risk-zones/${id}`, {
      method: 'DELETE',
      token,
    }),
};

export const rangerApi = {
  all: (token: string) => apiRequest<Ranger[]>('/api/rangers', { token }),
};

export const responderApi = {
  all: (token: string) => apiRequest<Responder[]>('/api/responders', { token }),
};

export const patrolRouteApi = {
  all: (token: string) => apiRequest<PatrolRoute[]>('/api/patrol-routes', { token }),
  create: (
    token: string,
    payload: {
      routeId: string;
      routeName: string;
      description?: string;
      startLatitude: number;
      startLongitude: number;
      endLatitude: number;
      endLongitude: number;
    },
  ) =>
    apiRequest<PatrolRoute>('/api/patrol-routes', {
      method: 'POST',
      token,
      body: payload,
    }),
};

export function nextAlertAction(status: AlertStatus) {
  if (status === 'DETECTED') {
    return 'accept' as const;
  }

  if (status === 'ACCEPTED') {
    return 'respond' as const;
  }

  if (status === 'RESPONDING') {
    return 'resolve' as const;
  }

  return null;
}
