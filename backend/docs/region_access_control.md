# 区域访问控制实现文档

## 1. 核心实现逻辑

### 1.1 区域权限控制模型

区域访问控制的核心是基于「商品资料区域标识」和「客户资料区域标识」的精确匹配，只有当两者完全一致时，客户才可访问该商品。

```
客户.region_id === 商品.region_id
```

### 1.2 角色与区域权限关系

| 角色类型 | 区域权限范围 | 产品权限范围 |
|---------|------------|------------|
| 系统管理员 | 所有区域 | 所有产品 |
| 管理员 | 所属区域 | 所属区域且自己创建的产品 |
| 普通用户 | 所属区域 | 所属区域的所有产品 |

## 2. 数据库层面实现

### 2.1 核心表结构

**用户表 (users)**
```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('system_admin', 'admin', 'user') NOT NULL DEFAULT 'user',
  region_id INT NOT NULL,
  status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  FOREIGN KEY (region_id) REFERENCES regions(id)
);
```

**产品表 (products)**
```sql
CREATE TABLE products (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  stock INT NOT NULL DEFAULT 0,
  region_id INT NOT NULL,
  admin_id INT NOT NULL,
  status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  FOREIGN KEY (region_id) REFERENCES regions(id),
  FOREIGN KEY (admin_id) REFERENCES users(id)
);
```

**区域表 (regions)**
```sql
CREATE TABLE regions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL UNIQUE,
  code VARCHAR(20) NOT NULL UNIQUE,
  description TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## 3. 后端层面实现

### 3.1 区域权限中间件

```javascript
// middlewares/regionAuth.js
const regionAuthMiddleware = async (req, res, next) => {
  const user = req.user;
  const { id } = req.params;
  
  // 系统管理员直接通过
  if (user.role === 'system_admin') {
    return next();
  }
  
  // 获取资源类型
  const pathSegments = req.path.split('/');
  const resourceType = pathSegments[2];
  
  switch (resourceType) {
    case 'products':
      await validateProductAccess(user, id, res, next);
      break;
    case 'users':
      await validateUserAccess(user, id, res, next);
      break;
    // 其他资源类型的验证...
    default:
      next();
  }
};
```

### 3.2 产品访问权限验证

```javascript
// 验证产品访问权限
const validateProductAccess = async (user, productId, res, next) => {
  if (!productId) {
    return next(); // 列表请求，后续处理
  }
  
  const product = await db.Product.findByPk(productId);
  
  if (user.role === 'admin') {
    // 管理员只能访问自己创建的同区域产品
    if (product.admin_id !== user.id || product.region_id !== user.region_id) {
      return res.status(403).json({ message: '无权限访问该产品' });
    }
  } else {
    // 普通用户只能访问同区域产品
    if (product.region_id !== user.region_id) {
      return res.status(403).json({ message: '无权限访问该产品' });
    }
  }
  
  next();
};
```

### 3.3 产品列表查询权限控制

```javascript
// controllers/productController.js - getProducts
// 构建查询条件
const whereClause = {};

// 区域权限控制
if (user.role === 'admin') {
  // 管理员只能查看自己创建的同区域产品
  whereClause.region_id = user.region_id;
  whereClause.admin_id = user.id;
} else if (user.role === 'user') {
  // 普通用户只能查看同区域产品
  whereClause.region_id = user.region_id;
}

