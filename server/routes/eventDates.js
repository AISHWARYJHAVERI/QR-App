import { Router } from 'express';
import { syncScannerWindow } from '../utils/syncScanner.js';

const router = Router();

// Frontend calls this after saving Event Dates. The QR App server forwards the
// values to the scanner with a server-side key, so the key never reaches the browser.
router.post('/sync', async (req, res) => {
  const days = Array.isArray(req.body && req.body.days)
    ? req.body.days.map(Number)
    : [];
  if (days.length !== 4 || days.some(n => Number.isNaN(n) || n < 1 || n > 31)) {
    return res.status(400).json({ error: 'Provide 4 day numbers between 1 and 31.' });
  }
  if (new Set(days).size !== 4) {
    return res.status(400).json({ error: 'The 4 event dates must be different.' });
  }
  const times = Array.isArray(req.body && req.body.times)
    ? req.body.times.map(String).map(t => t.replace(/\s+/g, ''))
    : [];
  if (times.length && (times.length !== 4 || times.some(t => !/^\d{1,2}:\d{2}-\d{1,2}:\d{2}$/.test(t)))) {
    return res.status(400).json({ error: 'Provide 4 time ranges in HH:mm-HH:mm format.' });
  }

  try {
    const data = await syncScannerWindow({
      days,
      ...(times.length === 4 ? { times } : {}),
      ...(req.body && req.body.permissions ? { permissions: req.body.permissions } : {}),
    });
    res.json({ ok: true, startDate: data.startDate, endDate: data.endDate, times: data.times || times });
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

export default router;
