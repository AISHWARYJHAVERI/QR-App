import { Router } from 'express';
import Scan from '../models/Scan.js';

const router = Router();

const qrToday = (when) => {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = {};
  for (const part of formatter.formatToParts(new Date(when))) {
    if (part.type !== 'literal') parts[part.type] = part.value;
  }
  return `${parts.day} ${parts.month} ${parts.year}`;
};

const computeDayStatus = (qrValue, when) => {
  try {
    const data = JSON.parse(qrValue);
    if (data.type === 'A') return 'none'; // admin QRs are exempt from date rules
    const dates = Array.isArray(data.dates) ? data.dates.map(String) : [];
    const today = qrToday(when);
    if (dates.length > 0) return dates.includes(today) ? 'allowed' : 'wrong';
    // Legacy QRs that still carry day numbers only.
    const days = Array.isArray(data.days) ? data.days.map(Number).filter(n => !Number.isNaN(n)) : [];
    if (days.length === 0) return 'none';
    return days.includes(Number(today.slice(0, 2))) ? 'allowed' : 'wrong';
  } catch {
    return 'none';
  }
};

router.post('/', async (req, res) => {
  try {
    const { qrValue, scannedBy, timeSlot, scannedAt } = req.body;
    if (!qrValue || !timeSlot) {
      return res.status(400).json({ error: 'qrValue and timeSlot required' });
    }
    const at = scannedAt ? new Date(scannedAt) : new Date();
    const scan = await Scan.create({
      qrValue,
      scannedBy: scannedBy || '',
      timeSlot,
      scannedAt: at,
      dayStatus: computeDayStatus(qrValue, at),
      source: 'scanner',
    });
    res.status(201).json(scan);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const slot = req.query.slot || 'all';
    const q = req.query.q || '';
    const filter = {};
    if (slot && slot !== 'all') filter.timeSlot = slot;
    if (q) filter.qrValue = { $regex: q, $options: 'i' };
    const [total, scans] = await Promise.all([
      Scan.countDocuments(filter),
      Scan.find(filter)
        .sort({ scannedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
    ]);
    const hydrated = scans.map(s => ({
      ...s,
      dayStatus: s.dayStatus && s.dayStatus !== 'none'
        ? s.dayStatus
        : computeDayStatus(s.qrValue, s.scannedAt),
    }));
    res.json({ scans: hydrated, total, page, totalPages: Math.ceil(total / limit), limit });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/analytics', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 90;
    const since = new Date();
    since.setDate(since.getDate() - days);
    const [stats] = await Scan.aggregate([
      { $match: { scannedAt: { $gte: since } } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          morning: { $sum: { $cond: [{ $eq: ['$timeSlot', 'morning'] }, 1, 0] } },
          afternoon: { $sum: { $cond: [{ $eq: ['$timeSlot', 'afternoon'] }, 1, 0] } },
          evening: { $sum: { $cond: [{ $eq: ['$timeSlot', 'evening'] }, 1, 0] } },
          night: { $sum: { $cond: [{ $eq: ['$timeSlot', 'night'] }, 1, 0] } },
          uniqueQRs: { $addToSet: '$qrValue' },
          totalScanners: { $addToSet: { $cond: [{ $ne: ['$scannedBy', ''] }, '$scannedBy', null] } },
        },
      },
    ]);
    if (!stats) return res.json({ total: 0, bySlot: { morning: 0, afternoon: 0, evening: 0, night: 0 }, uniqueQRs: 0, totalScanners: 0 });
    res.json({
      total: stats.total,
      bySlot: { morning: stats.morning, afternoon: stats.afternoon, evening: stats.evening, night: stats.night },
      uniqueQRs: stats.uniqueQRs.length,
      totalScanners: stats.totalScanners.filter(Boolean).length,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
