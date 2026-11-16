const express = require('express');
const router = express.Router();
const {
  getStaffPayments,
  getStaffPaymentById,
  createStaffPayment,
  updateStaffPayment,
  getStaffBalance,
  getStaffLiabilitySummary,
  getClientPayments,
  getClientPaymentById,
  createClientPayment,
  getClientBills,
  getClientBillById,
  createClientBill,
  getUnbilledDutiesForClient,
  getClientPaymentReport,
} = require('../controllers/paymentController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

// ==========================================
// 1. STAFF PAYMENTS (INTERNAL WAGES)
// ==========================================
router.route('/staff-liability').get(authorize('admin'), getStaffLiabilitySummary);
router.route('/staff/balance/:staffId').get(getStaffBalance);

router
  .route('/staff')
  .get(getStaffPayments)
  .post(authorize('admin'), createStaffPayment);

router
  .route('/staff/:id')
  .get(getStaffPaymentById)
  .put(authorize('admin'), updateStaffPayment);

// ==========================================
// 2. CLIENT PAYMENTS & BILLING (HOTEL & CATERING)
// ==========================================
// Comprehensive hotel & catering billing report
router.route('/client-report').get(authorize('admin'), getClientPaymentReport);

// Client Bills (Invoices generated from completed duties)
router
  .route('/client-bills')
  .get(authorize('admin'), getClientBills)
  .post(authorize('admin'), createClientBill);

router.route('/client-bills/:id').get(authorize('admin'), getClientBillById);

// Unbilled completed duties for client
router.route('/client-unbilled-duties/:clientId').get(authorize('admin'), getUnbilledDutiesForClient);

// Client Payment Receipts (Vouchers)
router
  .route(['/clients', '/client'])
  .get(authorize('admin'), getClientPayments)
  .post(authorize('admin'), createClientPayment);

router.route('/clients/:id').get(authorize('admin'), getClientPaymentById);

module.exports = router;
