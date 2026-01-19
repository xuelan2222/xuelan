const jwt = require('jsonwebtoken');
const { generateToken } = require('../controllers/authController');
const dotenv = require('dotenv');

dotenv.config();

describe('JWT Token', () => {
  test('token payload should include role and region_id', () => {
    const user = { id: 123, username: 'admin', role: 'system_admin', region_id: 1 };
    const token = generateToken(user);
    expect(typeof token).toBe('string');

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    expect(decoded).toBeDefined();
    expect(decoded.role).toBe('system_admin');
    expect(decoded.region_id).toBe(1);
  });
});
