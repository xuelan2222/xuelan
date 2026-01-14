const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const exceljs = require('exceljs');
const db = require('../models/index');
const logger = require('../config/logger');

// 下载产品导入模板
const downloadProductTemplate = async (req, res) => {
  try {
    const user = req.user;
    
    // 创建Excel工作簿
    const workbook = new exceljs.Workbook();
    const worksheet = workbook.addWorksheet('产品导入模板');
    
    // 设置列宽
    worksheet.columns = [
      { header: '产品名称', key: 'name', width: 30 },
      { header: '产品编码', key: 'code', width: 20 },
      { header: '产品描述', key: 'description', width: 50 },
      { header: '价格', key: 'price', width: 10 },
      { header: '库存', key: 'stock', width: 10 },
      { header: '状态', key: 'status', width: 10 },
      { header: '图片URL', key: 'images', width: 50 },
      { header: '原始文件名', key: 'original_names', width: 30 }
    ];
    
    // 添加示例数据
    worksheet.addRow({
      name: '示例产品',
      code: 'PROD001',
      description: '这是一个示例产品',
      price: 100.00,
      stock: 100,
      status: 'active',
      images: 'https://example.com/image1.jpg|https://example.com/image2.jpg',
      original_names: 'image1.jpg|image2.jpg'
    });
    
    // 设置标题样式
    worksheet.getRow(1).font = {
      bold: true,
      size: 12,
      color: { argb: 'FFFFFF' }
    };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '4285F4' }
    };
    
    // 生成临时文件
    const templatePath = path.join(__dirname, '../templates', 'product_template.xlsx');
    await workbook.xlsx.writeFile(templatePath);
    
    // 记录操作日志
    await db.OperationLog.create({
      user_id: user.id,
      operation: 'downloadProductTemplate',
      resource_type: 'excel',
      ip_address: req.ip,
      description: '下载产品导入模板'
    });
    
    // 下载文件
    res.download(templatePath, '产品导入模板.xlsx', (err) => {
      if (err) {
        logger.error('下载模板失败:', err);
        res.status(500).json({ message: '下载模板失败' });
      }
      
      // 删除临时文件
      fs.unlinkSync(templatePath);
    });
  } catch (error) {
    logger.error('下载产品导入模板错误:', error);
    res.status(500).json({ message: '下载产品导入模板失败' });
  }
};

// 导入产品数据
const importProducts = async (req, res) => {
  try {
    const user = req.user;
    
    // 检查是否有文件上传
    if (!req.file) {
      return res.status(400).json({ message: '请选择要导入的Excel文件' });
    }
    
    const filePath = req.file.path;
    
    // 读取Excel文件
    const workbook = xlsx.readFile(filePath);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(worksheet);
    
    // 验证数据格式
    if (!data || data.length === 0) {
      // 删除临时文件
      fs.unlinkSync(filePath);
      return res.status(400).json({ message: 'Excel文件中没有数据' });
    }
    
    // 处理导入数据
    const importedProducts = [];
    const errors = [];
    
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNum = i + 2; // 行号（第一行是标题）
      
      try {
        // 验证必填字段
        if (!row.name || !row.code || !row.price) {
          errors.push(`第${rowNum}行：产品名称、产品编码和价格是必填字段`);
          continue;
        }
        
        // 检查产品编码是否已存在
        const existingProduct = await db.Product.findOne({
          where: { code: row.code }
        });
        
        if (existingProduct) {
          errors.push(`第${rowNum}行：产品编码${row.code}已存在`);
          continue;
        }
        
        // 解析价格和库存
        const price = parseFloat(row.price);
        const stock = parseInt(row.stock) || 0;
        
        // 验证价格
        if (isNaN(price) || price < 0) {
          errors.push(`第${rowNum}行：价格必须是大于等于0的数字`);
          continue;
        }
        
        // 验证库存
        if (isNaN(stock) || stock < 0) {
          errors.push(`第${rowNum}行：库存必须是大于等于0的整数`);
          continue;
        }
        
        // 创建产品
        const product = await db.Product.create({
          name: row.name,
          code: row.code,
          description: row.description || '',
          price: price,
          stock: stock,
          region_id: user.region_id,
          admin_id: user.id,
          status: row.status === 'inactive' ? 'inactive' : 'active'
        });
        
        // 处理产品图片
        if (row.images) {
          const imageUrls = row.images.split('|');
          const originalNames = row.original_names ? row.original_names.split('|') : [];
          
          const productImages = imageUrls.map((imageUrl, index) => ({
            product_id: product.id,
            image_url: imageUrl.trim(),
            original_name: originalNames[index] ? originalNames[index].trim() : `image_${index + 1}.jpg`,
            sort_order: index
          }));
          
          await db.ProductImage.bulkCreate(productImages);
        }
        
        importedProducts.push(product);
      } catch (error) {
        errors.push(`第${rowNum}行：导入失败，错误信息：${error.message}`);
      }
    }
    
    // 删除临时文件
    fs.unlinkSync(filePath);
    
    // 记录操作日志
    await db.OperationLog.create({
      user_id: user.id,
      operation: 'importProducts',
      resource_type: 'excel',
      ip_address: req.ip,
      description: `导入产品数据，成功：${importedProducts.length}条，失败：${errors.length}条`
    });
    
    res.status(200).json({
      message: '产品导入完成',
      imported_count: importedProducts.length,
      error_count: errors.length,
      errors: errors.length > 0 ? errors : null
    });
  } catch (error) {
    logger.error('导入产品数据错误:', error);
    
    // 删除临时文件
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ message: '导入产品数据失败', error: error.message });
  }
};