// 查询产品列表
const { count, rows } = await db.Product.findAndCountAll({
  where: whereClause,
  // 其他查询条件...
});
```

## 4. 前端层面实现

### 4.1 路由守卫实现

```javascript
// router/index.js
router.beforeEach(async (to, from, next) => {
  const user = store.state.user;
  
  // 验证产品详情页权限
  if (to.name === 'productDetail') {
    const productId = to.params.id;
    const product = await productService.getProductDetail(productId);
    
    // 系统管理员可以访问所有产品
    if (user.role === 'system_admin') {
      return next();
    }
    
    // 普通用户只能访问同区域产品
    if (product.region_id === user.region_id) {
      return next();
    }
    
    // 无权限，跳转到无权限页面
    return next({ name: 'noPermission' });
  }
  
  next();
});
```

### 4.2 API请求拦截

```javascript
// services/api.js
axios.interceptors.request.use(config => {
  const user = store.state.user;
  if (user && user.region_id) {
    config.headers['X-Region-ID'] = user.region_id;
  }
  return config;
});
```

### 4.3 产品列表过滤

```javascript
// components/ProductList.vue
const filteredProducts = computed(() => {
  const user = store.state.user;
  
  // 系统管理员可以查看所有产品
  if (user.role === 'system_admin') {
    return products.value;
  }
  
  // 普通用户和管理员只能查看同区域产品
  return products.value.filter(product => {
    return product.region_id === user.region_id;
  });
});
```

## 5. 区域权限控制在各模块的应用

### 5.1 产品管理模块

- **产品创建**: 自动关联创建者的区域ID
- **产品编辑**: 验证区域权限和创建者权限
- **产品删除**: 验证区域权限和创建者权限
- **产品列表**: 根据用户区域权限过滤显示

### 5.2 用户管理模块

- **用户注册**: 分配区域ID
- **用户编辑**: 验证区域权限
- **用户列表**: 管理员只能查看同区域用户

### 5.3 前台展示模块

- **产品列表**: 根据客户区域权限过滤显示
- **产品搜索**: 只搜索客户有权限访问的产品
- **产品详情**: 验证区域权限后显示

## 6. 权限验证流程

### 6.1 产品访问验证流程

```
客户端请求 → JWT认证 → 角色验证 → 区域权限验证 → 产品权限验证 → 返回数据
```

### 6.2 详细验证步骤

1. **JWT认证**: 验证用户身份和Token有效性
2. **角色验证**: 确定用户角色(系统管理员/管理员/普通用户)
3. **区域权限验证**: 
   - 系统管理员: 跳过区域验证
   - 管理员: 验证资源(产品/用户)的region_id是否与用户region_id一致
   - 普通用户: 验证资源(产品/用户)的region_id是否与用户region_id一致
4. **产品权限验证**: 
   - 系统管理员: 跳过产品验证
   - 管理员: 验证产品的admin_id是否与用户id一致
   - 普通用户: 跳过产品创建者验证
5. **返回数据**: 根据验证结果返回数据或错误信息

## 7. 安全考虑

### 7.1 双重验证机制

- **后端验证**: 所有API接口都进行区域权限验证
- **前端验证**: 前端也进行区域权限验证，提高用户体验和安全性

### 7.2 权限边界控制

- 严格限制角色的权限范围
- 避免越权操作
- 记录所有权限验证失败的操作日志

### 7.3 数据隔离

- 不同区域的数据在逻辑上完全隔离
- 确保跨区域数据访问无法绕过权限验证

## 8. 测试和调试

### 8.1 测试用例

- 测试普通用户只能访问同区域产品
- 测试管理员只能访问自己创建的同区域产品
- 测试系统管理员可以访问所有产品
- 测试越权访问的错误处理

### 8.2 调试工具

- **日志记录**: 记录所有权限验证操作
- **调试模式**: 提供详细的权限验证调试信息
- **测试账户**: 创建不同角色和区域的测试账户

## 9. 未来扩展

### 9.1 多级区域支持

未来可以扩展为多级区域支持，如：
- 省级区域
- 市级区域
- 县级区域

```
客户.province_id === 商品.province_id &&
客户.city_id === 商品.city_id &&
客户.district_id === 商品.district_id
```

### 9.2 区域权限继承

实现区域权限的继承机制，如：
- 市级管理员可以访问所属省的所有产品
- 省级管理员可以访问所属省的所有产品

### 9.3 动态区域权限

实现动态区域权限分配，支持：
- 临时授权
- 权限有效期
- 基于时间的权限控制

## 10. 总结

区域访问控制是本系统的核心功能之一，通过将区域标识深度融入产品管理、人员管理和前台展示的全流程，实现了客户与产品的精确匹配。该实现严格遵循了最小权限原则，确保了数据的安全性和隔离性，同时提供了良好的扩展性，可以满足未来业务发展的需求。