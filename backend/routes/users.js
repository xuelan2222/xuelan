const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const userController = require('../controllers/userController');
const authMiddleware = require('../middlewares/auth');
const { roleAuthMiddleware } = require('../middlewares/auth');

// 公开路由
router.post('/login', authController.login);
router.post('/register', authController.register);
router.post('/validate-invite-code', authController.validateInviteCode);

// 需要认证的路由
router.use(authMiddleware);

// 获取当前用户信息
router.get('/me', userController.getCurrentUser);

// 用户管理路由（需要管理员权限）
router.get('/', roleAuthMiddleware(['system_admin', 'admin']), userController.getUsers);
router.get('/:id', roleAuthMiddleware(['system_admin', 'admin']), userController.getUserById);
router.post('/', roleAuthMiddleware(['system_admin', 'admin']), userController.createUser);
router.put('/:id', roleAuthMiddleware(['system_admin', 'admin']), userController.updateUser);
router.delete('/:id', roleAuthMiddleware(['system_admin']), userController.deleteUser);

module.exports = router;