import api from './api'

// 获取分类列表
export const getCategories = async () => {
  try {
    const response = await api.get('/api/categories')
    return response.data
  } catch (error) {
    throw error
  }
}

// 获取分类详情
export const getCategoryDetail = async (id) => {
  try {
    const response = await api.get(`/api/categories/${id}`)
    return response.data
  } catch (error) {
    throw error
  }
}

// 创建分类
export const createCategory = async (data) => {
  try {
    const response = await api.post('/api/categories', data)
    return response.data
  } catch (error) {
    throw error
  }
}

// 更新分类
export const updateCategory = async (id, data) => {
  try {
    const response = await api.put(`/api/categories/${id}`, data)
    return response.data
  } catch (error) {
    throw error
  }
}

// 删除分类
export const deleteCategory = async (id) => {
  try {
    const response = await api.delete(`/api/categories/${id}`)
    return response.data
  } catch (error) {
    throw error
  }
}

// 搜索分类
export const searchCategories = async (keyword) => {
  try {
    const response = await api.get('/api/categories', { params: { keyword } })
    return response.data
  } catch (error) {
    throw error
  }
}

// 获取分类树形结构
export const getCategoryTree = async () => {
  try {
    const response = await api.get('/api/categories/tree')
    return response.data
  } catch (error) {
    throw error
  }
}

// 获取顶级分类
export const getTopCategories = async () => {
  try {
    const response = await api.get('/api/categories/top')
    return response.data
  } catch (error) {
    throw error
  }
}

// 获取子分类
export const getChildCategories = async (parentId) => {
  try {
    const response = await api.get(`/api/categories/${parentId}/children`)
    return response.data
  } catch (error) {
    throw error
  }
}
