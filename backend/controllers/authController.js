const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const joi = require('joi');
const dotenv = require('dotenv');
const db = require('../models');
const logger = require('../config/logger');

dotenv.config();

// 登录验证
const login = async (req, res) => {
  try {
    logger.info('收到登录请求', {
      ip: req.ip,
      username: req.body.username,
      userAgent: req.headers['user-agent'],
      timestamp: new Date().toISOString()
    });
    
    // 验证请求数据
    const { error } = validateLogin(req.body);
    if (error) {
      logger.warn('登录请求参数错误', {
        username: req.body.username,
        error: error.details[0].message
      });
      return res.status(400).json({ message: error.details[0].message });
    }
    
    const { username, password } = req.body;
    logger.info('登录参数验证通过', { username });
    
    // 查找用户
    logger.info('开始查找用户', { username });
    const user = await db.User.findOne({
      where: { username },
      include: ['region']
    });
    
    if (!user) {
      logger.warn('用户不存在', { username });
      return res.status(401).json({ message: '用户名或密码错误' });
    }
    
    logger.info('找到用户', {
      userId: user.id,
      username: user.username,
      role: user.role,
      regionId: user.region_id
    });
    
    // 验证密码
    logger.info('开始验证密码', { userId: user.id });
    const validPassword = await user.validPassword(password);
    if (!validPassword) {
      logger.warn('密码验证失败', { userId: user.id });
      return res.status(401).json({ message: '用户名或密码错误' });
    }
    
    logger.info('密码验证成功', { userId: user.id });
    
    // 检查用户状态
    if (user.status === 'inactive') {
      logger.warn('用户已被禁用', { userId: user.id });
      return res.status(401).json({ message: '用户已被禁用' });
    }
    
    logger.info('用户状态正常', { userId: user.id, status: user.status });
    
    // 生成JWT令牌
    logger.info('开始生成JWT令牌', { userId: user.id });
    const token = generateToken(user);
    logger.info('JWT令牌生成成功', { userId: user.id, tokenLength: token.length });
    
    // 记录登录日志
    logger.info('开始记录登录日志', { userId: user.id });
    await db.OperationLog.create({
      user_id: user.id,
      operation: 'login',
      resource_id: user.id,
      resource_type: 'user',
      ip_address: req.ip,
      description: '用户登录成功'
    });
    logger.info('登录日志记录成功', { userId: user.id });
    
    const responseData = {
      message: '登录成功',
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        region_id: user.region_id,
        region_name: user.region.name,
        email: user.email,
        phone: user.phone,
        status: user.status
      }
    };
    
    logger.info('登录成功，返回响应', {
      userId: user.id,
      responseLength: JSON.stringify(responseData).length
    });
    
    res.status(200).json(responseData);
  } catch (error) {
    logger.error('登录错误:', {
      username: req.body?.username,
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({ message: '登录失败' });
  }
};

// 注册验证
const register = async (req, res) => {
  try {
    // 验证请求数据
    const { error } = validateRegister(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
    
    const { username, password, invite_code, region_id } = req.body;
    
    // 验证邀请码
    const inviteCode = await db.InviteCode.findOne({
      where: {
        code: invite_code,
        status: 'unused'
      }
    });
    
    if (!inviteCode) {
      return res.status(400).json({ message: '邀请码无效或已过期' });
    }
    
    // 检查用户名是否已存在
    const existingUser = await db.User.findOne({
      where: { username }
    });
    
    if (existingUser) {
      return res.status(400).json({ message: '用户名已存在' });
    }
    
    // 密码加密
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // 创建用户
    const user = await db.User.create({
      username,
      password: hashedPassword,
      role: 'user',
      region_id,
      status: 'active',
      invite_code_id: inviteCode.id
    });
    
    // 更新邀请码状态
    await inviteCode.update({
      status: 'used',
      used_by: user.id
    });
    
    // 生成JWT令牌
    const token = generateToken(user);
    
    // 记录注册日志
    await db.OperationLog.create({
      user_id: user.id,
      operation: 'register',
      resource_id: user.id,
      resource_type: 'user',
      ip_address: req.ip,
      description: '用户注册成功'
    });
    
    res.status(201).json({
      message: '注册成功',
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        region_id: user.region_id,
        status: user.status
      }
    });
  } catch (error) {
    logger.error('注册错误:', error);
    res.status(500).json({ message: '注册失败' });
  }
};

// 验证邀请码
const validateInviteCode = async (req, res) => {
  try {
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({ message: '邀请码不能为空' });
    }
    
    const inviteCode = await db.InviteCode.findOne({
      where: {
        code,
        status: 'unused'
      },
      include: ['creator']
    });
    
    if (!inviteCode) {
      return res.status(400).json({ message: '邀请码无效或已过期' });
    }
    
    // 检查邀请码是否过期
    if (inviteCode.expire_time && new Date(inviteCode.expire_time) < new Date()) {
      await inviteCode.update({
        status: 'expired'
      });
      return res.status(400).json({ message: '邀请码已过期' });
    }
    
    res.status(200).json({
      message: '邀请码有效',
      invite_code: {
        id: inviteCode.id,
        code: inviteCode.code,
        created_by: inviteCode.creator.username,
        created_at: inviteCode.created_at,
        expire_time: inviteCode.expire_time
      }
    });
  } catch (error) {
    logger.error('邀请码验证错误:', error);
    res.status(500).json({ message: '邀请码验证失败' });
  }
};

/**
 * 生成 JWT 令牌
 * @param {Object} user - 用户对象（sequelize model 或 简单对象）
 * @property {number} user.id
 * @property {string} user.username
 * @property {string} user.role
 * @property {number} user.region_id
 * @returns {string} JWT
 */
const generateToken = (user) => {
  const payload = {
    id: user.id,
    username: user.username,
    role: user.role,
    region_id: user.region_id
  };
  
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  });
};

// 验证登录数据
const validateLogin = (data) => {
  const schema = joi.object({
    username: joi.string().required().min(3).max(50),
    password: joi.string().required().min(6).max(255)
  });
  
  return schema.validate(data);
};

// 验证注册数据
const validateRegister = (data) => {
  const schema = joi.object({
    username: joi.string().required().min(3).max(50),
    password: joi.string().required().min(6).max(255),
    invite_code: joi.string().required().min(6).max(20),
    region_id: joi.number().required().integer().positive()
  });
  
  return schema.validate(data);
};

module.exports = {
  login,
  register,
  validateInviteCode,
  // 导出以便测试使用
  generateToken
};