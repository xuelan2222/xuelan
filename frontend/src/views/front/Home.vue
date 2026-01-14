<template>
  <div class="home-container">
    <!-- 顶部导航栏 -->
    <van-nav-bar
      title="产品展示"
      fixed
      left-text=""
      right-text=""
      @click-left="onBack"
      @click-right="onRightClick"
    />

    <!-- 搜索栏 -->
    <div class="search-container">
      <van-search
        v-model="searchKeyword"
        placeholder="搜索产品名称或首拼"
        @search="onSearch"
        @input="onSearchInput"
        @focus="onSearchFocus"
      />
    </div>

    <!-- 分类筛选栏 -->
    <div class="category-container">
      <van-tabs v-model:active="activeCategory" @change="onCategoryChange">
        <van-tab title="全部" />
        <van-tab v-for="category in categories" :key="category.id" :title="category.name" />
      </van-tabs>
    </div>

    <!-- 产品列表 -->
    <div class="product-list-container">
      <!-- 下拉刷新 -->
      <van-pull-refresh v-model="isRefreshing" @refresh="onRefresh">
        <!-- 上拉加载 -->
        <van-list
          v-model:loading="isLoading"
          :finished="isFinished"
          finished-text="没有更多了"
          @load="onLoad"
          :immediate-check="false"
        >
          <!-- 产品网格 -->
          <van-grid :column-num="2" :border="false">
            <van-grid-item
              v-for="product in filteredProducts"
              :key="product.id"
              @click="goToProductDetail(product.id)"
            >
              <div class="product-item">
                <!-- 产品图片 -->
                <van-image
                  :src="product.images && product.images.length > 0 ? product.images[0].image_url : 'https://picsum.photos/400/400'"
                  :fit="'cover'"
                  width="100%"
                  height="150px"
                  lazy-load
                />
                <!-- 产品信息 -->
                <div class="product-info">
                  <div class="product-name">{{ product.name }}</div>
                  <div class="product-code">编码: {{ product.code }}</div>
                  <div class="product-price">¥{{ product.price.toFixed(2) }}</div>
                  <div class="product-stock">库存: {{ product.stock }}</div>
                </div>
                <!-- 加入清单按钮 -->
                <div class="add-to-list-btn-container">
                  <van-button
                    type="primary"
                    size="small"
                    @click.stop="addToListItem(product)"
                  >
                    加入清单
                  </van-button>
                </div>
              </div>
            </van-grid-item>
          </van-grid>

          <!-- 空状态 -->
          <div v-if="filteredProducts.length === 0" class="empty-state">
            <van-empty description="暂无产品数据" />
          </div>
        </van-list>
      </van-pull-refresh>
    </div>

    <!-- 底部导航栏 -->
    <van-tabbar v-model="active" route>
      <van-tabbar-item name="home" icon="home-o">首页</van-tabbar-item>
      <van-tabbar-item name="search" icon="search">搜索</van-tabbar-item>
      <van-tabbar-item name="list" icon="list">清单</van-tabbar-item>
      <van-tabbar-item name="profile" icon="user-o">我的</van-tabbar-item>
    </van-tabbar>

    <!-- 数量输入对话框 -->
    <van-dialog
      v-model:show="listStore.showQuantityDialog"
      title="加入清单"
      show-cancel-button
      @confirm="listStore.addToList"
      @cancel="listStore.onCancel"
    >
      <div class="quantity-dialog-content">
        <div class="dialog-product-name">{{ listStore.selectedProduct?.name }}</div>
        <div class="quantity-input-container">
          <van-stepper
            v-model="listStore.quantity"
            :min="1"
            :max="9999"
            :step="1"
            @change="onQuantityChange"
          />
        </div>
      </div>
    </van-dialog>

    <!-- 图片预览 -->
    <van-image-preview
      v-model:show="listStore.showPreview"
      :images="listStore.previewImages"
      :start-position="listStore.previewIndex"
      @change="onPreviewChange"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { PullRefresh, List, Empty, Tab, Tabs, Tabbar, TabbarItem, Dialog, Stepper, ImagePreview } from 'vant'
import { getProducts, filterProductsByFirstLetter } from '@/services/product'
import { getCategories } from '@/services/category'
import { useUserStore } from '@/store/modules/user'
import { useListStore } from '@/store/modules/list'
import { showFailToast } from 'vant'

// 路由
const router = useRouter()

// 状态管理
const userStore = useUserStore()
const listStore = useListStore()

// 响应式数据
const searchKeyword = ref('')
const activeCategory = ref(0)
const active = ref('home')
const products = ref([])
const filteredProducts = ref([])
const categories = ref([{ id: 0, name: '全部' }])
const page = ref(1)
const pageSize = ref(10)
const isRefreshing = ref(false)
const isLoading = ref(false)
const isFinished = ref(false)

// 计算属性：根据搜索关键词过滤产品
const filteredByKeyword = computed(() => {
  return filterProductsByFirstLetter(products.value, searchKeyword.value)
})

