const db = require('../models/index');
const logger = require('../config/logger');

const regionAuthMiddleware = async (req, res, next) => {
  try {
    const user = req.user;
    const { id } = req.params;
    
    // 系统管理员直接通过
    if (user.role === 'system_admin') {
      return next();
    }
    
    // 获取资源类型
    const pathSegments = req.path.split('/');
    const resourceType = pathSegments[2]; // 例如: /api/products/:id 中的 'products'
    
    if (!resourceType) {
      return next();
    }
    
    switch (resourceType) {
      case 'products':
        await validateProductAccess(user, id, res, next);
        break;
      case 'users':
        await validateUserAccess(user, id, res, next);
        break;
      case 'regions':
        // 只有系统管理员可以管理区域
        return res.status(403).json({ message: '只有系统管理员可以管理区域' });
      default:
        // 对于其他资源类型，普通用户只能访问同区域资源
        // 管理员可以访问同区域资源
        next();
    }
  } catch (error) {
    logger.error('区域权限验证错误:', error);
    res.status(500).json({ message: '区域权限验证失败' });
  }
};

// 验证产品访问权限
const validateProductAccess = async (user, productId, res, next) => {
  if (!productId) {
    // 没有产品ID，可能是列表请求，继续处理
    return next();
  }
  
  const product = await db.Product.findByPk(productId);
  
  if (!product) {
    return res.status(404).json({ message: '产品不存在' });
  }
  
  if (user.role === 'admin') {
    // 管理员只能访问自己创建的同区域产品
    if (product.admin_id !== user.id || product.region_id !== user.region_id) {
      return res.status(403).json({ message: '无权限访问该产品' });
    }
  } else {
    // 普通用户只能访问同区域产品
    if (product.region_id !== user.region_id) {
      return res.status(403).json({ message: '无权限访问该产品' });
    }
  }
  
  next();
};

// 验证用户访问权限
const validateUserAccess = async (user, userId, res, next) => {
  if (!userId) {
    // 没有用户ID，可能是列表请求，继续处理
    return next();
  }
  
  const targetUser = await db.User.findByPk(userId);
  
  if (!targetUser) {
    return res.status(404).json({ message: '用户不存在' });
  }
  
  if (user.role === 'admin') {
    // 管理员只能访问同区域用户
    if (targetUser.region_id !== user.region_id) {
      return res.status(403).json({ message: '无权限访问该用户' });
    }
    
    // 管理员不能访问系统管理员
    if (targetUser.role === 'system_admin') {
      return res.status(403).json({ message: '无权限访问该用户' });
    }
    
    // 管理员不能修改其他管理员
    if (targetUser.role === 'admin' && targetUser.id !== user.id) {
      return res.status(403).json({ message: '无权限修改其他管理员' });
    }
  } else {
    // 普通用户只能访问自己
    if (targetUser.id !== user.id) {
      return res.status(403).json({ message: '无权限访问其他用户' });
    }
  }
  
  next();
};

module.exports = regionAuthMiddleware;