const joi = require('joi');
const bcrypt = require('bcrypt');
const db = require('../models/index');
const logger = require('../config/logger');

// 获取当前用户信息
const getCurrentUser = async (req, res) => {
  try {
    const user = req.user;
    
    // 记录操作日志
    await db.OperationLog.create({
      user_id: user.id,
      operation: 'getCurrentUser',
      resource_id: user.id,
      resource_type: 'user',
      ip_address: req.ip,
      description: '获取当前用户信息'
    });
    
    res.status(200).json({
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        region_id: user.region_id,
        region_name: user.region.name,
        email: user.email,
        phone: user.phone,
        status: user.status,
        created_at: user.created_at,
        updated_at: user.updated_at
      }
    });
  } catch (error) {
    logger.error('获取当前用户信息错误:', error);
    res.status(500).json({ message: '获取当前用户信息失败' });
  }
};

// 获取用户列表
const getUsers = async (req, res) => {
  try {
    const user = req.user;
    const { page = 1, pageSize = 10, role, status, region_id, keyword } = req.query;
    
    // 构建查询条件
    const whereClause = {};
    
    // 管理员只能查看同区域用户
    if (user.role === 'admin') {
      whereClause.region_id = user.region_id;
      // 管理员不能查看系统管理员
      whereClause.role = { [db.Sequelize.Op.ne]: 'system_admin' };
    }
    
    // 筛选条件
    if (role) {
      whereClause.role = role;
    }
    
    if (status) {
      whereClause.status = status;
    }
    
    if (region_id) {
      whereClause.region_id = region_id;
    }
    
    if (keyword) {
      whereClause[db.Sequelize.Op.or] = [
        { username: { [db.Sequelize.Op.like]: `%${keyword}%` } },
        { email: { [db.Sequelize.Op.like]: `%${keyword}%` } },
        { phone: { [db.Sequelize.Op.like]: `%${keyword}%` } }
      ];
    }
    
    // 查询用户列表
    const { count, rows } = await db.User.findAndCountAll({
      where: whereClause,
      include: ['region'],
      limit: parseInt(pageSize),
      offset: (parseInt(page) - 1) * parseInt(pageSize),
      order: [['created_at', 'DESC']]
    });
    
    // 转换响应数据
    const users = rows.map(user => ({
      id: user.id,
      username: user.username,
      role: user.role,
      region_id: user.region_id,
      region_name: user.region.name,
      email: user.email,
      phone: user.phone,
      status: user.status,
      created_at: user.created_at,
      updated_at: user.updated_at
    }));
    
    // 记录操作日志
    await db.OperationLog.create({
      user_id: user.id,
      operation: 'getUsers',
      resource_type: 'user',
      ip_address: req.ip,
      description: `获取用户列表，页码：${page}，每页数量：${pageSize}`
    });
    
    res.status(200).json({
      total: count,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      users
    });
  } catch (error) {
    logger.error('获取用户列表错误:', error);
    res.status(500).json({ message: '获取用户列表失败' });
  }
};

// 根据ID获取用户
const getUserById = async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;
    
    // 查询用户
    const targetUser = await db.User.findByPk(id, {
      include: ['region']
    });
    
    if (!targetUser) {
      return res.status(404).json({ message: '用户不存在' });
    }
    
    // 记录操作日志
    await db.OperationLog.create({
      user_id: user.id,
      operation: 'getUserById',
      resource_id: id,
      resource_type: 'user',
      ip_address: req.ip,
      description: `获取用户信息，用户ID：${id}`
    });
    
    res.status(200).json({
      user: {
        id: targetUser.id,
        username: targetUser.username,
        role: targetUser.role,
        region_id: targetUser.region_id,
        region_name: targetUser.region.name,
        email: targetUser.email,
        phone: targetUser.phone,
        status: targetUser.status,
        created_at: targetUser.created_at,
        updated_at: targetUser.updated_at
      }
    });
  } catch (error) {
    logger.error('获取用户信息错误:', error);
    res.status(500).json({ message: '获取用户信息失败' });
  }
};

