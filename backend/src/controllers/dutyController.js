const Duty = require('../models/Duty');
const Staff = require('../models/Staff');
const Client = require('../models/Client');
const User = require('../models/User');

// Helper to convert HH:MM to total minutes from start of day
const timeToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  const parts = timeStr.split(':').map(Number);
  return (parts[0] || 0) * 60 + (parts[1] || 0);
};

// Helper to calculate total working hours and detect overnight shifts
const calculateShiftHours = (inTime, outTime) => {
  if (!inTime || !outTime) {
    return { hoursWorked: 8, isOvernight: false };
  }
  const inMins = timeToMinutes(inTime);
  const outMins = timeToMinutes(outTime);
  let diff = outMins - inMins;
  let isOvernight = false;

  if (diff <= 0) {
    // Out time is on the next day (Overnight shift)
    isOvernight = true;
    diff += 24 * 60;
  }

  const hoursWorked = Math.round((diff / 60) * 10) / 10;
  return { hoursWorked, isOvernight };
};

// Helper to check if two shifts on the same day overlap in time
const checkShiftOverlap = (inA, outA, isOvernightA, inB, outB, isOvernightB) => {
  const startA = timeToMinutes(inA);
  let endA = timeToMinutes(outA);
  if (endA <= startA || isOvernightA) endA += 1440;

  const startB = timeToMinutes(inB);
  let endB = timeToMinutes(outB);
  if (endB <= startB || isOvernightB) endB += 1440;

  return Math.max(startA, startB) < Math.min(endA, endB);
};

