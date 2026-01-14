<template>
  <div class="product-list-container">
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
        <span class="breadcrumb-item">产品管理</span>
        <span class="breadcrumb-separator">/</span>
        <span class="breadcrumb-item active">产品列表</span>
      </div>

      <!-- 页面标题和操作按钮 -->
      <div class="page-header">
        <h1>产品列表</h1>
        <div class="action-buttons">
          <van-button type="primary" @click="goToAddProduct">
            <van-icon name="plus" /> 添加产品
          </van-button>
          <van-button type="default" @click="goToImportExport">
            <van-icon name="document" /> Excel导入导出
          </van-button>
        </div>
      </div>

      <!-- 搜索和筛选区域 -->
      <div class="search-filter-section">
        <van-collapse v-model="activeFilter">
          <van-collapse-item title="搜索" name="search">
            <div class="search-form">
              <van-field
                v-model="searchForm.keyword"
                placeholder="搜索产品名称、编码"
                left-icon="search"
                @input="onSearchInput"
              />
              <van-button type="primary" @click="onSearch">搜索</van-button>
              <van-button type="default" @click="onReset">重置</van-button>
            </div>
          </van-collapse-item>
          <van-collapse-item title="筛选" name="filter">
            <div class="filter-form">
              <div class="filter-row">
                <div class="filter-item">
                  <label>分类:</label>
                  <van-dropdown-menu>
                    <van-dropdown-item v-model="searchForm.categoryId" :options="categoryOptions" />
                  </van-dropdown-menu>
                </div>
                <div class="filter-item">
                  <label>区域:</label>
                  <van-dropdown-menu>
                    <van-dropdown-item v-model="searchForm.regionId" :options="regionOptions" />
                  </van-dropdown-menu>
                </div>
              </div>
              <div class="filter-row">
                <div class="filter-item">
                  <label>状态:</label>
                  <van-dropdown-menu>
                    <van-dropdown-item v-model="searchForm.status" :options="statusOptions" />
                  </van-dropdown-menu>
                </div>
                <div class="filter-item">
                  <label>价格范围:</label>
                  <div class="price-range">
                    <van-field
                      v-model="searchForm.minPrice"
                      placeholder="最小价格"
                      style="width: 100px"
                    />
                    <span class="price-separator">-</span>
                    <van-field
                      v-model="searchForm.maxPrice"
                      placeholder="最大价格"
                      style="width: 100px"
                    />
                  </div>
                </div>
              </div>
              <div class="filter-actions">
                <van-button type="primary" @click="onFilter">筛选</van-button>
                <van-button type="default" @click="onResetFilter">重置筛选</van-button>
              </div>
            </div>
          </van-collapse-item>
        </van-collapse>
      </div>

      <!-- 产品列表 -->
      <div class="product-list">
        <!-- 批量操作栏 -->
        <div class="batch-actions" v-if="selectedProducts.length > 0">
          <span>已选择 {{ selectedProducts.length }} 项</span>
          <van-button type="primary" size="small" @click="batchDelete">批量删除</van-button>
          <van-button type="default" size="small" @click="batchStatusChange('active')">批量上架</van-button>
          <van-button type="default" size="small" @click="batchStatusChange('inactive')">批量下架</van-button>
          <van-button type="default" size="small" @click="clearSelection">取消选择</van-button>
        </div>

        <!-- 列表内容 -->
        <div class="product-table" v-if="!isLoading">
          <table>
            <thead>
              <tr>
                <th><input type="checkbox" v-model="selectAll" @change="toggleSelectAll"></th>
                <th>产品名称</th>
                <th>产品编码</th>
                <th>价格</th>
                <th>库存</th>
                <th>区域</th>
                <th>状态</th>
                <th>创建时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="product in products" :key="product.id" @click="handleRowClick(product)">
                <td><input type="checkbox" v-model="selectedProducts" :value="product" @click.stop="toggleSelect(product)"></td>
                <td>{{ product.name }}</td>
                <td>{{ product.code }}</td>
                <td>¥{{ product.price?.toFixed(2) || '0.00' }}</td>
                <td>{{ product.stock || 0 }}</td>
                <td>{{ product.region?.name || '-' }}</td>
                <td>{{ product.status === 'active' ? '上架' : '下架' }}</td>
                <td>{{ product.created_at }}</td>
                <td>
                  <div class="operation-buttons">
                    <van-button type="primary" size="small" @click.stop="goToEditProduct(product.id)">
                      编辑
                    </van-button>
                    <van-button type="danger" size="small" @click.stop="handleDelete(product.id)">
                      删除
                    </van-button>
                    <van-button
                      :type="product.status === 'active' ? 'default' : 'primary'"
                      size="small"
                      @click.stop="toggleProductStatus(product)"
                    >
                      {{ product.status === 'active' ? '下架' : '上架' }}
                    </van-button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 分页 -->
        <div class="pagination">
          <van-pagination
            v-model:current-page="pagination.current"
            v-model:page-size="pagination.pageSize"
            :total-items="total"
            :page-count="pageCount"
            @change="onPageChange"
            show-page-size
            :page-sizes="[10, 20, 50, 100]"
            layout="prev, pager, next, jumper, info, sizes"
          />
        </div>

        <!-- 空状态 -->
        <div v-if="products.length === 0 && !isLoading" class="empty-state">
          <van-empty description="暂无产品数据" />
        </div>
      </div>
    </div>

    <!-- 删除确认对话框 -->
    <van-dialog
      v-model:show="showDeleteDialog"
      title="删除确认"
      content="确定要删除选中的产品吗?"
      show-cancel-button
      @confirm="confirmDelete"
    />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Button, Collapse, CollapseItem, Dialog, Empty, TreeSelect, DropdownMenu, DropdownItem, Icon, Pagination, Field, showFailToast } from 'vant'
