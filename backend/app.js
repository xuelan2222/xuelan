const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const logger = require('./config/logger');
const db = require('./models');
const authMiddleware = require('./middlewares/auth');
const regionAuthMiddleware = require('./middlewares/regionAuth');
const userRoutes = require('./routes/users');
const productRoutes = require('./routes/products');
const regionRoutes = require('./routes/regions');
const inviteCodeRoutes = require('./routes/inviteCodes');
const excelRoutes = require('./routes/excel');

// 加载环境变量
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件配置
app.use(cors({
  origin: process.env.FRONTEND_ORIGIN || 'http://localhost:3001',
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Region-ID']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件服务
app.use('/uploads', express.static('uploads'));

// 路由配置
app.use('/api/auth', userRoutes);
app.use('/api/regions', authMiddleware, regionRoutes);
app.use('/api/products', authMiddleware, regionAuthMiddleware, productRoutes);
app.use('/api/invite-codes', authMiddleware, inviteCodeRoutes);
app.use('/api/excel', authMiddleware, regionAuthMiddleware, excelRoutes);

// 健康检查
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).json({ message: 'Internal Server Error' });
});

// 启动服务器
app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
  // 测试数据库连接
  db.sequelize.authenticate()
    .then(() => logger.info('Database connected successfully'))
    .catch(err => logger.error('Database connection error:', err));
});

module.exports = app;