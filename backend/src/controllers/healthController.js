const mongoose = require('mongoose');
const User = require('../models/User');
const Staff = require('../models/Staff');
const Client = require('../models/Client');
const Duty = require('../models/Duty');

exports.getHealth = async (req, res) => {
  try {
    const mongoState = mongoose.connection.readyState;
    // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
    const stateMap = {
      0: 'Disconnected',
      1: 'Connected',
      2: 'Connecting',
      3: 'Disconnecting',
    };

    let counts = { users: 0, staff: 0, clients: 0, duties: 0 };
    if (mongoState === 1) {
      counts = {
        users: await User.countDocuments().catch(() => 0),
        staff: await Staff.countDocuments().catch(() => 0),
        clients: await Client.countDocuments().catch(() => 0),
        duties: await Duty.countDocuments().catch(() => 0),
      };
    }

    res.status(200).json({
      success: true,
      service: 'KK Brothers - Staff Duty & Payment Management System API',
      status: 'operational',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      database: {
        status: stateMap[mongoState] || 'Unknown',
        connected: mongoState === 1,
        host: mongoose.connection.host || '127.0.0.1',
        name: mongoose.connection.name || 'kk_brothers_management',
        counts,
      },
      environment: process.env.NODE_ENV || 'development',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      service: 'KK Brothers API',
      status: 'degraded',
      error: error.message,
    });
  }
};
