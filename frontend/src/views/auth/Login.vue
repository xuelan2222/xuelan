<template>
  <div class="login-container">
    <div class="login-form-wrapper">
      <!-- 系统标题 -->
      <div class="system-title">产品资料管理系统</div>
      <div class="system-subtitle">专业的产品资料管理与展示平台</div>

      <!-- 登录表单 -->
      <van-form @submit="onLogin">
        <!-- 用户名 -->
        <van-field
          v-model="loginForm.username"
          name="username"
          label="用户名"
          placeholder="请输入用户名"
          :rules="[{ required: true, message: '请输入用户名' }]"
        />

        <!-- 密码 -->
        <van-field
          v-model="loginForm.password"
          type="password"
          name="password"
          label="密码"
          placeholder="请输入密码"
          :rules="[{ required: true, message: '请输入密码' }]"
          show-password
        />

        <!-- 验证码 -->
        <div class="captcha-field">
          <van-field
            v-model="loginForm.captcha"
            name="captcha"
            label="验证码"
            placeholder="请输入验证码"
            :rules="[{ required: true, message: '请输入验证码' }]"
          />
          <div class="captcha-image">
            <img :src="captchaUrl" @click="refreshCaptcha" alt="验证码" />
          </div>
        </div>

        <!-- 记住密码 -->
        <div class="remember-me">
          <van-checkbox v-model="loginForm.rememberMe">记住密码</van-checkbox>
          <div class="forgot-password" @click="onForgotPassword">忘记密码?</div>
        </div>

        <!-- 登录按钮 -->
        <div class="login-button-container">
          <van-button
            type="primary"
            block
            native-type="submit"
            :loading="isLoading"
            size="large"
          >
            登录
          </van-button>
        </div>

        <!-- 注册链接 -->
        <div class="register-link">
          还没有账号? <a href="javascript:;" @click="goToRegister">立即注册</a>
        </div>
      </van-form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Form, Field, Button, Checkbox, showFailToast, showToast, showSuccessToast } from 'vant'
import { useUserStore } from '@/store/modules/user'
import { generateRandomCode, generateCaptchaImage, validateCaptcha } from '@/utils/captcha'
import { debugLogin } from '@/utils/login-debug'

// 路由
const router = useRouter()

// 用户状态
const userStore = useUserStore()

// 响应式数据
const loginForm = ref({
  username: '',
  password: '',
  captcha: '',
  rememberMe: false
})
const isLoading = ref(false)
const captchaUrl = ref('')
const correctCaptcha = ref('') // 存储正确的验证码

// 初始化数据
onMounted(() => {
  // 加载验证码
  loadCaptcha()
  
  // 加载记住的密码
  loadRememberedPassword()
})

// 加载验证码
const loadCaptcha = () => {
  try {
    // 生成随机验证码
    const code = generateRandomCode()
    correctCaptcha.value = code
    
    // 生成验证码图片
    captchaUrl.value = generateCaptchaImage(code)
  } catch (error) {
    console.error('验证码生成失败:', error)
    showFailToast('验证码加载失败')
  }
}

// 刷新验证码
const refreshCaptcha = () => {
  loadCaptcha()
}

// 加载记住的密码
const loadRememberedPassword = () => {
  const rememberedUser = localStorage.getItem('rememberedUser')
  if (rememberedUser) {
    const { username, password } = JSON.parse(rememberedUser)
    loginForm.value.username = username
    loginForm.value.password = password
    loginForm.value.rememberMe = true
  }
}

// 登录
const onLogin = async () => {
  try {
    console.log('=== 开始登录流程 ===')
    console.log('登录表单数据:', loginForm.value)
    
    // 先验证前端验证码
    if (!validateCaptcha(loginForm.value.captcha, correctCaptcha.value)) {
      showFailToast('验证码错误')
      console.log('验证码验证失败:', loginForm.value.captcha, 'vs', correctCaptcha.value)
      // 刷新验证码
      loadCaptcha()
      return
    }
    
    console.log('验证码验证成功')
    isLoading.value = true
    
    // 调用登录API
    console.log('准备调用登录API')
    await userStore.login({
      username: loginForm.value.username,
      password: loginForm.value.password
    })
    
    console.log('登录API调用成功')
    
    // 保存记住的密码
    if (loginForm.value.rememberMe) {
      localStorage.setItem('rememberedUser', JSON.stringify({
        username: loginForm.value.username,
        password: loginForm.value.password
      }))
      console.log('记住密码已保存')
    } else {
      localStorage.removeItem('rememberedUser')
      console.log('记住密码已移除')
    }
    
    // 跳转到相应页面
    console.log('准备跳转页面')
    redirectAfterLogin()
  } catch (error) {
    console.error('=== 登录流程失败 ===')
    console.error('错误类型:', error.constructor.name)
    console.error('错误信息:', error.message)
    console.error('错误详情:', error)
    
    if (error.response) {
      console.error('响应状态:', error.response.status)
      console.error('响应数据:', error.response.data)
    }
    
    // 登录失败时刷新验证码
    loadCaptcha()
  } finally {
    isLoading.value = false
    console.log('=== 登录流程结束 ===')
  }
}

