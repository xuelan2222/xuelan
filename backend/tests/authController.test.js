// 直接调用控制器函数的单元测试，避免依赖网络或 HTTP 层
// Mock models to avoid real DB dependency
jest.mock('../models', () => ({
  User: {
    findOne: jest.fn()
  },
  OperationLog: {
    create: jest.fn()
  }
}));

const db = require('../models');
const authController = require('../controllers/authController');

describe('Auth Controller', () => {
  beforeAll(() => {
    // Set a deterministic JWT secret for tests
    process.env.JWT_SECRET = 'test_jwt_secret';
    process.env.JWT_EXPIRES_IN = '1h';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('login returns 401 when user not found', async () => {
    db.User.findOne.mockResolvedValue(null);

    const req = {
      body: { username: 'nonexist', password: 'password' },
      ip: '127.0.0.1',
      headers: {}
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await authController.login(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: '用户名或密码错误' }));
  });

  test('login succeeds for admin user and returns token with role', async () => {
    // Mock user instance returned from DB
    const fakeUser = {
      id: 10,
      username: 'admin_user',
      role: 'admin',
      region_id: 2,
      email: 'a@a.com',
      phone: '13800138000',
      status: 'active',
      region: { id: 2, name: '区域2' },
      validPassword: jest.fn().mockResolvedValue(true)
    };

    db.User.findOne.mockResolvedValue(fakeUser);
    db.OperationLog.create.mockResolvedValue(true);

    const req = {
      body: { username: 'admin_user', password: 'password' },
      ip: '127.0.0.1',
      headers: {}
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await authController.login(req, res);

    expect(db.User.findOne).toHaveBeenCalledWith(expect.objectContaining({ where: { username: 'admin_user' } }));
    expect(fakeUser.validPassword).toHaveBeenCalledWith('password');
    expect(res.status).toHaveBeenCalledWith(200);

    const responseArg = res.json.mock.calls[0][0];
    expect(responseArg).toHaveProperty('token');
    expect(responseArg).toHaveProperty('user');
    expect(responseArg.user.role).toBe('admin');

    // verify token contains role
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(responseArg.token, process.env.JWT_SECRET);
    expect(decoded.role).toBe('admin');
    expect(decoded.id).toBe(fakeUser.id);
  });

  test('login succeeds for system_admin user and returns token with role', async () => {
    const sysUser = {
      id: 2,
      username: 'sysadmin',
      role: 'system_admin',
      region_id: 1,
      region: { id: 1, name: '默认区域' },
      validPassword: jest.fn().mockResolvedValue(true)
    };

    db.User.findOne.mockResolvedValue(sysUser);
    db.OperationLog.create.mockResolvedValue(true);

    const req = {
      body: { username: 'sysadmin', password: 'password' },
      ip: '127.0.0.1',
      headers: {}
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await authController.login(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const responseArg = res.json.mock.calls[0][0];
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(responseArg.token, process.env.JWT_SECRET);
    expect(decoded.role).toBe('system_admin');
  });
});
