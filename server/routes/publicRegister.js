import { Router } from 'express';
import Admin from '../models/Admin.js';
import { backfillLegacyOrigins } from '../utils/adminOrigins.js';

const router = Router();
export const PUBLIC_SIGNUP_LIMIT = 2;

const publicSignupCount = () => Admin.countDocuments({ origin: 'public', qrOnly: false });

router.get('/status', async (req, res) => {
  try {
    await backfillLegacyOrigins();
    const count = await publicSignupCount();
    res.json({
      open: count < PUBLIC_SIGNUP_LIMIT,
      remaining: Math.max(0, PUBLIC_SIGNUP_LIMIT - count),
      limit: PUBLIC_SIGNUP_LIMIT,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  let created = null;
  try {
    await backfillLegacyOrigins();
    const count = await publicSignupCount();
    if (count >= PUBLIC_SIGNUP_LIMIT) {
      return res.status(403).json({
        error: 'Registration is closed. Only 2 public admin accounts are allowed.',
        code: 'REGISTRATION_CLOSED',
      });
    }

    const body = req.body || {};
    const fields = {
      name: String(body.name || '').trim(),
      username: String(body.username || '').trim(),
      password: String(body.password || ''),
      role: String(body.role || 'President').trim() || 'President',
      phone: String(body.phone || '').trim(),
      city: String(body.city || '').trim(),
    };
    if (!fields.name || !fields.username || !fields.password || !fields.phone || !fields.city) {
      return res.status(400).json({ error: 'Please fill in all fields.' });
    }

    created = await Admin.create({
      ...fields,
      qrOnly: false,
      origin: 'public',
      token: null,
      tokenExpiresAt: null,
    });

    // Recheck after the write so two simultaneous requests cannot leave more
    // than two public accounts behind.
    const countAfter = await publicSignupCount();
    if (countAfter > PUBLIC_SIGNUP_LIMIT) {
      await Admin.findByIdAndDelete(created._id);
      return res.status(403).json({
        error: 'Registration is closed. Only 2 public admin accounts are allowed.',
        code: 'REGISTRATION_CLOSED',
      });
    }

    const token = await created.issueToken();
    res.status(201).json({ token, admin: created.toPublic() });
  } catch (err) {
    if (created && !res.headersSent) {
      try { await Admin.findByIdAndDelete(created._id); } catch { /* ignore */ }
    }
    if (err.code === 11000) return res.status(409).json({ error: 'Username already exists' });
    res.status(400).json({ error: err.message });
  }
});

export default router;
