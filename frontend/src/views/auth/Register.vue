<template>
  <div class="register-container">
    <div class="register-form-wrapper">
      <!-- 系统标题 -->
      <div class="system-title">产品资料管理系统</div>
      <div class="system-subtitle">专业的产品资料管理与展示平台</div>

      <!-- 注册表单 -->
      <van-form @submit="onRegister">
        <!-- 用户名 -->
        <van-field
          v-model="registerForm.username"
          name="username"
          label="用户名"
          placeholder="请输入用户名"
          :rules="[{ required: true, message: '请输入用户名' }, { min: 3, max: 20, message: '用户名长度在3-20个字符之间' }]"
        />

        <!-- 密码 -->
        <van-field
          v-model="registerForm.password"
          type="password"
          name="password"
          label="密码"
          placeholder="请输入密码"
          :rules="[{ required: true, message: '请输入密码' }, { min: 6, max: 20, message: '密码长度在6-20个字符之间' }]"
          show-password
        />

        <!-- 确认密码 -->
        <van-field
          v-model="registerForm.confirmPassword"
          type="password"
          name="confirmPassword"
          label="确认密码"
          placeholder="请再次输入密码"
          :rules="[
            { required: true, message: '请再次输入密码' },
            { validator: validatePassword, message: '两次输入的密码不一致' }
          ]"
          show-password
        />

        <!-- 邀请码 -->
        <van-field
          v-model="registerForm.inviteCode"
          name="inviteCode"
          label="邀请码"
          placeholder="请输入邀请码"
          :rules="[{ required: true, message: '请输入邀请码' }]"
        />

        <!-- 验证邀请码按钮 -->
        <div class="verify-button-container">
          <van-button
            type="default"
            block
            @click="verifyInviteCode"
            :loading="isVerifyingInviteCode"
            size="small"
          >
            验证邀请码
          </van-button>
        </div>

        <!-- 邮箱 -->
        <van-field
          v-model="registerForm.email"
          name="email"
          label="邮箱"
          placeholder="请输入邮箱"
          :rules="[
            { required: true, message: '请输入邮箱' },
            { type: 'email', message: '请输入正确的邮箱格式' }
          ]"
        />

        <!-- 手机号 -->
        <van-field
          v-model="registerForm.phone"
          name="phone"
          label="手机号"
          placeholder="请输入手机号"
          :rules="[
            { required: true, message: '请输入手机号' },
            { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号格式' }
          ]"
        />

        <!-- 区域选择 -->
        <van-field
          v-model="registerForm.regionName"
          name="region"
          label="所属区域"
          placeholder="请选择所属区域"
          :rules="[{ required: true, message: '请选择所属区域' }]"
          is-link
          readonly
          @click="showRegionPicker = true"
        />

        <!-- 区域选择器 -->
        <van-popup
          v-model:show="showRegionPicker"
          position="bottom"
          round
          style="height: 30%"
        >
          <van-picker
            :columns="regions"
            @confirm="onRegionConfirm"
            @cancel="showRegionPicker = false"
          />
        </van-popup>

        <!-- 验证码 -->
        <div class="captcha-field">
          <van-field
            v-model="registerForm.captcha"
            name="captcha"
            label="验证码"
            placeholder="请输入验证码"
            :rules="[{ required: true, message: '请输入验证码' }]"
          />
          <div class="captcha-image">
            <img :src="captchaUrl" @click="refreshCaptcha" alt="验证码" />
          </div>
        </div>

        <!-- 同意协议 -->
        <div class="agreement">
          <van-checkbox v-model="registerForm.agreement">
            我已阅读并同意 <a href="javascript:;" @click="showAgreement">《用户协议》</a> 和 <a href="javascript:;" @click="showPrivacy">《隐私政策》</a>
          </van-checkbox>
        </div>

        <!-- 注册按钮 -->
        <div class="register-button-container">
          <van-button
            type="primary"
            block
            native-type="submit"
            :loading="isLoading"
            size="large"
          >
            注册
          </van-button>
        </div>

        <!-- 登录链接 -->
        <div class="login-link">
          已有账号? <a href="javascript:;" @click="goToLogin">立即登录</a>
        </div>
      </van-form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Form, Field, Button, Checkbox, Popup, Picker, showFailToast, showToast, showSuccessToast } from 'vant'
