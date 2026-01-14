<template>
  <div class="dashboard-container">
    <!-- 顶部导航栏 -->
    <div class="top-header">
      <div class="header-left">
        <div class="logo">产品资料管理系统</div>
      </div>
      <div class="header-right">
        <div class="user-info">
          <span class="username">{{ userInfo.username }}</span>
          <span class="role">({{ getRoleName(userInfo.role) }})</span>
        </div>
        <van-dropdown-menu>
          <van-dropdown-item v-model="action" :options="actionOptions" @change="handleAction" />
        </van-dropdown-menu>
      </div>
    </div>

    <!-- 侧边栏导航 -->
    <div class="sidebar">
      <van-tree-select
        v-model:active-id="activeMenu"
        :items="menuItems"
        @click-nav-item="handleMenuClick"
        :selectable="false"
      />
    </div>

    <!-- 主内容区域 -->
    <div class="main-content">
      <!-- 面包屑导航 -->
      <div class="breadcrumb">
        <span class="breadcrumb-item">首页</span>
        <span class="breadcrumb-separator">/</span>
        <span class="breadcrumb-item active">仪表盘</span>
      </div>

      <!-- 欢迎信息 -->
      <div class="welcome-section">
        <h1>欢迎回来，{{ userInfo.username }}!</h1>
        <p>今天是 {{ currentDate }}，祝您工作愉快！</p>
      </div>

      <!-- 数据统计卡片 -->
      <div class="stats-cards">
        <van-card title="产品总数" :bordered="false">
          <div class="stats-number">{{ stats.productCount }}</div>
          <div class="stats-change">+{{ stats.productGrowth }}%</div>
        </van-card>
        <van-card title="用户总数" :bordered="false">
          <div class="stats-number">{{ stats.userCount }}</div>
          <div class="stats-change">+{{ stats.userGrowth }}%</div>
        </van-card>
        <van-card title="区域总数" :bordered="false">
          <div class="stats-number">{{ stats.regionCount }}</div>
          <div class="stats-change">+{{ stats.regionGrowth }}%</div>
        </van-card>
        <van-card title="管理员总数" :bordered="false">
          <div class="stats-number">{{ stats.adminCount }}</div>
          <div class="stats-change">+{{ stats.adminGrowth }}%</div>
        </van-card>
      </div>

      <!-- 图表区域 -->
      <div class="charts-section">
        <van-card title="产品增长趋势" :bordered="false">
          <div class="chart-container">
            <!-- 这里可以集成ECharts等图表库 -->
            <div class="chart-placeholder">产品增长趋势图表</div>
          </div>
        </van-card>
        <van-card title="用户分布" :bordered="false">
          <div class="chart-container">
            <!-- 这里可以集成ECharts等图表库 -->
            <div class="chart-placeholder">用户分布图表</div>
          </div>
        </van-card>
      </div>

      <!-- 最近活动 -->
      <div class="recent-activities">
        <van-card title="最近活动" :bordered="false">
          <van-cell-group inset>
            <van-cell v-for="activity in recentActivities" :key="activity.id">
              <template #title>
                <div class="activity-title">{{ activity.title }}</div>
              </template>
              <template #label>
                <div class="activity-time">{{ activity.time }}</div>
              </template>
            </van-cell>
          </van-cell-group>
        </van-card>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Card, TreeSelect, DropdownMenu, DropdownItem, Cell, CellGroup, showFailToast } from 'vant'
import { useUserStore } from '@/store/modules/user'
import { getDashboardStats } from '@/services/dashboard'

// 路由
const router = useRouter()

// 用户状态
const userStore = useUserStore()

// 响应式数据
const activeMenu = ref('dashboard')
const action = ref('profile')
const userInfo = ref(userStore.userInfo)
const stats = ref({
  productCount: 0,
  productGrowth: 0,
  userCount: 0,
  userGrowth: 0,
  regionCount: 0,
  regionGrowth: 0,
  adminCount: 0,
  adminGrowth: 0
})
const recentActivities = ref([
  { id: 1, title: '管理员添加了新用户', time: '2026-01-13 10:00:00' },
  { id: 2, title: '用户上传了新图片', time: '2026-01-13 09:30:00' },
  { id: 3, title: '系统更新了产品信息', time: '2026-01-13 08:45:00' },
  { id: 4, title: '管理员删除了过期产品', time: '2026-01-12 16:20:00' },
  { id: 5, title: '用户导出了产品列表', time: '2026-01-12 15:10:00' }
])

// 计算属性：当前日期
const currentDate = computed(() => {
  const date = new Date()
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  return `${year}-${month}-${day}`
})

// 下拉菜单选项
const actionOptions = [
  { text: '个人资料', value: 'profile' },
  { text: '修改密码', value: 'changePassword' },
  { text: '退出登录', value: 'logout' }
]

