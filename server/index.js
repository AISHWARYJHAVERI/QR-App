import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import usersRouter from './routes/users.js';
import adminsRouter from './routes/admins.js';
import scansRouter from './routes/scans.js';

const app = express();
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://aishwaryzaveri_db_user:RIICoTtU05WsV24f@qr-app.okafjbt.mongodb.net/QRAPP?appName=QR-App';

app.use(cors());
app.use(express.json());

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
