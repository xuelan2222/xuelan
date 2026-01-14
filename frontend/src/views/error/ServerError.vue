<template>
  <div class="error-container">
    <div class="error-code">500</div>
    <div class="error-message">服务器内部错误</div>
    <van-button type="primary" @click="goToHome">返回首页</van-button>
  </div>
</template>

<script setup>
import { Button } from 'vant'
import { useRouter } from 'vue-router'

const router = useRouter()

const goToHome = () => {
  router.push('/home')
}
</script>

<style lang="scss" scoped>
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  text-align: center;
  padding: 20px;

  .error-code {
    font-size: 80px;
    font-weight: bold;
    color: #1989fa;
    margin-bottom: 20px;
  }

  .error-message {
    font-size: 18px;
    color: #666;
    margin-bottom: 40px;
  }
}
</style>