// 菜单配置
const menuItems = ref([
  {
    text: '仪表盘',
    id: 'dashboard',
    icon: 'dashboard',
    path: '/admin/dashboard'
  },
  {
    text: '用户管理',
    id: 'user',
    icon: 'user',
    children: [
      { text: '用户列表', id: 'user-list', path: '/admin/users' },
      { text: '角色管理', id: 'role-list', path: '/admin/roles' }
    ]
  },
  {
    text: '产品管理',
    id: 'product',
    icon: 'goods',
    children: [
      { text: '产品列表', id: 'product-list', path: '/admin/products' },
      { text: '产品分类', id: 'category-list', path: '/admin/categories' },
      { text: 'Excel导入导出', id: 'product-import-export', path: '/admin/products/import-export' }
    ]
  },
  {
    text: '区域管理',
    id: 'region',
    icon: 'location',
    path: '/admin/regions'
  },
  {
    text: '邀请码管理',
    id: 'invite',
    icon: 'coupon',
    path: '/admin/invite-codes'
  },
  {
    text: '系统设置',
    id: 'setting',
    icon: 'setting',
    children: [
      { text: '系统配置', id: 'system-setting', path: '/admin/settings' },
      { text: '操作日志', id: 'operation-log', path: '/admin/logs' }
    ]
  }
])

// 初始化数据
onMounted(async () => {
  await loadDashboardStats()
})

// 加载仪表盘统计数据
const loadDashboardStats = async () => {
  try {
    const response = await getDashboardStats()
    stats.value = response.stats
  } catch (error) {
    console.error('加载仪表盘统计数据失败:', error)
    showFailToast('加载统计数据失败')
  }
}

// 获取角色名称
const getRoleName = (role) => {
  const roleMap = {
    'system_admin': '系统管理员',
    'admin': '管理员',
    'user': '普通用户'
  }
  return roleMap[role] || role
}

// 处理菜单点击
const handleMenuClick = (item) => {
  if (item.path) {
    router.push(item.path)
  }
}

// 处理用户操作
const handleAction = (value) => {
  switch (value) {
    case 'profile':
      // 跳转到个人资料页面
      router.push('/admin/profile')
      break
    case 'changePassword':
      // 跳转到修改密码页面
      router.push('/admin/change-password')
      break
    case 'logout':
      // 退出登录
      userStore.logout()
      router.push('/login')
      break
  }
  // 重置下拉菜单
  action.value = 'profile'
}
</script>

<style lang="scss" scoped>
.dashboard-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #f5f5f5;
}

.top-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 60px;
  padding: 0 20px;
  background-color: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 100;
  
  .logo {
    font-size: 20px;
    font-weight: 600;
    color: #1989fa;
  }
  
  .user-info {
    display: flex;
    align-items: center;
    margin-right: 20px;
    
    .username {
      font-size: 16px;
      font-weight: 500;
      margin-right: 5px;
    }
    
    .role {
      font-size: 14px;
      color: #666;
    }
  }
}

.sidebar {
  width: 200px;
  height: calc(100vh - 60px);
  background-color: #fff;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
  overflow-y: auto;
  flex-shrink: 0;
}

.main-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.breadcrumb {
  margin-bottom: 20px;
  padding: 10px 0;
  border-bottom: 1px solid #eee;
  display: flex;
  align-items: center;
  font-size: 14px;
  color: #666;
}

.breadcrumb-item {
  cursor: pointer;
  color: #1989fa;
  margin-right: 5px;
}

.breadcrumb-item:hover {
  text-decoration: underline;
}

.breadcrumb-item.active {
  color: #666;
  cursor: default;
}

.breadcrumb-item.active:hover {
  text-decoration: none;
}

.breadcrumb-separator {
  margin: 0 5px;
  color: #ccc;
}

.welcome-section {
  margin-bottom: 30px;
  
  h1 {
    font-size: 24px;
    font-weight: 600;
    margin-bottom: 10px;
  }
  
  p {
    font-size: 14px;
    color: #666;
  }
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
  
  .van-card {
    height: 120px;
    display: flex;
    flex-direction: column;
    
    .stats-number {
      font-size: 32px;
      font-weight: 700;
      color: #1989fa;
      margin: 10px 0;
    }
    
    .stats-change {
      font-size: 14px;
      color: #52c41a;
    }
  }
}

.charts-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
  
  .van-card {
    height: 300px;
    
    .chart-container {
      height: 250px;
      display: flex;
      align-items: center;
      justify-content: center;
      
      .chart-placeholder {
        font-size: 18px;
        color: #999;
      }
    }
  }
}

.recent-activities {
  margin-bottom: 30px;
  
  .activity-title {
    font-size: 16px;
    font-weight: 500;
  }
  
  .activity-time {
    font-size: 14px;
    color: #666;
  }
}

// 响应式设计
@media (max-width: 768px) {
  .sidebar {
    width: 100%;
    height: auto;
    position: fixed;
    bottom: 0;
    left: 0;
    z-index: 100;
  }
  
  .main-content {
    padding-bottom: 100px;
  }
  
  .stats-cards {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    
    .van-card {
      height: 100px;
      
      .stats-number {
        font-size: 24px;
      }
    }
  }
  
  .charts-section {
    grid-template-columns: 1fr;
    
    .van-card {
      height: 250px;
      
      .chart-container {
        height: 200px;
      }
    }
  }
}
</style>