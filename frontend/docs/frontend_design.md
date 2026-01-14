# 前台开发设计文档

## 1. 项目概述

本项目是一个产品资料管理与展示系统的前台部分，以手机端为核心适配目标，实现登录验证、产品展示、清单管理等功能。系统采用前后端分离架构，前端使用Vue 3 + Vant UI + Pinia + Vue Router技术栈。

## 2. 核心功能设计

### 2.1 登录与注册功能

#### 2.1.1 登录界面设计

**页面结构**：
- 系统标题和logo
- 登录表单（用户名、密码、验证码）
- 记住密码选项
- 忘记密码链接
- 注册链接

**交互逻辑**：
- 表单验证：用户名和密码必填
- 验证码：点击可刷新
- 登录成功后根据用户角色自动跳转（管理员→后台管理系统，普通用户→前台产品展示页面）
- 登录失败时显示错误信息，并刷新验证码

**代码实现**：
```vue
<template>
  <div class="login-container">
    <div class="login-form-wrapper">
      <div class="system-title">产品资料管理系统</div>
      <van-form @submit="onLogin">
        <van-field
          v-model="loginForm.username"
          name="username"
          label="用户名"
          placeholder="请输入用户名"
          :rules="[{ required: true, message: '请输入用户名' }]"
        />
        <van-field
          v-model="loginForm.password"
          type="password"
          name="password"
          label="密码"
          placeholder="请输入密码"
          :rules="[{ required: true, message: '请输入密码' }]"
          show-password
        />
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
        <div class="remember-me">
          <van-checkbox v-model="loginForm.rememberMe">记住密码</van-checkbox>
          <div class="forgot-password" @click="onForgotPassword">忘记密码?</div>
        </div>
        <van-button type="primary" block native-type="submit" :loading="isLoading" size="large">登录</van-button>
        <div class="register-link">
          还没有账号? <a href="javascript:;" @click="goToRegister">立即注册</a>
        </div>
      </van-form>
    </div>
  </div>
</template>
```

#### 2.1.2 注册界面设计

**页面结构**：
- 系统标题和logo
- 注册表单（用户名、密码、确认密码、手机号、邮箱、邀请码、区域选择）
- 验证码
- 同意协议选项
- 注册按钮
- 登录链接

**交互逻辑**：
- 表单验证：所有必填项验证
- 邀请码验证：普通用户注册需验证邀请码，邀请码由管理员/系统管理员生成
- 区域选择：客户区域属性由注册页面下拉选择或管理员预先分配，注册后不可自行修改
- 注册成功后跳转至登录页面

**代码实现**：
```vue
<template>
  <div class="register-container">
    <div class="register-form-wrapper">
      <div class="system-title">产品资料管理系统</div>
      <van-form @submit="onRegister">
        <van-field
          v-model="registerForm.username"
          name="username"
          label="用户名"
          placeholder="请输入用户名"
          :rules="[{ required: true, message: '请输入用户名' }, { min: 3, max: 20, message: '用户名长度在3-20个字符之间' }]"
        />
        <van-field
          v-model="registerForm.password"
          type="password"
          name="password"
          label="密码"
          placeholder="请输入密码"
          :rules="[{ required: true, message: '请输入密码' }, { min: 6, max: 20, message: '密码长度在6-20个字符之间' }]"
          show-password
        />
        <van-field
          v-model="registerForm.confirmPassword"
          type="password"
          name="confirmPassword"
          label="确认密码"
          placeholder="请再次输入密码"
          :rules="[{ required: true, message: '请再次输入密码' }, { validator: validatePassword, message: '两次输入的密码不一致' }]"
          show-password
        />
        <van-field
          v-model="registerForm.inviteCode"
          name="inviteCode"
          label="邀请码"
          placeholder="请输入邀请码"
          :rules="[{ required: true, message: '请输入邀请码' }]"
        />
        <div class="verify-button-container">
          <van-button type="default" block @click="verifyInviteCode" :loading="isVerifyingInviteCode" size="small">验证邀请码</van-button>
        </div>
        <van-field
          v-model="registerForm.email"
          name="email"
          label="邮箱"
          placeholder="请输入邮箱"
          :rules="[{ required: true, message: '请输入邮箱' }, { type: 'email', message: '请输入正确的邮箱格式' }]"
        />
        <van-field
          v-model="registerForm.phone"
          name="phone"
          label="手机号"
          placeholder="请输入手机号"
          :rules="[{ required: true, message: '请输入手机号' }, { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号格式' }]"
        />
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
        <van-popup v-model:show="showRegionPicker" position="bottom" round style="height: 30%">
          <van-picker :columns="regions" @confirm="onRegionConfirm" @cancel="showRegionPicker = false" />
        </van-popup>
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
        <div class="agreement">
          <van-checkbox v-model="registerForm.agreement">
            我已阅读并同意 <a href="javascript:;" @click="showAgreement">《用户协议》</a> 和 <a href="javascript:;" @click="showPrivacy">《隐私政策》</a>
          </van-checkbox>
        </div>
        <div class="register-button-container">
          <van-button type="primary" block native-type="submit" :loading="isLoading" size="large">注册</van-button>
        </div>
        <div class="login-link">
          已有账号? <a href="javascript:;" @click="goToLogin">立即登录</a>
        </div>
      </van-form>
    </div>
  </div>
</template>
```

