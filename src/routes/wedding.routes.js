const express = require('express');
const router = express.Router();
const weddingController = require('../controllers/wedding.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

router.post('/', authenticate, authorize('COUPLE'), weddingController.create);
router.get('/:id', authenticate, weddingController.getById);
router.patch('/:id', authenticate, authorize('COUPLE'), weddingController.update);
router.delete('/:id', authenticate, authorize('COUPLE'), weddingController.deactivate);
router.get('/invite/:inviteCode', weddingController.getByInviteCode);

module.exports = router;