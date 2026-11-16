const express = require('express');
const router = express.Router();
const {
  getStaffList,
  getStaffById,
  getStaffDutyHistory,
  createStaff,
  updateStaff,
  deleteOrDeactivateStaff,
  toggleStaffStatus,
} = require('../controllers/staffController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.use(authorize('admin'));

router.route('/').get(getStaffList).post(createStaff);
router.route('/:id').get(getStaffById).put(updateStaff).delete(deleteOrDeactivateStaff);
router.get('/:id/duties', getStaffDutyHistory);
router.patch('/:id/status', toggleStaffStatus);

module.exports = router;
