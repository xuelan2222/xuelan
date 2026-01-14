<template>
  <div class="list-container">
    <!-- 顶部导航栏 -->
    <van-nav-bar
      title="要货清单"
      fixed
      left-text="返回"
      @click-left="goBack"
    />

    <!-- 主内容区域 -->
    <div class="main-content">
      <!-- 用户信息 -->
      <div class="user-info-section">
        <div class="user-info">
          <div class="username">用户: {{ userStore.userInfo.username }}</div>
          <div class="user-region">区域: {{ userStore.userInfo.region_name }}</div>
        </div>
      </div>

      <!-- 清单信息 -->
      <div class="list-info-section">
        <div class="list-date">
          <span class="label">创建日期:</span>
          <span class="value">{{ formatDate(listStore.list.created_at) }}</span>
        </div>
        <div class="list-update-date">
          <span class="label">更新日期:</span>
          <span class="value">{{ formatDate(listStore.list.updated_at) }}</span>
        </div>
      </div>

      <!-- 商品列表 -->
      <div class="product-list-section">
        <!-- 列表为空状态 -->
        <div v-if="listStore.isEmpty" class="empty-state">
          <van-empty description="清单为空，快去添加商品吧" />
          <van-button type="primary" block size="large" @click="goToHome">
            去添加商品
          </van-button>
        </div>

        <!-- 列表内容 -->
        <div v-else id="list-content">
          <!-- 列表头部 -->
          <div class="list-header">
            <div class="header-item item-info">商品信息</div>
            <div class="header-item item-quantity">数量</div>
            <div class="header-item item-price">单价</div>
            <div class="header-item item-subtotal">小计</div>
          </div>

          <!-- 列表项 -->
          <div
            v-for="item in listStore.list.items"
            :key="item.id"
            class="list-item"
          >
            <!-- 商品信息 -->
            <div class="item-info">
              <div class="item-name">{{ item.product.name }}</div>
              <div class="item-spec">{{ item.product.spec }}</div>
              <div class="item-manufacturer">{{ item.product.manufacturer }}</div>
            </div>

            <!-- 数量 -->
            <div class="item-quantity">
              <van-stepper
                v-model="item.quantity"
                :min="1"
                :max="9999"
                :step="1"
                @change="onQuantityChange(item.id, $event)"
              />
            </div>

            <!-- 单价 -->
            <div class="item-price">¥{{ item.product.price.toFixed(2) }}</div>

            <!-- 小计 -->
            <div class="item-subtotal">¥{{ (item.quantity * item.product.price).toFixed(2) }}</div>

            <!-- 删除按钮 -->
            <div class="item-delete">
              <van-icon name="cross" @click="onDelete(item.id)" />
            </div>
          </div>
        </div>
      </div>

      <!-- 合计信息 -->
      <div v-if="!listStore.isEmpty" class="total-info-section">
        <div class="total-item">
          <span class="label">数量合计:</span>
          <span class="value">{{ listStore.totalQuantity }}</span>
        </div>
        <div class="total-item">
          <span class="label">金额合计:</span>
          <span class="value total-amount">¥{{ listStore.totalAmount.toFixed(2) }}</span>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div v-if="!listStore.isEmpty" class="action-buttons">
        <van-button type="default" block @click="onClear">
          清空清单
        </van-button>
        <van-button type="primary" block @click="onExport">
          导出清单
        </van-button>
      </div>
    </div>

    <!-- 底部导航栏 -->
    <van-tabbar v-model="active" route>
      <van-tabbar-item name="home" icon="home-o">首页</van-tabbar-item>
      <van-tabbar-item name="search" icon="search">搜索</van-tabbar-item>
      <van-tabbar-item name="list" icon="list">清单</van-tabbar-item>
      <van-tabbar-item name="profile" icon="user-o">我的</van-tabbar-item>
    </van-tabbar>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { NavBar, Empty, Button, Tabbar, TabbarItem, Stepper, Icon } from 'vant'
import { useListStore } from '@/store/modules/list'
import { useUserStore } from '@/store/modules/user'
import { Toast } from 'vant'

// 组件内路由守卫 - 清单页
// 使用组合式 API 实现路由守卫功能
const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

// 路由访问验证
const validateRouteAccess = () => {
  // 检查用户是否已登录
  const token = localStorage.getItem('token')
  if (!token) {
    // 未登录用户，根据全局守卫跳转到登录页
    // 这里不直接跳转，避免与全局守卫冲突
    return false
  }
  
  // 检查用户角色与页面权限
  if (userStore.userInfo.role === 'system_admin' || userStore.userInfo.role === 'admin') {
    // 管理员角色，根据全局守卫跳转到后台页面
    // 这里不直接跳转，避免与全局守卫冲突
    return false
  }
  
  // 普通用户可以访问清单页
  return true
}

