const joi = require('joi');
const crypto = require('crypto');
const db = require('../models/index');
const logger = require('../config/logger');

// 生成邀请码
const generateInviteCodes = async (req, res) => {
  try {
    // 验证请求数据
    const { error } = validateGenerateInviteCodes(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
    
    const user = req.user;
    const { count = 1, expire_time } = req.body;
    
    // 生成多个邀请码
    const inviteCodes = [];
    for (let i = 0; i < count; i++) {
      const code = generateRandomCode();
      
      inviteCodes.push({
        code,
        status: 'unused',
        created_by: user.id,
        expire_time: expire_time ? new Date(expire_time) : null
      });
    }
    
    // 批量创建邀请码
    const createdInviteCodes = await db.InviteCode.bulkCreate(inviteCodes);
    
    // 记录操作日志
    await db.OperationLog.create({
      user_id: user.id,
      operation: 'generateInviteCodes',
      resource_type: 'invite_code',
      ip_address: req.ip,
      description: `生成邀请码，数量：${count}`
    });
    
    res.status(201).json({
      message: '邀请码生成成功',
      invite_codes: createdInviteCodes
    });
  } catch (error) {
    logger.error('生成邀请码错误:', error);
    res.status(500).json({ message: '生成邀请码失败' });
  }
};

// 获取邀请码列表
const getInviteCodes = async (req, res) => {
  try {
    const user = req.user;
    const { page = 1, pageSize = 10, status, keyword } = req.query;
    
    // 构建查询条件
    const whereClause = {};
    
    // 管理员只能查看自己创建的邀请码
    if (user.role === 'admin') {
      whereClause.created_by = user.id;
    }
    
    // 状态筛选
    if (status) {
      whereClause.status = status;
    }
    
    // 关键词搜索
    if (keyword) {
      whereClause.code = { [db.Sequelize.Op.like]: `%${keyword}%` };
    }
    
    // 查询邀请码列表
    const { count, rows } = await db.InviteCode.findAndCountAll({
      where: whereClause,
      include: [
        { model: db.User, as: 'creator', attributes: ['id', 'username'] },
        { model: db.User, as: 'user', attributes: ['id', 'username'] }
      ],
      limit: parseInt(pageSize),
      offset: (parseInt(page) - 1) * parseInt(pageSize),
      order: [['created_at', 'DESC']]
    });
    
    // 记录操作日志
    await db.OperationLog.create({
      user_id: user.id,
      operation: 'getInviteCodes',
      resource_type: 'invite_code',
      ip_address: req.ip,
      description: `获取邀请码列表，页码：${page}，每页数量：${pageSize}`
    });
    
    res.status(200).json({
      total: count,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      invite_codes: rows
    });
  } catch (error) {
    logger.error('获取邀请码列表错误:', error);
    res.status(500).json({ message: '获取邀请码列表失败' });
  }
};

// 根据ID获取邀请码
const getInviteCodeById = async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;
    
    // 查询邀请码
    const inviteCode = await db.InviteCode.findByPk(id, {
      include: [
        { model: db.User, as: 'creator', attributes: ['id', 'username'] },
        { model: db.User, as: 'user', attributes: ['id', 'username'] }
      ]
    });
    
    if (!inviteCode) {
      return res.status(404).json({ message: '邀请码不存在' });
    }
    
    // 管理员只能查看自己创建的邀请码
    if (user.role === 'admin' && inviteCode.created_by !== user.id) {
      return res.status(403).json({ message: '无权访问该邀请码' });
    }
    
    // 记录操作日志
    await db.OperationLog.create({
      user_id: user.id,
      operation: 'getInviteCodeById',
      resource_id: id,
      resource_type: 'invite_code',
      ip_address: req.ip,
      description: `获取邀请码信息，邀请码ID：${id}`
    });
    
    res.status(200).json({
      invite_code: inviteCode
    });
  } catch (error) {
    logger.error('获取邀请码信息错误:', error);
    res.status(500).json({ message: '获取邀请码信息失败' });
  }
};

