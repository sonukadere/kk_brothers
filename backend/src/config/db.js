const mongoose = require('mongoose');
const dns = require('dns');

// Configure reliable DNS servers to prevent SRV lookup failures on Windows/cloud environments
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch (e) {
  // Ignore in environments where setting DNS servers is restricted
}

const connectDB = async () => {
  const uri =
    process.env.DATABASE_URL ||
    process.env.MONGO_URI ||
    'mongodb+srv://sonu1506_db_user:Sonu%401506@cluster0.ywjskqg.mongodb.net/kk_brothers?retryWrites=true&w=majority&appName=Cluster0';

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
    });

    console.log(
      `[MongoDB Atlas] Connected successfully to host: ${conn.connection.host}, database: ${conn.connection.name}`
    );
    return conn;
  } catch (error) {
    console.error(`[MongoDB Error] Failed to connect: ${error.message}`);
    return null;
  }
};

module.exports = connectDB;
