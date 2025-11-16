// Vercel serverless function entry point
// This file is in the root /api directory for Vercel
import app from '../backend/server.js';
import mongoose from 'mongoose';

// Ensure MongoDB connection for serverless functions
const ensureConnection = async () => {
  if (mongoose.connection.readyState === 0) {
    const MONGODB_URI = process.env.MONGODB_URI;
    if (MONGODB_URI) {
      try {
        await mongoose.connect(MONGODB_URI, {
          serverSelectionTimeoutMS: 5000,
          socketTimeoutMS: 45000,
        });
      } catch (error) {
        console.error('Failed to connect to MongoDB:', error);
      }
    }
  }
};

// Middleware to ensure DB connection before handling requests
app.use(async (req, res, next) => {
  await ensureConnection();
  next();
});

export default app;