// 更新邀请码
const updateInviteCode = async (req, res) => {
  try {
    // 验证请求数据
    const { error } = validateUpdateInviteCode(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
    
    const user = req.user;
    const { id } = req.params;
    const { status, expire_time } = req.body;
    
    // 查询邀请码
    const inviteCode = await db.InviteCode.findByPk(id);
    
    if (!inviteCode) {
      return res.status(404).json({ message: '邀请码不存在' });
    }
    
    // 管理员只能更新自己创建的邀请码
    if (user.role === 'admin' && inviteCode.created_by !== user.id) {
      return res.status(403).json({ message: '无权更新该邀请码' });
    }
    
    // 准备更新数据
    const updateData = {};
    if (status) updateData.status = status;
    if (expire_time) updateData.expire_time = new Date(expire_time);
    
    // 更新邀请码
    await inviteCode.update(updateData);
    
    // 记录操作日志
    await db.OperationLog.create({
      user_id: user.id,
      operation: 'updateInviteCode',
      resource_id: id,
      resource_type: 'invite_code',
      ip_address: req.ip,
      description: `更新邀请码信息，邀请码ID：${id}`
    });
    
    res.status(200).json({
      message: '邀请码更新成功',
      invite_code: inviteCode
    });
  } catch (error) {
    logger.error('更新邀请码错误:', error);
    res.status(500).json({ message: '更新邀请码失败' });
  }
};

// 删除邀请码
const deleteInviteCode = async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;
    
    // 查询邀请码
    const inviteCode = await db.InviteCode.findByPk(id);
    
    if (!inviteCode) {
      return res.status(404).json({ message: '邀请码不存在' });
    }
    
    // 管理员只能删除自己创建的邀请码
    if (user.role === 'admin' && inviteCode.created_by !== user.id) {
      return res.status(403).json({ message: '无权删除该邀请码' });
    }
    
    // 删除邀请码
    await inviteCode.destroy();
    
    // 记录操作日志
    await db.OperationLog.create({
      user_id: user.id,
      operation: 'deleteInviteCode',
      resource_id: id,
      resource_type: 'invite_code',
      ip_address: req.ip,
      description: `删除邀请码，邀请码ID：${id}`
    });
    
    res.status(200).json({ message: '邀请码删除成功' });
  } catch (error) {
    logger.error('删除邀请码错误:', error);
    res.status(500).json({ message: '删除邀请码失败' });
  }
};

// 使邀请码过期
const expireInviteCode = async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;
    
    // 查询邀请码
    const inviteCode = await db.InviteCode.findByPk(id);
    
    if (!inviteCode) {
      return res.status(404).json({ message: '邀请码不存在' });
    }
    
    // 管理员只能操作自己创建的邀请码
    if (user.role === 'admin' && inviteCode.created_by !== user.id) {
      return res.status(403).json({ message: '无权操作该邀请码' });
    }
    
    // 只有未使用的邀请码可以设置过期
    if (inviteCode.status !== 'unused') {
      return res.status(400).json({ message: '只能使未使用的邀请码过期' });
    }
    
    // 更新邀请码状态为过期
    await inviteCode.update({
      status: 'expired'
    });
    
    // 记录操作日志
    await db.OperationLog.create({
      user_id: user.id,
      operation: 'expireInviteCode',
      resource_id: id,
      resource_type: 'invite_code',
      ip_address: req.ip,
      description: `使邀请码过期，邀请码ID：${id}`
    });
    
    res.status(200).json({ message: '邀请码已过期' });
  } catch (error) {
    logger.error('使邀请码过期错误:', error);
    res.status(500).json({ message: '使邀请码过期失败' });
  }
};

// 生成随机邀请码
const generateRandomCode = () => {
  return crypto.randomBytes(6).toString('hex').toUpperCase();
};

// 验证生成邀请码数据
const validateGenerateInviteCodes = (data) => {
  const schema = joi.object({
    count: joi.number().optional().integer().min(1).max(100).default(1),
    expire_time: joi.date().optional().greater('now')
  });
  
  return schema.validate(data);
};

// 验证更新邀请码数据
const validateUpdateInviteCode = (data) => {
  const schema = joi.object({
    status: joi.string().valid('unused', 'used', 'expired').optional(),
    expire_time: joi.date().optional()
  });
  
  return schema.validate(data);
};

module.exports = {
  generateInviteCodes,
  getInviteCodes,
  getInviteCodeById,
  updateInviteCode,
  deleteInviteCode,
  expireInviteCode
};