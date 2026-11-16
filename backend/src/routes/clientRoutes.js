const express = require('express');
const router = express.Router();
const {
  getClientsList,
  getClientById,
  getClientDutyHistory,
  getClientStaffSent,
  createClient,
  updateClient,
  deleteOrDeactivateClient,
  toggleClientStatus,
} = require('../controllers/clientController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

// Admin can create; all authenticated users can list (for duty submission dropdowns)
router.route('/').get(getClientsList).post(authorize('admin'), createClient);

// Admin-only management endpoints
router
  .route('/:id')
  .get(authorize('admin'), getClientById)
  .put(authorize('admin'), updateClient)
  .delete(authorize('admin'), deleteOrDeactivateClient);

router.get('/:id/duties', authorize('admin'), getClientDutyHistory);
router.get('/:id/staff', authorize('admin'), getClientStaffSent);
router.patch('/:id/status', authorize('admin'), toggleClientStatus);

module.exports = router;
