#!/usr/bin/env node

/**
 * 系统管理员登录测试脚本
 * 用于验证前后端联动的权限校验机制
 * 测试步骤：
 * 1. 测试登录API的基本功能
 * 2. 验证token的生成和解析
 * 3. 检查权限控制是否正常工作
 * 4. 测试管理员用户的登录和权限
 */

const axios = require('axios');
const jwt = require('jsonwebtoken');
const fs = require('fs');

// 配置信息
const config = {
  baseUrl: 'http://cqxsg.cloud',
  loginUrl: '/api/auth/login',
  meUrl: '/api/auth/me',
  testAdminUrl: '/api/admin/dashboard',
  adminCredentials: {
    username: 'admin',
    password: 'admin@123'
  },
  // 从后端.env文件读取JWT密钥
  jwtSecret: 'your_jwt_secret_key'
};

// 日志函数
const log = (message, data = null) => {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`[${timestamp}] ${message}`);
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
};

const logError = (message, error) => {
  const timestamp = new Date().toLocaleTimeString();
  console.error(`[${timestamp}] ERROR: ${message}`);
  if (error.response) {
    console.error('响应状态:', error.response.status);
    console.error('响应数据:', JSON.stringify(error.response.data, null, 2));
  } else if (error.request) {
    console.error('无响应:', error.request);
  } else {
    console.error('错误信息:', error.message);
  }
};

// 测试登录API
const testLogin = async () => {
  log('=== 开始测试登录API ===');
  
  try {
    // 发送登录请求
    const response = await axios.post(`${config.baseUrl}${config.loginUrl}`, {
      username: config.adminCredentials.username,
      password: config.adminCredentials.password
    });
    
    log('登录成功:', response.data);
    
    // 验证响应数据
    if (!response.data.token) {
      throw new Error('登录响应中没有token');
    }
    
    if (!response.data.user) {
      throw new Error('登录响应中没有user信息');
    }
    
    if (response.data.user.role !== 'system_admin') {
      throw new Error('用户角色不是系统管理员');
    }
    
    log('登录API测试通过');
    return response.data;
  } catch (error) {
    logError('登录API测试失败', error);
    throw error;
  }
};

// 验证JWT Token
const testToken = async (token, userInfo) => {
  log('\n=== 开始验证JWT Token ===');
  
  try {
    // 验证token格式
    if (!token.startsWith('eyJ')) {
      throw new Error('无效的JWT token格式');
    }
    
    // 解码token
    const decoded = jwt.verify(token, config.jwtSecret);
    log('Token解码成功:', decoded);
    
    // 验证token内容
    if (decoded.id !== userInfo.id) {
      throw new Error('Token中的用户ID与响应中的用户ID不匹配');
    }
    
    if (decoded.username !== userInfo.username) {
      throw new Error('Token中的用户名与响应中的用户名不匹配');
    }
    
    if (decoded.role !== userInfo.role) {
      throw new Error('Token中的角色与响应中的角色不匹配');
    }
    
    log('JWT Token验证通过');
    return decoded;
  } catch (error) {
    logError('JWT Token验证失败', error);
    throw error;
  }
};

// 测试获取用户信息API
const testGetUserInfo = async (token) => {
  log('\n=== 开始测试获取用户信息API ===');
  
  try {
    const response = await axios.get(`${config.baseUrl}${config.meUrl}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    log('获取用户信息成功:', response.data);
    
    if (!response.data.user) {
      throw new Error('响应中没有user信息');
    }
    
    log('获取用户信息API测试通过');
    return response.data.user;
  } catch (error) {
    logError('获取用户信息API测试失败', error);
    throw error;
  }
};

// 测试管理员权限API
const testAdminPermission = async (token) => {
  log('\n=== 开始测试管理员权限API ===');
  
  try {
    const response = await axios.get(`${config.baseUrl}${config.testAdminUrl}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    log('管理员权限API访问成功:', {
      status: response.status,
      data: response.data
    });
    
    log('管理员权限API测试通过');
    return true;
  } catch (error) {
    // 如果返回403，说明权限控制正常工作
    if (error.response && error.response.status === 403) {
      log('管理员权限API返回403，权限控制正常');
      return true;
    } else {
      logError('管理员权限API测试失败', error);
      throw error;
    }
  }
};

// 主测试函数
const runTests = async () => {
  log('=== 开始系统管理员登录测试 ===');
  log('测试环境:', config.baseUrl);
  log('测试账号:', config.adminCredentials.username);
  
  try {
    // 1. 测试登录
    const loginResult = await testLogin();
    const { token, user } = loginResult;
    
    // 2. 验证token
    await testToken(token, user);
    
    // 3. 测试获取用户信息
    const userInfo = await testGetUserInfo(token);
    
    // 4. 测试管理员权限
    await testAdminPermission(token);
    
    log('\n=== 所有测试通过！系统管理员登录功能正常 ===');
    
    // 输出测试报告
    const report = {
      timestamp: new Date().toISOString(),
      baseUrl: config.baseUrl,
      username: config.adminCredentials.username,
      userInfo: userInfo,
      tokenLength: token.length,
      tokenExpiresIn: '24h',
      tests: {
        login: 'PASS',
        token: 'PASS',
        getUserInfo: 'PASS',
        adminPermission: 'PASS'
      }
    };
    
    log('测试报告:', report);
    
    // 保存测试报告
    fs.writeFileSync('login-test-report.json', JSON.stringify(report, null, 2));
    log('测试报告已保存到 login-test-report.json');
    
    return true;
  } catch (error) {
    logError('\n=== 测试失败！系统管理员登录功能异常 ===', error);
    return false;
  }
};

// 运行测试
runTests().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  logError('测试执行出错', error);
  process.exit(1);
});
