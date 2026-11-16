const Staff = require('../models/Staff');
const Client = require('../models/Client');
const Duty = require('../models/Duty');
const StaffPayment = require('../models/StaffPayment');
const ClientPayment = require('../models/ClientPayment');
const ClientBill = require('../models/ClientBill');

// Helper to construct date filters
const buildDateFilter = (startDate, endDate, dateField = 'dutyDate') => {
  const filter = {};
  if (startDate || endDate) {
    filter[dateField] = {};
    if (startDate) {
      const s = new Date(startDate);
      s.setHours(0, 0, 0, 0);
      filter[dateField].$gte = s;
    }
    if (endDate) {
      const e = new Date(endDate);
      e.setHours(23, 59, 59, 999);
      filter[dateField].$lte = e;
    }
  }
  return filter;
};

// 1. Staff-wise Duty Report
exports.getStaffDutyReport = async (req, res, next) => {
  try {
    const { startDate, endDate, staffId } = req.query;
    const staffQuery = { status: { $ne: 'inactive' } };
    if (staffId) staffQuery._id = staffId;

    const staffMembers = await Staff.find(staffQuery).sort({ name: 1 });
    const reportData = [];

    let grandTotalDuties = 0;
    let grandTotalHours = 0;
    let grandTotalEarned = 0;
    let grandTotalPaid = 0;
    let grandTotalPending = 0;

    for (const stf of staffMembers) {
      const dutyFilter = {
        staff: stf._id,
        status: { $in: ['Approved', 'Completed'] },
        ...buildDateFilter(startDate, endDate, 'dutyDate'),
      };

      const duties = await Duty.find(dutyFilter)
        .populate('client', 'companyName type city')
        .sort({ dutyDate: -1 });

      const totalDuties = duties.length;
      const totalHours = Math.round(duties.reduce((sum, d) => sum + (d.hoursWorked || 0), 0) * 10) / 10;
      const totalEarned = duties.reduce((sum, d) => sum + (d.staffWage || 0), 0);

      const paymentFilter = {
        staff: stf._id,
        status: 'Completed',
        ...buildDateFilter(startDate, endDate, 'paymentDate'),
      };
      const payments = await StaffPayment.find(paymentFilter);
      const totalPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
      const pendingAmount = Math.max(0, totalEarned - totalPaid);

      grandTotalDuties += totalDuties;
      grandTotalHours += totalHours;
      grandTotalEarned += totalEarned;
      grandTotalPaid += totalPaid;
      grandTotalPending += pendingAmount;

      reportData.push({
        staffId: stf._id,
        staffCode: stf.staffCode,
        name: stf.name,
        phone: stf.phone,
        designation: stf.designation,
        defaultDailyRate: stf.defaultDailyRate,
        totalDuties,
        totalHours,
        totalEarned,
        totalPaid,
        pendingAmount,
        duties: duties.map((d) => ({
          slip: d.dutySlipNumber,
          date: d.dutyDate,
          client: d.client?.companyName || '—',
          clientType: d.client?.type || '—',
          inTime: d.inTime,
          outTime: d.outTime,
          hours: d.hoursWorked,
          isOvernight: d.isOvernight,
          wage: d.staffWage,
          location: d.location,
          status: d.status,
        })),
      });
    }

    res.status(200).json({
      success: true,
      reportType: 'staff_duty_report',
      dateRange: { startDate: startDate || 'All', endDate: endDate || 'All' },
      summary: {
        totalStaffCount: staffMembers.length,
        grandTotalDuties,
        grandTotalHours: Math.round(grandTotalHours * 10) / 10,
        grandTotalEarned,
        grandTotalPaid,
        grandTotalPending,
      },
      data: reportData,
    });
  } catch (error) {
    next(error);
  }
};

