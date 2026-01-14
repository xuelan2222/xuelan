import axios from 'axios'
import { showFailToast } from 'vant'
import { useUserStore } from '@/store/modules/user'
import router from '@/router'

// 创建axios实例
const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
api.interceptors.request.use(
  config => {
    const userStore = useUserStore()
    
    // 确保headers对象存在
    if (!config.headers) {
      config.headers = {}
    }
    
    console.log('API请求拦截器:', {
      url: config.url,
      method: config.method,
      hasToken: !!userStore.token,
      token: userStore.token ? userStore.token.substring(0, 20) + '...' : 'none',
      userRole: userStore.userInfo.role,
      regionId: userStore.userInfo.region_id
    })
    
    // 添加token到请求头
    if (userStore.token) {
      // 确保token格式正确（JWT格式）
      const token = userStore.token.startsWith('Bearer ') 
        ? userStore.token 
        : `Bearer ${userStore.token}`
      
      config.headers.Authorization = token
      console.log('已添加Authorization头:', token.substring(0, 30) + '...')
    } else {
      console.log('未添加Authorization头: token不存在')
    }
    
    // 添加区域ID到请求头
    if (userStore.userInfo.region_id) {
      config.headers['X-Region-ID'] = userStore.userInfo.region_id
      console.log('已添加X-Region-ID头:', userStore.userInfo.region_id)
    }
    
    return config
  },
  error => {
    console.error('请求拦截器错误:', error)
    showFailToast('请求发送失败')
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  response => {
    return response
  },
  error => {
    const { response } = error
    const userStore = useUserStore()
    
    if (response) {
      switch (response.status) {
        case 400:
          showFailToast(response.data?.message || '请求参数错误')
          break
        case 401:
          showFailToast(response.data?.message || '未授权，请重新登录')
          userStore.logout()
          // 跳转到登录页
          if (router.currentRoute.value.name !== 'login') {
            router.push('/login')
          }
          break
        case 403:
          showFailToast(response.data?.message || '无权限访问')
          // 跳转到403页面
          router.push('/403')
          break
        case 404:
          showFailToast(response.data?.message || '请求的资源不存在')
          break
        case 500:
          showFailToast(response.data?.message || '服务器内部错误')
          break
        default:
          showFailToast('请求失败')
      }
    } else {
      showFailToast('网络错误，请检查网络连接')
    }
    
    return Promise.reject(error)
  }
)

export default api