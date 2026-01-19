const { generateToken } = require('../controllers/authController');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: __dirname + '/../.env' });

(async () => {
  try {
    const user = { id: 1, username: 'admin', role: 'system_admin', region_id: 1 };
    const token = generateToken(user);
    console.log('Generated token length:', token.length);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded payload:', decoded);
    process.exit(0);
  } catch (e) {
    console.error('Token check failed:', e);
    process.exit(1);
  }
})();
