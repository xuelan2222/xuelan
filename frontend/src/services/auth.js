import api from './api'

// 登录
export const login = async (data) => {
  try {
    const response = await api.post('/api/auth/login', data)
    return response.data
  } catch (error) {
    throw error
  }
}

// 注册
export const register = async (data) => {
  try {
    const response = await api.post('/api/auth/register', data)
    return response.data
  } catch (error) {
    throw error
  }
}

// 登出
export const logout = async () => {
  try {
    const response = await api.post('/api/auth/logout')
    return response.data
  } catch (error) {
    throw error
  }
}

// 获取当前用户信息
export const getCurrentUser = async () => {
  try {
    const response = await api.get('/api/auth/me')
    return response.data
  } catch (error) {
    throw error
  }
}

// 验证邀请码
export const validateInviteCode = async (code) => {
  try {
    const response = await api.post('/api/auth/validate-invite-code', { code })
    return response.data
  } catch (error) {
    throw error
  }
}

// 获取验证码
export const getCaptcha = async () => {
  try {
    const response = await api.get('/api/auth/captcha')
    return response.data
  } catch (error) {
    throw error
  }
}

// 刷新验证码
export const refreshCaptcha = async () => {
  try {
    const response = await api.get('/api/auth/captcha/refresh')
    return response.data
  } catch (error) {
    throw error
  }
}

// 忘记密码
export const forgotPassword = async (data) => {
  try {
    const response = await api.post('/api/auth/forgot-password', data)
    return response.data
  } catch (error) {
    throw error
  }
}

// 重置密码
export const resetPassword = async (data) => {
  try {
    const response = await api.post('/api/auth/reset-password', data)
    return response.data
  } catch (error) {
    throw error
  }
}
