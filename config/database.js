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
      serverSelectionTimeoutMS: 3000, // Keep trying to send operations for 3 seconds
      socketTimeoutMS: 30000, // Close sockets after 30 seconds of inactivity
      maxPoolSize: 5, // Maintain up to 5 socket connections
      minPoolSize: 1, // Maintain a minimum of 1 socket connection
      maxIdleTimeMS: 20000, // Close connections after 20 seconds of inactivity
      connectTimeoutMS: 5000, // Give up initial connection after 5 seconds
      heartbeatFrequencyMS: 10000, // Send a ping every 10 seconds
      retryWrites: true,
      w: 'majority'
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
