import mongoose from 'mongoose';
import fs from 'fs';
import User from './models/User.js';
import Admin from './models/Admin.js';

const MONGO_URI = 'mongodb+srv://aishwaryzaveri_db_user:RIICoTtU05WsV24f@qr-app.okafjbt.mongodb.net/QRAPP?appName=QR-App';

const seed = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    const raw = fs.readFileSync(new URL('../src/db.json', import.meta.url));
    const data = JSON.parse(raw);

    await User.deleteMany({});
    await Admin.deleteMany({});

    if (data.users && data.users.length > 0) {
      await User.insertMany(data.users);
      console.log(`Seeded ${data.users.length} users`);
    }

    if (data.admins && data.admins.length > 0) {
      const admins = data.admins.map(a => {
        const { id, ...rest } = a;
        return rest;
      });
      await Admin.insertMany(admins);
      console.log(`Seeded ${admins.length} admins`);
    }

    console.log('Seed complete');
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
};

seed();
