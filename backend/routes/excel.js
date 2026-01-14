const express = require('express');
const router = express.Router();
const excelController = require('../controllers/excelController');
const { roleAuthMiddleware } = require('../middlewares/auth');

// Excel导入导出路由（需要管理员权限）
router.get('/template/products', roleAuthMiddleware(['system_admin', 'admin']), excelController.downloadProductTemplate);
router.post('/import/products', roleAuthMiddleware(['system_admin', 'admin']), excelController.importProducts);
router.get('/export/products', roleAuthMiddleware(['system_admin', 'admin']), excelController.exportProducts);

module.exports = router;