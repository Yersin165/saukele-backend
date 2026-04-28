const express = require('express');
const router = express.Router();
const vendorController = require('../controllers/vendor.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

router.post('/', authenticate, authorize('VENDOR'), vendorController.create);
router.get('/', authenticate, vendorController.list);
router.get('/:id', authenticate, vendorController.getById);
router.patch('/:id', authenticate, authorize('VENDOR'), vendorController.update);
router.delete('/:id', authenticate, authorize('ADMIN'), vendorController.remove);

module.exports = router;