import { useUserStore } from '@/store/modules/user'
import { getProducts } from '@/services/product'
import { getCategories } from '@/services/category'
import { getRegions } from '@/services/region'

// 路由
const router = useRouter()

// 用户状态
const userStore = useUserStore()

// 响应式数据
const activeMenu = ref('product-list')
const action = ref('profile')
const activeFilter = ref(['search'])
const userInfo = ref(userStore.userInfo)
const isLoading = ref(false)
const products = ref([])
const selectedProducts = ref([])
const selectAll = ref(false)
const showDeleteDialog = ref(false)
const categoryOptions = ref([])
const regionOptions = ref([])
const categories = ref([])
const regions = ref([])
const toDeleteId = ref(null)

// 搜索表单
const searchForm = reactive({
  keyword: '',
  categoryId: '',
  regionId: '',
  status: '',
  minPrice: '',
  maxPrice: ''
})

// 分页配置
const pagination = reactive({
  current: 1,
  pageSize: 20
})

// 总数据量
const total = ref(0)

// 下拉菜单选项
const actionOptions = [
  { text: '个人资料', value: 'profile' },
  { text: '修改密码', value: 'changePassword' },
  { text: '退出登录', value: 'logout' }
]

// 产品状态选项
const statusOptions = [
  { text: '全部', value: '' },
  { text: '上架', value: 'active' },
  { text: '下架', value: 'inactive' }
]

// 菜单配置
const menuItems = ref([
  { text: '仪表盘', id: 'dashboard', path: '/admin/dashboard' },
  { 
    text: '产品管理', 
    id: 'product',
    children: [
      { text: '产品列表', id: 'product-list', path: '/admin/products' },
      { text: '产品分类', id: 'category-list', path: '/admin/categories' },
      { text: 'Excel导入导出', id: 'product-import-export', path: '/admin/products/import-export' }
    ]
  },
  { text: '用户管理', id: 'user', path: '/admin/users' },
  { text: '区域管理', id: 'region', path: '/admin/regions' },
  { text: '邀请码管理', id: 'invite', path: '/admin/invite-codes' },
  { text: '系统设置', id: 'setting', path: '/admin/settings' }
])

// 表格列配置
const columns = [
  {
    type: 'selection',
    width: 40,
    fixed: 'left'
  },
  {
    title: '产品名称',
    dataIndex: 'name',
    key: 'name',
    ellipsis: true
  },
  {
    title: '产品编码',
    dataIndex: 'code',
    key: 'code',
    width: 150
  },
  {
    title: '分类',
    dataIndex: 'category',
    key: 'category',
    width: 120,
    ellipsis: true,
    customRender: ({ row }) => row.category?.name || '-'
  },
  {
    title: '价格',
    dataIndex: 'price',
    key: 'price',
    width: 100,
    customRender: ({ row }) => `¥${row.price.toFixed(2)}`
  },
  {
    title: '库存',
    dataIndex: 'stock',
    key: 'stock',
    width: 100
  },
  {
    title: '区域',
    dataIndex: 'region',
    key: 'region',
    width: 120,
    ellipsis: true,
    customRender: ({ row }) => row.region?.name || '-'
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    width: 100,
    customRender: ({ row }) => {
      return row.status === 'active' ? '上架' : '下架'
    }
  },
  {
    title: '创建时间',
    dataIndex: 'created_at',
    key: 'created_at',
    width: 180
  },
  {
    title: '操作',
    key: 'operation',
    width: 200,
    fixed: 'right'
  }
]

