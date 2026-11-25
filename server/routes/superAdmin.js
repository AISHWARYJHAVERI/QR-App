import { Router } from 'express';
import crypto from 'crypto';
import SuperAdmin from '../models/SuperAdmin.js';
import SuperAdminSettings from '../models/SuperAdminSettings.js';
import Admin from '../models/Admin.js';
import { requireSuperAdmin } from '../middleware/superAdmin.js';
import { syncScannerWindow } from '../utils/syncScanner.js';
import { backfillLegacyOrigins } from '../utils/adminOrigins.js';

const router = Router();
const TIME_RE = /^\d{1,2}:\d{2}-\d{1,2}:\d{2}$/;

const normalizeDays = (days) => {
  if (!Array.isArray(days) || days.length !== 4) return null;
  const nums = days.map(Number);
  if (nums.some(n => Number.isNaN(n) || n < 1 || n > 31)) return null;
  if (new Set(nums).size !== 4) return null;
  return nums;
};

const normalizeTimes = (times) => {
  if (!Array.isArray(times) || times.length !== 4) return null;
  const list = times.map(v => String(v || '').replace(/\s+/g, ''));
  if (list.some(t => !TIME_RE.test(t))) return null;
  if (new Set(list).size !== 4) return null;
  return list;
};

const normalizePermissions = (permissions) => {
  const result = {};
  if (Array.isArray(permissions)) {
    for (const item of permissions) {
      const id = String((item && item.id) || '');
      if (!id) continue;
      result[id] = {
        username: String((item && item.username) || ''),
        name: String((item && item.name) || ''),
        phone: String((item && item.phone) || ''),
        scanOverride: !!(item && item.scanOverride),
        pageAccess: !!(item && item.pageAccess),
      };
    }
  } else if (permissions && typeof permissions === 'object') {
    for (const [id, item] of Object.entries(permissions)) {
      result[String(id)] = {
        username: String((item && item.username) || ''),
        name: String((item && item.name) || ''),
        phone: String((item && item.phone) || ''),
        scanOverride: !!(item && item.scanOverride),
        pageAccess: !!(item && item.pageAccess),
      };
    }
  }
  return result;
};

const getSettings = async () => {
  let doc = await SuperAdminSettings.findOne({ key: 'main' });
  if (!doc) doc = await SuperAdminSettings.create({ key: 'main' });
  return doc;
};

router.post('/login', async (req, res) => {
  try {
    const admin = await SuperAdmin.ensureSeeded();
    const username = String(req.body?.username || '').trim().toLowerCase();
    const password = String(req.body?.password || '');
    if (username !== admin.username || !admin.verifyPassword(password)) {
      return res.status(401).json({ error: 'Wrong username or password' });
    }
    const token = crypto.randomBytes(24).toString('hex');
    admin.sessionToken = token;
    admin.sessionExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await admin.save();
    res.json({ token, username: admin.username, passwordMasked: '••••••••' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/logout', requireSuperAdmin, async (req, res) => {
  try {
    req.superAdmin.sessionToken = null;
    req.superAdmin.sessionExpiresAt = null;
    await req.superAdmin.save();
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/me', requireSuperAdmin, async (req, res) => {
  res.json({ username: req.superAdmin.username, passwordMasked: '••••••••' });
});

router.put('/password', requireSuperAdmin, async (req, res) => {
  try {
    const next = String(req.body?.newPassword || '');
    const confirm = String(req.body?.confirmPassword || '');
    if (next.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
    if (next !== confirm) return res.status(400).json({ error: 'Passwords do not match' });
    const { salt, passwordHash } = SuperAdmin.hashPassword(next);
    req.superAdmin.salt = salt;
    req.superAdmin.passwordHash = passwordHash;
    await req.superAdmin.save();
    res.json({ ok: true, message: 'Password updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/settings', requireSuperAdmin, async (req, res) => {
  try {
    const settings = await getSettings();
    await backfillLegacyOrigins();
    const admins = await Admin.find({}).sort({ createdAt: -1 }).lean();
    res.json({
      days: settings.days || [],
      times: settings.times || [],
      permissions: settings.permissions || {},
      admins: admins.map(a => ({
        id: a._id.toString(),
        username: a.username,
        name: a.name,
        role: a.role,
        phone: a.phone || '',
        city: a.city || '',
        qrOnly: !!a.qrOnly,
        origin: a.origin || 'qr',
      })),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/settings', requireSuperAdmin, async (req, res) => {
  try {
    const settings = await getSettings();
    const body = req.body || {};

    if (body.days !== undefined) {
      const days = normalizeDays(body.days);
      if (!days) return res.status(400).json({ error: 'Provide 4 different day numbers between 1 and 31' });
      settings.days = days;
    }
    if (body.times !== undefined) {
      const times = normalizeTimes(body.times);
      if (!times) return res.status(400).json({ error: 'Provide 4 time ranges like 09:00-12:00' });
      settings.times = times;
    }
    if (body.permissions !== undefined) {
      settings.permissions = normalizePermissions(body.permissions);
    }
    await settings.save();

    let sync = null;
    if (settings.days.length === 4) {
      sync = await syncScannerWindow({
        days: settings.days,
        ...(settings.times.length === 4 ? { times: settings.times } : {}),
        permissions: settings.permissions,
      });
    }

    res.json({
      ok: true,
      days: settings.days,
      times: settings.times,
      permissions: settings.permissions,
      sync,
    });
  } catch (err) {
    res.status(502).json({ error: `Saved locally, but scanner sync failed: ${err.message}` });
  }
});

export default router;
