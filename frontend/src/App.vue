<template>
  <div class="app-container">
    <router-view />
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useUserStore } from './store/modules/user'
import { useRouter } from 'vue-router'

const userStore = useUserStore()
const router = useRouter()

// 页面加载时检查用户登录状态
onMounted(() => {
  // 从本地存储获取token
  const token = localStorage.getItem('token')
  if (token) {
    // 验证token并获取用户信息
    userStore.getUserInfo()
      .catch(() => {
        // token无效，清除本地存储并跳转到登录页
        localStorage.removeItem('token')
        router.push('/login')
      })
  } else {
    // 没有token，跳转到登录页
    const publicRoutes = ['login', 'register', 'validate-invite-code']
    if (!publicRoutes.includes(router.currentRoute.value.name)) {
      router.push('/login')
    }
  }
})
</script>

<style lang="scss">
.app-container {
  min-height: 100vh;
  background-color: #f5f5f5;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
}
</style>