import { Router } from 'express';
import User from '../models/User.js';

const router = Router();

// Same rules as src/utils/nameKey.js: ignore case/spaces/symbols, allow swapped words,
// exact letters, trailing number = family member number.
const parseName = (name) => {
  const words = String(name || '').toLowerCase().replace(/[^\p{L}\p{N}\s]+/gu, '').trim().split(/\s+/).filter(Boolean);
  let num = null;
  if (words.length) {
    const last = words[words.length - 1];
    const m = last.match(/^(\D*)(\d+)$/);
    if (m && (m[1] || words.length > 1)) {
      num = parseInt(m[2], 10);
      if (m[1]) words[words.length - 1] = m[1];
      else words.pop();
    }
  }
  return { compact: words.join(''), sorted: [...words].sort().join(' '), num };
};

const sameName = (a, b) => {
  const pa = parseName(a);
  const pb = parseName(b);
  return !!pa.compact && pa.num === pb.num && (pa.compact === pb.compact || pa.sorted === pb.sorted);
};

const nameTaken = async (name, excludeId) => {
  if (!parseName(name).compact) return false;
  const users = await User.find({}, { name: 1 }).lean();
  return users.some(u => String(u._id) !== String(excludeId) && sameName(u.name, name));
};

const DUP_ERROR = (name) => ({ error: `"${String(name).trim()}": Name already used — add a middle name or something different.`, code: 'DUPLICATE_NAME' });

router.get('/', async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    if (await nameTaken(req.body?.name)) return res.status(409).json(DUP_ERROR(req.body.name));
    const user = await User.create(req.body);
    res.status(201).json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { _id, id, ...updateData } = req.body;
    if (updateData.name !== undefined) {
      const current = await User.findById(req.params.id, { name: 1 }).lean();
      if (current && !sameName(current.name, updateData.name) && await nameTaken(updateData.name, req.params.id)) {
        return res.status(409).json(DUP_ERROR(updateData.name));
      }
    }
    const user = await User.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'User deleted', id: req.params.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
