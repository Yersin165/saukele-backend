const express = require('express');
const router = express.Router();
const deliveryController = require('../controllers/delivery.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

router.post('/', authenticate, authorize('ADMIN'), deliveryController.create);
router.get('/', authenticate, deliveryController.list);
router.get('/:id', authenticate, deliveryController.getById);
router.patch('/:id/status', authenticate, authorize('COURIER', 'ADMIN'), deliveryController.updateStatus);
router.delete('/:id', authenticate, authorize('ADMIN'), deliveryController.remove);

module.exports = router;