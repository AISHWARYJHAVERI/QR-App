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
    const all = await Scan.find({});
    const total = all.length;
    const bySlot = { morning: 0, afternoon: 0, evening: 0, night: 0 };
    const scannedBySet = new Set();
    for (const s of all) {
      bySlot[s.timeSlot] = (bySlot[s.timeSlot] || 0) + 1;
      if (s.scannedBy) scannedBySet.add(s.scannedBy);
    }
    const uniqueQRs = new Set(all.map(s => s.qrValue)).size;
    res.json({ total, bySlot, uniqueQRs, totalScanners: scannedBySet.size });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
