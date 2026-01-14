import { defineStore } from 'pinia'
import axios from '@/services/api'
import { showFailToast, showSuccessToast } from 'vant'
import router from '@/router'

export const useUserStore = defineStore('user', {
  state: () => ({
    userInfo: {
      id: '',
      username: '',
      role: '',
      region_id: '',
      region_name: '',
      email: '',
      phone: '',
      status: ''
    },
    token: localStorage.getItem('token') || '',
    isLogin: !!localStorage.getItem('token')
  }),

  getters: {
    // 是否为系统管理员
    isSystemAdmin: (state) => state.userInfo.role === 'system_admin',
    // 是否为管理员
    isAdmin: (state) => state.userInfo.role === 'admin',
    // 是否为普通用户
    isUser: (state) => state.userInfo.role === 'user',
    // 用户区域ID
    userRegionId: (state) => state.userInfo.region_id,
    // 用户区域名称
    userRegionName: (state) => state.userInfo.region_name
  },

  actions: {
    // 登录
    async login(loginForm) {
      try {
        const response = await axios.post('/api/auth/login', loginForm)
        const { token, user } = response.data
        
        // 保存token
        this.token = token
        localStorage.setItem('token', token)
        
        // 保存用户信息
        this.userInfo = user
        this.isLogin = true
        
        showSuccessToast('登录成功')

        // 根据角色自动跳转（管理员 → 后台首页，普通用户 → 前台首页）
        try {
          const targetRoute = (user.role === 'system_admin' || user.role === 'admin') ? '/admin/dashboard' : '/home'
          await router.replace(targetRoute)
        } catch (e) {
          console.error('自动跳转失败:', e)
        }

        return response.data
      } catch (error) {
        showFailToast(error.response?.data?.message || '登录失败')
        throw error
      }
    },

    // 注册
    async register(registerForm) {
      try {
        const response = await axios.post('/api/auth/register', registerForm)
        const { token, user } = response.data
        
        // 保存token
        this.token = token
        localStorage.setItem('token', token)
        
        // 保存用户信息
        this.userInfo = user
        this.isLogin = true
        
        showSuccessToast('注册成功')

        // 根据角色自动跳转（管理员 → 后台首页，普通用户 → 前台首页）
        try {
          const targetRoute = (user.role === 'system_admin' || user.role === 'admin') ? '/admin/dashboard' : '/home'
          await router.replace(targetRoute)
        } catch (e) {
          console.error('注册后自动跳转失败:', e)
        }

        return response.data
      } catch (error) {
        showFailToast(error.response?.data?.message || '注册失败')
        throw error
      }
    },

    // 验证邀请码
    async validateInviteCode(code) {
      try {
        const response = await axios.post('/api/auth/validate-invite-code', { code })
        return response.data
      } catch (error) {
        showFailToast(error.response?.data?.message || '邀请码验证失败')
        throw error
      }
    },

    // 获取当前用户信息
    async getUserInfo() {
      try {
        const response = await axios.get('/api/auth/me')
        this.userInfo = response.data.user
        this.isLogin = true
        return response.data
      } catch (error) {
        showFailToast(error.response?.data?.message || '获取用户信息失败')
        this.logout()
        throw error
      }
    },

    // 退出登录
    logout() {
      // 清除token
      this.token = ''
      localStorage.removeItem('token')
      
      // 清除用户信息
      this.userInfo = {
        id: '',
        username: '',
        role: '',
        region_id: '',
        region_name: '',
        email: '',
        phone: '',
        status: ''
      }
      
      this.isLogin = false
      
      showSuccessToast('退出登录成功')
    },

    // 更新用户信息
    async updateUserInfo(userInfo) {
      try {
        const response = await axios.put(`/api/auth/${this.userInfo.id}`, userInfo)
        this.userInfo = response.data.user
        showSuccessToast('用户信息更新成功')
        return response.data
      } catch (error) {
        showFailToast(error.response?.data?.message || '用户信息更新失败')
        throw error
      }
    }
  }
})