// 计算属性：总页数
const pageCount = computed(() => {
  return Math.ceil(total.value / pagination.pageSize)
})

// 初始化数据
onMounted(async () => {
  await loadCategories()
  await loadRegions()
  await loadProducts()
})

// 加载分类列表
const loadCategories = async () => {
  try {
    const response = await getCategories()
    categories.value = response.categories
    categoryOptions.value = [
      { text: '全部', value: '' },
      ...response.categories.map(category => ({
        text: category.name,
        value: category.id
      }))
    ]
  } catch (error) {
    console.error('加载分类失败:', error)
    showFailToast('加载分类失败')
  }
}

// 加载区域列表
const loadRegions = async () => {
  try {
    const response = await getRegions()
    regions.value = response.regions
    regionOptions.value = [
      { text: '全部', value: '' },
      ...response.regions.map(region => ({
        text: region.name,
        value: region.id
      }))
    ]
  } catch (error) {
    console.error('加载区域失败:', error)
    showFailToast('加载区域失败')
  }
}

// 加载产品列表
const loadProducts = async () => {
  try {
    isLoading.value = true
    
    // 构建请求参数
    const params = {
      page: pagination.current,
      pageSize: pagination.pageSize,
      keyword: searchForm.keyword,
      category_id: searchForm.categoryId,
      region_id: searchForm.regionId,
      status: searchForm.status,
      min_price: searchForm.minPrice,
      max_price: searchForm.maxPrice
    }
    
    // 发送请求
    const response = await getProducts(params)
    products.value = response.products
    total.value = response.total
    
    // 清空选中状态
    selectedProducts.value = []
  } catch (error) {
    console.error('加载产品失败:', error)
    showFailToast('加载产品失败')
  } finally {
    isLoading.value = false
  }
}

// 搜索输入
const onSearchInput = (value) => {
  searchForm.keyword = value
}

// 搜索
const onSearch = () => {
  // 重置分页
  pagination.current = 1
  loadProducts()
}

// 重置搜索
const onReset = () => {
  searchForm.keyword = ''
  onSearch()
}

// 筛选
const onFilter = () => {
  // 重置分页
  pagination.current = 1
  loadProducts()
}

// 重置筛选
const onResetFilter = () => {
  searchForm.categoryId = ''
  searchForm.regionId = ''
  searchForm.status = ''
  searchForm.minPrice = ''
  searchForm.maxPrice = ''
  onFilter()
}

// 分页变化
const onPageChange = () => {
  loadProducts()
}

// 行点击
const handleRowClick = (row) => {
  goToEditProduct(row.id)
}

// 选择变化
const handleSelectionChange = (selected) => {
  selectedProducts.value = selected
}

// 跳转到添加产品页面
const goToAddProduct = () => {
  router.push('/admin/products/add')
}

// 跳转到编辑产品页面
const goToEditProduct = (id) => {
  router.push(`/admin/products/${id}/edit`)
}

// 跳转到Excel导入导出页面
const goToImportExport = () => {
  router.push('/admin/products/import-export')
}

// 删除产品
const handleDelete = (id) => {
  toDeleteId.value = id
  showDeleteDialog.value = true
}

// 批量删除
const batchDelete = () => {
  if (selectedProducts.value.length === 0) {
    Toast('请选择要删除的产品')
    return
  }
  toDeleteId.value = selectedProducts.value.map(item => item.id)
  showDeleteDialog.value = true
}

// 确认删除 (暂时未实现)
const confirmDelete = async () => {
  try {
    // if (Array.isArray(toDeleteId.value)) {
    //   // 批量删除
    //   for (const id of toDeleteId.value) {
    //     await deleteProduct(id)
    //   }
    //   Toast.success('批量删除成功')
    // } else {
    //   // 单个删除
    //   await deleteProduct(toDeleteId.value)
    //   Toast.success('删除成功')
    // }
    // 重新加载产品列表
    loadProducts()
    Toast.success('删除成功')
  } catch (error) {
    console.error('删除失败:', error)
    showFailToast('删除失败')
  } finally {
    showDeleteDialog.value = false
  }
}

