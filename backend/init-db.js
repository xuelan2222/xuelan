const logger = require('./config/logger');
const db = require('./models');

// 创建系统管理员账号的函数
async function createSystemAdmin() {
  try {
    logger.info('开始初始化数据库...');

    // 创建所有表
    await db.sequelize.sync({
      force: false,  // 设置为true会删除现有表并重新创建
      alter: true     // 根据模型自动修改表结构
    });

    logger.info('数据库表创建/更新完成');

    // 检查是否已经存在系统管理员账号
    const existingAdmin = await db.User.findOne({
      where: {
        role: 'system_admin'
      }
    });

    if (existingAdmin) {
      logger.info('系统管理员账号已存在');
      return;
    }

    // 创建默认区域
    const region = await db.Region.findOrCreate({
      where: { id: 1 },
      defaults: {
        name: '默认区域',
        code: 'DEFAULT',
        description: '系统默认区域',
        created_at: new Date(),
        updated_at: new Date()
      }
    });

    // 创建系统管理员账号
    const admin = await db.User.create({
      username: 'admin',
      password: 'admin@123',  // 明文密码，会被模型的beforeCreate钩子自动加密
      role: 'system_admin',
      region_id: region[0].id,
      status: 'active',
      email: 'admin@example.com',
      phone: '13800138000',
      created_at: new Date(),
      updated_at: new Date()
    });

    logger.info('系统管理员账号创建完成');
    logger.info('管理员账号: admin');
    logger.info('管理员密码: admin@123');

  } catch (error) {
    logger.error('数据库初始化错误:', error);
  } finally {
    // 关闭数据库连接
    await db.sequelize.close();
  }
}

// 执行初始化
createSystemAdmin();