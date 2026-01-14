const express = require('express');
const router = express.Router();
const regionController = require('../controllers/regionController');
const { roleAuthMiddleware } = require('../middlewares/auth');

// 区域管理路由（需要系统管理员权限）
router.get('/', roleAuthMiddleware(['system_admin', 'admin']), regionController.getRegions);
router.get('/:id', roleAuthMiddleware(['system_admin', 'admin']), regionController.getRegionById);
router.post('/', roleAuthMiddleware(['system_admin']), regionController.createRegion);
router.put('/:id', roleAuthMiddleware(['system_admin']), regionController.updateRegion);
router.delete('/:id', roleAuthMiddleware(['system_admin']), regionController.deleteRegion);

module.exports = router;