const User = require('../models/User');
const Staff = require('../models/Staff');

// @desc    View all users (Admin only)
// @route   GET /api/users
// @access  Private (Admin only)
exports.getUsers = async (req, res, next) => {
  try {
    const { search, role, status } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    if (role && ['admin', 'user'].includes(role)) {
      query.role = role;
    }

    if (status !== undefined && status !== '') {
      query.isActive = status === 'active' || status === 'true';
    }

    const users = await User.find(query)
      .populate('staffProfile', 'staffCode designation defaultDailyRate status')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single user by ID (Admin only)
// @route   GET /api/users/:id
// @access  Private (Admin only)
exports.getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).populate('staffProfile');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found',
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new user (Admin only)
// @route   POST /api/users
// @access  Private (Admin only)
exports.createUser = async (req, res, next) => {
  try {
    const { name, email, phone, password, role, staffProfileId } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and initial password are required.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.',
      });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'A user account with this email address already exists.',
      });
    }

    // Role enforcement - only valid roles
    const assignedRole = role === 'admin' ? 'admin' : 'user';

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone ? phone.trim() : '',
      password,
      role: assignedRole,
      isActive: true,
    });

    // If role is user, link to existing staff or create staff profile
    if (assignedRole === 'user') {
      if (staffProfileId) {
        const staff = await Staff.findById(staffProfileId);
        if (staff) {
          staff.user = user._id;
          await staff.save();
          user.staffProfile = staff._id;
          await user.save();
        }
      } else {
        // Auto-create linked staff profile
        const staff = await Staff.create({
          user: user._id,
          name: user.name,
          phone: user.phone || 'N/A',
          designation: 'Waiter',
          defaultDailyRate: 600,
          status: 'active',
        });
        user.staffProfile = staff._id;
        await user.save();
      }
    }

    const createdUser = await User.findById(user._id).populate('staffProfile');

    res.status(201).json({
      success: true,
      message: `User account created successfully for ${createdUser.name} (${createdUser.role})`,
      data: createdUser,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Edit user details (Admin only)
// @route   PUT /api/users/:id
// @access  Private (Admin only)
exports.updateUser = async (req, res, next) => {
  try {
    const { name, email, phone, role } = req.body;
    const userToUpdate = await User.findById(req.params.id);

    if (!userToUpdate) {
      return res.status(404).json({
        success: false,
        message: 'User account not found',
      });
    }

    // Check if new email conflicts with another user
    if (email && email.toLowerCase() !== userToUpdate.email) {
      const emailExists = await User.findOne({
        email: email.toLowerCase(),
        _id: { $ne: userToUpdate._id },
      });
      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: 'This email is already in use by another account.',
        });
      }
      userToUpdate.email = email.toLowerCase().trim();
    }

    if (name) userToUpdate.name = name.trim();
    if (phone !== undefined) userToUpdate.phone = phone.trim();
    if (role && ['admin', 'user'].includes(role)) {
      // Prevent admin from accidentally demoting themselves if they are the only admin
      if (userToUpdate._id.toString() === req.user._id.toString() && role !== 'admin') {
        return res.status(400).json({
          success: false,
          message: 'You cannot remove your own administrator privileges.',
        });
      }
      userToUpdate.role = role;
    }

    await userToUpdate.save();

    // If linked to staff profile, keep staff name/phone in sync
    if (userToUpdate.staffProfile) {
      await Staff.findByIdAndUpdate(userToUpdate.staffProfile, {
        ...(name && { name: name.trim() }),
        ...(phone && { phone: phone.trim() }),
      });
    }

    const updatedUser = await User.findById(userToUpdate._id).populate('staffProfile');

    res.status(200).json({
      success: true,
      message: 'User account updated successfully',
      data: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Activate or Deactivate user account (Admin only)
// @route   PATCH /api/users/:id/status
// @access  Private (Admin only)
exports.toggleUserStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found',
      });
    }

    // Prevent admin from deactivating their own account
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot deactivate your own administrator account.',
      });
    }

    // If explicit isActive provided in body, use it; otherwise toggle
    const newStatus =
      req.body.isActive !== undefined ? Boolean(req.body.isActive) : !user.isActive;

    user.isActive = newStatus;
    await user.save();

    // If linked to staff profile, update staff status as well
    if (user.staffProfile) {
      await Staff.findByIdAndUpdate(user.staffProfile, {
        status: newStatus ? 'active' : 'inactive',
      });
    }

    res.status(200).json({
      success: true,
      message: `User account ${newStatus ? 'activated' : 'deactivated'} successfully`,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset user password (Admin only)
// @route   PATCH /api/users/:id/reset-password
// @access  Private (Admin only)
exports.resetUserPassword = async (req, res, next) => {
  try {
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long.',
      });
    }

    const user = await User.findById(req.params.id).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found',
      });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: `Password has been reset successfully for user: ${user.name}`,
    });
  } catch (error) {
    next(error);
  }
};