### 2.2 产品展示页面

#### 2.2.1 导航栏设计

**导航栏结构**：
- 左侧：清单图标和文字
- 中间：搜索框
- 右侧：类别筛选图标和文字

**交互逻辑**：
- 点击清单图标：跳转至清单页面
- 搜索框：支持首拼搜索，可匹配商品名称、生产厂家、类别等信息
- 点击类别筛选图标：弹出类别选择菜单

**代码实现**：
```vue
<template>
  <div class="product-list-container">
    <div class="navbar">
      <div class="navbar-left" @click="goToList">
        <van-icon name="list" size="24" />
        <span>清单</span>
      </div>
      <div class="navbar-center">
        <van-search
          v-model="searchKeyword"
          placeholder="搜索产品名称或首拼"
          @search="onSearch"
          @input="onSearchInput"
          show-action
          action-text="取消"
          @search-action-click="onCancel"
        />
      </div>
      <div class="navbar-right" @click="showCategoryPicker = true">
        <van-icon name="apps-o" size="24" />
        <span>筛选</span>
      </div>
    </div>
  </div>
</template>
```

#### 2.2.2 商品展示设计

**页面结构**：
- 商品分类标签
- 商品列表（卡片式呈现）
- 分页加载

**交互逻辑**：
- 商品以卡片式呈现，适配各类手机屏幕
- 商品卡片包含：主图、名称、规格、供货价、医保类型、医保价、生产厂家、类别、备注
- 点击商品图片：跳转至商品详情页
- 点击加入清单按钮：弹出数量输入对话框

**代码实现**：
```vue
<template>
  <div class="product-list">
    <!-- 分类标签 -->
    <div class="category-tabs">
      <van-tabs v-model:active="activeCategory" @change="onCategoryChange">
        <van-tab title="全部" />
        <van-tab v-for="category in categories" :key="category.id" :title="category.name" />
      </van-tabs>
    </div>

    <!-- 商品列表 -->
    <van-pull-refresh v-model="isRefreshing" @refresh="onRefresh">
      <van-list
        v-model:loading="isLoading"
        :finished="isFinished"
        finished-text="没有更多了"
        @load="onLoad"
        :immediate-check="false"
      >
        <van-grid :column-num="2" :border="false">
          <van-grid-item
            v-for="product in filteredProducts"
            :key="product.id"
            @click="goToProductDetail(product.id)"
          >
            <div class="product-item">
              <!-- 商品主图 -->
              <van-image
                :src="product.images && product.images.length > 0 ? product.images[0].image_url : 'https://picsum.photos/400/400'
                :fit="'cover'"
                width="100%"
                height="150px"
                lazy-load
              />
              <!-- 商品信息 -->
              <div class="product-info">
                <div class="product-name">{{ product.name }}</div>
                <div class="product-spec">{{ product.spec }}</div>
                <div class="product-price">供货价: ¥{{ product.price.toFixed(2) }}</div>
                <div class="product-medical-type">医保类型: {{ product.medical_type }}</div>
                <div class="product-medical-price">医保价: ¥{{ product.medical_price.toFixed(2) }}</div>
                <div class="product-manufacturer">厂家: {{ product.manufacturer }}</div>
                <div class="product-category">类别: {{ product.category.name }}</div>
                <div class="product-remark" v-if="product.remark">{{ product.remark }}</div>
              </div>
              <!-- 加入清单按钮 -->
              <div class="add-to-list" @click.stop="showQuantityDialog(product)">
                <van-button type="primary" size="small">加入清单</van-button>
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
</template>
```

