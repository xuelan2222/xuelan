const joi = require('joi');
const db = require('../models/index');
const logger = require('../config/logger');
const pinyin = require('pinyin');

// 获取产品列表
const getProducts = async (req, res) => {
  try {
    const user = req.user;
    const { page = 1, pageSize = 10, keyword, category_id, min_price, max_price, status } = req.query;
    
    // 构建查询条件
    const whereClause = {};
    
    // 区域权限控制
    if (user.role === 'admin') {
      // 管理员只能查看自己创建的同区域产品
      whereClause.region_id = user.region_id;
      whereClause.admin_id = user.id;
    } else if (user.role === 'user') {
      // 普通用户只能查看同区域产品
      whereClause.region_id = user.region_id;
    }
    
    // 状态筛选
    if (status) {
      whereClause.status = status;
    } else {
      // 默认只显示激活状态的产品
      whereClause.status = 'active';
    }
    
    // 价格筛选
    if (min_price) {
      whereClause.price = { ...whereClause.price, [db.Sequelize.Op.gte]: parseFloat(min_price) };
    }
    
    if (max_price) {
      whereClause.price = { ...whereClause.price, [db.Sequelize.Op.lte]: parseFloat(max_price) };
    }
    
    // 关键词搜索
    if (keyword) {
      whereClause[db.Sequelize.Op.or] = [
        { name: { [db.Sequelize.Op.like]: `%${keyword}%` } },
        { code: { [db.Sequelize.Op.like]: `%${keyword}%` } },
        { description: { [db.Sequelize.Op.like]: `%${keyword}%` } },
        // 首拼搜索支持
        { name: { [db.Sequelize.Op.like]: `%${keyword}%` } }
      ];
    }
    
    // 查询产品列表
    const { count, rows } = await db.Product.findAndCountAll({
      where: whereClause,
      include: [
        { model: db.User, as: 'admin', attributes: ['id', 'username'] },
        { model: db.Region, as: 'region', attributes: ['id', 'name'] },
        { model: db.ProductImage, as: 'images', attributes: ['id', 'image_url', 'original_name', 'sort_order'] }
      ],
      limit: parseInt(pageSize),
      offset: (parseInt(page) - 1) * parseInt(pageSize),
      order: [['created_at', 'DESC']]
    });
    
    // 记录操作日志
    await db.OperationLog.create({
      user_id: user.id,
      operation: 'getProducts',
      resource_type: 'product',
      ip_address: req.ip,
      description: `获取产品列表，页码：${page}，每页数量：${pageSize}`
    });
    
    res.status(200).json({
      total: count,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      products: rows
    });
  } catch (error) {
    logger.error('获取产品列表错误:', error);
    res.status(500).json({ message: '获取产品列表失败' });
  }
};

// 根据ID获取产品
const getProductById = async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;
    
    // 查询产品
    const product = await db.Product.findByPk(id, {
      include: [
        { model: db.User, as: 'admin', attributes: ['id', 'username'] },
        { model: db.Region, as: 'region', attributes: ['id', 'name'] },
        { model: db.ProductImage, as: 'images', attributes: ['id', 'image_url', 'original_name', 'sort_order'] }
      ]
    });
    
    if (!product) {
      return res.status(404).json({ message: '产品不存在' });
    }
    
    // 记录操作日志
    await db.OperationLog.create({
      user_id: user.id,
      operation: 'getProductById',
      resource_id: id,
      resource_type: 'product',
      ip_address: req.ip,
      description: `获取产品信息，产品ID：${id}`
    });
    
    res.status(200).json({
      product
    });
  } catch (error) {
    logger.error('获取产品信息错误:', error);
    res.status(500).json({ message: '获取产品信息失败' });
  }
};

