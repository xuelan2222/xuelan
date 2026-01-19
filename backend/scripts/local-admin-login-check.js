const axios = require('axios');

(async () => {
  try {
    const baseUrl = process.env.BASE_URL || 'http://localhost:3001';
    const credentials = { username: 'admin', password: 'admin@123' };

    console.log('Logging in as admin to', baseUrl);
    const res = await axios.post(`${baseUrl}/api/auth/login`, credentials);
    console.log('Login response:', { status: res.status, data: { user: res.data.user } });

    const token = res.data.token;
    if (!token) throw new Error('No token returned');

    console.log('Testing admin-only endpoint /api/admin/dashboard (if exists)');
    try {
      const permRes = await axios.get(`${baseUrl}/api/admin/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Admin endpoint responded:', permRes.status, permRes.data);
    } catch (e) {
      if (e.response) {
        console.log('Admin endpoint response status:', e.response.status, e.response.data);
      } else {
        console.error('Admin endpoint request failed:', e.message);
      }
    }

    process.exit(0);
  } catch (e) {
    console.error('Local admin login check failed:', e.response ? e.response.data : e.message);
    process.exit(1);
  }
})();