// 导出产品数据
const exportProducts = async (req, res) => {
  try {
    const user = req.user;
    const { ids } = req.query;
    
    // 构建查询条件
    const whereClause = {};
    
    // 区域权限控制
    if (user.role === 'admin') {
      whereClause.region_id = user.region_id;
      whereClause.admin_id = user.id;
    } else if (user.role === 'user') {
      whereClause.region_id = user.region_id;
    }
    
    // 默认只导出激活状态的产品
    whereClause.status = 'active';
    
    // 指定产品ID导出
    if (ids) {
      const productIds = ids.split(',').map(id => parseInt(id));
      whereClause.id = { [db.Sequelize.Op.in]: productIds };
    }
    
    // 查询产品数据
    const products = await db.Product.findAll({
      where: whereClause,
      include: [
        { model: db.User, as: 'admin', attributes: ['id', 'username'] },
        { model: db.Region, as: 'region', attributes: ['id', 'name'] },
        { model: db.ProductImage, as: 'images', attributes: ['id', 'image_url', 'original_name', 'sort_order'] }
      ],
      order: [['created_at', 'DESC']]
    });
    
    if (products.length === 0) {
      return res.status(400).json({ message: '没有可导出的产品数据' });
    }
    
    // 创建Excel工作簿
    const workbook = new exceljs.Workbook();
    const worksheet = workbook.addWorksheet('产品导出数据');
    
    // 设置列宽
    worksheet.columns = [
      { header: '产品ID', key: 'id', width: 10 },
      { header: '产品名称', key: 'name', width: 30 },
      { header: '产品编码', key: 'code', width: 20 },
      { header: '产品描述', key: 'description', width: 50 },
      { header: '价格', key: 'price', width: 10 },
      { header: '库存', key: 'stock', width: 10 },
      { header: '状态', key: 'status', width: 10 },
      { header: '所属区域', key: 'region_name', width: 15 },
      { header: '创建者', key: 'admin_username', width: 15 },
      { header: '创建时间', key: 'created_at', width: 20 },
      { header: '更新时间', key: 'updated_at', width: 20 },
      { header: '图片URL', key: 'images', width: 50 },
      { header: '原始文件名', key: 'original_names', width: 30 }
    ];
    
    // 添加数据行
    products.forEach(product => {
      // 处理图片数据
      const images = product.images.map(image => image.image_url).join('|');
      const originalNames = product.images.map(image => image.original_name).join('|');
      
      worksheet.addRow({
        id: product.id,
        name: product.name,
        code: product.code,
        description: product.description,
        price: product.price,
        stock: product.stock,
        status: product.status,
        region_name: product.region.name,
        admin_username: product.admin.username,
        created_at: product.created_at.toISOString().substring(0, 19).replace('T', ' '),
        updated_at: product.updated_at.toISOString().substring(0, 19).replace('T', ' '),
        images: images,
        original_names: originalNames
      });
    });
    
    // 设置标题样式
    worksheet.getRow(1).font = {
      bold: true,
      size: 12,
      color: { argb: 'FFFFFF' }
    };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '4285F4' }
    };
    
    // 生成临时文件
    const exportPath = path.join(__dirname, '../exports', `产品导出_${Date.now()}.xlsx`);
    await workbook.xlsx.writeFile(exportPath);
    
    // 记录操作日志
    await db.OperationLog.create({
      user_id: user.id,
      operation: 'exportProducts',
      resource_type: 'excel',
      ip_address: req.ip,
      description: `导出产品数据，共${products.length}条`
    });
    
    // 下载文件
    res.download(exportPath, `产品导出_${Date.now()}.xlsx`, (err) => {
      if (err) {
        logger.error('下载导出文件失败:', err);
        res.status(500).json({ message: '下载导出文件失败' });
      }
      
      // 删除临时文件
      fs.unlinkSync(exportPath);
    });
  } catch (error) {
    logger.error('导出产品数据错误:', error);
    res.status(500).json({ message: '导出产品数据失败', error: error.message });
  }
};

module.exports = {
  downloadProductTemplate,
  importProducts,
  exportProducts
};