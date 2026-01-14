// 登录调试工具
import axios from '@/services/api'
import { useUserStore } from '@/store/modules/user'

export const debugLogin = async (username, password, captcha) => {
  try {
    console.log('=== 开始登录调试 ===')
    console.log('输入参数:', { username, password, captcha })
    
    // 1. 直接测试API调用
    console.log('\n1. 直接测试API调用:')
    const apiResponse = await axios.post('/api/auth/login', { username, password })
    console.log('API响应:', apiResponse.data)
    
    // 2. 测试store的login方法
    console.log('\n2. 测试store的login方法:')
    const userStore = useUserStore()
    const storeResponse = await userStore.login({ username, password, captcha })
    console.log('Store响应:', storeResponse)
    
    // 3. 检查用户状态
    console.log('\n3. 检查用户状态:')
    console.log('token:', userStore.token)
    console.log('userInfo:', userStore.userInfo)
    console.log('isLogin:', userStore.isLogin)
    
    console.log('=== 登录调试完成 ===')
    return { success: true, data: apiResponse.data }
  } catch (error) {
    console.error('=== 登录调试失败 ===')
    console.error('错误信息:', error.message)
    console.error('错误详情:', error)
    if (error.response) {
      console.error('响应状态:', error.response.status)
      console.error('响应数据:', error.response.data)
      console.error('响应头:', error.response.headers)
    }
    return { success: false, error: error.message }
  }
}