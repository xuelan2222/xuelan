const joi = require('joi');
const db = require('../models/index');
const logger = require('../config/logger');

// 获取区域列表
const getRegions = async (req, res) => {
  try {
    const user = req.user;
    const { keyword } = req.query;
    
    // 构建查询条件
    const whereClause = {};
    
    // 管理员只能查看同区域
    if (user.role === 'admin') {
      whereClause.id = user.region_id;
    }
    
    // 关键词搜索
    if (keyword) {
      whereClause[db.Sequelize.Op.or] = [
        { name: { [db.Sequelize.Op.like]: `%${keyword}%` } },
        { code: { [db.Sequelize.Op.like]: `%${keyword}%` } }
      ];
    }
    
    // 查询区域列表
    const regions = await db.Region.findAll({
      where: whereClause,
      order: [['name', 'ASC']]
    });
    
    // 记录操作日志
    await db.OperationLog.create({
      user_id: user.id,
      operation: 'getRegions',
      resource_type: 'region',
      ip_address: req.ip,
      description: '获取区域列表'
    });
    
    res.status(200).json({
      regions
    });
  } catch (error) {
    logger.error('获取区域列表错误:', error);
    res.status(500).json({ message: '获取区域列表失败' });
  }
};

// 根据ID获取区域
const getRegionById = async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;
    
    // 查询区域
    const region = await db.Region.findByPk(id);
    
    if (!region) {
      return res.status(404).json({ message: '区域不存在' });
    }
    
    // 管理员只能查看同区域
    if (user.role === 'admin' && region.id !== user.region_id) {
      return res.status(403).json({ message: '无权访问该区域' });
    }
    
    // 记录操作日志
    await db.OperationLog.create({
      user_id: user.id,
      operation: 'getRegionById',
      resource_id: id,
      resource_type: 'region',
      ip_address: req.ip,
      description: `获取区域信息，区域ID：${id}`
    });
    
    res.status(200).json({
      region
    });
  } catch (error) {
    logger.error('获取区域信息错误:', error);
    res.status(500).json({ message: '获取区域信息失败' });
  }
};

// 创建区域
const createRegion = async (req, res) => {
  try {
    // 验证请求数据
    const { error } = validateRegion(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
    
    const user = req.user;
    const { name, code, description } = req.body;
    
    // 检查区域名称是否已存在
    const existingRegion = await db.Region.findOne({
      where: {
        [db.Sequelize.Op.or]: [
          { name },
          { code }
        ]
      }
    });
    
    if (existingRegion) {
      return res.status(400).json({ message: '区域名称或编码已存在' });
    }
    
    // 创建区域
    const region = await db.Region.create({
      name,
      code,
      description
    });
    
    // 记录操作日志
    await db.OperationLog.create({
      user_id: user.id,
      operation: 'createRegion',
      resource_id: region.id,
      resource_type: 'region',
      ip_address: req.ip,
      description: `创建区域，区域ID：${region.id}，区域名称：${name}`
    });
    
    res.status(201).json({
      message: '区域创建成功',
      region
    });
  } catch (error) {
    logger.error('创建区域错误:', error);
    res.status(500).json({ message: '创建区域失败' });
  }
};

// 更新区域
const updateRegion = async (req, res) => {
  try {
    // 验证请求数据
    const { error } = validateUpdateRegion(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
    
    const user = req.user;
    const { id } = req.params;
    const { name, code, description } = req.body;
    
    // 查询区域
    const region = await db.Region.findByPk(id);
    
    if (!region) {
      return res.status(404).json({ message: '区域不存在' });
    }
    
    // 检查区域名称或编码是否已存在
    const existingRegion = await db.Region.findOne({
      where: {
        [db.Sequelize.Op.or]: [
          { name },
          { code }
        ],
        id: { [db.Sequelize.Op.ne]: id }
      }
    });
    
    if (existingRegion) {
      return res.status(400).json({ message: '区域名称或编码已存在' });
    }
    
    // 更新区域
    await region.update({
      name,
      code,
      description
    });
    
    // 记录操作日志
    await db.OperationLog.create({
      user_id: user.id,
      operation: 'updateRegion',
      resource_id: id,
      resource_type: 'region',
      ip_address: req.ip,
      description: `更新区域信息，区域ID：${id}`
    });
    
    res.status(200).json({
      message: '区域更新成功',
      region
    });
  } catch (error) {
    logger.error('更新区域错误:', error);
    res.status(500).json({ message: '更新区域失败' });
  }
};

// 删除区域
const deleteRegion = async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;
    
    // 查询区域
    const region = await db.Region.findByPk(id);
    
    if (!region) {
      return res.status(404).json({ message: '区域不存在' });
    }
    
    // 检查区域是否有用户
    const users = await db.User.findAll({
      where: { region_id: id }
    });
    
    if (users.length > 0) {
      return res.status(400).json({ message: '该区域下存在用户，无法删除' });
    }
    
    // 检查区域是否有产品
    const products = await db.Product.findAll({
      where: { region_id: id }
    });
    
    if (products.length > 0) {
      return res.status(400).json({ message: '该区域下存在产品，无法删除' });
    }
    
    // 删除区域
    await region.destroy();
    
    // 记录操作日志
    await db.OperationLog.create({
      user_id: user.id,
      operation: 'deleteRegion',
      resource_id: id,
      resource_type: 'region',
      ip_address: req.ip,
      description: `删除区域，区域ID：${id}`
    });
    
    res.status(200).json({ message: '区域删除成功' });
  } catch (error) {
    logger.error('删除区域错误:', error);
    res.status(500).json({ message: '删除区域失败' });
  }
};

// 验证区域数据
const validateRegion = (data) => {
  const schema = joi.object({
    name: joi.string().required().min(2).max(50),
    code: joi.string().required().min(2).max(20).alphanum(),
    description: joi.string().optional().max(255)
  });
  
  return schema.validate(data);
};

// 验证更新区域数据
const validateUpdateRegion = (data) => {
  const schema = joi.object({
    name: joi.string().optional().min(2).max(50),
    code: joi.string().optional().min(2).max(20).alphanum(),
    description: joi.string().optional().max(255)
  });
  
  return schema.validate(data);
};

module.exports = {
  getRegions,
  getRegionById,
  createRegion,
  updateRegion,
  deleteRegion
};