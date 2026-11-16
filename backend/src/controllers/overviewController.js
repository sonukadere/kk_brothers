const User = require('../models/User');
const Staff = require('../models/Staff');
const Client = require('../models/Client');
const Duty = require('../models/Duty');
const StaffPayment = require('../models/StaffPayment');
const ClientPayment = require('../models/ClientPayment');

// @desc    Get Admin Dashboard Stats, Analytics & Live Action Lists from MongoDB
// @route   GET /api/overview/admin
// @access  Private (Admin only)
exports.getAdminOverview = async (req, res, next) => {
  try {
    const { date, startDate, endDate, staff, client } = req.query;

    // 1. Core entity counts
    const totalStaff = await Staff.countDocuments();
    const activeStaff = await Staff.countDocuments({ status: { $ne: 'inactive' } });
    const totalHotels = await Client.countDocuments({ type: { $in: ['Hotel', 'Resort'] } });
    const totalCatering = await Client.countDocuments({ type: { $in: ['Catering', 'Catering Company'] } });
    const totalDuties = await Duty.countDocuments();

    // 2. Today's duties count
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);
    const todaysDuties = await Duty.countDocuments({
      dutyDate: { $gte: startOfToday, $lte: endOfToday },
      status: { $nin: ['Cancelled', 'Rejected'] },
    });

    // 3. Build dynamic filter for filtered duties & summaries if date/staff/client requested
    const filteredDutyQuery = {};
    if (staff) filteredDutyQuery.staff = staff;
    if (client) filteredDutyQuery.client = client;
    if (date) {
      const dStart = new Date(date);
      dStart.setHours(0, 0, 0, 0);
      const dEnd = new Date(date);
      dEnd.setHours(23, 59, 59, 999);
      filteredDutyQuery.dutyDate = { $gte: dStart, $lte: dEnd };
    } else if (startDate || endDate) {
      filteredDutyQuery.dutyDate = {};
      if (startDate) {
        const s = new Date(startDate);
        s.setHours(0, 0, 0, 0);
        filteredDutyQuery.dutyDate.$gte = s;
      }
      if (endDate) {
        const e = new Date(endDate);
        e.setHours(23, 59, 59, 999);
        filteredDutyQuery.dutyDate.$lte = e;
      }
    }

    // 4. Financial rollups from finalized duties (Approved / Completed)
    const dutyFinancialsAgg = await Duty.aggregate([
      { $match: { status: { $in: ['Approved', 'Completed'] } } },
      {
        $group: {
          _id: null,
          totalStaffEarnings: { $sum: '$staffWage' },
          totalClientBilling: { $sum: '$clientBillingAmount' },
          totalHours: { $sum: '$hoursWorked' },
        },
      },
    ]);

    const totalStaffEarnings = dutyFinancialsAgg[0]?.totalStaffEarnings || 0;
    const totalClientBilling = dutyFinancialsAgg[0]?.totalClientBilling || 0;
    const totalHoursWorked = dutyFinancialsAgg[0]?.totalHours || 0;

    // Staff Payments Disbursed
    const staffPaymentsAgg = await StaffPayment.aggregate([
      { $match: { status: 'Completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const totalStaffPaid = staffPaymentsAgg[0]?.total || 0;
    const staffPaymentsPending = Math.max(0, totalStaffEarnings - totalStaffPaid);

    // Client Payments Received
    const clientPaymentsAgg = await ClientPayment.aggregate([
      { $match: { status: 'Received' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const totalClientPaymentsReceived = clientPaymentsAgg[0]?.total || 0;
    const clientPaymentsPending = Math.max(0, totalClientBilling - totalClientPaymentsReceived);

    const grossProfit = totalClientBilling - totalStaffEarnings;

    // 5. Recent Duty Records (respecting filters if provided)
    const recentDuties = await Duty.find(filteredDutyQuery)
      .populate('staff', 'name staffCode designation phone defaultDailyRate')
      .populate('client', 'companyName type city businessId')
      .sort({ dutyDate: -1, createdAt: -1 })
      .limit(8);

    // 6. Upcoming / Active Duties (Today or future dates, not cancelled)
    const upcomingDuties = await Duty.find({
      dutyDate: { $gte: startOfToday },
      status: { $in: ['Pending Approval', 'Approved', 'Pending'] },
      ...(staff && { staff }),
      ...(client && { client }),
    })
      .populate('staff', 'name staffCode designation phone')
      .populate('client', 'companyName type city')
      .sort({ dutyDate: 1, inTime: 1 })
      .limit(6);

    // 7. Pending Staff Payments (Staff with earned wages > paid payments)
    const allStaff = await Staff.find({ status: { $ne: 'inactive' } }).select('name staffCode phone designation user');
    const pendingStaffPayments = [];

    for (const stf of allStaff) {
      const matchCriteria = {
        staff: stf._id,
        status: { $in: ['Approved', 'Completed'] },
      };
      const dutySum = await Duty.aggregate([
        { $match: matchCriteria },
        { $group: { _id: null, totalEarned: { $sum: '$staffWage' }, dutyCount: { $sum: 1 } } },
      ]);
      const totalEarned = dutySum[0]?.totalEarned || 0;
      const dutyCount = dutySum[0]?.dutyCount || 0;

      const paymentSum = await StaffPayment.aggregate([
        { $match: { staff: stf._id, status: 'Completed' } },
        { $group: { _id: null, totalPaid: { $sum: '$amount' } } },
      ]);
      const totalPaid = paymentSum[0]?.totalPaid || 0;
      const pendingAmount = Math.max(0, totalEarned - totalPaid);

      if (pendingAmount > 0) {
        pendingStaffPayments.push({
          staffId: stf._id,
          name: stf.name,
          staffCode: stf.staffCode,
          phone: stf.phone,
          designation: stf.designation,
          dutyCount,
          totalEarned,
          totalPaid,
          pendingAmount,
        });
      }
    }
    pendingStaffPayments.sort((a, b) => b.pendingAmount - a.pendingAmount);

    // 8. Pending Client Payments (Clients with total billed > total received)
    const allClients = await Client.find({ status: { $ne: 'inactive' } }).select('companyName type contactPerson phone city businessId');
    const pendingClientPayments = [];

    for (const cl of allClients) {
      const dutySum = await Duty.aggregate([
        { $match: { client: cl._id, status: { $in: ['Approved', 'Completed'] } } },
        { $group: { _id: null, totalBilled: { $sum: '$clientBillingAmount' }, dutyCount: { $sum: 1 } } },
      ]);
      const totalBilled = dutySum[0]?.totalBilled || 0;
      const dutyCount = dutySum[0]?.dutyCount || 0;

      const paymentSum = await ClientPayment.aggregate([
        { $match: { client: cl._id, status: 'Received' } },
        { $group: { _id: null, totalReceived: { $sum: '$amount' } } },
      ]);
      const totalReceived = paymentSum[0]?.totalReceived || 0;
      const pendingAmount = Math.max(0, totalBilled - totalReceived);

      if (pendingAmount > 0) {
        pendingClientPayments.push({
          clientId: cl._id,
          companyName: cl.companyName,
          type: cl.type,
          businessId: cl.businessId,
          contactPerson: cl.contactPerson,
          phone: cl.phone,
          dutyCount,
          totalBilled,
          totalReceived,
          pendingAmount,
        });
      }
    }
    pendingClientPayments.sort((a, b) => b.pendingAmount - a.pendingAmount);

    res.status(200).json({
      success: true,
      stats: {
        totalStaff,
        activeStaff,
        totalHotels,
        totalCatering,
        totalDuties,
        todaysDuties,
        staffPaymentsPending,
        clientPaymentsPending,
        totalStaffEarnings,
        totalStaffPaid,
        totalClientBilling,
        totalClientPaymentsReceived,
        grossProfit,
        totalHoursWorked,
      },
      recentDuties,
      upcomingDuties,
      pendingStaffPayments: pendingStaffPayments.slice(0, 6),
      pendingClientPayments: pendingClientPayments.slice(0, 6),
      allStaffList: allStaff,
      allClientsList: allClients,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Staff User Dashboard Stats & Personal Duties from MongoDB
// @route   GET /api/overview/user
// @access  Private (User only, filtered strictly by logged in user)
exports.getUserOverview = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Strict security: User can only see duties where user is req.user._id
    const totalDuties = await Duty.countDocuments({ user: userId });
    const approvedDuties = await Duty.countDocuments({ user: userId, status: { $in: ['Approved', 'Completed'] } });
    const pendingDuties = await Duty.countDocuments({ user: userId, status: { $in: ['Pending', 'Pending Approval'] } });

    // Calculate total earned and hours worked from approved duties
    const earnedAgg = await Duty.aggregate([
      { $match: { user: userId, status: { $in: ['Approved', 'Completed'] } } },
      { $group: { _id: null, total: { $sum: '$staffWage' }, totalHours: { $sum: '$hoursWorked' } } },
    ]);
    const totalEarned = earnedAgg[0]?.total || 0;
    const totalHours = earnedAgg[0]?.totalHours || 0;

    // Personal payments received
    const staffPayments = await StaffPayment.find({ user: userId }).sort({ paymentDate: -1 });
    const totalReceived = staffPayments.reduce((acc, curr) => acc + (curr.amount || 0), 0);
    const pendingPaymentAmount = Math.max(0, totalEarned - totalReceived);

    // Recent duties
    const recentDuties = await Duty.find({ user: userId })
      .populate('client', 'companyName type city')
      .sort({ dutyDate: -1, createdAt: -1 })
      .limit(6);

    res.status(200).json({
      success: true,
      stats: {
        totalDuties,
        approvedDuties,
        pendingDuties,
        totalHours,
        totalEarned,
        totalReceived,
        pendingPaymentAmount,
      },
      staffProfile: req.user.staffProfile,
      recentDuties,
      recentPayments: staffPayments.slice(0, 6),
    });
  } catch (error) {
    next(error);
  }
};