// 2. Hotel-wise Duty Report
exports.getHotelDutyReport = async (req, res, next) => {
  try {
    const { startDate, endDate, clientId } = req.query;
    const clientQuery = { type: { $in: ['Hotel', 'Resort'] }, status: { $ne: 'inactive' } };
    if (clientId) clientQuery._id = clientId;

    const hotels = await Client.find(clientQuery).sort({ companyName: 1 });
    const reportData = [];

    let grandTotalDuties = 0;
    let grandTotalHours = 0;
    let grandTotalBilling = 0;
    let grandTotalReceived = 0;
    let grandTotalBalance = 0;

    for (const htl of hotels) {
      const dutyFilter = {
        client: htl._id,
        status: { $in: ['Approved', 'Completed'] },
        ...buildDateFilter(startDate, endDate, 'dutyDate'),
      };

      const duties = await Duty.find(dutyFilter)
        .populate('staff', 'name staffCode phone')
        .sort({ dutyDate: -1 });

      const totalDuties = duties.length;
      const totalHours = Math.round(duties.reduce((sum, d) => sum + (d.hoursWorked || 0), 0) * 10) / 10;
      const totalBilling = duties.reduce((sum, d) => sum + (d.clientBillingAmount || 0), 0);

      // Unique staff count sent to this hotel
      const uniqueStaffIds = new Set(duties.map((d) => d.staff?._id?.toString()).filter(Boolean));
      const totalStaffSent = uniqueStaffIds.size;

      const paymentFilter = {
        client: htl._id,
        status: 'Received',
        ...buildDateFilter(startDate, endDate, 'paymentDate'),
      };
      const payments = await ClientPayment.find(paymentFilter);
      const totalReceived = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
      const remainingBalance = Math.max(0, totalBilling - totalReceived);

      grandTotalDuties += totalDuties;
      grandTotalHours += totalHours;
      grandTotalBilling += totalBilling;
      grandTotalReceived += totalReceived;
      grandTotalBalance += remainingBalance;

      reportData.push({
        clientId: htl._id,
        businessId: htl.businessId,
        companyName: htl.companyName,
        contactPerson: htl.contactPerson,
        phone: htl.phone,
        city: htl.city,
        defaultBillingRate: htl.defaultBillingRatePerStaff,
        totalDuties,
        totalStaffSent,
        totalHours,
        totalBilling,
        totalReceived,
        remainingBalance,
        duties: duties.map((d) => ({
          slip: d.dutySlipNumber,
          date: d.dutyDate,
          staffName: d.staff?.name || '—',
          staffCode: d.staff?.staffCode || '—',
          inTime: d.inTime,
          outTime: d.outTime,
          hours: d.hoursWorked,
          charge: d.clientBillingAmount,
          location: d.location,
        })),
      });
    }

    res.status(200).json({
      success: true,
      reportType: 'hotel_duty_report',
      dateRange: { startDate: startDate || 'All', endDate: endDate || 'All' },
      summary: {
        totalHotelsCount: hotels.length,
        grandTotalDuties,
        grandTotalHours: Math.round(grandTotalHours * 10) / 10,
        grandTotalBilling,
        grandTotalReceived,
        grandTotalBalance,
      },
      data: reportData,
    });
  } catch (error) {
    next(error);
  }
};

// 3. Catering-wise Duty Report
exports.getCateringDutyReport = async (req, res, next) => {
  try {
    const { startDate, endDate, clientId } = req.query;
    const clientQuery = { type: { $in: ['Catering', 'Catering Company'] }, status: { $ne: 'inactive' } };
    if (clientId) clientQuery._id = clientId;

    const caterers = await Client.find(clientQuery).sort({ companyName: 1 });
    const reportData = [];

    let grandTotalDuties = 0;
    let grandTotalHours = 0;
    let grandTotalBilling = 0;
    let grandTotalReceived = 0;
    let grandTotalBalance = 0;

    for (const cat of caterers) {
      const dutyFilter = {
        client: cat._id,
        status: { $in: ['Approved', 'Completed'] },
        ...buildDateFilter(startDate, endDate, 'dutyDate'),
      };

      const duties = await Duty.find(dutyFilter)
        .populate('staff', 'name staffCode phone')
        .sort({ dutyDate: -1 });

      const totalDuties = duties.length;
      const totalHours = Math.round(duties.reduce((sum, d) => sum + (d.hoursWorked || 0), 0) * 10) / 10;
      const totalBilling = duties.reduce((sum, d) => sum + (d.clientBillingAmount || 0), 0);

      const uniqueStaffIds = new Set(duties.map((d) => d.staff?._id?.toString()).filter(Boolean));
      const totalStaffSent = uniqueStaffIds.size;

      const paymentFilter = {
        client: cat._id,
        status: 'Received',
        ...buildDateFilter(startDate, endDate, 'paymentDate'),
      };
      const payments = await ClientPayment.find(paymentFilter);
      const totalReceived = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
      const remainingBalance = Math.max(0, totalBilling - totalReceived);

      grandTotalDuties += totalDuties;
      grandTotalHours += totalHours;
      grandTotalBilling += totalBilling;
      grandTotalReceived += totalReceived;
      grandTotalBalance += remainingBalance;

      reportData.push({
        clientId: cat._id,
        businessId: cat.businessId,
        companyName: cat.companyName,
        contactPerson: cat.contactPerson,
        phone: cat.phone,
        city: cat.city,
        defaultBillingRate: cat.defaultBillingRatePerStaff,
        totalDuties,
        totalStaffSent,
        totalHours,
        totalBilling,
        totalReceived,
        remainingBalance,
        duties: duties.map((d) => ({
          slip: d.dutySlipNumber,
          date: d.dutyDate,
          staffName: d.staff?.name || '—',
          staffCode: d.staff?.staffCode || '—',
          inTime: d.inTime,
          outTime: d.outTime,
          hours: d.hoursWorked,
          charge: d.clientBillingAmount,
          location: d.location,
        })),
      });
    }

    res.status(200).json({
      success: true,
      reportType: 'catering_duty_report',
      dateRange: { startDate: startDate || 'All', endDate: endDate || 'All' },
      summary: {
        totalCateringCount: caterers.length,
        grandTotalDuties,
        grandTotalHours: Math.round(grandTotalHours * 10) / 10,
        grandTotalBilling,
        grandTotalReceived,
        grandTotalBalance,
      },
      data: reportData,
    });
  } catch (error) {
    next(error);
  }
};

