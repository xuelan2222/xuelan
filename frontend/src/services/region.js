import api from './api'

// 获取区域列表
export const getRegions = async () => {
  try {
    const response = await api.get('/api/regions')
    return response.data
  } catch (error) {
    throw error
  }
}

// 获取区域详情
export const getRegionDetail = async (id) => {
  try {
    const response = await api.get(`/api/regions/${id}`)
    return response.data
  } catch (error) {
    throw error
  }
}

// 创建区域
export const createRegion = async (data) => {
  try {
    const response = await api.post('/api/regions', data)
    return response.data
  } catch (error) {
    throw error
  }
}

// 更新区域
export const updateRegion = async (id, data) => {
  try {
    const response = await api.put(`/api/regions/${id}`, data)
    return response.data
  } catch (error) {
    throw error
  }
}

// 删除区域
export const deleteRegion = async (id) => {
  try {
    const response = await api.delete(`/api/regions/${id}`)
    return response.data
  } catch (error) {
    throw error
  }
}

// 搜索区域
export const searchRegions = async (keyword) => {
  try {
    const response = await api.get('/api/regions', { params: { keyword } })
    return response.data
  } catch (error) {
    throw error
  }
}
