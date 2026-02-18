
// module.exports = connectDB;
const mongoose = require('mongoose');
require('dotenv').config(); // Loads variables from .env

const connectDB = async () => {
  try {
    // We use the variable from .env for security
    const conn = await mongoose.connect(process.env.MONGO_URI);
    
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ Connection Error: ${error.message}`);
    process.exit(1); 
  }
};

module.exports = connectDB;