// 4. Date-wise Duty Report
exports.getDateWiseDutyReport = async (req, res, next) => {
  try {
    const { startDate, endDate, staffId, clientId, status } = req.query;
    const filter = {
      ...buildDateFilter(startDate, endDate, 'dutyDate'),
    };
    if (staffId) filter.staff = staffId;
    if (clientId) filter.client = clientId;
    if (status && status !== 'all') {
      filter.status = status;
    }

    const duties = await Duty.find(filter)
      .populate('staff', 'name staffCode designation phone defaultDailyRate')
      .populate('client', 'companyName type city businessId')
      .sort({ dutyDate: -1, inTime: -1 });

    let totalStaffWages = 0;
    let totalClientBilling = 0;
    let totalHours = 0;

    const data = duties.map((d) => {
      const isFin = d.status === 'Approved' || d.status === 'Completed';
      if (isFin) {
        totalStaffWages += d.staffWage || 0;
        totalClientBilling += d.clientBillingAmount || 0;
      }
      totalHours += d.hoursWorked || 0;

      return {
        _id: d._id,
        dutySlipNumber: d.dutySlipNumber,
        dutyDate: d.dutyDate,
        staffName: d.staff?.name || 'Unassigned',
        staffCode: d.staff?.staffCode || '—',
        clientName: d.client?.companyName || '—',
        clientType: d.client?.type || '—',
        city: d.client?.city || '—',
        inTime: d.inTime,
        outTime: d.outTime,
        hoursWorked: d.hoursWorked,
        isOvernight: d.isOvernight,
        location: d.location,
        rolePerformed: d.rolePerformed,
        staffWage: d.staffWage,
        clientBillingAmount: d.clientBillingAmount,
        margin: (d.clientBillingAmount || 0) - (d.staffWage || 0),
        status: d.status,
      };
    });

    res.status(200).json({
      success: true,
      reportType: 'date_wise_duty_report',
      dateRange: { startDate: startDate || 'All', endDate: endDate || 'All' },
      summary: {
        totalDuties: duties.length,
        totalHours: Math.round(totalHours * 10) / 10,
        totalStaffWages,
        totalClientBilling,
        grossMargin: totalClientBilling - totalStaffWages,
      },
      data,
    });
  } catch (error) {
    next(error);
  }
};

// 5. Staff Payment Report (Internal Wage Disbursals)
exports.getStaffPaymentReport = async (req, res, next) => {
  try {
    const { startDate, endDate, staffId, paymentMethod } = req.query;
    const filter = {
      ...buildDateFilter(startDate, endDate, 'paymentDate'),
    };
    if (staffId) filter.staff = staffId;
    if (paymentMethod && paymentMethod !== 'all') filter.paymentMethod = paymentMethod;

    const payments = await StaffPayment.find(filter)
      .populate('staff', 'name staffCode phone designation bankAccountNo upiId')
      .populate('recordedBy', 'name email')
      .sort({ paymentDate: -1, createdAt: -1 });

    const totalAmountDisbursed = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

    const methodBreakdown = { Cash: 0, UPI: 0, 'Bank Transfer': 0 };
    payments.forEach((p) => {
      if (methodBreakdown[p.paymentMethod] !== undefined) {
        methodBreakdown[p.paymentMethod] += p.amount || 0;
      }
    });

    res.status(200).json({
      success: true,
      reportType: 'staff_payment_report',
      dateRange: { startDate: startDate || 'All', endDate: endDate || 'All' },
      summary: {
        totalVouchers: payments.length,
        totalAmountDisbursed,
        methodBreakdown,
      },
      data: payments.map((p) => ({
        paymentId: p.paymentId || p.paymentNumber || p._id,
        paymentDate: p.paymentDate,
        staffName: p.staff?.name || '—',
        staffCode: p.staff?.staffCode || '—',
        phone: p.staff?.phone || '—',
        amount: p.amount,
        paymentType: p.paymentType,
        paymentMethod: p.paymentMethod,
        transactionReference: p.transactionReference || '—',
        status: p.status,
        recordedBy: p.recordedBy?.name || 'Admin',
        notes: p.notes || '',
      })),
    });
  } catch (error) {
    next(error);
  }
};

