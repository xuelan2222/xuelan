import api from './api'

// 获取仪表盘数据
export const getDashboardStats = async () => {
  try {
    const response = await api.get('/api/dashboard')
    return response.data
  } catch (error) {
    throw error
  }
}

// 兼容旧函数名
export const getDashboardData = getDashboardStats

// 获取产品统计数据
export const getProductStatistics = async () => {
  try {
    const response = await api.get('/api/dashboard/products')
    return response.data
  } catch (error) {
    throw error
  }
}

// 获取用户统计数据
export const getUserStatistics = async () => {
  try {
    const response = await api.get('/api/dashboard/users')
    return response.data
  } catch (error) {
    throw error
  }
}

// 获取订单统计数据
export const getOrderStatistics = async () => {
  try {
    const response = await api.get('/api/dashboard/orders')
    return response.data
  } catch (error) {
    throw error
  }
}

// 获取销售统计数据
export const getSalesStatistics = async (params) => {
  try {
    const response = await api.get('/api/dashboard/sales', { params })
    return response.data
  } catch (error) {
    throw error
  }
}

// 获取区域统计数据
export const getRegionStatistics = async () => {
  try {
    const response = await api.get('/api/dashboard/regions')
    return response.data
  } catch (error) {
    throw error
  }
}

// 获取热门产品
export const getHotProducts = async () => {
  try {
    const response = await api.get('/api/dashboard/hot-products')
    return response.data
  } catch (error) {
    throw error
  }
}

// 获取最新活动
export const getRecentActivities = async () => {
  try {
    const response = await api.get('/api/dashboard/activities')
    return response.data
  } catch (error) {
    throw error
  }
}
