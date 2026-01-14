const express = require('express');
const router = express.Router();
const inviteCodeController = require('../controllers/inviteCodeController');
const { roleAuthMiddleware } = require('../middlewares/auth');

// 邀请码管理路由（需要管理员权限）
router.get('/', roleAuthMiddleware(['system_admin', 'admin']), inviteCodeController.getInviteCodes);
router.post('/', roleAuthMiddleware(['system_admin', 'admin']), inviteCodeController.generateInviteCodes);
router.get('/:id', roleAuthMiddleware(['system_admin', 'admin']), inviteCodeController.getInviteCodeById);
router.put('/:id', roleAuthMiddleware(['system_admin', 'admin']), inviteCodeController.updateInviteCode);
router.delete('/:id', roleAuthMiddleware(['system_admin', 'admin']), inviteCodeController.deleteInviteCode);
router.post('/:id/expire', roleAuthMiddleware(['system_admin', 'admin']), inviteCodeController.expireInviteCode);

module.exports = router;