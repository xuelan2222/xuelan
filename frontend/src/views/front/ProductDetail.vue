<template>
  <div class="product-detail-container">
    <!-- 顶部导航栏 -->
    <van-nav-bar
      title="产品详情"
      fixed
      left-text="返回"
      @click-left="goBack"
    />

    <!-- 加载状态 -->
    <div v-if="isLoading" class="loading-container">
      <van-loading type="spinner" size="40px" color="#1989fa" />
      <div class="loading-text">加载中...</div>
    </div>

    <!-- 无权限状态 -->
    <div v-else-if="!hasPermission" class="no-permission-container">
      <div class="no-permission-icon">🔒</div>
      <div class="no-permission-text">您没有权限访问该产品</div>
      <van-button type="primary" @click="goBack">返回首页</van-button>
    </div>

    <!-- 产品详情 -->
    <div v-else-if="product" class="product-content">
      <!-- 产品图片轮播 -->
      <div class="product-images">
        <van-swipe :autoplay="3000" :show-indicators="true" :height="250">
          <van-swipe-item v-for="image in product.images" :key="image.id">
            <van-image
              :src="image.image_url"
              :fit="'cover'"
              width="100%"
              height="250px"
              lazy-load
            />
          </van-swipe-item>
        </van-swipe>
      </div>

      <!-- 产品基本信息 -->
      <div class="product-info">
        <div class="product-name">{{ product.name }}</div>
        <div class="product-code">产品编码: {{ product.code }}</div>
        <div class="product-price">¥{{ product.price.toFixed(2) }}</div>
        <div class="product-stock">库存: {{ product.stock }}</div>
        <div class="product-region">区域: {{ product.region.name }}</div>
        <!-- 加入清单按钮 -->
        <div class="add-to-list-container">
          <van-button type="primary" size="large" block @click="addToListItem(product)">
            加入清单
          </van-button>
        </div>
      </div>

      <!-- 产品详细描述 -->
      <div class="product-description">
        <div class="section-title">产品描述</div>
        <div class="description-content" v-html="product.description"></div>
      </div>

      <!-- 产品参数 -->
      <div class="product-params">
        <div class="section-title">产品参数</div>
        <van-cell-group>
          <van-cell title="产品ID" :value="product.id" />
          <van-cell title="创建者" :value="product.admin.username" />
          <van-cell title="创建时间" :value="formatDate(product.created_at)" />
          <van-cell title="更新时间" :value="formatDate(product.updated_at)" />
          <van-cell title="产品状态" :value="product.status === 'active' ? '上架' : '下架'" />
        </van-cell-group>
      </div>

      <!-- 相关产品 -->
      <div class="related-products">
        <div class="section-title">相关产品</div>
        <div class="related-list">
          <div
            v-for="item in relatedProducts"
            :key="item.id"
            class="related-item"
            @click="goToProductDetail(item.id)"
          >
            <van-image
              :src="item.images && item.images.length > 0 ? item.images[0].image_url : 'https://picsum.photos/200/200'"
              :fit="'cover'"
              width="80px"
              height="80px"
              lazy-load
            />
            <div class="related-info">
              <div class="related-name">{{ item.name }}</div>
              <div class="related-price">¥{{ item.price.toFixed(2) }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 错误状态 -->
    <div v-else class="error-container">
      <van-empty description="产品不存在或已被删除" />
      <van-button type="primary" @click="goBack">返回首页</van-button>
    </div>

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
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Swipe, SwipeItem, Image as VanImage, Cell, CellGroup, Empty, Button, Loading, Dialog, Stepper, ImagePreview } from 'vant'
import { getProductDetail } from '@/services/product'
import { useUserStore } from '@/store/modules/user'
import { useListStore } from '@/store/modules/list'
import { showFailToast } from 'vant'

// 组件内路由守卫 - 产品详情页
// 使用 defineAsyncComponent 包装组件可以添加组件内守卫
// 这里通过组合式 API 实现路由守卫功能
const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

// 路由更新时重新验证权限
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
  
  // 普通用户可以访问产品详情页
  return true
}

