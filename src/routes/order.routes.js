const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

router.post('/', authenticate, authorize('GUEST'), orderController.create);
router.get('/', authenticate, orderController.list);
router.get('/:id', authenticate, orderController.getById);
router.patch('/:id/status', authenticate, authorize('VENDOR', 'ADMIN'), orderController.updateStatus);
router.delete('/:id', authenticate, authorize('ADMIN'), orderController.remove);

module.exports = router;