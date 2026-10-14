import { getStoredJson, setStoredJson } from '@/services/storage';

function storageKey(userId: number) {
  return `wildlife.dismissed-risk-alerts.${userId}`;
}

export async function getDismissedRiskAlerts(userId: number) {
  return getStoredJson<string[]>(storageKey(userId), []);
}

export async function dismissRiskAlert(userId: number, alertId: string) {
  const dismissed = await getDismissedRiskAlerts(userId);

  if (!dismissed.includes(alertId)) {
    await setStoredJson(storageKey(userId), [...dismissed, alertId]);
  }
}