// 登录后跳转
const redirectAfterLogin = async () => {
  const userStore = useUserStore()
  
  console.log('\n=== 开始跳转逻辑 ===')
  console.log('用户角色:', userStore.userInfo.role)
  console.log('用户信息:', userStore.userInfo)
  console.log('isSystemAdmin:', userStore.isSystemAdmin)
  console.log('isAdmin:', userStore.isAdmin)
  console.log('isLogin:', userStore.isLogin)
  
  // 定义跳转目标
  const targetRoute = userStore.isSystemAdmin || userStore.isAdmin 
    ? '/admin/dashboard' 
    : '/home'
  
  console.log('计算跳转目标:', targetRoute)
  
  // 重试机制，最多重试3次
  let retryCount = 0
  const maxRetries = 3
  const retryDelay = 500 // 毫秒
  
  const attemptRedirect = async () => {
    try {
      console.log(`尝试跳转 (${retryCount + 1}/${maxRetries}):`, targetRoute)
      
      // 使用replace而不是push，避免返回登录页
      await router.replace(targetRoute)
      
      console.log('跳转成功:', targetRoute)
      return true
    } catch (error) {
      console.error(`跳转失败 (${retryCount + 1}/${maxRetries}):`, error)
      
      retryCount++
      
      if (retryCount < maxRetries) {
        console.log(`等待${retryDelay}ms后重试...`)
        await new Promise(resolve => setTimeout(resolve, retryDelay))
        return attemptRedirect()
      } else {
        console.error('所有重试都失败了')
        return false
      }
    }
  }
  
  // 执行跳转
  const isSuccess = await attemptRedirect()
  
  if (!isSuccess) {
    console.error('跳转失败，尝试备选方案')
    
    try {
      // 备选方案1: 重新获取用户信息后再跳转
      console.log('尝试备选方案1: 重新获取用户信息')
      await userStore.getUserInfo()
      await router.replace(targetRoute)
      console.log('备选方案1成功')
    } catch (error) {
      console.error('备选方案1失败:', error)
      
      try {
        // 备选方案2: 直接刷新页面
        console.log('尝试备选方案2: 直接刷新页面')
        window.location.href = targetRoute
        console.log('备选方案2成功')
      } catch (error) {
        console.error('所有跳转方案都失败了')
        // 最终方案: 显示成功提示，让用户手动操作
        showSuccessToast('登录成功，但跳转失败，请手动访问后台页面')
      }
    }
  }
  
  console.log('=== 跳转逻辑结束 ===')
}

// 忘记密码
const onForgotPassword = () => {
  showToast('忘记密码功能暂未实现')
}

// 跳转到注册页面
const goToRegister = () => {
  router.push('/register')
}
</script>

<style lang="scss" scoped>
.login-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background-color: #f5f5f5;
  padding: 20px;
}

.login-form-wrapper {
  width: 100%;
  max-width: 400px;
  background-color: #fff;
  border-radius: 8px;
  padding: 30px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.system-title {
  font-size: 24px;
  font-weight: 700;
  text-align: center;
  margin-bottom: 10px;
  color: #1989fa;
}

.system-subtitle {
  font-size: 14px;
  text-align: center;
  margin-bottom: 30px;
  color: #666;
}

.captcha-field {
  display: flex;
  align-items: center;
  gap: 10px;
  
  .van-field {
    flex: 1;
  }
  
  .captcha-image {
    width: 100px;
    height: 44px;
    
    img {
      width: 100%;
      height: 100%;
      border-radius: 4px;
      cursor: pointer;
    }
  }
}

.remember-me {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 20px 0;
  
  .forgot-password {
    color: #1989fa;
    font-size: 14px;
    cursor: pointer;
  }
}

.login-button-container {
  margin: 30px 0;
}

.register-link {
  text-align: center;
  font-size: 14px;
  color: #666;
  
  a {
    color: #1989fa;
    text-decoration: none;
  }
}

// 响应式设计
@media (max-width: 480px) {
  .login-form-wrapper {
    padding: 20px;
  }
  
  .system-title {
    font-size: 20px;
  }
  
  .captcha-image {
    width: 80px;
  }
}
</style>