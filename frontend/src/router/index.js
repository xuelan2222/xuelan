import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '../store/modules/user'

// 定义路由
const routes = [
  // 公开路由（无需登录即可访问）
  { path: '/login', name: 'login', component: () => import('../views/auth/Login.vue') },
  { path: '/register', name: 'register', component: () => import('../views/auth/Register.vue') },
  
  // 前台展示模块路由
  { path: '/', redirect: '/home' },
  { path: '/home', name: 'home', component: () => import('../views/front/Home.vue') },
  { path: '/product/:id', name: 'productDetail', component: () => import('../views/front/ProductDetail.vue') },
  { path: '/search', name: 'search', component: () => import('../views/front/Search.vue') },
  { path: '/list', name: 'list', component: () => import('../views/front/List.vue') },
  
  // 后台管理模块路由
  { path: '/admin', redirect: '/admin/dashboard' },
  { 
    path: '/admin/dashboard', 
    name: 'adminDashboard', 
    component: () => import('../views/admin/Dashboard.vue'),
    // 路由独享守卫 - 后台首页
    beforeEnter: (to, from, next) => {
      const userStore = useUserStore()
      // 检查用户是否有查看仪表盘的权限
      if (userStore.userInfo.role === 'system_admin' || userStore.userInfo.role === 'admin') {
        return next()
      }
      return next({ name: '403' })
    }
  },
  { 
    path: '/admin/products', 
    name: 'adminProducts', 
    component: () => import('../views/admin/ProductList.vue'),
    // 路由独享守卫 - 产品管理页
    beforeEnter: (to, from, next) => {
      const userStore = useUserStore()
      // 检查用户是否有产品管理权限
      if (userStore.userInfo.role === 'system_admin' || userStore.userInfo.role === 'admin') {
        return next()
      }
      return next({ name: '403' })
    }
  },

  
  // 错误路由
  { path: '/404', name: '404', component: () => import('../views/error/NotFound.vue') },
  { path: '/403', name: '403', component: () => import('../views/error/Forbidden.vue') },
  { path: '/500', name: '500', component: () => import('../views/error/ServerError.vue') },
  { path: '/:pathMatch(.*)*', redirect: '/404' }
]

// 创建路由实例
const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

// 路由守卫
router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore()
  const token = localStorage.getItem('token')
  
  // 公开路由白名单（无需登录即可访问）
  // 包含：登录页、注册页、错误页面
  const publicRoutes = ['login', 'register', '404', '403', '500']
  
  try {
    // 1. 处理to.name为undefined的情况（访问未知路由）
    if (!to.name) {
      return next({ name: '404' })
    }
    
    // 2. 防止从同一页面跳转导致的循环
    if (from.path === to.path && from.name === to.name) {
      return next(false) // 取消跳转
    }
    
    // 3. 处理公开路由访问 - 直接放行，不执行后续逻辑
    if (publicRoutes.includes(to.name)) {
      // 如果是已登录用户访问公开路由（如登录页），根据角色跳转到对应页面
      if (token && to.name === 'login') {
        // 如果 token 存在但用户信息尚未加载，先尝试获取
        if (!userStore.userInfo || !userStore.userInfo.role) {
          try {
            await userStore.getUserInfo()
          } catch (e) {
            // 获取用户信息失败，清理并让用户停留在登录页
            localStorage.removeItem('token')
            userStore.logout()
            return next()
          }
        }

        // 根据角色跳转到对应首页，避免重复跳转
        if (userStore.userInfo.role === 'system_admin' || userStore.userInfo.role === 'admin') {
          // 管理员跳转到后台首页
          if (to.path !== '/admin/dashboard') {
            return next({ name: 'adminDashboard' })
          }
        } else if (userStore.userInfo.role === 'user') {
          // 普通用户跳转到前台首页
          if (to.path !== '/home') {
            return next({ name: 'home' })
          }
        }
      }

      return next() // 公开路由直接放行
    }
    
    // 4. 非公开路由需要登录验证
    if (!token) {
      // 没有token，强制跳转到登录页
      // 避免重复跳转到登录页
      if (to.name !== 'login') {
        return next({ name: 'login' })
      }
      return next()
    }
    
    // 5. 有token但无用户信息，获取用户信息
    if (!userStore.userInfo.id || !userStore.userInfo.role) {
      try {
        await userStore.getUserInfo()
      } catch (error) {
        // 获取用户信息失败，清理token并跳转到登录页
        localStorage.removeItem('token')
        userStore.logout()
        if (to.name !== 'login') {
          return next({ name: 'login' })
        }
        return next()
      }
    }
    
    // 6. 角色权限校验与页面分流
    const userRole = userStore.userInfo.role
    
    // 6.1 普通用户权限校验（只能访问前台页面）
    if (userRole === 'user') {
      // 普通用户禁止访问后台管理页
      if (to.path.startsWith('/admin')) {
        return next({ name: '403' })
      }
      // 普通用户访问前台页面，直接放行
      return next()
    }
    
    // 6.2 管理员权限校验（只能访问后台管理页）
    if (userRole === 'system_admin' || userRole === 'admin') {
      // 管理员禁止访问前台普通用户页面
      if (['home', 'productDetail', 'search', 'list'].includes(to.name)) {
        // 根据管理员类型跳转到对应后台页面
        if (userRole === 'system_admin' && to.path !== '/admin/dashboard') {
          return next({ name: 'adminDashboard' })
        } else if (userRole === 'admin' && to.path !== '/admin/dashboard') {
          return next({ name: 'adminDashboard' })
        }
        return next(false) // 取消当前跳转
      }
      
      // 管理员内部权限细分
      if (to.path.startsWith('/admin/region')) {
        // 只有系统管理员可以访问区域管理
        if (userRole !== 'system_admin') {
          return next({ name: '403' })
        }
      }
      
      // 管理员访问后台页面，直接放行
      return next()
    }
    
    // 7. 角色异常处理（token存在但角色不存在或无效）
    console.error('无效的用户角色:', userRole)
    localStorage.removeItem('token')
    userStore.logout()
    if (to.name !== 'login') {
      return next({ name: 'login' })
    }
    return next()
    
  } catch (error) {
    // 处理异常情况
    console.error('路由守卫错误:', error)
    
    // 清理用户信息
    localStorage.removeItem('token')
    userStore.logout()
    
    // 避免从错误页面跳转导致循环
    if (to.name !== 'login' && !publicRoutes.includes(to.name)) {
      next({ name: 'login' })
    } else {
      next()
    }
  }
})

export default router