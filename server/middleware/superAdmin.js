import SuperAdmin from '../models/SuperAdmin.js';

export const requireSuperAdmin = async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) return res.status(401).json({ error: 'Super admin login required' });

  const admin = await SuperAdmin.findOne({
    sessionToken: token,
    sessionExpiresAt: { $gt: new Date() },
  });
  if (!admin) return res.status(401).json({ error: 'Invalid or expired session' });

  req.superAdmin = admin;
  next();
};

export default requireSuperAdmin;