// @desc    Get all duty records with filters, search, and financial metrics
// @route   GET /api/duties
// @access  Private (Admin sees all; Regular user sees ONLY own records)
exports.getDuties = async (req, res, next) => {
  try {
    const { status, client, staff, date, startDate, endDate, search } = req.query;
    const query = {};

    // STRICT USER ISOLATION
    if (req.user.role !== 'admin') {
      query.user = req.user._id;
    } else {
      if (req.query.user) query.user = req.query.user;
      if (staff) query.staff = staff;
    }

    // Status filter
    if (status && status !== 'all') {
      if (status === 'Pending') {
        query.status = { $in: ['Pending', 'Pending Approval'] };
      } else {
        query.status = status;
      }
    }

    if (client) query.client = client;

    // Date filtering
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      query.dutyDate = { $gte: startOfDay, $lte: endOfDay };
    } else if (startDate || endDate) {
      query.dutyDate = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        query.dutyDate.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.dutyDate.$lte = end;
      }
    }

    let duties = await Duty.find(query)
      .populate('staff', 'name staffCode designation phone defaultDailyRate')
      .populate('client', 'companyName type contactPerson phone city businessId')
      .populate('verifiedBy', 'name email')
      .sort({ dutyDate: -1, createdAt: -1 });

    // Live search filter across staff name, code, client name, slip #, location
    if (search) {
      const s = search.toLowerCase().trim();
      duties = duties.filter((d) => {
        const staffName = d.staff?.name?.toLowerCase() || '';
        const staffCode = d.staff?.staffCode?.toLowerCase() || '';
        const clientName = d.client?.companyName?.toLowerCase() || '';
        const slipNo = (d.dutySlipNumber || d.dutyId || '').toLowerCase();
        const loc = (d.location || '').toLowerCase();
        const role = (d.rolePerformed || '').toLowerCase();
        return (
          staffName.includes(s) ||
          staffCode.includes(s) ||
          clientName.includes(s) ||
          slipNo.includes(s) ||
          loc.includes(s) ||
          role.includes(s)
        );
      });
    }

    // Summary statistics
    const totalDuties = duties.length;
    let pendingApprovalCount = 0;
    let approvedCount = 0;
    let completedCount = 0;
    let cancelledCount = 0;
    let totalHours = 0;
    let totalStaffWages = 0;
    let totalClientBilling = 0;

    duties.forEach((d) => {
      totalHours += d.hoursWorked || 0;
      const st = d.status;
      if (st === 'Pending' || st === 'Pending Approval') {
        pendingApprovalCount++;
      } else if (st === 'Approved') {
        approvedCount++;
      } else if (st === 'Completed') {
        completedCount++;
      } else if (st === 'Cancelled' || st === 'Rejected') {
        cancelledCount++;
      }

      // Financial rule: Only count finalized financial transactions (Approved or Completed)
      // Do not count cancelled or unapproved duties in financial totals
      if (st === 'Approved' || st === 'Completed') {
        totalStaffWages += d.staffWage || 0;
        totalClientBilling += d.clientBillingAmount || 0;
      }
    });

    res.status(200).json({
      success: true,
      count: duties.length,
      data: duties,
      summary: {
        totalDuties,
        pendingApprovalCount,
        approvedCount,
        completedCount,
        cancelledCount,
        totalHours: Math.round(totalHours * 10) / 10,
        totalStaffWages,
        totalClientBilling,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single duty by ID with ownership check
// @route   GET /api/duties/:id
// @access  Private (Admin or record owner only)
exports.getDutyById = async (req, res, next) => {
  try {
    const duty = await Duty.findById(req.params.id)
      .populate('staff', 'name staffCode designation phone address bankAccountNo upiId')
      .populate('client', 'companyName type contactPerson phone city address businessId')
      .populate('verifiedBy', 'name email')
      .populate('changeLog.modifiedBy', 'name email');

    if (!duty) {
      return res.status(404).json({ success: false, message: 'Duty record not found.' });
    }

    // STRICT ISOLATION: Prevent users from accessing other workers' records
    if (req.user.role !== 'admin' && duty.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You are not authorized to view another worker\'s duty records.',
      });
    }

    res.status(200).json({
      success: true,
      data: duty,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add new duty record (User for own account; Admin for any staff)
// @route   POST /api/duties
// @access  Private
exports.createDuty = async (req, res, next) => {
  try {
    const {
      client: clientId,
      dutyDate,
      inTime,
      outTime,
      shiftType,
      hoursWorked,
      location,
      rolePerformed,
      remarks,
    } = req.body;

    const clientDoc = await Client.findById(clientId);
    if (!clientDoc) {
      return res.status(404).json({
        success: false,
        message: 'Selected Hotel / Catering client not found.',
      });
    }

    let staffId;
    let userId;
    let staffWage;
    let clientBillingAmount;
    let reportedBy;
    let initialStatus = 'Pending Approval';

    if (req.user.role === 'admin') {
      staffId = req.body.staff;
      const staffDoc = await Staff.findById(staffId);
      if (!staffDoc) {
        return res.status(404).json({ success: false, message: 'Selected staff member not found.' });
      }
      userId = staffDoc.user || req.user._id;

      // Admin can specify rates or fallback to defaults
      staffWage = req.body.staffWage !== undefined ? Number(req.body.staffWage) : staffDoc.defaultDailyRate || 750;
      clientBillingAmount = req.body.clientBillingAmount !== undefined ? Number(req.body.clientBillingAmount) : clientDoc.defaultBillingRatePerStaff || 1000;
      reportedBy = 'Admin';
      initialStatus = req.body.status || 'Approved';
    } else {
      // Regular User: Strictly for own account
      userId = req.user._id;
      let staffDoc = null;
      if (req.user.staffProfile) {
        staffDoc = await Staff.findById(req.user.staffProfile);
      }
      if (!staffDoc) {
        staffDoc = await Staff.findOne({ user: userId });
      }
      if (!staffDoc) {
        staffDoc = await Staff.create({
          user: userId,
          name: req.user.name,
          phone: req.user.phone || '9876543210',
          designation: 'Staff',
          defaultDailyRate: 600,
        });
      }

      staffId = staffDoc._id;
      // Users CANNOT modify payment amounts or payment status
      staffWage = staffDoc.defaultDailyRate || 600;
      clientBillingAmount = clientDoc.defaultBillingRatePerStaff || 1000;
      reportedBy = 'Staff User';
      initialStatus = 'Pending Approval';
    }

    // 1. Calculate working hours automatically and handle overnight shifts
    const effectiveInTime = inTime || '09:00';
    const effectiveOutTime = outTime || '18:00';
    const { hoursWorked: calcHours, isOvernight } = calculateShiftHours(effectiveInTime, effectiveOutTime);
    const finalHours = hoursWorked !== undefined && req.user.role === 'admin' ? Number(hoursWorked) : calcHours;

    // 2. Prevent overlapping duty entries for the same staff member
    const targetDate = dutyDate ? new Date(dutyDate) : new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const existingDuties = await Duty.find({
      staff: staffId,
      dutyDate: { $gte: startOfDay, $lte: endOfDay },
      status: { $nin: ['Cancelled', 'Rejected'] },
    });

    for (const ex of existingDuties) {
      if (checkShiftOverlap(effectiveInTime, effectiveOutTime, isOvernight, ex.inTime, ex.outTime, ex.isOvernight)) {
        return res.status(400).json({
          success: false,
          message: `Staff member already has an active duty shift (${ex.dutySlipNumber} from ${ex.inTime} to ${ex.outTime}) on this date. Overlapping duty entries are not permitted.`,
        });
      }
    }

    // 3. Create Duty Record
    const duty = await Duty.create({
      staff: staffId,
      user: userId,
      client: clientDoc._id,
      dutyDate: targetDate,
      inTime: effectiveInTime,
      outTime: effectiveOutTime,
      isOvernight,
      shiftType: shiftType || (isOvernight ? 'Night (10 PM - 6 AM)' : 'Full Day (8-10 hrs)'),
      hoursWorked: finalHours,
      staffWage,
      clientBillingAmount,
      location: location || 'Main Hall',
      rolePerformed: rolePerformed || 'Waiter',
      status: initialStatus,
      paymentStatus: 'Unpaid',
      reportedBy,
      remarks: remarks || '',
      ...(req.user.role === 'admin' && initialStatus === 'Approved' && {
        verifiedBy: req.user._id,
        verifiedAt: new Date(),
      }),
      changeLog: [
        {
          modifiedBy: req.user._id,
          modifiedAt: new Date(),
          changeSummary: `Duty entry created by ${reportedBy} (${req.user.name}) with ${finalHours} hours`,
        },
      ],
    });

    const populated = await Duty.findById(duty._id)
      .populate('staff', 'name staffCode designation phone')
      .populate('client', 'companyName type city businessId');

    res.status(201).json({
      success: true,
      message: `Duty record '${duty.dutySlipNumber}' logged successfully into MongoDB (${finalHours} hours, ${isOvernight ? 'Overnight Shift' : 'Standard Shift'})`,
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Edit duty record with change history tracking (Admin only)
// @route   PUT /api/duties/:id
// @access  Private (Admin only)
exports.updateDuty = async (req, res, next) => {
  try {
    const duty = await Duty.findById(req.params.id);

    if (!duty) {
      return res.status(404).json({ success: false, message: 'Duty record not found.' });
    }

    const {
      client: clientId,
      dutyDate,
      inTime,
      outTime,
      hoursWorked,
      shiftType,
      staffWage,
      clientBillingAmount,
      location,
      rolePerformed,
      remarks,
      status,
    } = req.body;

    const changes = [];

    if (clientId && clientId !== duty.client.toString()) {
      duty.client = clientId;
      changes.push('Client updated');
    }

    if (dutyDate) {
      duty.dutyDate = new Date(dutyDate);
      changes.push(`Date updated to ${dutyDate}`);
    }

    let timingChanged = false;
    if (inTime && inTime !== duty.inTime) {
      duty.inTime = inTime;
      timingChanged = true;
      changes.push(`In-time changed to ${inTime}`);
    }
    if (outTime && outTime !== duty.outTime) {
      duty.outTime = outTime;
      timingChanged = true;
      changes.push(`Out-time changed to ${outTime}`);
    }

    if (timingChanged) {
      const { hoursWorked: calcHours, isOvernight } = calculateShiftHours(duty.inTime, duty.outTime);
      duty.hoursWorked = hoursWorked !== undefined ? Number(hoursWorked) : calcHours;
      duty.isOvernight = isOvernight;
      changes.push(`Recalculated to ${duty.hoursWorked} hrs (${isOvernight ? 'Overnight' : 'Regular'})`);
    } else if (hoursWorked !== undefined) {
      duty.hoursWorked = Number(hoursWorked);
      changes.push(`Hours manually adjusted to ${hoursWorked}`);
    }

    if (shiftType) duty.shiftType = shiftType;
    if (staffWage !== undefined) {
      duty.staffWage = Number(staffWage);
      changes.push(`Wage updated to ₹${staffWage}`);
    }
    if (clientBillingAmount !== undefined) {
      duty.clientBillingAmount = Number(clientBillingAmount);
      changes.push(`Client charge updated to ₹${clientBillingAmount}`);
    }
    if (location !== undefined) duty.location = location.trim();
    if (rolePerformed !== undefined) duty.rolePerformed = rolePerformed.trim();
    if (remarks !== undefined) duty.remarks = remarks.trim();

    if (status && status !== duty.status) {
      duty.status = status;
      changes.push(`Status changed to ${status}`);
      if (status === 'Approved') {
        duty.verifiedBy = req.user._id;
        duty.verifiedAt = new Date();
      }
    }

    // Record audit trail
    if (changes.length > 0) {
      duty.changeLog.push({
        modifiedBy: req.user._id,
        modifiedAt: new Date(),
        changeSummary: changes.join('; '),
      });
    }

    await duty.save();

    const populated = await Duty.findById(duty._id)
      .populate('staff', 'name staffCode designation phone')
      .populate('client', 'companyName type city businessId')
      .populate('changeLog.modifiedBy', 'name');

    res.status(200).json({
      success: true,
      message: `Duty '${duty.dutySlipNumber}' updated successfully by Admin`,
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel duty record (Admin only)
// @route   PATCH /api/duties/:id/cancel
// @access  Private (Admin only)
exports.cancelDuty = async (req, res, next) => {
  try {
    const duty = await Duty.findById(req.params.id);

    if (!duty) {
      return res.status(404).json({ success: false, message: 'Duty record not found.' });
    }

    duty.status = 'Cancelled';
    duty.changeLog.push({
      modifiedBy: req.user._id,
      modifiedAt: new Date(),
      changeSummary: 'Duty record cancelled by Admin. Excluded from financial transactions.',
    });

    await duty.save();

    res.status(200).json({
      success: true,
      message: `Duty record '${duty.dutySlipNumber}' cancelled. Not counted towards financial settlements.`,
      data: duty,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify/Approve/Complete Duty (Admin only)
// @route   PUT /api/duties/:id/verify
// @access  Private (Admin only)
exports.verifyDuty = async (req, res, next) => {
  try {
    const { status, remarks } = req.body;

    const allowed = ['Pending Approval', 'Approved', 'Completed', 'Cancelled', 'Pending', 'Rejected'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid duty status value.' });
    }

    const normalizedStatus = status === 'Pending' ? 'Pending Approval' : status === 'Rejected' ? 'Cancelled' : status;

    const duty = await Duty.findById(req.params.id);
    if (!duty) {
      return res.status(404).json({ success: false, message: 'Duty record not found.' });
    }

    duty.status = normalizedStatus;
    if (remarks) duty.remarks = remarks;
    if (normalizedStatus === 'Approved' || normalizedStatus === 'Completed') {
      duty.verifiedBy = req.user._id;
      duty.verifiedAt = new Date();
    }

    duty.changeLog.push({
      modifiedBy: req.user._id,
      modifiedAt: new Date(),
      changeSummary: `Status verified as ${normalizedStatus} by Admin`,
    });

    await duty.save();

    const populated = await Duty.findById(duty._id)
      .populate('staff', 'name staffCode designation')
      .populate('client', 'companyName type');

    res.status(200).json({
      success: true,
      message: `Duty record marked as ${normalizedStatus}`,
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get staff-wise duty history
// @route   GET /api/duties/staff/:staffId
// @access  Private (Admin or record owner only)
exports.getStaffDutyHistory = async (req, res, next) => {
  try {
    const { staffId } = req.params;
    const staff = await Staff.findById(staffId);
    if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff member not found.' });
    }

    if (req.user.role !== 'admin' && staff.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Forbidden. Cannot access another worker\'s history.' });
    }

    const duties = await Duty.find({ staff: staffId })
      .populate('client', 'companyName type city')
      .sort({ dutyDate: -1 });

    res.status(200).json({
      success: true,
      count: duties.length,
      data: duties,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get hotel/catering-wise duty history (Admin only)
// @route   GET /api/duties/client/:clientId
// @access  Private (Admin only)
exports.getClientDutyHistory = async (req, res, next) => {
  try {
    const { clientId } = req.params;
    const client = await Client.findById(clientId);
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client business not found.' });
    }

    const duties = await Duty.find({ client: clientId })
      .populate('staff', 'name staffCode designation phone')
      .sort({ dutyDate: -1 });

    res.status(200).json({
      success: true,
      count: duties.length,
      data: duties,
    });
  } catch (error) {
    next(error);
  }
};