// 初始权限验证
if (!validateRouteAccess()) {
  // 权限验证失败，不执行后续逻辑
  // 全局守卫会处理跳转
} else {

// 路由（已在组件内守卫中声明）

// 状态管理
const userStore = useUserStore()
const listStore = useListStore()

// 响应式数据
const product = ref(null)
const relatedProducts = ref([])
const isLoading = ref(true)
const hasPermission = ref(true)

// 计算属性：产品ID
const productId = computed(() => route.params.id)

// 初始化数据
onMounted(async () => {
  await loadProductDetail()
})

// 加载产品详情
const loadProductDetail = async () => {
  try {
    isLoading.value = true
    
    // 获取产品详情
    const response = await getProductDetail(productId.value)
    product.value = response.product
    
    // 验证区域权限
    validateRegionPermission()
    
    // 加载相关产品
    // if (hasPermission.value) {
    //   await loadRelatedProducts()
    // }
  } catch (error) {
    showFailToast('产品加载失败')
    console.error('加载产品详情失败:', error)
  } finally {
    isLoading.value = false
  }
}

// 验证区域权限
const validateRegionPermission = () => {
  // 系统管理员可以访问所有产品
  if (userStore.isSystemAdmin) {
    hasPermission.value = true
    return
  }
  
  // 普通用户和管理员只能访问同区域产品
  if (product.value && product.value.region_id === userStore.userRegionId) {
    hasPermission.value = true
  } else {
    hasPermission.value = false
    showFailToast('您没有权限访问该产品')
  }
}

// 加载相关产品 (暂时未实现)
// const loadRelatedProducts = async () => {
//   try {
//     const response = await getRelatedProducts(productId.value)
//     relatedProducts.value = response.products
//   } catch (error) {
//     console.error('加载相关产品失败:', error)
//     // 相关产品加载失败不影响主页面显示
//   }
// }

// 返回上一页
const goBack = () => {
  router.back()
}

// 跳转到产品详情
const goToProductDetail = (id) => {
  router.push(`/product/${id}`)
}

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return ''
  
  const date = new Date(dateString)
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`
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
}
</script>

<style lang="scss" scoped>
.product-detail-container {
  min-height: 100vh;
  background-color: #f5f5f5;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  padding-top: 60px;
  box-sizing: border-box;
  
  .loading-text {
    margin-top: 10px;
    color: #666;
    font-size: 14px;
  }
}

.no-permission-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  padding-top: 60px;
  box-sizing: border-box;
  
  .no-permission-icon {
    font-size: 60px;
    margin-bottom: 20px;
  }
  
  .no-permission-text {
    font-size: 18px;
    color: #666;
    margin-bottom: 20px;
  }
  
  .van-button {
    margin-top: 20px;
  }
}

.product-content {
  padding-top: 46px;
}

.product-images {
  width: 100%;
  background-color: #fff;
}

.product-info {
  padding: 15px;
  background-color: #fff;
  margin-bottom: 10px;
  
  .product-name {
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 10px;
  }
  
  .product-code {
    font-size: 14px;
    color: #666;
    margin-bottom: 8px;
  }
  
  .product-price {
    font-size: 24px;
    font-weight: 700;
    color: #ee0a24;
    margin-bottom: 8px;
  }
  
  .product-stock {
    font-size: 14px;
    color: #666;
    margin-bottom: 8px;
  }
  
  .product-region {
    font-size: 14px;
    color: #666;
  }
}

.product-description,
.product-params,
.related-products {
  background-color: #fff;
  margin-bottom: 10px;
  padding: 15px;
  
  .section-title {
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 15px;
    padding-bottom: 10px;
    border-bottom: 1px solid #eee;
  }
  
  .description-content {
    font-size: 14px;
    line-height: 1.6;
    color: #333;
  }
}

.related-products {
  margin-bottom: 0;
  padding-bottom: 20px;
  
  .related-list {
    display: flex;
    flex-wrap: nowrap;
    overflow-x: auto;
    gap: 10px;
    padding-bottom: 10px;
  }
  
  .related-item {
    display: flex;
    flex-direction: column;
    min-width: 120px;
    cursor: pointer;
    
    .related-info {
      padding: 8px 0;
      
      .related-name {
        font-size: 12px;
        margin-bottom: 4px;
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
      }
      
      .related-price {
        font-size: 14px;
        color: #ee0a24;
        font-weight: 500;
      }
    }
  }
}

.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  padding-top: 60px;
  box-sizing: border-box;
  
  .van-button {
    margin-top: 20px;
  }
}

// 加入清单按钮样式
.add-to-list-container {
  margin-top: 15px;
  
  .van-button {
    font-size: 16px;
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

// 响应式设计
@media (min-width: 768px) {
  .product-detail-container {
    max-width: 768px;
    margin: 0 auto;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  }
}
</style>