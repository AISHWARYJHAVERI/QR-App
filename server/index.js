import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import usersRouter from './routes/users.js';
import adminsRouter from './routes/admins.js';
import scansRouter from './routes/scans.js';
import committeesessionsRouter from './routes/committeesessions.js';
import eventDatesRouter from './routes/eventDates.js';
import superAdminRouter from './routes/superAdmin.js';
import publicRegisterRouter from './routes/publicRegister.js';

const app = express();
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://aishwaryzaveri_db_user:RIICoTtU05WsV24f@qr-app.okafjbt.mongodb.net/QRAPP?appName=QR-App';

app.use(cors());
app.use(express.json());

// Lightweight keep-alive/health check. Registered before the DB middleware so
// uptime cron jobs do not fail during a temporary database issue.
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

let cachedDb = null;
let connecting = null;

async function connectToDatabase() {
  if (cachedDb && mongoose.connection.readyState === 1) return cachedDb;
  if (connecting) return connecting;
  connecting = mongoose.connect(MONGO_URI);
  cachedDb = await connecting;
  connecting = null;
  return cachedDb;
}

app.use(async (req, res, next) => {
  try {
    await connectToDatabase();
    next();
  } catch (err) {
    console.error('MongoDB connection error:', err);
    res.status(500).json({ error: 'Database connection failed' });
  }
});

app.use('/users', usersRouter);
app.use('/admins', adminsRouter);
app.use('/api/scans', scansRouter);
app.use('/committeesessions', committeesessionsRouter);
app.use('/api/event-dates', eventDatesRouter);
app.use('/api/super-admin', superAdminRouter);
app.use('/api/public-register', publicRegisterRouter);

app.get('/', (req, res) => {
  res.json({ message: 'QR App API running on MongoDB' });
});

export default app;

if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 5001;
  connectToDatabase()
    .then(() => {
      console.log('Connected to MongoDB (QRAPP)');
      app.listen(PORT, () => {
        console.log(`Server running at http://localhost:${PORT}`);
      });
    })
    .catch((err) => {
      console.error('MongoDB connection error:', err);
      process.exit(1);
    });
}
