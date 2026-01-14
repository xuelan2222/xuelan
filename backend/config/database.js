const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');
const logger = require('./logger');

// 加载环境变量
dotenv.config();

// 数据库配置
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'mysql',
    logging: (msg) => logger.debug(msg), // 日志配置
    timezone: '+08:00', // 设置时区
    dialectOptions: {
      connectTimeout: 10000, // 连接超时时间
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

// 测试数据库连接
sequelize.authenticate()
  .then(() => {
    logger.info('Database connected successfully');
    // 标记连接状态，供其他模块检查
    sequelize.isConnected = true;
  })
  .catch(err => {
    logger.error('Database connection error:', err);
    // 不再直接退出进程，允许上层逻辑在运行时处理连接问题或重试
    sequelize.isConnected = false;
  });

// 仅导出Sequelize实例（包含连接状态）
module.exports = sequelize;