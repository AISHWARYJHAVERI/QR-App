import Admin from '../models/Admin.js';
import SuperAdmin from '../models/SuperAdmin.js';
import { bearerToken } from '../utils/adminOrigins.js';

// Accepts either the super-admin token or a full-admin token.
// QR-only admins never receive a token, so they cannot call these routes.
export const requireAdminAuth = async (req, res, next) => {
  const token = bearerToken(req);
  if (!token) return res.status(401).json({ error: 'Admin login required' });

  const superAdmin = await SuperAdmin.findOne({
    sessionToken: token,
    sessionExpiresAt: { $gt: new Date() },
  });
  if (superAdmin) {
    req.superAdmin = superAdmin;
    return next();
  }

  const admin = await Admin.findOne({
    token,
    tokenExpiresAt: { $gt: new Date() },
    qrOnly: false,
  });
  if (!admin) return res.status(401).json({ error: 'Invalid or expired admin session' });

  req.admin = admin;
  next();
};