// 初始化数据
onMounted(async () => {
  try {
    // 加载分类数据
    await loadCategories()
    
    // 加载产品数据
    await loadProducts()
  } catch (error) {
    showFailToast('数据加载失败')
  }
})

// 监听搜索关键词变化
watch(searchKeyword, (newKeyword, oldKeyword) => {
  if (newKeyword !== oldKeyword) {
    // 重置分页
    page.value = 1
    isFinished.value = false
    products.value = []
    
    // 重新加载数据
    loadProducts()
  }
})

// 监听分类变化
watch(activeCategory, (newCategory, oldCategory) => {
  if (newCategory !== oldCategory) {
    // 重置分页
    page.value = 1
    isFinished.value = false
    products.value = []
    
    // 重新加载数据
    loadProducts()
  }
})

// 加载分类数据
const loadCategories = async () => {
  try {
    const response = await getCategories()
    categories.value = [{ id: 0, name: '全部' }, ...response.categories]
  } catch (error) {
    showFailToast('分类加载失败')
  }
}

// 加载产品数据
const loadProducts = async () => {
  try {
    isLoading.value = true
    
    // 构建请求参数
    const params = {
      page: page.value,
      pageSize: pageSize.value,
      keyword: searchKeyword.value
    }
    
    // 获取当前选中的分类ID
    const categoryId = categories.value[activeCategory.value].id
    if (categoryId !== 0) {
      params.category_id = categoryId
    }
    
    // 发送请求
    const response = await getProducts(params)
    
    // 更新产品列表
    if (page.value === 1) {
      products.value = response.products
    } else {
      products.value = [...products.value, ...response.products]
    }
    
    // 更新分页状态
    isFinished.value = response.products.length < pageSize.value
    page.value++
  } catch (error) {
    showFailToast('产品加载失败')
  } finally {
    isLoading.value = false
    isRefreshing.value = false
  }
}

// 下拉刷新
const onRefresh = async () => {
  // 重置分页
  page.value = 1
  isFinished.value = false
  products.value = []
  
  // 重新加载数据
  await loadProducts()
}

// 上拉加载更多
const onLoad = async () => {
  await loadProducts()
}

// 搜索
const onSearch = async () => {
  // 重置分页
  page.value = 1
  isFinished.value = false
  products.value = []
  
  // 重新加载数据
  await loadProducts()
}

// 搜索输入
const onSearchInput = (value) => {
  searchKeyword.value = value
}

// 搜索聚焦
const onSearchFocus = () => {
  router.push('/search')
}

// 分类变化
const onCategoryChange = (index) => {
  activeCategory.value = index
}

// 返回
const onBack = () => {
  router.back()
}

// 右侧按钮点击
const onRightClick = () => {
  // 可以添加更多操作
}

// 跳转到产品详情
const goToProductDetail = (productId) => {
  router.push(`/product/${productId}`)
}

// 加入清单
const addToListItem = (product) => {
  listStore.showQuantityInput(product)
}

// 数量变化
const onQuantityChange = (value) => {
  listStore.quantity = value
}

// 图片预览变化
const onPreviewChange = (index) => {
  listStore.previewIndex = index
}
</script>

<style lang="scss" scoped>
.home-container {
  min-height: 100vh;
  padding-bottom: 50px; // 为底部导航栏预留空间
}

.search-container {
  padding: 10px;
  background-color: #fff;
  margin-top: 46px; // 为顶部导航栏预留空间
}

.category-container {
  background-color: #fff;
  margin-bottom: 10px;
}

.product-list-container {
  padding: 10px;
  background-color: #f5f5f5;
  min-height: calc(100vh - 200px);
}

.product-item {
  width: 100%;
  background-color: #fff;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease;

  &:active {
    transform: scale(0.98);
  }

  img {
    width: 100%;
    height: 150px;
    object-fit: cover;
  }
}

.product-info {
  padding: 10px;

  .product-name {
    font-size: 14px;
    font-weight: 500;
    margin-bottom: 5px;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }

  .product-code {
    font-size: 12px;
    color: #999;
    margin-bottom: 3px;
  }

  .product-price {
    font-size: 16px;
    font-weight: 600;
    color: #ee0a24;
    margin-bottom: 3px;
  }

  .product-stock {
    font-size: 12px;
    color: #999;
  }
}

.empty-state {
  padding: 20px 0;
}

// 响应式设计
@media (min-width: 768px) {
  .home-container {
    max-width: 768px;
    margin: 0 auto;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  }
  
  .product-list-container {
    min-height: calc(100vh - 220px);
  }
}

// 加入清单按钮样式
.add-to-list-btn-container {
  padding: 10px;
  display: flex;
  justify-content: center;
  align-items: center;
  
  .van-button {
    width: 100%;
    font-size: 14px;
  }
}

// 数量对话框样式
.quantity-dialog-content {
  .dialog-product-name {
    font-size: 16px;
    font-weight: 500;
    margin-bottom: 20px;
    text-align: center;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }
  
  .quantity-input-container {
    display: flex;
    justify-content: center;
    align-items: center;
    
    .van-stepper {
      width: 150px;
    }
  }
}
</style>