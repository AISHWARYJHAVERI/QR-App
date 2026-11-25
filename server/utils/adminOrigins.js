import Admin from '../models/Admin.js';

// Admins created before this feature had no origin. They are the original account(s).
export const backfillLegacyOrigins = async () => {
  await Admin.updateMany({ origin: { $exists: false } }, { $set: { origin: 'seed' } });
};

export const bearerToken = (req) => {
  const header = req.headers.authorization || '';
  return header.startsWith('Bearer ') ? header.slice(7) : '';
};
