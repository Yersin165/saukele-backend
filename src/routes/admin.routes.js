const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

router.patch('/vendors/:id/approve', authenticate, authorize('ADMIN'), adminController.approveVendor);
router.patch('/vendors/:id/suspend', authenticate, authorize('ADMIN'), adminController.suspendVendor);
router.get('/users', authenticate, authorize('ADMIN'), adminController.listUsers);
router.patch('/users/:id/ban', authenticate, authorize('ADMIN'), adminController.banUser);

module.exports = router;