// 6. Client Payment Report (Inbound Hotel & Catering Collections)
exports.getClientPaymentReport = async (req, res, next) => {
  try {
    const { startDate, endDate, clientId, paymentMethod } = req.query;
    const filter = {
      ...buildDateFilter(startDate, endDate, 'paymentDate'),
    };
    if (clientId) filter.client = clientId;
    if (paymentMethod && paymentMethod !== 'all') filter.paymentMethod = paymentMethod;

    const payments = await ClientPayment.find(filter)
      .populate('client', 'companyName type businessId contactPerson phone city')
      .populate('recordedBy', 'name email')
      .sort({ paymentDate: -1, createdAt: -1 });

    const totalAmountReceived = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

    const methodBreakdown = { Cash: 0, UPI: 0, 'Bank Transfer': 0, Cheque: 0 };
    payments.forEach((p) => {
      if (methodBreakdown[p.paymentMethod] !== undefined) {
        methodBreakdown[p.paymentMethod] += p.amount || 0;
      }
    });

    res.status(200).json({
      success: true,
      reportType: 'client_payment_report',
      dateRange: { startDate: startDate || 'All', endDate: endDate || 'All' },
      summary: {
        totalVouchers: payments.length,
        totalAmountReceived,
        methodBreakdown,
      },
      data: payments.map((p) => ({
        paymentId: p.paymentId || p.voucherNumber || p._id,
        paymentDate: p.paymentDate,
        clientName: p.client?.companyName || '—',
        businessType: p.client?.type || '—',
        businessId: p.client?.businessId || '—',
        contactPerson: p.client?.contactPerson || '—',
        phone: p.client?.phone || '—',
        amount: p.amount,
        paymentMethod: p.paymentMethod,
        transactionReference: p.transactionReference || '—',
        status: p.status,
        notes: p.notes || '',
        recordedBy: p.recordedBy?.name || 'Admin',
      })),
    });
  } catch (error) {
    next(error);
  }
};

// 7. Pending Payment Report (Two-Sided Balance Sheet: Staff Payables vs Client Receivables)
exports.getPendingPaymentReport = async (req, res, next) => {
  try {
    // A. Staff Wage Liabilities
    const staffMembers = await Staff.find({ status: { $ne: 'inactive' } }).sort({ name: 1 });
    const staffPayables = [];
    let grandStaffEarned = 0;
    let grandStaffPaid = 0;
    let grandStaffPending = 0;

    for (const stf of staffMembers) {
      const dutySum = await Duty.aggregate([
        { $match: { staff: stf._id, status: { $in: ['Approved', 'Completed'] } } },
        { $group: { _id: null, totalEarned: { $sum: '$staffWage' }, count: { $sum: 1 } } },
      ]);
      const totalEarned = dutySum[0]?.totalEarned || 0;
      const dutyCount = dutySum[0]?.count || 0;

      const paySum = await StaffPayment.aggregate([
        { $match: { staff: stf._id, status: 'Completed' } },
        { $group: { _id: null, totalPaid: { $sum: '$amount' } } },
      ]);
      const totalPaid = paySum[0]?.totalPaid || 0;
      const pendingAmount = Math.max(0, totalEarned - totalPaid);

      if (pendingAmount > 0) {
        grandStaffEarned += totalEarned;
        grandStaffPaid += totalPaid;
        grandStaffPending += pendingAmount;

        staffPayables.push({
          staffId: stf._id,
          staffCode: stf.staffCode,
          name: stf.name,
          phone: stf.phone,
          designation: stf.designation,
          dutyCount,
          totalEarned,
          totalPaid,
          pendingAmount,
        });
      }
    }

    // B. Client Receivables
    const clients = await Client.find({ status: { $ne: 'inactive' } }).sort({ companyName: 1 });
    const clientReceivables = [];
    let grandClientBilled = 0;
    let grandClientReceived = 0;
    let grandClientPending = 0;

    for (const cl of clients) {
      const dutySum = await Duty.aggregate([
        { $match: { client: cl._id, status: { $in: ['Approved', 'Completed'] } } },
        { $group: { _id: null, totalBilled: { $sum: '$clientBillingAmount' }, count: { $sum: 1 } } },
      ]);
      const totalBilled = dutySum[0]?.totalBilled || 0;
      const dutyCount = dutySum[0]?.count || 0;

      const paySum = await ClientPayment.aggregate([
        { $match: { client: cl._id, status: 'Received' } },
        { $group: { _id: null, totalReceived: { $sum: '$amount' } } },
      ]);
      const totalReceived = paySum[0]?.totalReceived || 0;
      const remainingBalance = Math.max(0, totalBilled - totalReceived);

      if (remainingBalance > 0) {
        grandClientBilled += totalBilled;
        grandClientReceived += totalReceived;
        grandClientPending += remainingBalance;

        clientReceivables.push({
          clientId: cl._id,
          businessId: cl.businessId,
          companyName: cl.companyName,
          type: cl.type,
          contactPerson: cl.contactPerson,
          phone: cl.phone,
          city: cl.city,
          dutyCount,
          totalBilled,
          totalReceived,
          remainingBalance,
        });
      }
    }

    res.status(200).json({
      success: true,
      reportType: 'pending_payment_report',
      summary: {
        totalStaffLiability: grandStaffPending,
        totalClientReceivable: grandClientPending,
        netCashflowGap: grandClientPending - grandStaffPending,
      },
      staffPayables,
      clientReceivables,
    });
  } catch (error) {
    next(error);
  }
};