// 初始权限验证
if (!validateRouteAccess()) {
  // 权限验证失败，不执行后续逻辑
  // 全局守卫会处理跳转
} else {

// 路由（已在组件内守卫中声明）

// 状态管理
const listStore = useListStore()
const userStore = useUserStore()

// 响应式数据
const active = ref('list')

// 初始化数据
onMounted(() => {
  // 加载清单
  listStore.loadList()
})

// 返回上一页
const goBack = () => {
  router.back()
}

// 跳转到首页
const goToHome = () => {
  router.push('/home')
}

// 格式化日期
const formatDate = (dateString) => {
  const date = new Date(dateString)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

// 数量变化
const onQuantityChange = (itemId, quantity) => {
  listStore.updateItemQuantity(itemId, quantity)
}

// 删除项目
const onDelete = (itemId) => {
  listStore.removeFromList(itemId)
}

// 清空清单
const onClear = () => {
  listStore.clearList()
}

// 导出清单
const onExport = () => {
  listStore.exportListAsImage('list-content')
}
}
</script>

<style lang="scss" scoped>
.list-container {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-bottom: 50px; // 为底部导航栏预留空间
}

.main-content {
  padding: 60px 15px 20px; // 为顶部导航栏预留空间
}

.user-info-section {
  background-color: #fff;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 15px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  
  .user-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    .username {
      font-size: 16px;
      font-weight: 600;
    }
    
    .user-region {
      font-size: 14px;
      color: #666;
    }
  }
}

.list-info-section {
  background-color: #fff;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 15px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  
  .list-date,
  .list-update-date {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
    
    &:last-child {
      margin-bottom: 0;
    }
    
    .label {
      font-size: 14px;
      color: #666;
    }
    
    .value {
      font-size: 14px;
      font-weight: 500;
    }
  }
}

.product-list-section {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 15px;
  
  .empty-state {
    padding: 40px 20px;
    text-align: center;
  }
}

#list-content {
  overflow-x: auto;
}

.list-header {
  display: grid;
  grid-template-columns: 1fr 80px 80px 80px;
  gap: 10px;
  padding: 15px;
  background-color: #f5f5f5;
  font-weight: 600;
  font-size: 14px;
  color: #333;
  border-bottom: 1px solid #eee;
}

.list-item {
  display: grid;
  grid-template-columns: 1fr 80px 80px 80px;
  gap: 10px;
  padding: 15px;
  border-bottom: 1px solid #eee;
  position: relative;
  
  &:last-child {
    border-bottom: none;
  }
  
  .item-info {
    .item-name {
      font-size: 16px;
      font-weight: 500;
      margin-bottom: 5px;
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
    }
    
    .item-spec,
    .item-manufacturer {
      font-size: 12px;
      color: #666;
      margin-bottom: 3px;
    }
  }
  
  .item-quantity {
    display: flex;
    align-items: center;
  }
  
  .item-price,
  .item-subtotal {
    display: flex;
    align-items: center;
    font-size: 14px;
  }
  
  .item-delete {
    position: absolute;
    top: 15px;
    right: 15px;
    color: #ff4d4f;
    cursor: pointer;
  }
}

.total-info-section {
  background-color: #fff;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 15px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  
  .total-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
    
    &:last-child {
      margin-bottom: 0;
    }
    
    .label {
      font-size: 16px;
      font-weight: 500;
    }
    
    .value {
      font-size: 16px;
      font-weight: 600;
    }
    
    .total-amount {
      color: #ee0a24;
      font-size: 20px;
    }
  }
}

.action-buttons {
  display: flex;
  gap: 10px;
  
  .van-button {
    flex: 1;
  }
}

// 响应式设计
@media (max-width: 480px) {
  .main-content {
    padding: 60px 10px 20px;
  }
  
  .list-header,
  .list-item {
    grid-template-columns: 1fr 60px 60px 60px;
  }
  
  .list-item {
    padding: 10px;
  }
  
  .item-info {
    .item-name {
      font-size: 14px;
    }
    
    .item-spec,
    .item-manufacturer {
      font-size: 12px;
    }
  }
  
  .item-quantity {
    .van-stepper {
      width: 100%;
    }
  }
}
</style>