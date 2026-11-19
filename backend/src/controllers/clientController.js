const Client = require('../models/Client');
const Duty = require('../models/Duty');
const ClientPayment = require('../models/ClientPayment');
const Staff = require('../models/Staff');

// @desc    Get all hotel & catering businesses with search, filters and live financial aggregations
// @route   GET /api/clients
// @access  Private (Admin has full management; User can read active for duty logging)
exports.getClientsList = async (req, res, next) => {
  try {
    const { search, type, status } = req.query;
    const query = {};

    // Search by Business Name, Contact Person, Mobile Number, City, or Business ID
    if (search) {
      const searchClean = search.trim();
      const digitsOnly = searchClean.replace(/\D/g, '');
      const searchConditions = [
        { companyName: { $regex: searchClean, $options: 'i' } },
        { contactPerson: { $regex: searchClean, $options: 'i' } },
        { phone: { $regex: searchClean, $options: 'i' } },
        { city: { $regex: searchClean, $options: 'i' } },
        { businessId: { $regex: searchClean, $options: 'i' } },
        { clientCode: { $regex: searchClean, $options: 'i' } },
      ];

      if (digitsOnly && digitsOnly.length >= 4) {
        searchConditions.push({ phone: { $regex: digitsOnly } });
      }

      query.$or = searchConditions;
    }

    // Filter by type: Hotel vs Catering vs others
    if (type && type !== 'all') {
      if (type.toLowerCase() === 'catering') {
        query.type = { $in: ['Catering', 'Catering Company'] };
      } else {
        query.type = type;
      }
    }

    // Filter by active/inactive
    if (status && status !== 'all') {
      query.status = status;
    }

    const clients = await Client.find(query).sort({ createdAt: -1 });

    // Aggregate duties and payments for summary statistics on each business
    const clientIds = clients.map((c) => c._id);

    // 1. Duties aggregation (Total duties, total bill amount)
    const dutiesAgg = await Duty.aggregate([
      { $match: { client: { $in: clientIds } } },
      {
        $group: {
          _id: '$client',
          totalDuties: { $sum: 1 },
          totalHours: { $sum: '$hoursWorked' },
          totalBillAmount: {
            $sum: {
              $cond: [{ $ne: ['$status', 'Rejected'] }, '$clientBillingAmount', 0],
            },
          },
          staffSet: { $addToSet: '$staff' },
        },
      },
    ]);

    const dutiesMap = {};
    dutiesAgg.forEach((d) => {
      dutiesMap[d._id.toString()] = {
        totalDuties: d.totalDuties,
        totalHours: d.totalHours,
        totalBillAmount: d.totalBillAmount,
        totalStaffProvided: d.staffSet ? d.staffSet.length : 0,
      };
    });

    // 2. Client Payments aggregation (Total received)
    const paymentsAgg = await ClientPayment.aggregate([
      { $match: { client: { $in: clientIds }, status: 'Received' } },
      {
        $group: {
          _id: '$client',
          totalReceived: { $sum: '$amount' },
        },
      },
    ]);

    const paymentsMap = {};
    paymentsAgg.forEach((p) => {
      paymentsMap[p._id.toString()] = p.totalReceived;
    });

    const enrichedClients = clients.map((c) => {
      const cObj = c.toObject();
      const dData = dutiesMap[c._id.toString()] || {
        totalDuties: 0,
        totalHours: 0,
        totalBillAmount: 0,
        totalStaffProvided: 0,
      };
      const received = paymentsMap[c._id.toString()] || 0;
      cObj.totalDuties = dData.totalDuties;
      cObj.totalHours = dData.totalHours;
      cObj.totalStaffProvided = dData.totalStaffProvided;
      cObj.totalBillAmount = dData.totalBillAmount;
      cObj.totalReceived = received;
      cObj.remainingBalance = Math.max(0, dData.totalBillAmount - received);
      return cObj;
    });

    res.status(200).json({
      success: true,
      count: enrichedClients.length,
      data: enrichedClients,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get complete individual business profile with staff sent, duty history & billing summary
// @route   GET /api/clients/:id
// @access  Private (Admin only)
exports.getClientById = async (req, res, next) => {
  try {
    const client = await Client.findById(req.params.id);

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Hotel or Catering business not found',
      });
    }

    // 1. Total duties & hours
    const totalDuties = await Duty.countDocuments({ client: client._id });

    // 2. Total bill amount
    const dutiesAgg = await Duty.aggregate([
      { $match: { client: client._id } },
      {
        $group: {
          _id: null,
          totalHours: { $sum: '$hoursWorked' },
          totalBillAmount: {
            $sum: {
              $cond: [{ $ne: ['$status', 'Rejected'] }, '$clientBillingAmount', 0],
            },
          },
        },
      },
    ]);

    const totalHours = dutiesAgg[0]?.totalHours || 0;
    const totalBillAmount = dutiesAgg[0]?.totalBillAmount || 0;

    // 3. Amount received from ClientPayment
    const paymentsAgg = await ClientPayment.aggregate([
      { $match: { client: client._id, status: 'Received' } },
      { $group: { _id: null, totalReceived: { $sum: '$amount' } } },
    ]);

    const totalReceived = paymentsAgg[0]?.totalReceived || 0;
    const remainingBalance = Math.max(0, totalBillAmount - totalReceived);

    // 4. Staff sent to this business (Distinct staff members who worked here)
    const staffSentAgg = await Duty.aggregate([
      { $match: { client: client._id } },
      {
        $group: {
          _id: '$staff',
          shiftsCompleted: { $sum: 1 },
          hoursWorked: { $sum: '$hoursWorked' },
          lastDutyDate: { $max: '$dutyDate' },
        },
      },
    ]);

    const staffIds = staffSentAgg.map((s) => s._id);
    const staffDocs = await Staff.find({ _id: { $in: staffIds } });
    const staffDocMap = {};
    staffDocs.forEach((s) => {
      staffDocMap[s._id.toString()] = s;
    });

    const staffSentList = staffSentAgg.map((item) => {
      const staffDoc = staffDocMap[item._id ? item._id.toString() : ''] || {};
      return {
        staffId: item._id,
        staffCode: staffDoc.staffCode || 'STF',
        name: staffDoc.name || 'Unassigned Staff',
        phone: staffDoc.phone || '',
        designation: staffDoc.designation || 'Staff',
        status: staffDoc.status || 'active',
        shiftsCompleted: item.shiftsCompleted,
        hoursWorked: item.hoursWorked,
        lastDutyDate: item.lastDutyDate,
      };
    });

    const totalStaffProvided = staffSentList.length;

    // 5. Recent duty records (Last 10)
    const recentDuties = await Duty.find({ client: client._id })
      .populate('staff', 'name staffCode designation phone')
      .sort({ dutyDate: -1, createdAt: -1 })
      .limit(10);

    // 6. Payment history (Last 10)
    const paymentHistory = await ClientPayment.find({ client: client._id })
      .sort({ paymentDate: -1, createdAt: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      data: client,
      stats: {
        totalDuties,
        totalWorkingHours: totalHours,
        totalStaffProvided,
        totalBillAmount,
        totalReceived,
        remainingBalance,
      },
      staffSent: staffSentList,
      recentDuties,
      paymentHistory,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all duty records for a specific business
// @route   GET /api/clients/:id/duties
// @access  Private (Admin only)
exports.getClientDutyHistory = async (req, res, next) => {
  try {
    const { status } = req.query;
    const query = { client: req.params.id };

    if (status && status !== 'all') {
      query.status = status;
    }

    const duties = await Duty.find(query)
      .populate('staff', 'name staffCode designation phone')
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

// @desc    Get staff sent to that business
// @route   GET /api/clients/:id/staff
// @access  Private (Admin only)
exports.getClientStaffSent = async (req, res, next) => {
  try {
    const staffSentAgg = await Duty.aggregate([
      { $match: { client: req.params.id } },
      {
        $group: {
          _id: '$staff',
          shiftsCompleted: { $sum: 1 },
          hoursWorked: { $sum: '$hoursWorked' },
          lastDutyDate: { $max: '$dutyDate' },
        },
      },
    ]);

    const staffIds = staffSentAgg.map((s) => s._id);
    const staffDocs = await Staff.find({ _id: { $in: staffIds } });
    const staffDocMap = {};
    staffDocs.forEach((s) => {
      staffDocMap[s._id.toString()] = s;
    });

    const staffSentList = staffSentAgg.map((item) => {
      const staffDoc = staffDocMap[item._id ? item._id.toString() : ''] || {};
      return {
        staffId: item._id,
        staffCode: staffDoc.staffCode || 'STF',
        name: staffDoc.name || 'Unassigned',
        phone: staffDoc.phone || '',
        designation: staffDoc.designation || 'Staff',
        status: staffDoc.status || 'active',
        shiftsCompleted: item.shiftsCompleted,
        hoursWorked: item.hoursWorked,
        lastDutyDate: item.lastDutyDate,
      };
    });

    res.status(200).json({
      success: true,
      count: staffSentList.length,
      data: staffSentList,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add new hotel or catering company (Admin only)
// @route   POST /api/clients
// @access  Private (Admin only)
exports.createClient = async (req, res, next) => {
  try {
    const {
      companyName,
      businessName,
      type,
      contactPerson,
      phone,
      mobileNumber,
      alternatePhone,
      email,
      address,
      city,
      gstNumber,
      defaultBillingRatePerStaff,
      creditPeriodDays,
      status,
      notes,
    } = req.body;

    const name = (companyName || businessName || '').trim();
    const contact = (contactPerson || '').trim();
    const mobile = (phone || mobileNumber || '').trim();

    if (!name || !contact || !mobile) {
      return res.status(400).json({
        success: false,
        message: 'Business Name, Contact Person, and Mobile Number are required.',
      });
    }

    const businessType = type === 'Catering' ? 'Catering Company' : type || 'Hotel';

    const client = await Client.create({
      companyName: name,
      type: businessType,
      contactPerson: contact,
      phone: mobile,
      alternatePhone: alternatePhone ? alternatePhone.trim() : '',
      email: email ? email.trim().toLowerCase() : '',
      address: address ? address.trim() : '',
      city: city ? city.trim() : 'Indore',
      gstNumber: gstNumber ? gstNumber.trim().toUpperCase() : '',
      defaultBillingRatePerStaff: defaultBillingRatePerStaff ? Number(defaultBillingRatePerStaff) : 1200,
      creditPeriodDays: creditPeriodDays ? Number(creditPeriodDays) : 15,
      status: status || 'active',
      notes: notes ? notes.trim() : '',
    });

    res.status(201).json({
      success: true,
      message: `${businessType} '${client.companyName}' registered successfully with ID: ${client.businessId}`,
      data: client,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Edit business information (Admin only)
// @route   PUT /api/clients/:id
// @access  Private (Admin only)
exports.updateClient = async (req, res, next) => {
  try {
    const client = await Client.findById(req.params.id);

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Business not found',
      });
    }

    const {
      companyName,
      businessName,
      type,
      contactPerson,
      phone,
      mobileNumber,
      alternatePhone,
      email,
      address,
      city,
      gstNumber,
      defaultBillingRatePerStaff,
      creditPeriodDays,
      status,
      notes,
    } = req.body;

    const name = companyName || businessName;
    const mobile = phone || mobileNumber;

    if (name) client.companyName = name.trim();
    if (contactPerson) client.contactPerson = contactPerson.trim();
    if (mobile) client.phone = mobile.trim();
    if (type) client.type = type === 'Catering' ? 'Catering Company' : type;
    if (alternatePhone !== undefined) client.alternatePhone = alternatePhone.trim();
    if (email !== undefined) client.email = email.trim().toLowerCase();
    if (address !== undefined) client.address = address.trim();
    if (city !== undefined) client.city = city.trim();
    if (gstNumber !== undefined) client.gstNumber = gstNumber.trim().toUpperCase();
    if (defaultBillingRatePerStaff !== undefined) {
      client.defaultBillingRatePerStaff = Number(defaultBillingRatePerStaff);
    }
    if (creditPeriodDays !== undefined) {
      client.creditPeriodDays = Number(creditPeriodDays);
    }
    if (status) client.status = status;
    if (notes !== undefined) client.notes = notes.trim();

    await client.save();

    res.status(200).json({
      success: true,
      message: 'Business information updated successfully',
      data: client,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Deactivate or Delete business (Safe audit retention)
// @route   DELETE /api/clients/:id
// @access  Private (Admin only)
exports.deleteOrDeactivateClient = async (req, res, next) => {
  try {
    const client = await Client.findById(req.params.id);

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Business not found',
      });
    }

    // Check historical duty records
    const dutyCount = await Duty.countDocuments({ client: client._id });

    // Check historical payment receipts
    const paymentCount = await ClientPayment.countDocuments({ client: client._id });

    if (dutyCount > 0 || paymentCount > 0) {
      client.status = 'inactive';
      await client.save();

      return res.status(200).json({
        success: true,
        deactivated: true,
        message: `Business '${client.companyName}' has ${dutyCount} historical duty records and ${paymentCount} payment receipts. The establishment has been deactivated instead of permanently deleted to preserve billing and tax compliance records.`,
        data: client,
      });
    }

    // If zero records, safe to delete permanently
    await Client.findByIdAndDelete(client._id);

    res.status(200).json({
      success: true,
      deleted: true,
      message: `Business '${client.companyName}' deleted permanently as no historical duty or payment records existed.`,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle business active/inactive status (Admin only)
// @route   PATCH /api/clients/:id/status
// @access  Private (Admin only)
exports.toggleClientStatus = async (req, res, next) => {
  try {
    const client = await Client.findById(req.params.id);

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Business not found',
      });
    }

    const newStatus =
      req.body.status !== undefined
        ? req.body.status
        : client.status === 'active'
        ? 'inactive'
        : 'active';

    client.status = newStatus;
    await client.save();

    res.status(200).json({
      success: true,
      message: `Business '${client.companyName}' is now ${newStatus}`,
      data: client,
    });
  } catch (error) {
    next(error);
  }
};