import { useUserStore } from '@/store/modules/user'
import { getRegions } from '@/services/region'
import { generateRandomCode, generateCaptchaImage, validateCaptcha } from '@/utils/captcha'

// 路由
const router = useRouter()

// 用户状态
const userStore = useUserStore()

// 响应式数据
const isLoading = ref(false)
const isVerifyingInviteCode = ref(false)
const showRegionPicker = ref(false)
const captchaUrl = ref('')
const correctCaptcha = ref('') // 存储正确的验证码
const regions = ref([])

// 注册表单
const registerForm = reactive({
  username: '',
  password: '',
  confirmPassword: '',
  inviteCode: '',
  email: '',
  phone: '',
  region_id: '',
  regionName: '',
  captcha: '',
  agreement: false
})

// 初始化数据
onMounted(() => {
  // 加载验证码
  loadCaptcha()
  
  // 加载区域列表
  loadRegions()
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

// 加载区域列表
const loadRegions = async () => {
  try {
    const response = await getRegions()
    regions.value = response.regions.map(region => ({
      text: region.name,
      value: region.id
    }))
  } catch (error) {
    showFailToast('区域列表加载失败')
  }
}

// 验证密码
const validatePassword = (value, rule) => {
  return value === registerForm.password
}

// 验证邀请码
const verifyInviteCode = async () => {
  if (!registerForm.inviteCode) {
    showToast('请输入邀请码')
    return
  }
  
  try {
    isVerifyingInviteCode.value = true
    await userStore.validateInviteCode(registerForm.inviteCode)
    showSuccessToast('邀请码验证成功')
  } catch (error) {
    console.error('邀请码验证失败:', error)
  } finally {
    isVerifyingInviteCode.value = false
  }
}

// 区域选择确认
const onRegionConfirm = ({ selectedOptions }) => {
  const region = selectedOptions[0]
  registerForm.region_id = region.value
  registerForm.regionName = region.text
  showRegionPicker.value = false
}

// 显示用户协议
const showAgreement = () => {
  Toast('用户协议功能暂未实现')
}

// 显示隐私政策
const showPrivacy = () => {
  Toast('隐私政策功能暂未实现')
}

// 注册
const onRegister = async () => {
  if (!registerForm.agreement) {
    Toast('请阅读并同意用户协议和隐私政策')
    return
  }
  
  // 先验证前端验证码
  if (!validateCaptcha(registerForm.captcha, correctCaptcha.value)) {
    showFailToast('验证码错误')
    // 刷新验证码
    loadCaptcha()
    return
  }
  
  try {
    isLoading.value = true
    
    // 调用注册API
    await userStore.register(registerForm)
    
    showSuccessToast('注册成功')
    
    // 跳转到登录页面
    router.push('/login')
  } catch (error) {
    console.error('注册失败:', error)
    // 注册失败时刷新验证码
    loadCaptcha()
  } finally {
    isLoading.value = false
  }
}

// 跳转到登录页面
const goToLogin = () => {
  router.push('/login')
}
</script>

<style lang="scss" scoped>
.register-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background-color: #f5f5f5;
  padding: 20px;
}

.register-form-wrapper {
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

.verify-button-container {
  margin: 10px 0 20px;
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

.agreement {
  margin: 20px 0;
  font-size: 12px;
  color: #666;
  
  a {
    color: #1989fa;
    text-decoration: none;
  }
}

.register-button-container {
  margin: 30px 0;
}

.login-link {
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
  .register-form-wrapper {
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