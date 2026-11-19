const Staff = require('../models/Staff');
const User = require('../models/User');
const Duty = require('../models/Duty');
const StaffPayment = require('../models/StaffPayment');

// @desc    Get all staff members with search and filter
// @route   GET /api/staff
// @access  Private (Admin only)
exports.getStaffList = async (req, res, next) => {
  try {
    const { search, designation, status } = req.query;
    const query = {};

    // Search by name and mobile number (or staffCode)
    if (search) {
      const searchClean = search.trim();
      const digitsOnly = searchClean.replace(/\D/g, '');
      const searchConditions = [
        { name: { $regex: searchClean, $options: 'i' } },
        { staffCode: { $regex: searchClean, $options: 'i' } },
        { phone: { $regex: searchClean, $options: 'i' } },
      ];

      if (digitsOnly && digitsOnly.length >= 4) {
        searchConditions.push({ phone: { $regex: digitsOnly } });
      }

      query.$or = searchConditions;
    }

    if (designation) query.designation = designation;

    // Filter by active/inactive
    if (status && status !== 'all') {
      query.status = status;
    }

    const staffList = await Staff.find(query).sort({ createdAt: -1 });

    // Aggregate duties and payments for summary statistics on each staff member
    const staffIds = staffList.map((s) => s._id);

    const dutiesAgg = await Duty.aggregate([
      { $match: { staff: { $in: staffIds } } },
      {
        $group: {
          _id: '$staff',
          totalDuties: { $sum: 1 },
          totalHours: { $sum: '$hoursWorked' },
          totalEarned: {
            $sum: {
              $cond: [{ $eq: ['$status', 'Approved'] }, '$staffWage', 0],
            },
          },
        },
      },
    ]);

    const dutiesMap = {};
    dutiesAgg.forEach((d) => {
      dutiesMap[d._id.toString()] = d;
    });

    const paymentsAgg = await StaffPayment.aggregate([
      { $match: { staff: { $in: staffIds }, status: 'Completed' } },
      {
        $group: {
          _id: '$staff',
          totalPaid: { $sum: '$amount' },
        },
      },
    ]);

    const paymentsMap = {};
    paymentsAgg.forEach((p) => {
      paymentsMap[p._id.toString()] = p.totalPaid;
    });

    const enrichedStaff = staffList.map((s) => {
      const sObj = s.toObject();
      const dData = dutiesMap[s._id.toString()] || { totalDuties: 0, totalHours: 0, totalEarned: 0 };
      const paid = paymentsMap[s._id.toString()] || 0;
      sObj.totalDuties = dData.totalDuties;
      sObj.totalHours = dData.totalHours;
      sObj.totalEarnings = dData.totalEarned;
      sObj.totalPaid = paid;
      sObj.totalPending = Math.max(0, dData.totalEarned - paid);
      return sObj;
    });

    res.status(200).json({
      success: true,
      count: enrichedStaff.length,
      data: enrichedStaff,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get individual staff profile with complete duty and earnings summary
// @route   GET /api/staff/:id
// @access  Private (Admin only)
exports.getStaffById = async (req, res, next) => {
  try {
    const staff = await Staff.findById(req.params.id).populate('user', 'email isActive lastLogin');

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found',
      });
    }

    // Duty statistics
    const totalDuties = await Duty.countDocuments({ staff: staff._id });

    const dutiesAgg = await Duty.aggregate([
      { $match: { staff: staff._id } },
      {
        $group: {
          _id: null,
          totalHours: { $sum: '$hoursWorked' },
          totalEarned: {
            $sum: {
              $cond: [{ $eq: ['$status', 'Approved'] }, '$staffWage', 0],
            },
          },
        },
      },
    ]);

    const totalHours = dutiesAgg[0]?.totalHours || 0;
    const totalEarnings = dutiesAgg[0]?.totalEarned || 0;

    // Payments summary
    const paymentsAgg = await StaffPayment.aggregate([
      { $match: { staff: staff._id, status: 'Completed' } },
      { $group: { _id: null, totalPaid: { $sum: '$amount' } } },
    ]);

    const totalPaid = paymentsAgg[0]?.totalPaid || 0;
    const totalPending = Math.max(0, totalEarnings - totalPaid);

    // Recent duty records
    const recentDuties = await Duty.find({ staff: staff._id })
      .populate('client', 'companyName type contactPerson phone')
      .sort({ dutyDate: -1, createdAt: -1 })
      .limit(10);

    // Recent payment records
    const recentPayments = await StaffPayment.find({ staff: staff._id })
      .sort({ paymentDate: -1, createdAt: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      data: staff,
      stats: {
        totalDuties,
        totalWorkingHours: totalHours,
        totalEarnings,
        totalPaid,
        totalPending,
      },
      recentDuties,
      recentPayments,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get complete duty history for a specific staff member
// @route   GET /api/staff/:id/duties
// @access  Private (Admin only)
exports.getStaffDutyHistory = async (req, res, next) => {
  try {
    const { status } = req.query;
    const query = { staff: req.params.id };

    if (status && status !== 'all') {
      query.status = status;
    }

    const duties = await Duty.find(query)
      .populate('client', 'companyName type contactPerson phone city')
      .sort({ dutyDate: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: duties.length,
      data: duties,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add new staff member
// @route   POST /api/staff
// @access  Private (Admin only)
exports.createStaff = async (req, res, next) => {
  try {
    const {
      name,
      phone,
      alternatePhone,
      profilePhoto,
      address,
      dateOfBirth,
      age,
      joiningDate,
      designation,
      defaultDailyRate,
      defaultHourlyRate,
      status,
      idProofType,
      idProofNumber,
      bankDetails,
      emergencyContact,
      notes,
    } = req.body;

    if (!name || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Full Name and Mobile Number are required.',
      });
    }

    const staff = await Staff.create({
      name: name.trim(),
      phone: phone.trim(),
      alternatePhone: alternatePhone ? alternatePhone.trim() : '',
      profilePhoto: profilePhoto || '',
      address: address ? address.trim() : '',
      dateOfBirth: dateOfBirth || null,
      age: age ? Number(age) : null,
      joiningDate: joiningDate || Date.now(),
      designation: designation || 'Kitchen Helper',
      defaultDailyRate: defaultDailyRate !== undefined && defaultDailyRate !== '' ? Number(defaultDailyRate) : 600,
      defaultHourlyRate: defaultHourlyRate ? Number(defaultHourlyRate) : 75,
      status: status || 'active',
      idProofType: idProofType || 'Aadhaar',
      idProofNumber: idProofNumber ? idProofNumber.trim() : '',
      bankDetails: bankDetails || {},
      emergencyContact: emergencyContact || {},
      notes: notes ? notes.trim() : '',
    });

    res.status(201).json({
      success: true,
      message: `Staff member registered successfully with Staff ID: ${staff.staffCode}`,
      data: staff,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Edit staff details
// @route   PUT /api/staff/:id
// @access  Private (Admin only)
exports.updateStaff = async (req, res, next) => {
  try {
    const staff = await Staff.findById(req.params.id);

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found',
      });
    }

    const {
      name,
      phone,
      alternatePhone,
      profilePhoto,
      address,
      dateOfBirth,
      age,
      joiningDate,
      designation,
      defaultDailyRate,
      defaultHourlyRate,
      status,
      idProofType,
      idProofNumber,
      bankDetails,
      emergencyContact,
      notes,
    } = req.body;

    if (name) staff.name = name.trim();
    if (phone) staff.phone = phone.trim();
    if (alternatePhone !== undefined) staff.alternatePhone = alternatePhone.trim();
    if (profilePhoto !== undefined) staff.profilePhoto = profilePhoto;
    if (address !== undefined) staff.address = address.trim();
    if (dateOfBirth !== undefined) staff.dateOfBirth = dateOfBirth || null;
    if (age !== undefined) staff.age = age ? Number(age) : null;
    if (joiningDate) {
      staff.joiningDate = joiningDate;
      staff.joinDate = joiningDate;
    }
    if (designation) staff.designation = designation;
    if (defaultDailyRate !== undefined && defaultDailyRate !== '') {
      staff.defaultDailyRate = Number(defaultDailyRate);
    }
    if (defaultHourlyRate !== undefined && defaultHourlyRate !== '') {
      staff.defaultHourlyRate = Number(defaultHourlyRate);
    }
    if (status) staff.status = status;
    if (idProofType) staff.idProofType = idProofType;
    if (idProofNumber !== undefined) staff.idProofNumber = idProofNumber.trim();
    if (bankDetails) staff.bankDetails = { ...staff.bankDetails, ...bankDetails };
    if (emergencyContact) staff.emergencyContact = { ...staff.emergencyContact, ...emergencyContact };
    if (notes !== undefined) staff.notes = notes.trim();

    await staff.save();

    // If staff has linked user, sync name and phone
    if (staff.user) {
      await User.findByIdAndUpdate(staff.user, {
        ...(name && { name: name.trim() }),
        ...(phone && { phone: phone.trim() }),
        ...(status && { isActive: status === 'active' }),
      });
    }

    res.status(200).json({
      success: true,
      message: 'Staff details updated successfully',
      data: staff,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete or deactivate staff (Enforces historical records protection)
// @route   DELETE /api/staff/:id
// @access  Private (Admin only)
// Rule: Do not permanently delete staff who have historical duty or payment records. Use deactivation instead.
exports.deleteOrDeactivateStaff = async (req, res, next) => {
  try {
    const staff = await Staff.findById(req.params.id);

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found',
      });
    }

    // Check historical duty records
    const dutyCount = await Duty.countDocuments({ staff: staff._id });

    // Check historical payment records
    const paymentCount = await StaffPayment.countDocuments({ staff: staff._id });

    if (dutyCount > 0 || paymentCount > 0) {
      // Deactivate instead of deleting
      staff.status = 'inactive';
      await staff.save();

      // Also deactivate linked user if exists
      if (staff.user) {
        await User.findByIdAndUpdate(staff.user, { isActive: false });
      }

      return res.status(200).json({
        success: true,
        deactivated: true,
        message: `Worker ${staff.name} has ${dutyCount} historical duty record(s) and ${paymentCount} payment record(s). To preserve audit history and financial integrity, this staff profile has been deactivated instead of permanently deleted.`,
        data: staff,
      });
    }

    // No historical records exist: Safe to permanently delete
    await Staff.findByIdAndDelete(staff._id);

    // If user account was exclusively linked, delete or unlink
    if (staff.user) {
      await User.findByIdAndUpdate(staff.user, { staffProfile: null });
    }

    res.status(200).json({
      success: true,
      deleted: true,
      message: `Staff member ${staff.name} (${staff.staffCode}) deleted permanently as no historical duty or payment records existed.`,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle staff active / inactive status
// @route   PATCH /api/staff/:id/status
// @access  Private (Admin only)
exports.toggleStaffStatus = async (req, res, next) => {
  try {
    const staff = await Staff.findById(req.params.id);

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found',
      });
    }

    const newStatus =
      req.body.status !== undefined
        ? req.body.status
        : staff.status === 'active'
        ? 'inactive'
        : 'active';

    staff.status = newStatus;
    await staff.save();

    // If linked user, update active state
    if (staff.user) {
      await User.findByIdAndUpdate(staff.user, {
        isActive: newStatus === 'active',
      });
    }

    res.status(200).json({
      success: true,
      message: `Staff ${staff.name} is now ${newStatus}`,
      data: staff,
    });
  } catch (error) {
    next(error);
  }
};
