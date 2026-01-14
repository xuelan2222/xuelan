const sequelize = require('../config/database');
const bcrypt = require('bcrypt');

// 导入模型
const User = require('./User')(sequelize);
const Region = require('./Region')(sequelize);
const Product = require('./Product')(sequelize);
const ProductImage = require('./ProductImage')(sequelize);
const Category = require('./Category')(sequelize);
const InviteCode = require('./InviteCode')(sequelize);
const OperationLog = require('./OperationLog')(sequelize);
const FileUpload = require('./FileUpload')(sequelize);

// 定义模型关系
User.belongsTo(Region, { foreignKey: 'region_id', as: 'region' });
Region.hasMany(User, { foreignKey: 'region_id', as: 'users' });

Product.belongsTo(User, { foreignKey: 'admin_id', as: 'admin' });
User.hasMany(Product, { foreignKey: 'admin_id', as: 'products' });

Product.belongsTo(Region, { foreignKey: 'region_id', as: 'region' });
Region.hasMany(Product, { foreignKey: 'region_id', as: 'products' });

Product.belongsTo(Category, { foreignKey: 'category_id', as: 'category' });
Category.hasMany(Product, { foreignKey: 'category_id', as: 'products' });

Product.hasMany(ProductImage, { foreignKey: 'product_id', as: 'images' });
ProductImage.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

User.belongsTo(InviteCode, { foreignKey: 'invite_code_id', as: 'inviteCode' });
InviteCode.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

OperationLog.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// 导出包含所有模型的对象
const db = {
  sequelize,
  User,
  Region,
  Product,
  ProductImage,
  Category,
  InviteCode,
  OperationLog,
  FileUpload
};

module.exports = db;