#### 2.2.3 商品详情页设计

**页面结构**：
- 商品图片轮播
- 商品信息
- 加入清单按钮

**交互逻辑**：
- 图片轮播：支持多图切换、图片放大查看
- 商品信息：与商品卡片一致且更详细
- 加入清单按钮：点击后弹出数量输入对话框

**代码实现**：
```vue
<template>
  <div class="product-detail-container">
    <!-- 顶部导航栏 -->
    <van-nav-bar title="产品详情" fixed left-text="返回" @click-left="goBack" />

    <!-- 商品图片轮播 -->
    <div class="product-images">
      <van-swipe :autoplay="3000" :show-indicators="true" :height="250">
        <van-swipe-item v-for="image in product.images" :key="image.id">
          <van-image
            :src="image.image_url"
            :fit="'cover'"
            width="100%"
            height="250px"
            lazy-load
            @click="showImagePreview(image)"
          />
        </van-swipe-item>
      </van-swipe>
    </div>

    <!-- 商品信息 -->
    <div class="product-info">
      <div class="product-name">{{ product.name }}</div>
      <div class="product-spec">{{ product.spec }}</div>
      <div class="product-price">供货价: ¥{{ product.price.toFixed(2) }}</div>
      <div class="product-medical-type">医保类型: {{ product.medical_type }}</div>
      <div class="product-medical-price">医保价: ¥{{ product.medical_price.toFixed(2) }}</div>
      <div class="product-manufacturer">生产厂家: {{ product.manufacturer }}</div>
      <div class="product-category">类别: {{ product.category.name }}</div>
      <div class="product-remark" v-if="product.remark">备注: {{ product.remark }}</div>
    </div>

    <!-- 加入清单按钮 -->
    <div class="add-to-list-button">
      <van-button type="primary" block size="large" @click="showQuantityDialog(product)">
        加入清单
      </van-button>
    </div>

    <!-- 图片预览 -->
    <van-image-preview
      v-model:show="showPreview"
      :images="previewImages"
      :start-position="previewIndex"
    />
  </div>
</template>
```

### 2.3 要货清单功能

#### 2.3.1 数量输入对话框

**页面结构**：
- 数量输入框
- 加减按钮
- 确认和取消按钮

**交互逻辑**：
- 新商品：输入数量直接作为清单初始数量
- 已有商品：输入数量与清单现有数量累加

**代码实现**：
```vue
<template>
  <van-dialog
    v-model:show="showQuantityDialog"
    title="输入数量"
    show-cancel-button
    @confirm="addToList"
    @cancel="onCancel"
  >
    <div class="quantity-input">
      <van-stepper
        v-model="quantity"
        :min="1"
        :max="9999"
        :step="1"
        input-width="60px"
      />
    </div>
  </van-dialog>
</template>
```

#### 2.3.2 清单页面设计

**页面结构**：
- 用户信息和区域属性
- 清单创建/更新日期
- 商品列表（产品名称、规格、厂家、数量、单金额、小计）
- 数量合计、金额合计
- 导出按钮

**交互逻辑**：
- 显示当前登录用户信息（用户名、区域属性）
- 显示清单创建/更新日期
- 显示商品列表，包含产品名称、规格、厂家、数量、单金额、小计
- 显示数量合计和金额合计
- 支持清单导出为图片保存功能

**代码实现**：
```vue
<template>
  <div class="list-container">
    <!-- 顶部导航栏 -->
    <van-nav-bar title="要货清单" fixed left-text="返回" @click-left="goBack" />

    <!-- 用户信息 -->
    <div class="user-info">
      <div class="username">用户: {{ userInfo.username }}</div>
      <div class="user-region">区域: {{ userInfo.region_name }}</div>
    </div>

    <!-- 清单信息 -->
    <div class="list-info">
      <div class="list-date">创建日期: {{ formatDate(list.created_at) }}</div>
      <div class="list-update-date">更新日期: {{ formatDate(list.updated_at) }}</div>
    </div>

    <!-- 商品列表 -->
    <div class="product-list">
      <div class="list-header">
        <div class="header-item">商品信息</div>
        <div class="header-item">数量</div>
        <div class="header-item">单价</div>
        <div class="header-item">小计</div>
      </div>
      <div
        v-for="item in list.items"
        :key="item.id"
        class="list-item"
      >
        <div class="item-info">
          <div class="item-name">{{ item.product.name }}</div>
          <div class="item-spec">{{ item.product.spec }}</div>
          <div class="item-manufacturer">{{ item.product.manufacturer }}</div>
        </div>
        <div class="item-quantity">{{ item.quantity }}</div>
        <div class="item-price">¥{{ item.product.price.toFixed(2) }}</div>
        <div class="item-subtotal">¥{{ (item.quantity * item.product.price).toFixed(2) }}</div>
      </div>
    </div>

    <!-- 合计信息 -->
    <div class="total-info">
      <div class="total-quantity">数量合计: {{ totalQuantity }}</div>
      <div class="total-amount">金额合计: ¥{{ totalAmount.toFixed(2) }}</div>
    </div>

    <!-- 导出按钮 -->
    <div class="export-button">
      <van-button type="primary" block size="large" @click="exportList">
        导出清单
      </van-button>
    </div>
  </div>
</template>
```

