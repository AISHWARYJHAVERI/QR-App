import { Router } from 'express';
import Scan from '../models/Scan.js';

const router = Router();

router.post('/', async (req, res) => {
  try {
    const { qrValue, scannedBy, timeSlot, scannedAt } = req.body;
    if (!qrValue || !timeSlot) {
      return res.status(400).json({ error: 'qrValue and timeSlot required' });
    }
    const scan = await Scan.create({
      qrValue,
      scannedBy: scannedBy || '',
      timeSlot,
      scannedAt: scannedAt ? new Date(scannedAt) : new Date(),
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
    const total = await Scan.countDocuments(filter);
    const scans = await Scan.find(filter)
      .sort({ scannedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
    res.json({ scans, total, page, totalPages: Math.ceil(total / limit), limit });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/analytics', async (req, res) => {
  try {
    const [stats] = await Scan.aggregate([
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
