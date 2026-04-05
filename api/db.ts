import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import bcrypt from 'bcryptjs';
import User from './models/User.js';
import Appointment from './models/Appointment.js';
import Record from './models/Record.js';

let mongoServer: MongoMemoryServer;

export const connectDB = async () => {
  try {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();

    await mongoose.connect(uri);
    console.log('MongoDB Memory Server connected');

    await seedData();
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const seedData = async () => {
  const usersCount = await User.countDocuments();
  if (usersCount > 0) return;

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('password123', salt);

  await User.create({
    name: 'Admin User',
    email: 'admin@medicare.com',
    password: hashedPassword,
    role: 'admin',
  });

  const doctor1 = await User.create({
    name: 'Dr. Sarah Smith',
    email: 'doctor1@medicare.com',
    password: hashedPassword,
    role: 'doctor',
    specialization: 'Cardiologist',
  });

  await User.create({
    name: 'Dr. John Doe',
    email: 'doctor2@medicare.com',
    password: hashedPassword,
    role: 'doctor',
    specialization: 'Dermatologist',
  });

  const patient1 = await User.create({
    name: 'Alice Johnson',
    email: 'patient1@medicare.com',
    password: hashedPassword,
    role: 'patient',
  });

  await Appointment.create({
    patientId: patient1._id,
    doctorId: doctor1._id,
    date: new Date(Date.now() + 86400000), // tomorrow
    status: 'confirmed',
    notes: 'Regular checkup',
  });

  await Record.create({
    patientId: patient1._id,
    doctorId: doctor1._id,
    title: 'Blood Test Results',
    description: 'All levels are normal',
    verified: true,
  });

  console.log('Database seeded with dummy data');
};

export const disconnectDB = async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
};
