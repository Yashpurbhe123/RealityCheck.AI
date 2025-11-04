const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/twitter-clone';
    console.log('Attempting to connect to MongoDB...');
    console.log('URI:', mongoURI.replace(/\/\/.*@/, '//***:***@')); // Hide credentials in logs
    
    const conn = await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
    
    // Log connection state changes
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected');
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected');
    });
    
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    console.error('Make sure:');
    console.error('  1. MongoDB is running');
    console.error('  2. MONGODB_URI in .env is correct');
    console.error('  3. Network/firewall allows connection');
    process.exit(1);
  }
};

module.exports = connectDB;