## 3. 核心逻辑实现

### 3.1 首拼搜索功能

**实现思路**：
- 使用pinyin-js库将中文转换为拼音
- 支持搜索产品名称、生产厂家、类别等信息
- 支持全拼和首拼搜索

**代码实现**：
```javascript
// 首拼搜索产品
export const searchProductsByFirstLetter = async (keyword) => {
  try {
    const response = await api.get('/api/products/search/first-letter', { params: { keyword } })
    return response.data
  } catch (error) {
    throw error
  }
}

// 本地首拼搜索过滤
export const filterProductsByFirstLetter = (products, keyword) => {
  if (!keyword || keyword.trim() === '') {
    return products
  }
  
  const keywordPinyin = keyword.toLowerCase()
  
  return products.filter(product => {
    // 获取产品名称的首拼
    const productNamePinyin = pinyin.getFullChars(product.name)
    const productNameFirstLetter = productNamePinyin.replace(/[^A-Z]/g, '').toLowerCase()
    
    // 获取生产厂家的首拼
    const manufacturerPinyin = pinyin.getFullChars(product.manufacturer)
    const manufacturerFirstLetter = manufacturerPinyin.replace(/[^A-Z]/g, '').toLowerCase()
    
    // 获取类别的首拼
    const categoryPinyin = pinyin.getFullChars(product.category.name)
    const categoryFirstLetter = categoryPinyin.replace(/[^A-Z]/g, '').toLowerCase()
    
    // 匹配首拼或名称
    return (
      productNameFirstLetter.includes(keywordPinyin) || 
      productNamePinyin.toLowerCase().includes(keywordPinyin) ||
      manufacturerFirstLetter.includes(keywordPinyin) ||
      manufacturerPinyin.toLowerCase().includes(keywordPinyin) ||
      categoryFirstLetter.includes(keywordPinyin) ||
      categoryPinyin.toLowerCase().includes(keywordPinyin) ||
      product.name.includes(keyword) ||
      product.manufacturer.includes(keyword) ||
      product.category.name.includes(keyword)
    )
  })
}
```

### 3.2 区域权限控制

**实现思路**：
- 产品和用户都包含区域标识字段
- 通过中间件实现区域权限控制
- 只有当用户区域与产品区域匹配时，才能访问该产品

**代码实现**：
```javascript
// 前端API请求拦截器
api.interceptors.request.use(
  config => {
    const userStore = useUserStore()
    
    // 添加token到请求头
    if (userStore.token) {
      config.headers.Authorization = `Bearer ${userStore.token}`
    }
    
    // 添加区域ID到请求头
    if (userStore.userInfo.region_id) {
      config.headers['X-Region-ID'] = userStore.userInfo.region_id
    }
    
    return config
  },
  error => {
    Toast.fail('请求发送失败')
    return Promise.reject(error)
  }
)
```

### 3.3 清单导出功能

**实现思路**：
- 使用html2canvas库将清单页面转换为图片
- 支持保存图片到本地

**代码实现**：
```javascript
// 导出清单为图片
export const exportListAsImage = async (elementId) => {
  try {
    const element = document.getElementById(elementId)
    const canvas = await html2canvas(element, {
      scale: 2, // 提高图片清晰度
      useCORS: true, // 允许跨域图片
      backgroundColor: '#ffffff'
    })
    
    // 转换为图片链接
    const image = canvas.toDataURL('image/png')
    
    // 创建下载链接
    const link = document.createElement('a')
    link.href = image
    link.download = `要货清单_${new Date().getTime()}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    return true
  } catch (error) {
    console.error('导出图片失败:', error)
    return false
  }
}
```

## 4. 响应式设计

### 4.1 媒体查询

**实现思路**：
- 使用CSS媒体查询适配不同屏幕尺寸
- 优先适配手机屏幕

**代码实现**：
```scss
// 响应式设计
@media (max-width: 768px) {
  .product-list-container {
    max-width: 100%;
  }
  
  .product-item {
    padding: 10px;
  }
  
  .product-image {
    height: 120px;
  }
  
  .product-info {
    font-size: 14px;
  }
}

