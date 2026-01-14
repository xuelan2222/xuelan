<template>
  <div class="search-container">
    <!-- 顶部搜索栏 -->
    <div class="search-header">
      <van-search
        v-model="searchKeyword"
        placeholder="搜索产品名称或首拼"
        @search="onSearch"
        @input="onSearchInput"
        @clear="onClear"
        show-action
        action-text="取消"
        @search-action-click="onCancel"
      />
    </div>

    <!-- 搜索历史和热门搜索 -->
    <div v-if="!showResults" class="search-history">
      <!-- 搜索历史 -->
      <div v-if="searchHistory.length > 0" class="history-section">
        <div class="section-header">
          <span class="section-title">搜索历史</span>
          <van-icon name="delete-o" @click="clearSearchHistory" />
        </div>
        <div class="history-list">
          <van-tag
            v-for="(keyword, index) in searchHistory"
            :key="index"
            @click="search(keyword)"
            closeable
            @close="removeSearchHistory(keyword)"
          >
            {{ keyword }}
          </van-tag>
        </div>
      </div>

      <!-- 热门搜索 -->
      <div class="hot-section">
        <div class="section-header">
          <span class="section-title">热门搜索</span>
        </div>
        <div class="hot-list">
          <van-tag
            v-for="(keyword, index) in hotKeywords"
            :key="index"
            @click="search(keyword)"
            type="primary"
          >
            {{ keyword }}
          </van-tag>
        </div>
      </div>
    </div>

    <!-- 搜索结果 -->
    <div v-else class="search-results">
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
          <!-- 搜索结果列表 -->
          <van-grid :column-num="2" :border="false">
            <van-grid-item
              v-for="product in searchResults"
              :key="product.id"
              @click="goToProductDetail(product.id)"
            >
              <div class="product-item">
                <van-image
                  :src="product.images && product.images.length > 0 ? product.images[0].image_url : 'https://picsum.photos/400/400'"
                  :fit="'cover'"
                  width="100%"
                  height="150px"
                  lazy-load
                />
                <div class="product-info">
                  <div class="product-name">{{ product.name }}</div>
                  <div class="product-code">编码: {{ product.code }}</div>
                  <div class="product-price">¥{{ product.price.toFixed(2) }}</div>
                  <div class="product-stock">库存: {{ product.stock }}</div>
                </div>
              </div>
            </van-grid-item>
          </van-grid>

          <!-- 空状态 -->
          <div v-if="searchResults.length === 0" class="empty-state">
            <van-empty description="暂无搜索结果" />
            <van-button type="primary" @click="onCancel">返回</van-button>
          </div>
        </van-list>
      </van-pull-refresh>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Search, PullRefresh, List, Empty, Button, Tag, Icon, Grid, GridItem } from 'vant'
import { searchProducts } from '@/services/product'
import { showFailToast } from 'vant'

// 路由
const router = useRouter()

// 响应式数据
const searchKeyword = ref('')
const searchHistory = ref([])
const hotKeywords = ref(['产品1', '产品2', '产品3', '产品4', '产品5', '产品6'])
const searchResults = ref([])
const showResults = ref(false)
const page = ref(1)
const pageSize = ref(10)
const isRefreshing = ref(false)
const isLoading = ref(false)
const isFinished = ref(false)

// 初始化数据
onMounted(() => {
  // 加载搜索历史
  loadSearchHistory()
})

// 监听搜索关键词变化
watch(searchKeyword, (newKeyword) => {
  if (newKeyword) {
    // 可以实现实时搜索建议
  }
})

// 加载搜索历史
const loadSearchHistory = () => {
  const history = localStorage.getItem('searchHistory')
  if (history) {
    searchHistory.value = JSON.parse(history)
  }
}

// 保存搜索历史
const saveSearchHistory = () => {
  localStorage.setItem('searchHistory', JSON.stringify(searchHistory.value))
}

// 添加搜索历史
const addSearchHistory = (keyword) => {
  if (!keyword || keyword.trim() === '') return
  
  // 移除重复项
  const index = searchHistory.value.indexOf(keyword)
  if (index !== -1) {
    searchHistory.value.splice(index, 1)
  }
  
  // 添加到开头
  searchHistory.value.unshift(keyword)
  
  // 限制历史记录数量
  if (searchHistory.value.length > 10) {
    searchHistory.value.pop()
  }
  
  // 保存到本地存储
  saveSearchHistory()
}

// 移除搜索历史
const removeSearchHistory = (keyword) => {
  const index = searchHistory.value.indexOf(keyword)
  if (index !== -1) {
    searchHistory.value.splice(index, 1)
    saveSearchHistory()
  }
}

// 清除搜索历史
const clearSearchHistory = () => {
  searchHistory.value = []
  saveSearchHistory()
}

// 搜索
const search = (keyword) => {
  searchKeyword.value = keyword
  onSearch()
}

// 执行搜索
const onSearch = async () => {
  if (!searchKeyword.value || searchKeyword.value.trim() === '') {
    Toast('请输入搜索关键词')
    return
  }
  
  // 添加到搜索历史
  addSearchHistory(searchKeyword.value)
  
  // 显示搜索结果
  showResults.value = true
  
  // 重置分页
  page.value = 1
  isFinished.value = false
  searchResults.value = []
  
  // 加载搜索结果
  await loadSearchResults()
}

// 搜索输入
const onSearchInput = (value) => {
  searchKeyword.value = value
}

// 清除搜索
const onClear = () => {
  searchKeyword.value = ''
}

// 取消搜索
const onCancel = () => {
  showResults.value = false
  searchKeyword.value = ''
}

// 加载搜索结果
const loadSearchResults = async () => {
  try {
    isLoading.value = true
    
    // 构建请求参数
    const params = {
      page: page.value,
      pageSize: pageSize.value,
      keyword: searchKeyword.value
    }
    
    // 发送请求
    const response = await searchProducts(params)
    
    // 更新搜索结果
    if (page.value === 1) {
      searchResults.value = response.products
    } else {
      searchResults.value = [...searchResults.value, ...response.products]
    }
    
    // 更新分页状态
    isFinished.value = response.products.length < pageSize.value
    page.value++
  } catch (error) {
    showFailToast('搜索失败')
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
  searchResults.value = []
  
  // 重新加载数据
  await loadSearchResults()
}

// 上拉加载更多
const onLoad = async () => {
  await loadSearchResults()
}

// 跳转到产品详情
const goToProductDetail = (productId) => {
  router.push(`/product/${productId}`)
}
</script>

<style lang="scss" scoped>
.search-container {
  min-height: 100vh;
  background-color: #f5f5f5;
}

.search-header {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  background-color: #fff;
  z-index: 100;
  padding: 10px;
  box-sizing: border-box;
}

.search-history,
.search-results {
  padding: 80px 10px 20px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  
  .section-title {
    font-size: 16px;
    font-weight: 600;
  }
  
  .van-icon {
    color: #999;
  }
}

.history-list,
.hot-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 20px;
}

.search-results {
  .van-pull-refresh {
    background-color: #f5f5f5;
  }
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
  display: flex;
  flex-direction: column;
  align-items: center;
  
  .van-button {
    margin-top: 20px;
  }
}

// 响应式设计
@media (min-width: 768px) {
  .search-container {
    max-width: 768px;
    margin: 0 auto;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  }
}
</style>