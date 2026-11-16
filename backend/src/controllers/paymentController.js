const StaffPayment = require('../models/StaffPayment');
const ClientPayment = require('../models/ClientPayment');
const ClientBill = require('../models/ClientBill');
const Client = require('../models/Client');
const Duty = require('../models/Duty');
const Staff = require('../models/Staff');
const User = require('../models/User');

// Helper to convert number to words for Indian Rupees
const numberToWordsIndian = (num) => {
  if (!num || isNaN(num)) return 'Zero Rupees Only';
  const a = [
    '', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ',
    'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ',
    'Seventeen ', 'Eighteen ', 'Nineteen '
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const inWords = (n) => {
    let str = '';
    if (n > 19) {
      str += b[Math.floor(n / 10)] + ' ' + a[n % 10];
    } else {
      str += a[n];
    }
    return str;
  };

  let n = Math.floor(num);
  let crore = Math.floor(n / 10000000);
  n %= 10000000;
  let lakh = Math.floor(n / 100000);
  n %= 100000;
  let thousand = Math.floor(n / 1000);
  n %= 1000;
  let hundred = Math.floor(n / 100);
  let rest = n % 100;

  let out = '';
  if (crore > 0) out += inWords(crore) + 'Crore ';
  if (lakh > 0) out += inWords(lakh) + 'Lakh ';
  if (thousand > 0) out += inWords(thousand) + 'Thousand ';
  if (hundred > 0) out += inWords(hundred) + 'Hundred ';
  if (rest > 0) {
    if (out !== '') out += 'and ';
    out += inWords(rest);
  }
  return out.trim() + ' Rupees Only';
};

// ==========================================
// 1. STAFF PAYMENTS (INTERNAL WAGES DISBURSAL)
// ==========================================

// @desc    Get all staff payments with filters, search, and live summary stats
// @route   GET /api/payments/staff
// @access  Private (Admin has full access; User ONLY sees own payouts)
exports.getStaffPayments = async (req, res, next) => {
  try {
    const { search, staff, status, paymentMethod, startDate, endDate } = req.query;
    const query = {};

    // STRICT USER ISOLATION
    if (req.user.role !== 'admin') {
      query.user = req.user._id;
    } else {
      if (staff) query.staff = staff;
      if (req.query.user) query.user = req.query.user;
    }

    // Status filter (Paid, Partial, Pending)
    if (status && status !== 'all') {
      if (status === 'Paid') {
        query.status = { $in: ['Paid', 'Completed'] };
      } else {
        query.status = status;
      }
    }

    // Payment Method filter (Cash, UPI, Bank Transfer)
    if (paymentMethod && paymentMethod !== 'all') {
      query.$or = [{ paymentMethod: paymentMethod }, { paymentMode: paymentMethod }];
    }

    // Date range filter
    if (startDate || endDate) {
      query.paymentDate = {};
      if (startDate) query.paymentDate.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.paymentDate.$lte = end;
      }
    }

    let payments = await StaffPayment.find(query)
      .populate('staff', 'name staffCode designation phone bankAccountNo bankIfsc upiId')
      .populate('duty', 'dutySlipNumber dutyDate client shiftType staffWage')
      .sort({ paymentDate: -1, createdAt: -1 });

    // Live search filter across populated staff name, code, phone, or voucher/ref
    if (search) {
      const s = search.toLowerCase().trim();
      payments = payments.filter((p) => {
        const staffName = p.staff?.name?.toLowerCase() || '';
        const staffCode = p.staff?.staffCode?.toLowerCase() || '';
        const staffPhone = p.staff?.phone?.toLowerCase() || '';
        const voucherNo = (p.paymentVoucherNo || p.paymentId || '').toLowerCase();
        const txnRef = (p.transactionReference || '').toLowerCase();
        return (
          staffName.includes(s) ||
          staffCode.includes(s) ||
          staffPhone.includes(s) ||
          voucherNo.includes(s) ||
          txnRef.includes(s)
        );
      });
    }

    // Calculate aggregated summary statistics
    const totalPaidSum = payments.reduce(
      (sum, p) => (p.status !== 'Cancelled' ? sum + (p.paidAmount || p.amount || 0) : sum),
      0
    );

    // If Admin, also calculate overall staff payment liability across all active staff
    let overallLiability = 0;
    let pendingCount = 0;
    if (req.user.role === 'admin') {
      const allDuties = await Duty.aggregate([
        { $match: { status: { $ne: 'Rejected' } } },
        { $group: { _id: null, totalEarnings: { $sum: '$staffWage' } } },
      ]);
      const allPayments = await StaffPayment.aggregate([
        { $match: { status: { $ne: 'Cancelled' } } },
        { $group: { _id: null, totalDisbursed: { $sum: '$paidAmount' } } },
      ]);

      const totalEarned = allDuties.length > 0 ? allDuties[0].totalEarnings : 0;
      const totalDisbursed = allPayments.length > 0 ? allPayments[0].totalDisbursed : 0;
      overallLiability = Math.max(0, totalEarned - totalDisbursed);
      pendingCount = payments.filter((p) => p.status === 'Partial' || p.status === 'Pending').length;
    }

    res.status(200).json({
      success: true,
      count: payments.length,
      data: payments,
      summary: {
        totalPaid: totalPaidSum,
        totalLiability: overallLiability,
        pendingCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single staff payment with ownership check and formatted receipt
// @route   GET /api/payments/staff/:id
// @access  Private (Admin or record owner only)
exports.getStaffPaymentById = async (req, res, next) => {
  try {
    const payment = await StaffPayment.findById(req.params.id)
      .populate('staff', 'name staffCode designation phone address bankAccountNo bankIfsc upiId defaultDailyRate')
      .populate('duty', 'dutySlipNumber dutyDate client shiftType staffWage')
      .populate('recordedBy', 'name email');

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment record not found.' });
    }

    // STRICT ISOLATION: Prevent workers from accessing other workers' payment vouchers
    if (req.user.role !== 'admin' && payment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You are not authorized to view another worker\'s payment records.',
      });
    }

    // Prepare formal payment receipt object
    const receipt = {
      receiptNumber: payment.paymentVoucherNo || payment.paymentId,
      receiptDate: payment.paymentDate,
      staff: {
        id: payment.staff?._id,
        name: payment.staff?.name,
        code: payment.staff?.staffCode,
        designation: payment.staff?.designation,
        phone: payment.staff?.phone,
        bankAccountNo: payment.staff?.bankAccountNo || 'N/A',
        bankIfsc: payment.staff?.bankIfsc || 'N/A',
        upiId: payment.staff?.upiId || 'N/A',
      },
      paymentType: payment.paymentType || 'Standard Payment',
      totalEarning: payment.totalEarning || 0,
      paidAmount: payment.paidAmount || payment.amount || 0,
      paidAmountInWords: numberToWordsIndian(payment.paidAmount || payment.amount || 0),
      pendingAmount: payment.pendingAmount || 0,
      paymentMethod: payment.paymentMethod || payment.paymentMode || 'Cash',
      transactionReference: payment.transactionReference || 'Hand / Cash Settlement',
      status: payment.status,
      notes: payment.notes || '',
      issuedBy: 'KK Brothers Staff Management Administration',
      generatedAt: new Date(),
    };

    res.status(200).json({
      success: true,
      data: payment,
      receipt,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get live balance and pending wages for an individual worker
// @route   GET /api/payments/staff/:staffId/balance
// @access  Private (Admin or record owner only)
exports.getStaffBalance = async (req, res, next) => {
  try {
    let staffId = req.params.staffId;

    if (staffId === 'me' || staffId === 'my-balance') {
      const userStaff = await Staff.findOne({ user: req.user._id });
      if (!userStaff) {
        return res.status(404).json({ success: false, message: 'Staff profile not found for current user' });
      }
      staffId = userStaff._id;
    }

    const staff = await Staff.findById(staffId);
    if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff member not found' });
    }

    if (req.user.role !== 'admin' && staff.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Forbidden. Cannot view other worker balances.' });
    }

    const dutiesAgg = await Duty.aggregate([
      { $match: { staff: staff._id, status: { $ne: 'Rejected' } } },
      {
        $group: {
          _id: null,
          totalEarnings: { $sum: '$staffWage' },
          totalHours: { $sum: '$hoursWorked' },
          totalDuties: { $sum: 1 },
        },
      },
    ]);

    const totalEarnings = dutiesAgg.length > 0 ? dutiesAgg[0].totalEarnings : 0;
    const totalDuties = dutiesAgg.length > 0 ? dutiesAgg[0].totalDuties : 0;
    const totalHours = dutiesAgg.length > 0 ? dutiesAgg[0].totalHours : 0;

    const paymentsAgg = await StaffPayment.aggregate([
      { $match: { staff: staff._id, status: { $ne: 'Cancelled' } } },
      {
        $group: {
          _id: null,
          totalPaid: { $sum: '$paidAmount' },
          totalVouchers: { $sum: 1 },
        },
      },
    ]);

    const totalPaid = paymentsAgg.length > 0 ? paymentsAgg[0].totalPaid : 0;
    const totalVouchers = paymentsAgg.length > 0 ? paymentsAgg[0].totalVouchers : 0;
    const pendingAmount = Math.max(0, totalEarnings - totalPaid);

    const pendingDuties = await Duty.find({
      staff: staff._id,
      status: { $ne: 'Rejected' },
      paymentStatus: { $ne: 'Paid' },
    })
      .populate('client', 'companyName')
      .sort({ dutyDate: -1 });

    res.status(200).json({
      success: true,
      data: {
        staff: {
          _id: staff._id,
          name: staff.name,
          staffCode: staff.staffCode,
          designation: staff.designation,
          phone: staff.phone,
          defaultDailyRate: staff.defaultDailyRate,
          bankAccountNo: staff.bankAccountNo,
          bankIfsc: staff.bankIfsc,
          upiId: staff.upiId,
        },
        totalEarnings,
        totalPaid,
        pendingAmount,
        totalDuties,
        totalHours,
        totalVouchers,
        pendingDuties,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get total staff payment liability summary across all workers (Admin only)
// @route   GET /api/payments/staff-liability
// @access  Private (Admin only)
exports.getStaffLiabilitySummary = async (req, res, next) => {
  try {
    const staffList = await Staff.find({ status: 'active' }).sort({ name: 1 });
    const staffIds = staffList.map((s) => s._id);

    const earningsAgg = await Duty.aggregate([
      { $match: { staff: { $in: staffIds }, status: { $ne: 'Rejected' } } },
      {
        $group: {
          _id: '$staff',
          totalEarnings: { $sum: '$staffWage' },
          totalDuties: { $sum: 1 },
        },
      },
    ]);

    const earningsMap = {};
    earningsAgg.forEach((e) => {
      earningsMap[e._id.toString()] = {
        totalEarnings: e.totalEarnings,
        totalDuties: e.totalDuties,
      };
    });

    const paymentsAgg = await StaffPayment.aggregate([
      { $match: { staff: { $in: staffIds }, status: { $ne: 'Cancelled' } } },
      {
        $group: {
          _id: '$staff',
          totalPaid: { $sum: '$paidAmount' },
          totalVouchers: { $sum: 1 },
        },
      },
    ]);

    const paymentsMap = {};
    paymentsAgg.forEach((p) => {
      paymentsMap[p._id.toString()] = {
        totalPaid: p.totalPaid,
        totalVouchers: p.totalVouchers,
      };
    });

    let overallLiability = 0;
    let overallPaid = 0;
    let overallEarned = 0;

    const summaryList = staffList.map((s) => {
      const eData = earningsMap[s._id.toString()] || { totalEarnings: 0, totalDuties: 0 };
      const pData = paymentsMap[s._id.toString()] || { totalPaid: 0, totalVouchers: 0 };
      const pending = Math.max(0, eData.totalEarnings - pData.totalPaid);

      overallLiability += pending;
      overallPaid += pData.totalPaid;
      overallEarned += eData.totalEarnings;

      return {
        staffId: s._id,
        name: s.name,
        staffCode: s.staffCode,
        phone: s.phone,
        designation: s.designation,
        totalDuties: eData.totalDuties,
        totalEarnings: eData.totalEarnings,
        totalPaid: pData.totalPaid,
        pendingAmount: pending,
        paymentStatus: pending === 0 ? 'Paid' : pData.totalPaid > 0 ? 'Partial' : 'Pending',
        bankAccountNo: s.bankAccountNo,
        upiId: s.upiId,
      };
    });

    summaryList.sort((a, b) => b.pendingAmount - a.pendingAmount);

    res.status(200).json({
      success: true,
      count: summaryList.length,
      overallSummary: {
        totalStaffLiability: overallLiability,
        totalWagesPaid: overallPaid,
        totalWagesEarned: overallEarned,
        activeStaffCount: staffList.length,
      },
      data: summaryList,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Record a new staff wage payment (Full, Partial, or Advance Payment)
// @route   POST /api/payments/staff
// @access  Private (Admin only)
exports.createStaffPayment = async (req, res, next) => {
  try {
    const {
      staff: staffId,
      paidAmount,
      amount,
      paymentMethod,
      paymentMode,
      paymentType,
      duty: dutyId,
      dutiesCovered,
      transactionReference,
      paymentDate,
      notes,
    } = req.body;

    const finalAmount = Number(paidAmount ?? amount);

    if (!staffId || isNaN(finalAmount) || finalAmount < 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid staff member and payment amount are required.',
      });
    }

    const staffDoc = await Staff.findById(staffId);
    if (!staffDoc) {
      return res.status(404).json({ success: false, message: 'Staff member not found.' });
    }

    let userId = staffDoc.user;
    if (!userId) {
      const u = await User.findOne({ staffProfile: staffDoc._id });
      if (u) userId = u._id;
    }
    if (!userId) {
      userId = req.user._id;
    }

    const dutiesAgg = await Duty.aggregate([
      { $match: { staff: staffDoc._id, status: { $ne: 'Rejected' } } },
      { $group: { _id: null, totalEarnings: { $sum: '$staffWage' } } },
    ]);
    const cumulativeEarnings = dutiesAgg.length > 0 ? dutiesAgg[0].totalEarnings : 0;

    const paymentsAgg = await StaffPayment.aggregate([
      { $match: { staff: staffDoc._id, status: { $ne: 'Cancelled' } } },
      { $group: { _id: null, totalPaid: { $sum: '$paidAmount' } } },
    ]);
    const previousPaid = paymentsAgg.length > 0 ? paymentsAgg[0].totalPaid : 0;

    const previousPending = Math.max(0, cumulativeEarnings - previousPaid);
    const newTotalPaid = previousPaid + finalAmount;
    const remainingPending = Math.max(0, cumulativeEarnings - newTotalPaid);

    let type = paymentType || 'Standard Payment';
    if (!paymentType) {
      if (previousPending === 0 && finalAmount > 0) {
        type = 'Advance Payment';
      } else if (finalAmount >= previousPending) {
        type = 'Full Payment';
      } else if (finalAmount > 0) {
        type = 'Partial Payment';
      }
    }

    let paymentStatus = 'Paid';
    if (type === 'Advance Payment') {
      paymentStatus = 'Paid';
    } else if (remainingPending === 0 && finalAmount > 0) {
      paymentStatus = 'Paid';
    } else if (finalAmount > 0 && remainingPending > 0) {
      paymentStatus = 'Partial';
    } else if (finalAmount === 0) {
      paymentStatus = 'Pending';
    }

    const method = paymentMethod || paymentMode || 'Cash';

    const payment = await StaffPayment.create({
      staff: staffDoc._id,
      user: userId,
      duty: dutyId || null,
      dutiesCovered: dutiesCovered || [],
      totalEarning: cumulativeEarnings,
      paidAmount: finalAmount,
      amount: finalAmount,
      pendingAmount: remainingPending,
      paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
      paymentMethod: method,
      paymentMode: method,
      paymentType: type,
      transactionReference: transactionReference || '',
      status: paymentStatus,
      notes: notes || '',
      recordedBy: req.user._id,
    });

    if (dutiesCovered && dutiesCovered.length > 0) {
      await Duty.updateMany({ _id: { $in: dutiesCovered } }, { paymentStatus: 'Paid' });
    } else if (remainingPending === 0) {
      await Duty.updateMany(
        { staff: staffDoc._id, status: { $ne: 'Rejected' } },
        { paymentStatus: 'Paid' }
      );
    }

    const populated = await StaffPayment.findById(payment._id)
      .populate('staff', 'name staffCode designation phone bankAccountNo bankIfsc upiId')
      .populate('duty', 'dutySlipNumber dutyDate client shiftType staffWage');

    res.status(201).json({
      success: true,
      message: `${type} of ₹${finalAmount.toLocaleString()} recorded for ${staffDoc.name}. Remaining liability: ₹${remainingPending.toLocaleString()}`,
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update payment information (Admin only)
// @route   PUT /api/payments/staff/:id
// @access  Private (Admin only)
exports.updateStaffPayment = async (req, res, next) => {
  try {
    const payment = await StaffPayment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment record not found.' });
    }

    const {
      transactionReference,
      paymentMethod,
      paymentMode,
      paymentDate,
      notes,
      status,
      paidAmount,
      amount,
    } = req.body;

    if (transactionReference !== undefined) payment.transactionReference = transactionReference.trim();
    if (paymentMethod || paymentMode) {
      const m = paymentMethod || paymentMode;
      payment.paymentMethod = m;
      payment.paymentMode = m;
    }
    if (paymentDate) payment.paymentDate = new Date(paymentDate);
    if (notes !== undefined) payment.notes = notes.trim();
    if (status) payment.status = status;

    const newAmount = paidAmount !== undefined ? Number(paidAmount) : amount !== undefined ? Number(amount) : null;
    if (newAmount !== null && !isNaN(newAmount) && newAmount !== payment.paidAmount) {
      payment.paidAmount = newAmount;
      payment.amount = newAmount;
      payment.pendingAmount = Math.max(0, (payment.totalEarning || 0) - newAmount);
      payment.notes = (payment.notes ? payment.notes + ' ' : '') + `[Amount updated to ₹${newAmount} by Admin]`;
    }

    await payment.save();

    const populated = await StaffPayment.findById(payment._id)
      .populate('staff', 'name staffCode designation phone')
      .populate('duty', 'dutySlipNumber dutyDate client shiftType staffWage');

    res.status(200).json({
      success: true,
      message: 'Staff payment record updated successfully',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 2. CLIENT PAYMENTS & BILLING (HOTEL & CATERING)
// ==========================================

// @desc    Get hotel & catering client payments with filters and summary
// @route   GET /api/payments/clients
// @access  Private (Admin only)
exports.getClientPayments = async (req, res, next) => {
  try {
    const { search, client, businessType, status, startDate, endDate } = req.query;
    const query = {};

    if (client) query.client = client;

    if (status && status !== 'all') {
      query.$or = [{ paymentStatus: status }, { status: status }];
    }

    if (startDate || endDate) {
      query.receivedDate = {};
      if (startDate) query.receivedDate.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.receivedDate.$lte = end;
      }
    }

    let payments = await ClientPayment.find(query)
      .populate('client', 'companyName type contactPerson phone city businessId gstNumber')
      .populate('bill', 'billNumber totalBillAmount totalReceivedAmount remainingAmount status')
      .sort({ receivedDate: -1, createdAt: -1 });

    // Filter by businessType (Hotel vs Catering)
    if (businessType && businessType !== 'all') {
      payments = payments.filter((p) => {
        const t = (p.client?.type || '').toLowerCase();
        if (businessType.toLowerCase() === 'catering') {
          return t.includes('catering');
        }
        return t === businessType.toLowerCase();
      });
    }

    // Search filter across client name, receipt #, invoice #, or txn ref
    if (search) {
      const s = search.toLowerCase().trim();
      payments = payments.filter((p) => {
        const cName = p.client?.companyName?.toLowerCase() || '';
        const cType = p.client?.type?.toLowerCase() || '';
        const receiptNo = (p.receiptNo || p.clientPaymentId || '').toLowerCase();
        const invoiceNo = (p.invoiceNumber || p.bill?.billNumber || '').toLowerCase();
        const txnRef = (p.transactionReference || '').toLowerCase();
        return (
          cName.includes(s) ||
          cType.includes(s) ||
          receiptNo.includes(s) ||
          invoiceNo.includes(s) ||
          txnRef.includes(s)
        );
      });
    }

    // Aggregate summary statistics
    const totalReceived = payments.reduce(
      (sum, p) => (p.status !== 'Bounced' ? sum + (p.receivedAmount || p.amount || 0) : sum),
      0
    );

    let hotelCollections = 0;
    let cateringCollections = 0;
    payments.forEach((p) => {
      const amount = p.receivedAmount || p.amount || 0;
      const type = (p.client?.type || '').toLowerCase();
      if (type.includes('catering')) {
        cateringCollections += amount;
      } else {
        hotelCollections += amount;
      }
    });

    // Overall client billing & outstanding balances across all clients
    const allDutiesBilled = await Duty.aggregate([
      { $match: { status: { $ne: 'Rejected' } } },
      { $group: { _id: null, totalBilled: { $sum: '$clientBillingAmount' } } },
    ]);
    const totalBilled = allDutiesBilled.length > 0 ? allDutiesBilled[0].totalBilled : 0;
    const totalOutstanding = Math.max(0, totalBilled - totalReceived);

    res.status(200).json({
      success: true,
      count: payments.length,
      data: payments,
      summary: {
        totalReceived,
        totalBilled,
        totalOutstanding,
        hotelCollections,
        cateringCollections,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single client payment receipt with formatted printable data (Admin only)
// @route   GET /api/payments/clients/:id
// @access  Private (Admin only)
exports.getClientPaymentById = async (req, res, next) => {
  try {
    const payment = await ClientPayment.findById(req.params.id)
      .populate('client', 'companyName type contactPerson phone email address city businessId gstNumber')
      .populate('bill', 'billNumber totalBillAmount totalReceivedAmount remainingAmount status')
      .populate('recordedBy', 'name email');

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Client receipt not found.' });
    }

    const receivedAmt = payment.receivedAmount || payment.amount || 0;

    const receipt = {
      receiptNumber: payment.receiptNo || payment.clientPaymentId,
      receiptDate: payment.receivedDate || payment.paymentDate,
      invoiceNumber: payment.invoiceNumber || payment.bill?.billNumber || 'Direct Payment',
      client: {
        id: payment.client?._id,
        businessId: payment.client?.businessId || 'HTL/CAT',
        companyName: payment.client?.companyName,
        type: payment.client?.type,
        contactPerson: payment.client?.contactPerson,
        phone: payment.client?.phone,
        email: payment.client?.email,
        address: payment.client?.address,
        city: payment.client?.city,
        gstNumber: payment.client?.gstNumber || 'Unregistered',
      },
      totalBillAmount: payment.totalBillAmount || payment.bill?.totalBillAmount || 0,
      receivedAmount: receivedAmt,
      receivedAmountInWords: numberToWordsIndian(receivedAmt),
      remainingAmount: payment.remainingAmount ?? payment.bill?.remainingAmount ?? 0,
      paymentMethod: payment.paymentMethod || payment.paymentMode || 'Bank Transfer',
      transactionReference: payment.transactionReference || 'Direct Bank Settlement',
      status: payment.paymentStatus || payment.status || 'Received',
      notes: payment.notes || '',
      issuedBy: 'KK Brothers Staff Management Administration',
      generatedAt: new Date(),
    };

    res.status(200).json({
      success: true,
      data: payment,
      receipt,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Record a payment received from a hotel or caterer (Full or Partial)
// @route   POST /api/payments/clients
// @access  Private (Admin only)
exports.createClientPayment = async (req, res, next) => {
  try {
    const {
      client: clientId,
      amount,
      receivedAmount,
      bill: billId,
      relatedDutyIds,
      paymentMethod,
      paymentMode,
      invoiceNumber,
      transactionReference,
      receivedDate,
      notes,
    } = req.body;

    const finalAmount = Number(receivedAmount ?? amount);

    if (!clientId || isNaN(finalAmount) || finalAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid client establishment and positive payment amount are required.',
      });
    }

    const clientDoc = await Client.findById(clientId);
    if (!clientDoc) {
      return res.status(404).json({ success: false, message: 'Client establishment not found.' });
    }

    let billDoc = null;
    let billTotal = 0;
    let billRemaining = 0;
    let pStatus = 'Received';

    if (billId) {
      billDoc = await ClientBill.findById(billId);
      if (billDoc) {
        billTotal = billDoc.totalBillAmount;
        billDoc.totalReceivedAmount += finalAmount;
        billDoc.remainingAmount = Math.max(0, billDoc.totalBillAmount - billDoc.totalReceivedAmount);
        billRemaining = billDoc.remainingAmount;

        if (billDoc.remainingAmount === 0) {
          billDoc.status = 'Paid';
          pStatus = 'Paid';
        } else {
          billDoc.status = 'Partial';
          pStatus = 'Partial';
        }
        await billDoc.save();

        // Update duties associated with this bill
        if (billDoc.duties && billDoc.duties.length > 0) {
          await Duty.updateMany(
            { _id: { $in: billDoc.duties } },
            { clientPaymentStatus: billDoc.status }
          );
        }
      }
    } else {
      // If no explicit bill passed, calculate client's cumulative billing from duties
      const dutiesAgg = await Duty.aggregate([
        { $match: { client: clientDoc._id, status: { $ne: 'Rejected' } } },
        { $group: { _id: null, totalBilled: { $sum: '$clientBillingAmount' } } },
      ]);
      billTotal = dutiesAgg.length > 0 ? dutiesAgg[0].totalBilled : finalAmount;

      const paymentsAgg = await ClientPayment.aggregate([
        { $match: { client: clientDoc._id, status: { $ne: 'Bounced' } } },
        { $group: { _id: null, totalReceived: { $sum: '$receivedAmount' } } },
      ]);
      const prevReceived = paymentsAgg.length > 0 ? paymentsAgg[0].totalReceived : 0;
      const newTotalReceived = prevReceived + finalAmount;
      billRemaining = Math.max(0, billTotal - newTotalReceived);
      pStatus = billRemaining === 0 ? 'Paid' : 'Partial';
    }

    const method = paymentMethod || paymentMode || 'Bank Transfer';

    const payment = await ClientPayment.create({
      client: clientDoc._id,
      bill: billDoc ? billDoc._id : null,
      relatedDutyIds: relatedDutyIds || (billDoc ? billDoc.duties : []),
      totalBillAmount: billTotal,
      receivedAmount: finalAmount,
      amount: finalAmount,
      remainingAmount: billRemaining,
      receivedDate: receivedDate ? new Date(receivedDate) : new Date(),
      paymentDate: receivedDate ? new Date(receivedDate) : new Date(),
      paymentMethod: method,
      paymentMode: method,
      invoiceNumber: invoiceNumber || (billDoc ? billDoc.billNumber : ''),
      transactionReference: transactionReference || '',
      paymentStatus: pStatus,
      status: pStatus,
      notes: notes || '',
      recordedBy: req.user._id,
    });

    const populated = await ClientPayment.findById(payment._id)
      .populate('client', 'companyName type contactPerson phone city businessId')
      .populate('bill', 'billNumber totalBillAmount totalReceivedAmount remainingAmount status');

    res.status(201).json({
      success: true,
      message: `Payment of ₹${finalAmount.toLocaleString()} recorded from '${clientDoc.companyName}'. Remaining balance: ₹${billRemaining.toLocaleString()} (Status: ${pStatus})`,
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all client bills (Invoices generated from completed duties)
// @route   GET /api/payments/client-bills
// @access  Private (Admin only)
exports.getClientBills = async (req, res, next) => {
  try {
    const { search, client, businessType, status } = req.query;
    const query = {};

    if (client) query.client = client;
    if (status && status !== 'all') query.status = status;

    let bills = await ClientBill.find(query)
      .populate('client', 'companyName type contactPerson phone city businessId gstNumber')
      .populate('duties', 'dutySlipNumber dutyDate shiftType hoursWorked clientBillingAmount location')
      .sort({ billDate: -1, createdAt: -1 });

    if (businessType && businessType !== 'all') {
      bills = bills.filter((b) => {
        const t = (b.client?.type || '').toLowerCase();
        if (businessType.toLowerCase() === 'catering') {
          return t.includes('catering');
        }
        return t === businessType.toLowerCase();
      });
    }

    if (search) {
      const s = search.toLowerCase().trim();
      bills = bills.filter((b) => {
        const cName = b.client?.companyName?.toLowerCase() || '';
        const billNo = (b.billNumber || '').toLowerCase();
        const city = (b.client?.city || '').toLowerCase();
        return cName.includes(s) || billNo.includes(s) || city.includes(s);
      });
    }

    const totalBilled = bills.reduce((sum, b) => sum + (b.totalBillAmount || 0), 0);
    const totalReceived = bills.reduce((sum, b) => sum + (b.totalReceivedAmount || 0), 0);
    const totalPending = Math.max(0, totalBilled - totalReceived);
    const pendingCount = bills.filter((b) => b.status === 'Pending' || b.status === 'Partial').length;

    res.status(200).json({
      success: true,
      count: bills.length,
      data: bills,
      summary: {
        totalBilled,
        totalReceived,
        totalPending,
        pendingCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single client bill with duties and payment history transactions
// @route   GET /api/payments/client-bills/:id
// @access  Private (Admin only)
exports.getClientBillById = async (req, res, next) => {
  try {
    const bill = await ClientBill.findById(req.params.id)
      .populate('client', 'companyName type contactPerson phone email address city businessId gstNumber')
      .populate({
        path: 'duties',
        populate: { path: 'staff', select: 'name staffCode designation' },
      });

    if (!bill) {
      return res.status(404).json({ success: false, message: 'Client bill not found.' });
    }

    // Fetch all payment transactions recorded against this bill
    const payments = await ClientPayment.find({ bill: bill._id }).sort({ receivedDate: -1 });

    res.status(200).json({
      success: true,
      data: {
        bill,
        payments,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a client bill from completed, unbilled duties (Admin only)
// @route   POST /api/payments/client-bills
// @access  Private (Admin only)
exports.createClientBill = async (req, res, next) => {
  try {
    const { client: clientId, duties: dutyIds, dueDate, notes } = req.body;

    if (!clientId || !dutyIds || !Array.isArray(dutyIds) || dutyIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Client and at least one completed duty are required to generate a bill.',
      });
    }

    const clientDoc = await Client.findById(clientId);
    if (!clientDoc) {
      return res.status(404).json({ success: false, message: 'Client establishment not found.' });
    }

    // Verify duties belong to client and are NOT already billed
    const dutiesToBill = await Duty.find({
      _id: { $in: dutyIds },
      client: clientDoc._id,
      status: { $ne: 'Rejected' },
    });

    if (dutiesToBill.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No eligible approved duties found for this client.',
      });
    }

    // Check if any duty was already billed
    const alreadyBilled = dutiesToBill.filter((d) => d.clientBilled === true);
    if (alreadyBilled.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Duty slip '${alreadyBilled[0].dutySlipNumber}' has already been billed. Duplicate billing is strictly prohibited.`,
      });
    }

    // Calculate total bill amount as sum of clientBillingAmount
    const totalBillAmount = dutiesToBill.reduce((sum, d) => sum + (d.clientBillingAmount || 0), 0);

    const bill = await ClientBill.create({
      client: clientDoc._id,
      duties: dutiesToBill.map((d) => d._id),
      totalDuties: dutiesToBill.length,
      totalBillAmount,
      totalReceivedAmount: 0,
      remainingAmount: totalBillAmount,
      status: 'Pending',
      billDate: new Date(),
      dueDate: dueDate ? new Date(dueDate) : null,
      notes: notes || '',
      recordedBy: req.user._id,
    });

    // Mark duties as billed to prevent duplicate billing
    await Duty.updateMany(
      { _id: { $in: dutiesToBill.map((d) => d._id) } },
      {
        clientBilled: true,
        clientBill: bill._id,
        clientPaymentStatus: 'Billed',
      }
    );

    const populated = await ClientBill.findById(bill._id)
      .populate('client', 'companyName type contactPerson phone city businessId')
      .populate('duties', 'dutySlipNumber dutyDate shiftType hoursWorked clientBillingAmount');

    res.status(201).json({
      success: true,
      message: `Bill '${bill.billNumber}' created for ${clientDoc.companyName} for ₹${totalBillAmount.toLocaleString()} across ${dutiesToBill.length} duties.`,
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get unbilled completed duties for a client (Admin only)
// @route   GET /api/payments/client-unbilled-duties/:clientId
// @access  Private (Admin only)
exports.getUnbilledDutiesForClient = async (req, res, next) => {
  try {
    const { clientId } = req.params;

    const unbilledDuties = await Duty.find({
      client: clientId,
      status: 'Approved',
      clientBilled: { $ne: true },
    })
      .populate('staff', 'name staffCode designation')
      .sort({ dutyDate: -1 });

    const totalUnbilledAmount = unbilledDuties.reduce(
      (sum, d) => sum + (d.clientBillingAmount || 0),
      0
    );

    res.status(200).json({
      success: true,
      count: unbilledDuties.length,
      totalUnbilledAmount,
      data: unbilledDuties,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Generate comprehensive hotel & catering payment report (Admin only)
// @route   GET /api/payments/client-report
// @access  Private (Admin only)
exports.getClientPaymentReport = async (req, res, next) => {
  try {
    const clients = await Client.find().sort({ companyName: 1 });
    const clientIds = clients.map((c) => c._id);

    // Aggregate duties by client
    const dutiesAgg = await Duty.aggregate([
      { $match: { client: { $in: clientIds }, status: { $ne: 'Rejected' } } },
      {
        $group: {
          _id: '$client',
          totalBilled: { $sum: '$clientBillingAmount' },
          totalDuties: { $sum: 1 },
        },
      },
    ]);

    const dutiesMap = {};
    dutiesAgg.forEach((d) => {
      dutiesMap[d._id.toString()] = {
        totalBilled: d.totalBilled,
        totalDuties: d.totalDuties,
      };
    });

    // Aggregate payments by client
    const paymentsAgg = await ClientPayment.aggregate([
      { $match: { client: { $in: clientIds }, status: { $ne: 'Bounced' } } },
      {
        $group: {
          _id: '$client',
          totalReceived: { $sum: '$receivedAmount' },
          receiptsCount: { $sum: 1 },
        },
      },
    ]);

    const paymentsMap = {};
    paymentsAgg.forEach((p) => {
      paymentsMap[p._id.toString()] = {
        totalReceived: p.totalReceived,
        receiptsCount: p.receiptsCount,
      };
    });

    let overallBilled = 0;
    let overallReceived = 0;
    let overallOutstanding = 0;

    let hotelsBilled = 0;
    let hotelsReceived = 0;
    let cateringBilled = 0;
    let cateringReceived = 0;

    const reportList = clients.map((c) => {
      const dData = dutiesMap[c._id.toString()] || { totalBilled: 0, totalDuties: 0 };
      const pData = paymentsMap[c._id.toString()] || { totalReceived: 0, receiptsCount: 0 };
      const pending = Math.max(0, dData.totalBilled - pData.totalReceived);

      overallBilled += dData.totalBilled;
      overallReceived += pData.totalReceived;
      overallOutstanding += pending;

      const isCatering = (c.type || '').toLowerCase().includes('catering');
      if (isCatering) {
        cateringBilled += dData.totalBilled;
        cateringReceived += pData.totalReceived;
      } else {
        hotelsBilled += dData.totalBilled;
        hotelsReceived += pData.totalReceived;
      }

      let pStatus = 'Pending';
      if (pData.totalReceived > 0 && pending === 0) {
        pStatus = 'Paid';
      } else if (pData.totalReceived > 0 && pending > 0) {
        pStatus = 'Partial';
      }

      return {
        clientId: c._id,
        businessId: c.businessId || c.clientCode,
        companyName: c.companyName,
        type: c.type,
        contactPerson: c.contactPerson,
        phone: c.phone,
        city: c.city,
        totalDuties: dData.totalDuties,
        totalBill: dData.totalBilled,
        totalReceived: pData.totalReceived,
        remainingAmount: pending,
        paymentStatus: pStatus,
      };
    });

    // Sort by highest remaining balance first
    reportList.sort((a, b) => b.remainingAmount - a.remainingAmount);

    res.status(200).json({
      success: true,
      summary: {
        overallBilled,
        overallReceived,
        overallOutstanding,
        hotels: {
          billed: hotelsBilled,
          received: hotelsReceived,
          outstanding: Math.max(0, hotelsBilled - hotelsReceived),
        },
        catering: {
          billed: cateringBilled,
          received: cateringReceived,
          outstanding: Math.max(0, cateringBilled - cateringReceived),
        },
      },
      data: reportList,
    });
  } catch (error) {
    next(error);
  }
};
