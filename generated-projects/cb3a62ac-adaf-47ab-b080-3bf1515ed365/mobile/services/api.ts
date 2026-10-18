const API_BASE_URL = 'https://your-api.example.com';

export async function fetchAlerts() {
  const res = await fetch(`${API_BASE_URL}/api/alerts`);
  if (!res.ok) throw new Error('Failed to fetch alerts');
  return res.json();
}

export async function fetchDevices() {
  const res = await fetch(`${API_BASE_URL}/api/devices`);
  if (!res.ok) throw new Error('Failed to fetch devices');
  return res.json();
}

export async function acknowledgeAlert(alertId: string) {
  const res = await fetch(`${API_BASE_URL}/api/alerts/${alertId}/acknowledge`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to acknowledge alert');
  return res.json();
}