@media (max-width: 480px) {
  .navbar {
    padding: 0 10px;
  }
  
  .search-container {
    padding: 10px;
  }
  
  .product-list {
    padding: 10px;
  }
}
```

### 4.2 弹性布局

**实现思路**：
- 使用Flexbox和Grid布局实现响应式设计
- 适配不同屏幕尺寸和设备方向

**代码实现**：
```scss
.product-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 10px;
}

@media (max-width: 480px) {
  .product-grid {
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  }
}
```

## 5. 性能优化

### 5.1 图片懒加载

**实现思路**：
- 使用Vant UI的Image组件的lazy-load属性实现图片懒加载
- 减少初始加载时间

**代码实现**：
```vue
<van-image
  :src="product.images && product.images.length > 0 ? product.images[0].image_url : 'https://picsum.photos/400/400'
  :fit="'cover'"
  width="100%"
  height="150px"
  lazy-load
/>
```

### 5.2 分页加载

**实现思路**：
- 使用Vant UI的List组件实现分页加载
- 减少初始加载的数据量

**代码实现**：
```vue
<van-list
  v-model:loading="isLoading"
  :finished="isFinished"
  finished-text="没有更多了"
  @load="onLoad"
  :immediate-check="false"
>
  <!-- 商品列表 -->
</van-list>
```

### 5.3 缓存策略

**实现思路**：
- 使用localStorage缓存常用数据
- 减少API请求次数

**代码实现**：
```javascript
// 缓存产品列表
export const cacheProducts = (products) => {
  localStorage.setItem('products', JSON.stringify(products))
}

// 获取缓存的产品列表
export const getCachedProducts = () => {
  const cached = localStorage.getItem('products')
  return cached ? JSON.parse(cached) : null
}
```

## 6. 测试与调试

### 6.1 单元测试

**实现思路**：
- 使用Jest进行单元测试
- 测试核心功能和组件

**代码实现**：
```javascript
// 测试首拼搜索功能
describe('filterProductsByFirstLetter', () => {
  it('should filter products by first letter', () => {
    const products = [
      { id: 1, name: '产品1', manufacturer: '厂家1', category: { name: '类别1' } },
      { id: 2, name: '产品2', manufacturer: '厂家2', category: { name: '类别2' } },
      { id: 3, name: '测试产品', manufacturer: '测试厂家', category: { name: '测试类别' } }
    ]
    
    const filtered = filterProductsByFirstLetter(products, 'cp')
    expect(filtered.length).toBe(3)
    expect(filtered[0].name).toBe('产品1')
    expect(filtered[1].name).toBe('产品2')
  })
})
```

### 6.2 调试工具

**实现思路**：
- 使用Chrome DevTools进行调试
- 使用Vue DevTools进行Vue组件调试

**调试命令**：
```bash
# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 运行单元测试
npm run test
```

## 7. 部署与发布

### 7.1 构建与打包

**实现思路**：
- 使用Vite构建工具进行项目构建
- 生成生产版本的静态文件

**构建命令**：
```bash
# 构建生产版本
npm run build

# 预览生产版本
npm run preview
```

### 7.2 静态文件部署

**实现思路**：
- 将构建后的静态文件部署到Nginx或其他Web服务器
- 配置域名和SSL证书

**Nginx配置示例**：
```nginx
server {
  listen 80;
  server_name example.com;
  root /var/www/html;
  index index.html;
  
  location / {
    try_files $uri $uri/ /index.html;
  }
  
  location /api {
    proxy_pass http://localhost:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

## 8. 总结

本设计文档详细描述了产品资料管理与展示系统前台部分的开发设计，包括登录与注册功能、产品展示页面、要货清单功能等核心模块，以及首拼搜索、区域权限控制、响应式设计等关键技术实现。系统采用前后端分离架构，前端使用Vue 3 + Vant UI + Pinia + Vue Router技术栈，以手机端为核心适配目标，实现了完整的产品资料管理与展示功能。