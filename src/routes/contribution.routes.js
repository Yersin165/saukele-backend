const express = require('express');
const router = express.Router();
const contributionController = require('../controllers/contribution.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

router.post('/', authenticate, authorize('GUEST'), contributionController.create);
router.get('/', authenticate, contributionController.list);
router.get('/:id', authenticate, contributionController.getById);
router.patch('/:id/status', authenticate, authorize('ADMIN'), contributionController.updateStatus);

module.exports = router;