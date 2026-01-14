import api from './api'
import pinyin from 'pinyin'

// 获取产品列表
export const getProducts = async (params) => {
  try {
    const response = await api.get('/api/products', { params })
    return response.data
  } catch (error) {
    throw error
  }
}

// 获取产品详情
export const getProductDetail = async (id) => {
  try {
    const response = await api.get(`/api/products/${id}`)
    return response.data
  } catch (error) {
    throw error
  }
}

// 搜索产品
export const searchProducts = async (keyword) => {
  try {
    const response = await api.get('/api/products', { params: { keyword } })
    return response.data
  } catch (error) {
    throw error
  }
}

// 首拼搜索产品
export const searchProductsByFirstLetter = async (keyword) => {
  try {
    const response = await api.get('/api/products/search/first-letter', { params: { keyword } })
    return response.data
  } catch (error) {
    throw error
  }
}

// 本地首拼搜索过滤
// 用于前端快速过滤，减少API请求
export const filterProductsByFirstLetter = (products, keyword) => {
  if (!keyword || keyword.trim() === '') {
    return products
  }
  
  const keywordPinyin = keyword.toLowerCase()
  
  return products.filter(product => {
    // 获取产品名称的首拼
    const productFirstLetters = pinyin(product.name, { 
      style: pinyin.STYLE_FIRST_LETTER 
    }).flat().join('').toLowerCase()
    
    // 匹配首拼或名称
    return productFirstLetters.includes(keywordPinyin) || product.name.includes(keyword)
  })
}

// 根据分类获取产品
export const getProductsByCategory = async (categoryId, params) => {
  try {
    const response = await api.get(`/api/products/category/${categoryId}`, { params })
    return response.data
  } catch (error) {
    throw error
  }
}

// 根据价格范围获取产品
export const getProductsByPriceRange = async (minPrice, maxPrice, params) => {
  try {
    const response = await api.get('/api/products', { 
      params: {
        min_price: minPrice,
        max_price: maxPrice,
        ...params
      }
    })
    return response.data
  } catch (error) {
    throw error
  }
}

// 删除产品
export const deleteProduct = async (id) => {
  try {
    const response = await api.delete(`/api/products/${id}`)
    return response.data
  } catch (error) {
    throw error
  }
}

// 更新产品状态
export const updateProductStatus = async (id, status) => {
  try {
    const response = await api.patch(`/api/products/${id}/status`, { status })
    return response.data
  } catch (error) {
    throw error
  }
}

// 获取相关产品
export const getRelatedProducts = async (id) => {
  try {
    const response = await api.get(`/api/products/${id}/related`)
    return response.data
  } catch (error) {
    throw error
  }
}