// 切换产品状态 (暂时未实现)
const toggleProductStatus = async (product) => {
  try {
    // await updateProductStatus(product.id, product.status === 'active' ? 'inactive' : 'active')
    // Toast.success(`产品${product.status === 'active' ? '下架' : '上架'}成功`)
    // 重新加载产品列表
    loadProducts()
    Toast.success(`产品${product.status === 'active' ? '下架' : '上架'}成功`)
  } catch (error) {
    console.error('状态更新失败:', error)
    showFailToast('状态更新失败')
  }
}

// 批量修改产品状态 (暂时未实现)
const batchStatusChange = async (status) => {
  if (selectedProducts.value.length === 0) {
    Toast('请选择要操作的产品')
    return
  }
  
  try {
    // for (const product of selectedProducts.value) {
    //   await updateProductStatus(product.id, status)
    // }
    // Toast.success(`批量${status === 'active' ? '上架' : '下架'}成功`)
    // 重新加载产品列表
    loadProducts()
    Toast.success(`批量${status === 'active' ? '上架' : '下架'}成功`)
  } catch (error) {
    console.error('批量操作失败:', error)
    showFailToast('批量操作失败')
  }
}

// 清空选择
const clearSelection = () => {
  selectedProducts.value = []
  selectAll.value = false
}

// 全选/取消全选
const toggleSelectAll = () => {
  if (selectAll.value) {
    selectedProducts.value = [...products.value]
  } else {
    selectedProducts.value = []
  }
}

// 单个选择切换
const toggleSelect = (product) => {
  const index = selectedProducts.value.findIndex(item => item.id === product.id)
  if (index > -1) {
    selectedProducts.value.splice(index, 1)
  } else {
    selectedProducts.value.push(product)
  }
  
  // 更新全选状态
  selectAll.value = selectedProducts.value.length === products.value.length
}

// 菜单点击
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

// 获取角色名称
const getRoleName = (role) => {
  const roleMap = {
    'system_admin': '系统管理员',
    'admin': '管理员',
    'user': '普通用户'
  }
  return roleMap[role] || role
}
</script>

<style lang="scss" scoped>
.product-list-container {
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

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  
  h1 {
    font-size: 24px;
    font-weight: 600;
  }
  
  .action-buttons {
    display: flex;
    gap: 10px;
  }
}

.product-table {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  margin-bottom: 20px;
  
  table {
    width: 100%;
    border-collapse: collapse;
  }
  
  th,
  td {
    padding: 12px 16px;
    text-align: left;
    border-bottom: 1px solid #eee;
  }
  
  th {
    background-color: #f8f9fa;
    font-weight: 600;
    color: #333;
  }
  
  tr:hover {
    background-color: #f5f5f5;
    cursor: pointer;
  }
  
  .operation-buttons {
    display: flex;
    gap: 8px;
  }
}

.search-filter-section {
  background-color: #fff;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  
  .search-form {
    display: flex;
    gap: 10px;
    align-items: center;
  }
  
  .filter-form {
    .filter-row {
      display: flex;
      gap: 20px;
      margin-bottom: 20px;
      flex-wrap: wrap;
      
      .filter-item {
        display: flex;
        align-items: center;
        gap: 10px;
        
        label {
          font-weight: 500;
        }
      }
    }
    
    .filter-actions {
      display: flex;
      gap: 10px;
      justify-content: flex-end;
    }
  }
}

.product-list {
  background-color: #fff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
  
  .batch-actions {
    display: flex;
    gap: 10px;
    margin-bottom: 20px;
    padding: 10px;
    background-color: #f5f5f5;
    border-radius: 4px;
    
    span {
      font-weight: 500;
      color: #666;
    }
  }
  
  .operation-buttons {
    display: flex;
    gap: 8px;
  }
}

.pagination {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.empty-state {
  padding: 50px 0;
  text-align: center;
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
  
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .action-buttons {
    width: 100%;
    flex-wrap: wrap;
    
    .van-button {
      flex: 1;
      min-width: 100px;
    }
  }
  
  .search-form {
    flex-direction: column;
    align-items: stretch;
  }
  
  .filter-row {
    flex-direction: column;
    gap: 10px;
    
    .filter-item {
      flex-direction: column;
      align-items: stretch;
    }
  }
  
  .filter-actions {
    flex-direction: column;
  }
}
</style>