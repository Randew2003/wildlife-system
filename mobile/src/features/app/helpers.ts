import type { AlertStatus, ConflictReportStatus, PatrolStatus, UserRole } from '@/types/domain';

export type FormErrors = Record<string, string>;

export function isManagerRole(role?: UserRole | null) {
  return role === 'PARK_MANAGER' || role === 'SUPERVISOR';
}

export function formatDate(value?: string | null) {
  if (!value) {
    return 'Not recorded';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

export function formatCoordinate(value?: number | null) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return 'Not set';
  }

  return value.toFixed(5);
}

export function compactCoordinate(latitude?: number | null, longitude?: number | null) {
  return `${formatCoordinate(latitude)}, ${formatCoordinate(longitude)}`;
}

export function describeLocation(latitude?: number | null, longitude?: number | null) {
  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    return 'Location not set';
  }

  const places = [
    'Udawalawe North Gate',
    'Thanamalwila Road edge',
    'Mau Ara village boundary',
    'Reservoir buffer zone',
    'Forest track checkpoint',
    'Elephant corridor crossing',
    'Community farming belt',
    'Park operations post',
  ];
  const index = Math.abs(Math.round(latitude * 1000 + longitude * 1000)) % places.length;
  const sector = String.fromCharCode(65 + (Math.abs(Math.round(latitude * 100)) % 4));

  return `${places[index]}, Sector ${sector}`;
}

export function locationSummary(latitude?: number | null, longitude?: number | null) {
  return `${describeLocation(latitude, longitude)} (${compactCoordinate(latitude, longitude)})`;
}

export function formatLabel(value?: string | null) {
  if (!value) {
    return 'Not set';
  }

  return value
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function parseNumber(value: string) {
  const next = Number(value);

  return Number.isFinite(next) ? next : null;
}

export function validateLatitude(value: string) {
  const latitude = parseNumber(value);

  if (latitude === null || latitude < -90 || latitude > 90) {
    return 'Latitude must be a number from -90 to 90.';
  }

  return null;
}

export function validateLongitude(value: string) {
  const longitude = parseNumber(value);

  if (longitude === null || longitude < -180 || longitude > 180) {
    return 'Longitude must be a number from -180 to 180.';
  }

  return null;
}

export function required(value: string, label: string) {
  return value.trim() ? null : `${label} is required.`;
}

export function normalizePhotoList(value: string) {
  return value
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
}

export function statusTone(
  status?: AlertStatus | ConflictReportStatus | PatrolStatus | string | null,
): 'green' | 'amber' | 'red' | 'sky' | 'slate' {
  if (!status) {
    return 'slate';
  }

  const normalized = status.toUpperCase();

  if (['COMPLETED', 'RESOLVED', 'CLOSED', 'SYNCED', 'ACTIVE'].includes(normalized)) {
    return 'green';
  }

  if (['ASSIGNED', 'PENDING_SYNC', 'SUBMITTED', 'UNDER_REVIEW', 'DETECTED'].includes(normalized)) {
    return 'amber';
  }

  if (['SYNC_FAILED', 'HIGH', 'FAILED'].includes(normalized)) {
    return 'red';
  }

  if (['IN_PROGRESS', 'RESPONDING', 'ACCEPTED'].includes(normalized)) {
    return 'sky';
  }

  return 'slate';
}

export function validationSummary(errors: FormErrors) {
  return Object.values(errors).filter(Boolean);
}

export function todayReference(prefix: string) {
  const stamp = new Date().toISOString().slice(0, 10).replaceAll('-', '');
  const suffix = Math.random().toString(16).slice(2, 6).toUpperCase();

  return `${prefix}-${stamp}-${suffix}`;
}

export function demoRouteId() {
  return todayReference('ROUTE');
}

export function routeCoordinateFromSeed(seed: string, offset: number) {
  const numericSeed = [...seed].reduce((sum, character) => sum + character.charCodeAt(0), 0);
  const latitude = 6.4254 + ((numericSeed % 25) - 12) / 1000 + offset;
  const longitude = 80.8171 + ((numericSeed % 31) - 15) / 1000 + offset;

  return {
    latitude: Number(latitude.toFixed(6)),
    longitude: Number(longitude.toFixed(6)),
  };
}