// 8. Monthly Business Report (Executive P&L Statement)
exports.getMonthlyBusinessReport = async (req, res, next) => {
  try {
    const { year, month } = req.query;
    const now = new Date();
    const selYear = year ? parseInt(year, 10) : now.getFullYear();
    const selMonth = month ? parseInt(month, 10) - 1 : now.getMonth();

    const startOfMonth = new Date(selYear, selMonth, 1, 0, 0, 0, 0);
    const endOfMonth = new Date(selYear, selMonth + 1, 0, 23, 59, 59, 999);

    const monthName = startOfMonth.toLocaleString('en-IN', { month: 'long', year: 'numeric' });

    // Completed/Approved duties in this month
    const duties = await Duty.find({
      dutyDate: { $gte: startOfMonth, $lte: endOfMonth },
      status: { $in: ['Approved', 'Completed'] },
    }).populate('client', 'type companyName');

    const totalDuties = duties.length;
    const totalHours = Math.round(duties.reduce((sum, d) => sum + (d.hoursWorked || 0), 0) * 10) / 10;
    const grossClientBilling = duties.reduce((sum, d) => sum + (d.clientBillingAmount || 0), 0);
    const grossStaffWages = duties.reduce((sum, d) => sum + (d.staffWage || 0), 0);
    const grossMargin = grossClientBilling - grossStaffWages;
    const marginPercentage = grossClientBilling > 0 ? Math.round((grossMargin / grossClientBilling) * 1000) / 10 : 0;

    // Segment split (Hotel vs Catering)
    let hotelBilling = 0;
    let cateringBilling = 0;
    let hotelDutiesCount = 0;
    let cateringDutiesCount = 0;

    duties.forEach((d) => {
      if (d.client?.type === 'Hotel') {
        hotelBilling += d.clientBillingAmount || 0;
        hotelDutiesCount++;
      } else {
        cateringBilling += d.clientBillingAmount || 0;
        cateringDutiesCount++;
      }
    });

    // Payments collected from clients in this month
    const clientPayments = await ClientPayment.find({
      paymentDate: { $gte: startOfMonth, $lte: endOfMonth },
      status: 'Received',
    });
    const clientReceiptsCollected = clientPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

    // Wages disbursed to staff in this month
    const staffPayments = await StaffPayment.find({
      paymentDate: { $gte: startOfMonth, $lte: endOfMonth },
      status: 'Completed',
    });
    const staffWagesDisbursed = staffPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

    res.status(200).json({
      success: true,
      reportType: 'monthly_business_report',
      month: monthName,
      metrics: {
        totalDuties,
        totalHours,
        grossClientBilling,
        grossStaffWages,
        grossMargin,
        marginPercentage,
        clientReceiptsCollected,
        staffWagesDisbursed,
        hotelSplit: {
          dutiesCount: hotelDutiesCount,
          billingAmount: hotelBilling,
        },
        cateringSplit: {
          dutiesCount: cateringDutiesCount,
          billingAmount: cateringBilling,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
