const express = require('express');
const router = express.Router();
const giftController = require('../controllers/gift.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

router.post('/', authenticate, authorize('COUPLE', 'VENDOR'), giftController.create);
router.get('/', authenticate, giftController.list);
router.get('/:id', authenticate, giftController.getById);
router.patch('/:id', authenticate, authorize('COUPLE'), giftController.update);
router.delete('/:id', authenticate, authorize('COUPLE'), giftController.remove);

module.exports = router;