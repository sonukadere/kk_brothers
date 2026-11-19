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

// @desc    Login with Email, Mobile Number, or Staff ID and Password
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const identifier = (req.body.identifier || req.body.email || req.body.phone || '').trim();
    const { password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your email, mobile number or Staff ID, and password.',
      });
    }

    // Determine query: email vs phone number vs Staff ID
    let query;
    let matchedStaff = null;

    if (identifier.includes('@')) {
      query = { email: identifier.toLowerCase() };
    } else if (/^stf[\s-]?\d+/i.test(identifier)) {
      // Direct Staff ID login (e.g. STF-0001, STF0001)
      const cleanCode = identifier.toUpperCase().replace(/\s+/g, '');
      const withHyphen = cleanCode.replace(/^(STF)(\d+)$/, '$1-$2');
      matchedStaff = await Staff.findOne({
        $or: [
          { staffCode: cleanCode },
          { staffCode: withHyphen },
          { staffId: cleanCode },
          { staffId: withHyphen },
        ],
      });

      if (matchedStaff && matchedStaff.user) {
        query = { _id: matchedStaff.user };
      } else if (matchedStaff) {
        query = { staffProfile: matchedStaff._id };
      } else {
        query = { email: identifier.toLowerCase() };
      }
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

      // Check if this phone belongs to a Staff worker
      matchedStaff = await Staff.findOne({
        $or: [
          { phone: identifier },
          { phone: digitsOnly },
          ...(last10.length >= 7 ? [{ phone: { $regex: last10 + '$' } }] : []),
        ],
      });

      if (matchedStaff && matchedStaff.user) {
        conditions.push({ _id: matchedStaff.user });
      }

      query = { $or: conditions };
    }

    // Check for user
    let user = await User.findOne(query)
      .select('+password')
      .populate('staffProfile');

    // If User was not found, but a registered Staff was matched (auto-provision on the fly)
    if (!user && matchedStaff) {
      const isDefault =
        password === 'Staff@123' ||
        password === matchedStaff.phone ||
        (matchedStaff.phone && password === matchedStaff.phone.slice(-6));

      if (!isDefault) {
        return res.status(401).json({
          success: false,
          message: 'Invalid password. For staff initial login, default password is: Staff@123',
        });
      }

      const cleanEmail = `${matchedStaff.staffCode.toLowerCase().replace(/[^a-z0-9]/g, '')}@staff.kkbrothers.com`;
      user = await User.create({
        name: matchedStaff.name,
        email: cleanEmail,
        phone: matchedStaff.phone,
        password: password,
        role: 'user',
        staffProfile: matchedStaff._id,
        isActive: matchedStaff.status === 'active',
      });
      matchedStaff.user = user._id;
      await matchedStaff.save();
      user = await User.findById(user._id).select('+password').populate('staffProfile');
    }

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

    sendTokenResponse(user, 200, res, `Welcome ${user.name}! Logged in successfully.`);
  } catch (error) {
    next(error);
  }
};

// @desc    Register a new Staff Worker account
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { name, phone, password, designation, city, address, email } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide staff worker full name.',
      });
    }

    if (!phone || !phone.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a 10-digit mobile number.',
      });
    }

    const cleanPhone = phone.replace(/[^\d]/g, '').slice(-10);
    if (cleanPhone.length !== 10) {
      return res.status(400).json({
        success: false,
        message: 'Mobile number must be a valid 10-digit number.',
      });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.',
      });
    }

    // Role allowed for public registration is strictly 'user' (staff)
    const validDesignation = designation === 'Chef' ? 'Chef' : 'Kitchen Helper';

    // 1. Check if a User already exists with this phone
    const existingUser = await User.findOne({ phone: cleanPhone });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this mobile number already exists. Please sign in.',
      });
    }

    // 2. Check if a Staff record already exists for this phone
    let staff = await Staff.findOne({ phone: cleanPhone });
    if (staff && staff.user) {
      return res.status(400).json({
        success: false,
        message: 'A staff profile is already linked to this mobile number. Please sign in.',
      });
    }

    const defaultRate = validDesignation === 'Chef' ? 800 : 600;

    if (staff) {
      // Existing unlinked staff record: link user to it
      staff.name = name.trim();
      staff.designation = validDesignation;
      staff.defaultDailyRate = defaultRate;
      staff.defaultHourlyRate = Math.round(defaultRate / 8);
      if (address || city) staff.address = address ? address.trim() : (city ? city.trim() : 'Indore');
      await staff.save();
    } else {
      // Create new Staff member
      staff = await Staff.create({
        name: name.trim(),
        phone: cleanPhone,
        designation: validDesignation,
        defaultDailyRate: defaultRate,
        defaultHourlyRate: Math.round(defaultRate / 8),
        address: address ? address.trim() : (city ? city.trim() : 'Indore'),
        status: 'active',
        joiningDate: new Date(),
        joinDate: new Date(),
      });
    }

    // Generate clean email for staff worker
    const cleanEmail =
      email && email.trim()
        ? email.trim().toLowerCase()
        : `${staff.staffCode.toLowerCase().replace(/[^a-z0-9]/g, '')}@staff.kkbrothers.com`;

    // Ensure email is unique
    const emailConflict = await User.findOne({ email: cleanEmail });
    const finalEmail = emailConflict
      ? `${cleanPhone}@staff.kkbrothers.com`
      : cleanEmail;

    const user = await User.create({
      name: name.trim(),
      email: finalEmail,
      phone: cleanPhone,
      password,
      role: 'user',
      isActive: true,
      staffProfile: staff._id,
    });

    staff.user = user._id;
    await staff.save();

    sendTokenResponse(
      user,
      201,
      res,
      `Staff registered successfully! Staff ID: ${staff.staffCode}`
    );
  } catch (error) {
    next(error);
  }
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
