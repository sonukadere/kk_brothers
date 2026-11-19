require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Staff = require('../models/Staff');
const Client = require('../models/Client');
const Duty = require('../models/Duty');
const StaffPayment = require('../models/StaffPayment');
const ClientPayment = require('../models/ClientPayment');
const ClientBill = require('../models/ClientBill');

const clearAllDemoData = async () => {
  try {
    console.log('====================================================');
    console.log('   KK BROTHERS: ERASING ALL DEMO / TEST DATA        ');
    console.log('====================================================');

    await connectDB();

    console.log('[1/7] Deleting all Duty records...');
    const dutiesDeleted = await Duty.deleteMany({});
    console.log(`      ✓ Removed ${dutiesDeleted.deletedCount} duty records.`);

    console.log('[2/7] Deleting all Staff Payment vouchers...');
    const staffPayDeleted = await StaffPayment.deleteMany({});
    console.log(`      ✓ Removed ${staffPayDeleted.deletedCount} staff payment vouchers.`);

    console.log('[3/7] Deleting all Client Payment receipts...');
    const clientPayDeleted = await ClientPayment.deleteMany({});
    console.log(`      ✓ Removed ${clientPayDeleted.deletedCount} client payment receipts.`);

    console.log('[4/7] Deleting all Client Bills & Invoices...');
    const clientBillsDeleted = await ClientBill.deleteMany({});
    console.log(`      ✓ Removed ${clientBillsDeleted.deletedCount} client invoices.`);

    console.log('[5/7] Deleting all Staff profiles...');
    const staffDeleted = await Staff.deleteMany({});
    console.log(`      ✓ Removed ${staffDeleted.deletedCount} staff profiles.`);

    console.log('[6/7] Deleting all Hotel & Catering Client records...');
    const clientsDeleted = await Client.deleteMany({});
    console.log(`      ✓ Removed ${clientsDeleted.deletedCount} client businesses.`);

    console.log('[7/7] Cleaning Users collection (retaining Admin)...');
    const usersDeleted = await User.deleteMany({ role: { $ne: 'admin' } });
    console.log(`      ✓ Removed ${usersDeleted.deletedCount} non-admin user accounts.`);

    // Ensure Admin account exists and is clean
    let admin = await User.findOne({ email: 'admin@kkbrothers.com' });
    if (!admin) {
      admin = await User.create({
        name: 'KK Brothers Admin',
        email: 'admin@kkbrothers.com',
        password: 'Admin@123',
        role: 'admin',
        phone: '+91 98765 43210',
        isActive: true,
        staffProfile: null,
      });
      console.log('      ✓ Fresh Admin account created: admin@kkbrothers.com / Admin@123');
    } else {
      admin.staffProfile = null;
      admin.isActive = true;
      await admin.save();
      console.log('      ✓ Admin account retained & reset: admin@kkbrothers.com (Active)');
    }

    console.log('----------------------------------------------------');
    console.log('VERIFYING CLEAN DATABASE STATE:');
    const countStaff = await Staff.countDocuments();
    const countClients = await Client.countDocuments();
    const countDuties = await Duty.countDocuments();
    const countStaffPay = await StaffPayment.countDocuments();
    const countClientPay = await ClientPayment.countDocuments();
    const countClientBills = await ClientBill.countDocuments();
    const countUsers = await User.countDocuments();

    console.log(` - Staff Members:          ${countStaff}`);
    console.log(` - Hotels & Caterers:      ${countClients}`);
    console.log(` - Duty Shifts:            ${countDuties}`);
    console.log(` - Staff Payments:         ${countStaffPay}`);
    console.log(` - Client Payments:        ${countClientPay}`);
    console.log(` - Client Bills:           ${countClientBills}`);
    console.log(` - Users (Admin Only):     ${countUsers}`);
    console.log('====================================================');
    console.log(' SUCCESS: All demo data erased! Database is clean.  ');
    console.log('====================================================');

    process.exit(0);
  } catch (error) {
    console.error('Error erasing demo data:', error);
    process.exit(1);
  }
};

clearAllDemoData();
