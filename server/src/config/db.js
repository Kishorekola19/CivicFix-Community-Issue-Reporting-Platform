
import mongoose from 'mongoose';

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error('MONGODB_URI is missing from environment variables');
  }

  try {
    await mongoose.connect(uri);
    console.log('MongoDB Atlas connected successfully');
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    throw error;
  }
};
