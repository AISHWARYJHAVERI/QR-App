import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import usersRouter from './routes/users.js';
import adminsRouter from './routes/admins.js';

const app = express();
const PORT = process.env.PORT || 5001;
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://aishwaryzaveri_db_user:RIICoTtU05WsV24f@qr-app.okafjbt.mongodb.net/QRAPP?appName=QR-App';

app.use(cors());
app.use(express.json());

app.use('/users', usersRouter);
app.use('/admins', adminsRouter);

app.get('/', (req, res) => {
  res.json({ message: 'QR App API running on MongoDB' });
});

mongoose.connect(MONGO_URI)
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
