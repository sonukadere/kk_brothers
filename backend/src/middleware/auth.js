const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes: verify JWT & load user
exports.protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route. Token missing.',
    });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'kk_brothers_super_secret_jwt_key_2026'
    );

    const user = await User.findById(decoded.id).populate('staffProfile');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'The user belonging to this token no longer exists.',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated. Please contact administrator.',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired authentication token.',
    });
  }
};

// Grant access to specific roles (e.g. 'admin')
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user ? req.user.role : 'unauthenticated'}' is not authorized to access this route.`,
      });
    }
    next();
  };
};

// Strict check: non-admin users can ONLY access records belonging to themselves
exports.verifyResourceOwnership = (getOwnerUserId) => {
  return (req, res, next) => {
    if (req.user.role === 'admin') {
      return next(); // Admin has full access
    }

    const ownerId = typeof getOwnerUserId === 'function' ? getOwnerUserId(req) : req.params.userId;
    if (ownerId && ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are only allowed to view and manage your own records.',
      });
    }

    next();
  };
};
