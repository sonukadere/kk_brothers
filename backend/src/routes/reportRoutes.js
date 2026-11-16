const express = require('express');
const router = express.Router();
const {
  getStaffDutyReport,
  getHotelDutyReport,
  getCateringDutyReport,
  getDateWiseDutyReport,
  getStaffPaymentReport,
  getClientPaymentReport,
  getPendingPaymentReport,
  getMonthlyBusinessReport,
} = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/auth');

// All reports are strictly Admin only
router.use(protect);
router.use(authorize('admin'));

router.get('/staff-duties', getStaffDutyReport);
router.get('/hotel-duties', getHotelDutyReport);
router.get('/catering-duties', getCateringDutyReport);
router.get('/date-duties', getDateWiseDutyReport);
router.get('/staff-payments', getStaffPaymentReport);
router.get('/client-payments', getClientPaymentReport);
router.get('/pending-payments', getPendingPaymentReport);
router.get('/monthly-business', getMonthlyBusinessReport);

module.exports = router;
