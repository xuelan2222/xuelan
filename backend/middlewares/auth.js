const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const db = require('../models/index');
const logger = require('../config/logger');

dotenv.config();

const authMiddleware = async (req, res, next) => {
  try {
    // 获取Authorization头
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ message: '未提供认证令牌' });
    }
    
    // 提取JWT令牌
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: '认证令牌格式无效' });
    }
    
    // 验证JWT令牌
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 查找用户
    const user = await db.User.findByPk(decoded.id, {
      include: ['region']
    });
    
    if (!user) {
      return res.status(401).json({ message: '用户不存在' });
    }
    
    // 检查用户状态
    if (user.status === 'inactive') {
      return res.status(401).json({ message: '用户已被禁用' });
    }
    
    // 将用户信息添加到请求对象
    req.user = user;
    
    next();
  } catch (error) {
    logger.error('认证错误:', error);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: '认证令牌已过期' });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: '认证令牌无效' });
    } else {
      return res.status(500).json({ message: '认证失败' });
    }
  }
};

// 角色验证中间件
const roleAuthMiddleware = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: '权限不足' });
    }
    next();
  };
};

module.exports = authMiddleware;
module.exports.roleAuthMiddleware = roleAuthMiddleware;