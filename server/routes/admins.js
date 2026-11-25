import { Router } from 'express';
import Admin from '../models/Admin.js';
import { requireAdminAuth } from '../middleware/adminAuth.js';
import { backfillLegacyOrigins } from '../utils/adminOrigins.js';

const router = Router();

const readFields = (body) => ({
  name: String(body?.name || '').trim(),
  username: String(body?.username || '').trim(),
  password: String(body?.password || ''),
  role: String(body?.role || 'President').trim() || 'President',
  phone: String(body?.phone || '').trim(),
  city: String(body?.city || '').trim(),
});

const validate = (fields, { passwordRequired }) => {
  if (!fields.name || !fields.username || !fields.phone || !fields.city) {
    return 'Name, username, mobile number and city are required.';
  }
  if (passwordRequired && !fields.password) return 'Password is required.';
  return null;
};

router.get('/', async (req, res) => {
  try {
    await backfillLegacyOrigins();
    const filter = {};
    if (req.query.username) filter.username = req.query.username;
    const admins = await Admin.find(filter).sort({ createdAt: -1 });
    // Never send password or session token to the browser.
    res.json(admins.map(a => a.toPublic()));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Full-admin login. QR-only admins have no password and can never get a token.
router.post('/login', async (req, res) => {
  try {
    await backfillLegacyOrigins();
    const username = String(req.body?.username || '').trim();
    const password = String(req.body?.password || '');
    const admin = await Admin.findOne({ username });
    if (!admin || admin.qrOnly || !admin.password || admin.password !== password) {
      return res.status(401).json({ error: 'Wrong username or password' });
    }
    const token = await admin.issueToken();
    res.json({ token, admin: admin.toPublic() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/me', requireAdminAuth, (req, res) => {
  const admin = req.admin;
  res.json({
    role: admin ? 'admin' : 'super-admin',
    admin: admin ? admin.toPublic() : null,
  });
});

// Full admins may only create QR-only admins. The super admin can also create
// a full admin directly when needed.
router.post('/', requireAdminAuth, async (req, res) => {
  try {
    await backfillLegacyOrigins();
    const fields = readFields(req.body || {});
    const qrOnly = req.body?.qrOnly === true || req.body?.qrOnly === 'true';
    if (!qrOnly && !req.superAdmin) {
      return res.status(403).json({ error: 'Only the super admin can create full admins.' });
    }
    const problem = validate(fields, { passwordRequired: !qrOnly });
    if (problem) return res.status(400).json({ error: problem });

    const admin = await Admin.create({
      ...fields,
      password: qrOnly ? '' : fields.password,
      qrOnly,
      origin: qrOnly ? 'qr' : 'promoted',
      token: null,
      tokenExpiresAt: null,
    });
    res.status(201).json(admin.toPublic());
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: 'Username already exists' });
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', requireAdminAuth, async (req, res) => {
  try {
    const target = await Admin.findById(req.params.id);
    if (!target) return res.status(404).json({ error: 'Admin not found' });

    const body = req.body || {};
    const promote = body.promote === true || body.promote === 'true';
    const newPassword = String(body.password || '');
    const fields = readFields(body);

    // A full admin can only manage QR-only admins. Only the super admin can
    // touch a full admin or promote a QR-only account.
    if (!target.qrOnly && !req.superAdmin) {
      return res.status(403).json({ error: 'Only the super admin can edit full admins.' });
    }

    if (promote) {
      if (!req.superAdmin) return res.status(403).json({ error: 'Only the super admin can promote admins.' });
      if (!target.qrOnly) return res.status(400).json({ error: 'This admin is already a full admin.' });
      if (!newPassword) return res.status(400).json({ error: 'Set a password to promote this admin.' });
      target.qrOnly = false;
      target.origin = 'promoted';
      target.password = newPassword;
      target.token = null;
      target.tokenExpiresAt = null;
    } else if (newPassword) {
      if (target.qrOnly) return res.status(400).json({ error: 'QR-only admins cannot have a password.' });
      if (!req.superAdmin) return res.status(403).json({ error: 'Only the super admin can change full-admin passwords.' });
      target.password = newPassword;
    }

    for (const key of ['name', 'username', 'role', 'phone', 'city']) {
      if (body[key] !== undefined) target[key] = fields[key];
    }
    await target.save();
    res.json(target.toPublic());
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: 'Username already exists' });
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', requireAdminAuth, async (req, res) => {
  try {
    const target = await Admin.findById(req.params.id);
    if (!target) return res.status(404).json({ error: 'Admin not found' });
    if (!target.qrOnly && !req.superAdmin) {
      return res.status(403).json({ error: 'Only the super admin can delete full admins.' });
    }
    await Admin.findByIdAndDelete(req.params.id);
    res.json({ message: 'Admin deleted', id: req.params.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
