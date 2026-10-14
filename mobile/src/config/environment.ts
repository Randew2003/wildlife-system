import { Platform } from 'react-native';

function getEnv(name: string) {
  return typeof process !== 'undefined' ? process.env?.[name] : undefined;
}

export function normalizeBaseUrl(value: string) {
  return value.trim().replace(/\/+$/, '');
}

const DEFAULT_API_BASE_URLS: Record<string, string> = {
  android: 'http://10.0.2.2:8080',
  ios: 'http://localhost:8080',
  default: 'http://localhost:8080',
};

export const API_BASE_URL = normalizeBaseUrl(
  getEnv('EXPO_PUBLIC_API_BASE_URL') ?? DEFAULT_API_BASE_URLS[Platform.OS] ?? DEFAULT_API_BASE_URLS.default,
);
