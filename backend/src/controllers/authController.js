const User = require('../models/User');
const Staff = require('../models/Staff');

// Helper to send token response with user details
const sendTokenResponse = (user, statusCode, res, message = 'Success') => {
  const token = user.getSignedJwtToken();

  res.status(statusCode).json({
    success: true,
    message,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      isActive: user.isActive,
      staffProfile: user.staffProfile,
      createdAt: user.createdAt,
    },
  });
};

// @desc    Login with Email OR Mobile Number and Password
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const identifier = (req.body.identifier || req.body.email || req.body.phone || '').trim();
    const { password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your email or mobile number, and password.',
      });
    }

    // Determine query: email vs phone number
    let query;
    if (identifier.includes('@')) {
      query = { email: identifier.toLowerCase() };
    } else {
      // Clean non-digit characters for phone comparison
      const digitsOnly = identifier.replace(/\D/g, '');
      const last10 = digitsOnly.slice(-10);

      const conditions = [
        { phone: identifier },
        { phone: digitsOnly },
        { email: identifier.toLowerCase() },
      ];

      if (last10 && last10.length >= 7) {
        const flexiblePattern = last10.split('').join('[\\s\\-\\(\\)]*') + '$';
        conditions.push({ phone: { $regex: flexiblePattern, $options: 'i' } });
      }

      query = { $or: conditions };
    }

    // Check for user
    const user = await User.findOne(query)
      .select('+password')
      .populate('staffProfile');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. No account found with these details.',
      });
    }

    // Strict account active check
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact the administrator.',
      });
    }

    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Incorrect password.',
      });
    }

    // Update lastLogin
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    sendTokenResponse(user, 200, res, 'Logged in successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Public registration endpoint (Disabled by security policy)
// @route   POST /api/auth/register
// @access  Disabled (Only Admin can create user accounts via /api/users)
exports.register = async (req, res) => {
  return res.status(403).json({
    success: false,
    message: 'Public user registration is disabled. Only Administrators can create user accounts.',
  });
};

// @desc    Get current logged in user profile
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).populate('staffProfile');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found',
      });
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update current user's profile
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, phone } = req.body;
    const fieldsToUpdate = {};
    if (name) fieldsToUpdate.name = name.trim();
    if (phone !== undefined) fieldsToUpdate.phone = phone.trim();

    // Security: Never allow non-admin to change role, email or active status through profile update
    const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
      new: true,
      runValidators: true,
    }).populate('staffProfile');

    // Also update staff profile name/phone if linked
    if (user.staffProfile) {
      await Staff.findByIdAndUpdate(user.staffProfile._id, {
        ...(name && { name: name.trim() }),
        ...(phone && { phone: phone.trim() }),
      });
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Change password for logged-in user
// @route   PUT /api/auth/password
// @access  Private
exports.updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both current password and new password.',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long.',
      });
    }

    const user = await User.findById(req.user.id).select('+password');

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect.',
      });
    }

    user.password = newPassword;
    await user.save();

    sendTokenResponse(user, 200, res, 'Password changed successfully');
  } catch (error) {
    next(error);
  }
};