// 创建用户
const createUser = async (req, res) => {
  try {
    // 验证请求数据
    const { error } = validateUser(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
    
    const user = req.user;
    const { username, password, role, region_id, status, email, phone, invite_code_id } = req.body;
    
    // 检查用户名是否已存在
    const existingUser = await db.User.findOne({
      where: { username }
    });
    
    if (existingUser) {
      return res.status(400).json({ message: '用户名已存在' });
    }
    
    // 管理员只能创建同区域用户
    if (user.role === 'admin' && region_id !== user.region_id) {
      return res.status(403).json({ message: '只能创建所属区域的用户' });
    }
    
    // 管理员不能创建系统管理员
    if (user.role === 'admin' && role === 'system_admin') {
      return res.status(403).json({ message: '无权创建系统管理员' });
    }
    
    // 密码加密
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // 创建用户
    const newUser = await db.User.create({
      username,
      password: hashedPassword,
      role,
      region_id,
      status,
      email,
      phone,
      invite_code_id
    });
    
    // 记录操作日志
    await db.OperationLog.create({
      user_id: user.id,
      operation: 'createUser',
      resource_id: newUser.id,
      resource_type: 'user',
      ip_address: req.ip,
      description: `创建用户，用户ID：${newUser.id}，用户名：${username}`
    });
    
    res.status(201).json({
      message: '用户创建成功',
      user: {
        id: newUser.id,
        username: newUser.username,
        role: newUser.role,
        region_id: newUser.region_id,
        status: newUser.status,
        email: newUser.email,
        phone: newUser.phone,
        created_at: newUser.created_at
      }
    });
  } catch (error) {
    logger.error('创建用户错误:', error);
    res.status(500).json({ message: '创建用户失败' });
  }
};

// 更新用户
const updateUser = async (req, res) => {
  try {
    // 验证请求数据
    const { error } = validateUpdateUser(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
    
    const user = req.user;
    const { id } = req.params;
    const { password, role, region_id, status, email, phone } = req.body;
    
    // 查询用户
    const targetUser = await db.User.findByPk(id);
    
    if (!targetUser) {
      return res.status(404).json({ message: '用户不存在' });
    }
    
    // 管理员不能修改系统管理员
    if (user.role === 'admin' && targetUser.role === 'system_admin') {
      return res.status(403).json({ message: '无权修改系统管理员' });
    }
    
    // 管理员不能将用户升级为系统管理员
    if (user.role === 'admin' && role === 'system_admin') {
      return res.status(403).json({ message: '无权将用户升级为系统管理员' });
    }
    
    // 管理员只能修改同区域用户
    if (user.role === 'admin' && targetUser.region_id !== user.region_id) {
      return res.status(403).json({ message: '只能修改所属区域的用户' });
    }
    
    // 准备更新数据
    const updateData = {};
    
    if (password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(password, salt);
    }
    
    if (role) updateData.role = role;
    if (region_id) updateData.region_id = region_id;
    if (status) updateData.status = status;
    if (email) updateData.email = email;
    if (phone) updateData.phone = phone;
    
    // 更新用户
    await targetUser.update(updateData);
    
    // 记录操作日志
    await db.OperationLog.create({
      user_id: user.id,
      operation: 'updateUser',
      resource_id: id,
      resource_type: 'user',
      ip_address: req.ip,
      description: `更新用户信息，用户ID：${id}`
    });
    
    res.status(200).json({
      message: '用户更新成功',
      user: {
        id: targetUser.id,
        username: targetUser.username,
        role: targetUser.role,
        region_id: targetUser.region_id,
        status: targetUser.status,
        email: targetUser.email,
        phone: targetUser.phone,
        updated_at: targetUser.updated_at
      }
    });
  } catch (error) {
    logger.error('更新用户错误:', error);
    res.status(500).json({ message: '更新用户失败' });
  }
};

// 删除用户
const deleteUser = async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;
    
    // 查询用户
    const targetUser = await db.User.findByPk(id);
    
    if (!targetUser) {
      return res.status(404).json({ message: '用户不存在' });
    }
    
    // 不能删除当前登录用户
    if (parseInt(id) === user.id) {
      return res.status(400).json({ message: '不能删除当前登录用户' });
    }
    
    // 删除用户
    await targetUser.destroy();
    
    // 记录操作日志
    await db.OperationLog.create({
      user_id: user.id,
      operation: 'deleteUser',
      resource_id: id,
      resource_type: 'user',
      ip_address: req.ip,
      description: `删除用户，用户ID：${id}`
    });
    
    res.status(200).json({ message: '用户删除成功' });
  } catch (error) {
    logger.error('删除用户错误:', error);
    res.status(500).json({ message: '删除用户失败' });
  }
};

// 验证用户数据
const validateUser = (data) => {
  const schema = joi.object({
    username: joi.string().required().min(3).max(50),
    password: joi.string().required().min(6).max(255),
    role: joi.string().valid('system_admin', 'admin', 'user').required(),
    region_id: joi.number().required().integer().positive(),
    status: joi.string().valid('active', 'inactive').required(),
    email: joi.string().email().optional().max(100),
    phone: joi.string().pattern(/^1[3-9]\d{9}$/).optional(),
    invite_code_id: joi.number().optional().integer().positive()
  });
  
  return schema.validate(data);
};

// 验证更新用户数据
const validateUpdateUser = (data) => {
  const schema = joi.object({
    password: joi.string().optional().min(6).max(255),
    role: joi.string().valid('system_admin', 'admin', 'user').optional(),
    region_id: joi.number().optional().integer().positive(),
    status: joi.string().valid('active', 'inactive').optional(),
    email: joi.string().email().optional().max(100),
    phone: joi.string().pattern(/^1[3-9]\d{9}$/).optional()
  });
  
  return schema.validate(data);
};

module.exports = {
  getCurrentUser,
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
};