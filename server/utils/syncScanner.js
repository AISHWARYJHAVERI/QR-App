const SYNC_KEY = process.env.EVENT_SYNC_KEY || 'qrapp-event-sync-2026';
const SCANNER_API = (process.env.SCANNER_API_URL || 'https://qr-scan-rho-green.vercel.app').replace(/\/$/, '');

export const syncScannerWindow = async ({ days, month, year, times, permissions }) => {
  const response = await fetch(`${SCANNER_API}/api/internal/sync-window`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-sync-key': SYNC_KEY,
    },
    body: JSON.stringify({
      days,
      ...(month !== undefined ? { month } : {}),
      ...(year !== undefined ? { year } : {}),
      ...(times ? { times } : {}),
      ...(permissions ? { permissions } : {}),
    }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Scanner sync failed');
  return data;
};
