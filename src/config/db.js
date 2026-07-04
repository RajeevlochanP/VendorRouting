import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

export class Database {
  constructor() {
    this.uri = process.env.MONGO_URI;
    if (!this.uri) {
      throw new Error('MONGO_URI is missing from environment variables.');
    }
  }

  async connect() {
    try {
      mongoose.connection.on('connected', () => {
        console.log('Successfully connected to MongoDB Cluster.');
      });

      mongoose.connection.on('error', (err) => {
        console.error(`MongoDB connection error: ${err}`);
      });

      mongoose.connection.on('disconnected', () => {
        console.warn('MongoDB connection lost.');
      });

      await mongoose.connect(this.uri);
    } catch (error) {
      console.error('Failed to initialize MongoDB connection:', error);
      process.exit(1);
    }
  }
  
  async disconnect() {
    await mongoose.disconnect();
    console.log('MongoDB connection closed cleanly.');
  }
}