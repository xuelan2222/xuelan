const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { roleAuthMiddleware } = require('../middlewares/auth');

// 产品管理路由
router.get('/', productController.getProducts);
router.get('/:id', productController.getProductById);
router.post('/', roleAuthMiddleware(['system_admin', 'admin']), productController.createProduct);
router.put('/:id', roleAuthMiddleware(['system_admin', 'admin']), productController.updateProduct);
router.delete('/:id', roleAuthMiddleware(['system_admin', 'admin']), productController.deleteProduct);
router.get('/search/first-letter', productController.searchByFirstLetter);
router.patch('/:id/status', roleAuthMiddleware(['system_admin', 'admin']), productController.updateProductStatus);
router.get('/:id/related', productController.getRelatedProducts);

module.exports = router;