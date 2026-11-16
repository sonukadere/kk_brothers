const express = require('express');
const router = express.Router();
const {
  getDuties,
  getDutyById,
  createDuty,
  updateDuty,
  cancelDuty,
  verifyDuty,
  getStaffDutyHistory,
  getClientDutyHistory,
} = require('../controllers/dutyController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

// Staff-wise and Client-wise history
router.route('/staff/:staffId').get(getStaffDutyHistory);
router.route('/client/:clientId').get(authorize('admin'), getClientDutyHistory);

// Core Duty routes
router.route('/').get(getDuties).post(createDuty);

router
  .route('/:id')
  .get(getDutyById)
  .put(authorize('admin'), updateDuty);

router.route('/:id/cancel').patch(authorize('admin'), cancelDuty);
router.route('/:id/verify').put(authorize('admin'), verifyDuty);

module.exports = router;