// 创建产品
const createProduct = async (req, res) => {
  try {
    // 验证请求数据
    const { error } = validateProduct(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
    
    const user = req.user;
    const { name, code, description, price, stock, images, status } = req.body;
    
    // 检查产品编码是否已存在
    const existingProduct = await db.Product.findOne({
      where: { code }
    });
    
    if (existingProduct) {
      return res.status(400).json({ message: '产品编码已存在' });
    }
    
    // 创建产品
    const product = await db.Product.create({
      name,
      code,
      description,
      price,
      stock,
      region_id: user.region_id,
      admin_id: user.id,
      status: status || 'active'
    });
    
    // 创建产品图片
    if (images && images.length > 0) {
      const productImages = images.map((image, index) => ({
        product_id: product.id,
        image_url: image.image_url,
        original_name: image.original_name,
        sort_order: index
      }));
      
      await db.ProductImage.bulkCreate(productImages);
    }
    
    // 记录操作日志
    await db.OperationLog.create({
      user_id: user.id,
      operation: 'createProduct',
      resource_id: product.id,
      resource_type: 'product',
      ip_address: req.ip,
      description: `创建产品，产品ID：${product.id}，产品名称：${name}`
    });
    
    res.status(201).json({
      message: '产品创建成功',
      product
    });
  } catch (error) {
    logger.error('创建产品错误:', error);
    res.status(500).json({ message: '创建产品失败' });
  }
};

// 更新产品
const updateProduct = async (req, res) => {
  try {
    // 验证请求数据
    const { error } = validateUpdateProduct(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
    
    const user = req.user;
    const { id } = req.params;
    const { name, code, description, price, stock, images, status } = req.body;
    
    // 查询产品
    const product = await db.Product.findByPk(id);
    
    if (!product) {
      return res.status(404).json({ message: '产品不存在' });
    }
    
    // 检查产品编码是否已存在（排除当前产品）
    if (code && code !== product.code) {
      const existingProduct = await db.Product.findOne({
        where: {
          code,
          id: { [db.Sequelize.Op.ne]: id }
        }
      });
      
      if (existingProduct) {
        return res.status(400).json({ message: '产品编码已存在' });
      }
    }
    
    // 准备更新数据
    const updateData = {};
    if (name) updateData.name = name;
    if (code) updateData.code = code;
    if (description) updateData.description = description;
    if (price) updateData.price = parseFloat(price);
    if (stock) updateData.stock = parseInt(stock);
    if (status) updateData.status = status;
    
    // 更新产品
    await product.update(updateData);
    
    // 更新产品图片
    if (images !== undefined) {
      // 删除原有图片
      await db.ProductImage.destroy({
        where: { product_id: id }
      });
      
      // 创建新图片
      if (images && images.length > 0) {
        const productImages = images.map((image, index) => ({
          product_id: id,
          image_url: image.image_url,
          original_name: image.original_name,
          sort_order: index
        }));
        
        await db.ProductImage.bulkCreate(productImages);
      }
    }
    
    // 记录操作日志
    await db.OperationLog.create({
      user_id: user.id,
      operation: 'updateProduct',
      resource_id: id,
      resource_type: 'product',
      ip_address: req.ip,
      description: `更新产品信息，产品ID：${id}`
    });
    
    res.status(200).json({
      message: '产品更新成功',
      product
    });
  } catch (error) {
    logger.error('更新产品错误:', error);
    res.status(500).json({ message: '更新产品失败' });
  }
};

// 删除产品
const deleteProduct = async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;
    
    // 查询产品
    const product = await db.Product.findByPk(id);
    
    if (!product) {
      return res.status(404).json({ message: '产品不存在' });
    }
    
    // 删除产品图片
    await db.ProductImage.destroy({
      where: { product_id: id }
    });
    
    // 删除产品
    await product.destroy();
    
    // 记录操作日志
    await db.OperationLog.create({
      user_id: user.id,
      operation: 'deleteProduct',
      resource_id: id,
      resource_type: 'product',
      ip_address: req.ip,
      description: `删除产品，产品ID：${id}`
    });
    
    res.status(200).json({ message: '产品删除成功' });
  } catch (error) {
    logger.error('删除产品错误:', error);
    res.status(500).json({ message: '删除产品失败' });
  }
};

// 首拼搜索
const searchByFirstLetter = async (req, res) => {
  try {
    const user = req.user;
    const { keyword } = req.query;
    
    if (!keyword) {
      return res.status(400).json({ message: '搜索关键词不能为空' });
    }
    
    // 构建查询条件
    const whereClause = {};
    
    // 区域权限控制
    if (user.role === 'admin') {
      whereClause.region_id = user.region_id;
      whereClause.admin_id = user.id;
    } else if (user.role === 'user') {
      whereClause.region_id = user.region_id;
    }
    
    // 默认只显示激活状态的产品
    whereClause.status = 'active';
    
    // 查询所有符合条件的产品
    const products = await db.Product.findAll({
      where: whereClause,
      include: [
        { model: db.User, as: 'admin', attributes: ['id', 'username'] },
        { model: db.Region, as: 'region', attributes: ['id', 'name'] }
      ]
    });
    
    // 首拼搜索过滤
    const filteredProducts = products.filter(product => {
      // 获取产品名称的首拼
      const productPinyin = pinyin(product.name, {
        style: pinyin.STYLE_FIRST_LETTER,
        heteronym: false
      }).join('').toLowerCase();
      
      // 匹配首拼
      return productPinyin.includes(keyword.toLowerCase());
    });
    
    // 记录操作日志
    await db.OperationLog.create({
      user_id: user.id,
      operation: 'searchByFirstLetter',
      resource_type: 'product',
      ip_address: req.ip,
      description: `首拼搜索产品，关键词：${keyword}`
    });
    
    res.status(200).json({
      products: filteredProducts
    });
  } catch (error) {
    logger.error('首拼搜索错误:', error);
    res.status(500).json({ message: '首拼搜索失败' });
  }
};

