import type { IncidentType, UserRole } from '@/types/domain';

export const incidentOptions: { label: string; value: IncidentType }[] = [
  { label: 'Snare', value: 'SNARE' },
  { label: 'Animal carcass', value: 'ANIMAL_CARCASS' },
  { label: 'Illegal campsite', value: 'ILLEGAL_CAMPSITE' },
  { label: 'Animal footprints', value: 'ANIMAL_FOOTPRINTS' },
  { label: 'Other', value: 'OTHER' },
];

export const roleOptions: { label: string; value: UserRole }[] = [
  { label: 'Ranger', value: 'RANGER' },
  { label: 'Community member', value: 'COMMUNITY_MEMBER' },
  { label: 'Community liaison', value: 'COMMUNITY_LIAISON_OFFICER' },
  { label: 'Park manager', value: 'PARK_MANAGER' },
];

export const conflictTypeOptions = [
  { label: 'Crop damage', value: 'CROP_DAMAGE' },
  { label: 'Livestock attack', value: 'LIVESTOCK_ATTACK' },
  { label: 'Property damage', value: 'PROPERTY_DAMAGE' },
  { label: 'Animal near village', value: 'ANIMAL_NEAR_VILLAGE' },
  { label: 'Human injury', value: 'HUMAN_INJURY' },
  { label: 'Other', value: 'OTHER' },
] as const;

export const severityOptions = [
  { label: 'Low', value: 'LOW' },
  { label: 'Medium', value: 'MEDIUM' },
  { label: 'High', value: 'HIGH' },
] as const;

export const locationSourceOptions = [
  { label: 'GPS', value: 'GPS' },
  { label: 'Manual', value: 'MANUAL' },
] as const;

export const sampleParkLocation = {
  latitude: 6.4254,
  longitude: 80.8171,
};
