const mongoose = require('mongoose');

// Configure mongoose for serverless environment
mongoose.set('bufferCommands', false);

let isConnected = false;

const connectDB = async () => {
  if (isConnected) {
    console.log('✅ MongoDB already connected');
    return;
  }

  try {
    const options = {
      serverSelectionTimeoutMS: 2000, // Keep trying to send operations for 2 seconds
      socketTimeoutMS: 20000, // Close sockets after 20 seconds of inactivity
      maxPoolSize: 3, // Maintain up to 3 socket connections
      minPoolSize: 0, // No minimum connections
      maxIdleTimeMS: 10000, // Close connections after 10 seconds of inactivity
      connectTimeoutMS: 3000, // Give up initial connection after 3 seconds
      heartbeatFrequencyMS: 5000, // Send a ping every 5 seconds
      retryWrites: true,
      w: 'majority',
      retryReads: true
    };

    await mongoose.connect(process.env.MONGODB_URI, options);
    isConnected = true;
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    isConnected = false;
    throw error;
  }
};

const disconnectDB = async () => {
  if (isConnected) {
    await mongoose.connection.close();
    isConnected = false;
    console.log('✅ MongoDB disconnected');
  }
};

// Handle connection events
mongoose.connection.on('connected', () => {
  console.log('✅ Mongoose connected to MongoDB');
  isConnected = true;
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Mongoose connection error:', err);
  isConnected = false;
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️ Mongoose disconnected from MongoDB');
  isConnected = false;
});

// Handle process termination
process.on('SIGINT', async () => {
  await disconnectDB();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await disconnectDB();
  process.exit(0);
});

module.exports = { connectDB, disconnectDB, isConnected: () => isConnected };
