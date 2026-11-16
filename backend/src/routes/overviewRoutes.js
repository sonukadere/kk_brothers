const express = require('express');
const router = express.Router();
const { getAdminOverview, getUserOverview } = require('../controllers/overviewController');
const { protect, authorize } = require('../middleware/auth');

router.get('/admin', protect, authorize('admin'), getAdminOverview);
router.get('/user', protect, authorize('user'), getUserOverview);

module.exports = router;