// 更新产品状态
const updateProductStatus = async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;
    const { status } = req.body;
    
    // 查询产品
    const product = await db.Product.findByPk(id);
    
    if (!product) {
      return res.status(404).json({ message: '产品不存在' });
    }
    
    // 检查权限
    if (user.role === 'admin' && (product.region_id !== user.region_id || product.admin_id !== user.id)) {
      return res.status(403).json({ message: '无权限修改该产品状态' });
    } else if (user.role === 'user') {
      return res.status(403).json({ message: '无权限修改产品状态' });
    }
    
    // 更新状态
    await product.update({ status });
    
    // 记录操作日志
    await db.OperationLog.create({
      user_id: user.id,
      operation: 'updateProductStatus',
      resource_id: id,
      resource_type: 'product',
      ip_address: req.ip,
      description: `更新产品状态，产品ID：${id}，状态：${status}`
    });
    
    res.status(200).json({ message: '产品状态更新成功' });
  } catch (error) {
    logger.error('更新产品状态错误:', error);
    res.status(500).json({ message: '更新产品状态失败' });
  }
};

// 获取相关产品
const getRelatedProducts = async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;
    
    // 查询产品
    const product = await db.Product.findByPk(id);
    
    if (!product) {
      return res.status(404).json({ message: '产品不存在' });
    }
    
    // 构建查询条件
    const whereClause = {
      status: 'active',
      id: { [db.Sequelize.Op.ne]: id }
    };
    
    // 区域权限控制
    if (user.role === 'admin') {
      // 管理员只能查看自己创建的同区域产品
      whereClause.region_id = user.region_id;
      whereClause.admin_id = user.id;
    } else if (user.role === 'user') {
      // 普通用户只能查看同区域产品
      whereClause.region_id = user.region_id;
    }
    
    // 简单实现：获取同区域的其他产品作为相关产品
    const relatedProducts = await db.Product.findAll({
      where: whereClause,
      include: [
        { model: db.Region, as: 'region', attributes: ['id', 'name'] },
        { model: db.ProductImage, as: 'images', attributes: ['id', 'image_url', 'original_name', 'sort_order'], limit: 1 }
      ],
      limit: 10,
      order: [['created_at', 'DESC']]
    });
    
    // 记录操作日志
    await db.OperationLog.create({
      user_id: user.id,
      operation: 'getRelatedProducts',
      resource_id: id,
      resource_type: 'product',
      ip_address: req.ip,
      description: `获取相关产品，产品ID：${id}`
    });
    
    res.status(200).json({
      products: relatedProducts
    });
  } catch (error) {
    logger.error('获取相关产品错误:', error);
    res.status(500).json({ message: '获取相关产品失败' });
  }
};

// 验证产品数据
const validateProduct = (data) => {
  const schema = joi.object({
    name: joi.string().required().min(2).max(100),
    code: joi.string().required().min(2).max(50),
    description: joi.string().optional().max(1000),
    price: joi.number().required().min(0),
    stock: joi.number().required().min(0),
    images: joi.array().optional().items(
      joi.object({
        image_url: joi.string().required().uri(),
        original_name: joi.string().required()
      })
    ),
    status: joi.string().valid('active', 'inactive').optional()
  });
  
  return schema.validate(data);
};

// 验证更新产品数据
const validateUpdateProduct = (data) => {
  const schema = joi.object({
    name: joi.string().optional().min(2).max(100),
    code: joi.string().optional().min(2).max(50),
    description: joi.string().optional().max(1000),
    price: joi.number().optional().min(0),
    stock: joi.number().optional().min(0),
    images: joi.array().optional().items(
      joi.object({
        image_url: joi.string().required().uri(),
        original_name: joi.string().required()
      })
    ),
    status: joi.string().valid('active', 'inactive').optional()
  });
  
  return schema.validate(data);
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  searchByFirstLetter,
  updateProductStatus,
  getRelatedProducts
};