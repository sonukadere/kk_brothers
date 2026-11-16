const express = require('express');
const router = express.Router();
const {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  toggleUserStatus,
  resetUserPassword,
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

// All user management routes require valid JWT AND 'admin' role
router.use(protect);
router.use(authorize('admin'));

router.route('/').get(getUsers).post(createUser);
router.route('/:id').get(getUserById).put(updateUser);
router.patch('/:id/status', toggleUserStatus);
router.patch('/:id/reset-password', resetUserPassword);

module.exports = router;
