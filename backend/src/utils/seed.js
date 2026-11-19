require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Staff = require('../models/Staff');
const Client = require('../models/Client');
const Duty = require('../models/Duty');
const StaffPayment = require('../models/StaffPayment');
const ClientPayment = require('../models/ClientPayment');

const seedData = async () => {
  try {
    console.log('[Seed] Connecting to MongoDB...');
    await connectDB();

    console.log('[Seed] Checking existing records...');

    // 1. Admin Account
    let admin = await User.findOne({ email: 'admin@kkbrothers.com' });
    if (!admin) {
      admin = await User.create({
        name: 'KK Brothers Admin',
        email: 'admin@kkbrothers.com',
        password: 'Admin@123',
        role: 'admin',
        phone: '+91 98765 43210',
        isActive: true,
      });
      console.log('✓ Admin user created: admin@kkbrothers.com / Admin@123');
    } else {
      console.log('ℹ Admin user already exists: admin@kkbrothers.com');
    }

    // 2. Sample Clients (Hotels & Catering companies)
    const clientSamples = [
      {
        companyName: 'The Grand Imperial Hotel',
        type: 'Hotel',
        contactPerson: 'Rajesh Mehra (F&B Director)',
        phone: '+91 98201 12345',
        alternatePhone: '+91 022 2845 6789',
        email: 'fb.imperial@grandhotel.com',
        address: 'Plot 45, Marine Drive, Nariman Point',
        city: 'Indore',
        gstNumber: '27AABCT1345H1Z1',
        defaultBillingRatePerStaff: 1100,
        creditPeriodDays: 15,
        status: 'active',
        notes: 'Requires 10-15 banquet waitstaff for weekend weddings.',
      },
      {
        companyName: 'Royal Feast Catering Services',
        type: 'Catering Company',
        contactPerson: 'Sunil Verma (Operations Head)',
        phone: '+91 98334 56789',
        alternatePhone: '+91 98334 56780',
        email: 'operations@royalfeast.in',
        address: 'B-12, Industrial Estate, Andheri East',
        city: 'Indore',
        gstNumber: '27BBCDE5432J1Z3',
        defaultBillingRatePerStaff: 950,
        creditPeriodDays: 30,
        status: 'active',
        notes: 'High volume catering events. Prompt payments on 1st & 15th.',
      },
      {
        companyName: 'Golden Palms Banquet & Lawns',
        type: 'Banquet Hall',
        contactPerson: 'Vikram Singhania (Banquet Manager)',
        phone: '+91 98199 87654',
        alternatePhone: '+91 022 4123 9900',
        email: 'banquets@goldenpalms.com',
        address: 'S.V. Road, Near Infinity Mall, Malad West',
        city: 'Indore',
        gstNumber: '27CCDEF6789K1Z5',
        defaultBillingRatePerStaff: 1000,
        creditPeriodDays: 7,
        status: 'active',
        notes: 'Weekly billing cycle. Requires groomed captains & servers.',
      },
      {
        companyName: 'Sea Princess Beach Resort',
        type: 'Resort',
        contactPerson: 'Ananya Deshmukh (HR Manager)',
        phone: '+91 98711 22334',
        alternatePhone: '+91 022 6690 1200',
        email: 'hr@seaprincess.com',
        address: 'Juhu Tara Road, Juhu',
        city: 'Indore',
        gstNumber: '27DDEFG7890L1Z7',
        defaultBillingRatePerStaff: 1200,
        creditPeriodDays: 15,
        status: 'active',
        notes: 'Premium beachfront luxury resort. High grooming standards.',
      },
    ];

    const savedClients = [];
    for (const c of clientSamples) {
      let client = await Client.findOne({ companyName: c.companyName });
      if (!client) {
        client = await Client.create(c);
        console.log(`✓ Client created: ${client.companyName}`);
      }
      savedClients.push(client);
    }

    // 3. Staff User Account
    let staffUser = await User.findOne({ email: 'staff@kkbrothers.com' });
    let staffProfile = null;

    if (!staffUser) {
      staffUser = await User.create({
        name: 'Ramesh Kumar',
        email: 'staff@kkbrothers.com',
        password: 'Staff@123',
        role: 'user',
        phone: '+91 97654 32109',
        isActive: true,
      });
      console.log('✓ Staff user created: staff@kkbrothers.com / Staff@123');
    } else {
      console.log('ℹ Staff user already exists: staff@kkbrothers.com');
    }

    staffProfile = await Staff.findOne({ user: staffUser._id });
    if (!staffProfile) {
      staffProfile = await Staff.create({
        user: staffUser._id,
        name: 'Ramesh Kumar',
        phone: '+91 97654 32109',
        alternatePhone: '+91 97654 00000',
        designation: 'Captain',
        defaultDailyRate: 750,
        defaultHourlyRate: 95,
        idProofType: 'Aadhaar',
        idProofNumber: '4532 8901 2345',
        address: 'Vijay Nagar, Scheme 54, Indore',
        bankDetails: {
          accountHolderName: 'Ramesh Kumar',
          accountNumber: '50100456789123',
          ifscCode: 'HDFC0001234',
          bankName: 'HDFC Bank',
          upiId: 'ramesh.kk@upi',
        },
        status: 'active',
        joinDate: new Date('2025-06-15'),
        emergencyContact: {
          name: 'Sunita Kumar',
          relation: 'Spouse',
          phone: '+91 97654 11111',
        },
        notes: 'Reliable team captain. 5+ years experience in 5-star hotel banquet operations.',
      });
      staffUser.staffProfile = staffProfile._id;
      await staffUser.save();
      console.log('✓ Linked Staff profile created for Ramesh Kumar');
    }

    // 4. Additional Staff Members
    const additionalStaff = [
      {
        name: 'Suresh Patil',
        phone: '+91 98211 44556',
        designation: 'Waiter',
        defaultDailyRate: 600,
        defaultHourlyRate: 75,
        idProofType: 'Aadhaar',
        idProofNumber: '8877 6655 4433',
        address: 'Palasia, Indore',
        status: 'active',
        joinDate: new Date('2025-08-01'),
        bankDetails: {
          accountHolderName: 'Suresh Patil',
          accountNumber: '309988776655',
          ifscCode: 'SBIN0004321',
          bankName: 'State Bank of India',
          upiId: 'suresh.patil@okhdfcbank',
        },
      },
      {
        name: 'Mohammad Imran',
        phone: '+91 98322 77889',
        designation: 'Kitchen Helper',
        defaultDailyRate: 550,
        defaultHourlyRate: 70,
        idProofType: 'PAN Card',
        idProofNumber: 'ABCDE1234F',
        address: 'Bhanwarkuan, Indore',
        status: 'active',
        joinDate: new Date('2025-09-10'),
        bankDetails: {
          accountHolderName: 'Mohammad Imran',
          accountNumber: '918273645012',
          ifscCode: 'ICIC0000987',
          bankName: 'ICICI Bank',
          upiId: 'imran.m@paytm',
        },
      },
      {
        name: 'Deepak Sharma',
        phone: '+91 98455 12345',
        designation: 'Chef',
        defaultDailyRate: 850,
        defaultHourlyRate: 110,
        idProofType: 'Driving License',
        idProofNumber: 'MP09 20190012345',
        address: 'Rajwada, Indore',
        status: 'active',
        joinDate: new Date('2025-07-20'),
        bankDetails: {
          accountHolderName: 'Deepak Sharma',
          accountNumber: '445566778899',
          ifscCode: 'UTIB0000123',
          bankName: 'Axis Bank',
          upiId: 'deepak.bar@axl',
        },
      },
    ];

    const savedStaffList = [staffProfile];
    for (const s of additionalStaff) {
      let stf = await Staff.findOne({ phone: s.phone });
      if (!stf) {
        stf = await Staff.create(s);
        console.log(`✓ Staff created: ${stf.name} (${stf.designation})`);
      }
      savedStaffList.push(stf);
    }

    // 5. Sample Duties (linked to Ramesh Kumar and other staff)
    const dutyCount = await Duty.countDocuments();
    if (dutyCount === 0 && savedClients.length > 0) {
      const today = new Date();
      const dutiesToSeed = [
        {
          staff: staffProfile._id,
          user: staffUser._id,
          client: savedClients[0]._id,
          dutyDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 3),
          shiftType: 'Evening (2 PM - 10 PM)',
          hoursWorked: 8,
          staffWage: 750,
          clientBillingAmount: 1100,
          location: 'Grand Ballroom - Gala Wedding',
          rolePerformed: 'Captain',
          status: 'Approved',
          paymentStatus: 'Paid',
          reportedBy: 'Staff User',
          remarks: 'Managed buffet service and 8 servers successfully.',
          verifiedBy: admin._id,
          verifiedAt: new Date(),
        },
        {
          staff: staffProfile._id,
          user: staffUser._id,
          client: savedClients[1]._id,
          dutyDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 2),
          shiftType: 'Full Day (8-10 hrs)',
          hoursWorked: 10,
          staffWage: 950,
          clientBillingAmount: 1400,
          location: 'BKC Exhibition Grounds Caterers Pavilion',
          rolePerformed: 'Captain',
          status: 'Approved',
          paymentStatus: 'Paid',
          reportedBy: 'Staff User',
          remarks: 'Corporate launch catering setup and breakdown.',
          verifiedBy: admin._id,
          verifiedAt: new Date(),
        },
        {
          staff: staffProfile._id,
          user: staffUser._id,
          client: savedClients[2]._id,
          dutyDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1),
          shiftType: 'Night (10 PM - 6 AM)',
          hoursWorked: 8,
          staffWage: 800,
          clientBillingAmount: 1200,
          location: 'Poolside Lawn Banquet',
          rolePerformed: 'Captain',
          status: 'Pending',
          paymentStatus: 'Unpaid',
          reportedBy: 'Staff User',
          remarks: 'Sangeet night event duty.',
        },
        {
          staff: staffProfile._id,
          user: staffUser._id,
          client: savedClients[0]._id,
          dutyDate: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
          shiftType: 'Morning (6 AM - 2 PM)',
          hoursWorked: 8,
          staffWage: 750,
          clientBillingAmount: 1100,
          location: 'Cafe Promenade Breakfast & Brunch',
          rolePerformed: 'Captain',
          status: 'Pending',
          paymentStatus: 'Unpaid',
          reportedBy: 'Staff User',
          remarks: 'Sunday morning brunch rush.',
        },
      ];

      for (const d of dutiesToSeed) {
        await Duty.create(d);
      }
      console.log(`✓ Seeded ${dutiesToSeed.length} sample duties from MongoDB`);
    }

    // 6. Sample Staff Payment record
    const staffPayCount = await StaffPayment.countDocuments();
    if (staffPayCount === 0 && staffProfile) {
      await StaffPayment.create({
        staff: staffProfile._id,
        user: staffUser._id,
        amount: 1700,
        paymentDate: new Date(),
        paymentMode: 'UPI',
        transactionReference: 'UPI/2026/02938172930',
        status: 'Completed',
        notes: 'Payment for Grand Imperial & Royal Feast completed shifts',
        recordedBy: admin._id,
      });
      console.log('✓ Seeded sample staff payment record');
    }

    // 7. Sample Client Payment record
    const clientPayCount = await ClientPayment.countDocuments();
    if (clientPayCount === 0 && savedClients.length > 0) {
      await ClientPayment.create({
        client: savedClients[0]._id,
        amount: 25000,
        paymentDate: new Date(),
        paymentMode: 'NEFT / RTGS',
        invoiceNumber: 'INV-2026-0042',
        transactionReference: 'NEFT/HDFC/9871625430',
        status: 'Received',
        notes: 'Advance & settlement for January banquet staff supply',
        recordedBy: admin._id,
      });
      console.log('✓ Seeded sample client payment record');
    }

    console.log('\n===========================================');
    console.log('  SEEDING COMPLETED SUCCESSFULLY!');
    console.log('===========================================');
    console.log('Admin Account: admin@kkbrothers.com / Admin@123');
    console.log('User Account : staff@kkbrothers.com / Staff@123');
    console.log('===========================================\n');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('[Seed Error]:', error);
    process.exit(1);
  }
};

seedData();
