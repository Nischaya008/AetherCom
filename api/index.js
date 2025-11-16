// Vercel serverless function entry point
// This file is in the root /api directory for Vercel
import app from '../backend/server.js';
import mongoose from 'mongoose';

// Ensure MongoDB connection for serverless functions
const ensureConnection = async () => {
  // If already connected, return
  if (mongoose.connection.readyState === 1) {
    return true;
  }

  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    console.error('MONGODB_URI environment variable is not set');
    return false;
  }

  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(MONGODB_URI, {
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
      });
      console.log('MongoDB connected successfully');
    }
    return true;
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    return false;
  }
};

// Middleware to ensure DB connection before handling requests
app.use(async (req, res, next) => {
  const connected = await ensureConnection();
  if (!connected) {
    return res.status(500).json({
      error: 'Database connection failed',
      message: 'Unable to connect to MongoDB. Please check environment variables.'
    });
  }
  next();
});

export default app;

