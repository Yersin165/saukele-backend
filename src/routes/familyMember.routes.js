const express = require('express');
const router = express.Router();
const familyMemberController = require('../controllers/familyMember.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

router.post('/', authenticate, authorize('COUPLE'), familyMemberController.create);
router.get('/', authenticate, familyMemberController.list);
router.get('/tree', authenticate, familyMemberController.getTree);
router.patch('/:id', authenticate, authorize('COUPLE'), familyMemberController.update);
router.delete('/:id', authenticate, authorize('COUPLE'), familyMemberController.remove);

module.exports = router;