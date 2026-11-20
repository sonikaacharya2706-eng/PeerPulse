import mongoose from 'mongoose';

const connectDB = async () => {
  const uri = process.env.MONGO_URI || (
    process.env.NODE_ENV === 'production'
      ? null
      : 'mongodb://127.0.0.1:27017/smart_campus'
  );

  if (!uri) {
    throw new Error('FATAL: MONGO_URI environment variable is missing.');
  }

  const conn = await mongoose.connect(uri);
  console.log(`[MongoDB] Connected: ${conn.connection.host}`);
};

export default connectDB;
