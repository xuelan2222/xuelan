# 系统后台管理开发设计文档

## 1. 系统概述

本系统是一个以区域管理为核心的ERP系统后台，主要面向管理员和系统管理员，提供产品管理、图片管理、人员管理等功能，并深度融入区域标识逻辑，确保不同区域的管理员只能管理自身区域内的数据。

## 2. 技术栈

- **后端框架**：Node.js + Express.js
- **数据库**：MySQL
- **ORM**：Sequelize
- **文件存储**：本地文件系统（适配CentOS Stream 9）
- **日志**：Winston
- **认证**：JWT

## 3. 核心功能模块

### 3.1 产品管理模块

#### 3.1.1 产品列表页面

**功能描述**：采用列表式展示所有商品数据，支持多条件筛选和排序。

**页面结构**：
- 顶部筛选栏：
  - 区域筛选（下拉选择）
  - 类别筛选（下拉选择）
  - 生产厂家筛选（下拉选择）
  - 供货商筛选（下拉选择）
  - 商品状态筛选（下拉选择：全部/上架/下架）
  - 搜索框（支持商品名称、编码、规格搜索）
  - 重置按钮
  - 筛选按钮
- 操作栏：
  - 添加商品按钮
  - 批量导入按钮
  - 批量导出按钮
  - 批量维护按钮
- 产品列表：
  - 复选框（用于批量操作）
  - 序号
  - 商品图片（缩略图）
  - 商品名称
  - 商品编码
  - 规格
  - 供货价
  - 医保类型
  - 医保价
  - 生产厂家
  - 类别
  - 区域标识
  - 供货商
  - 功能分类
  - 状态
  - 操作（编辑/删除/上下架）
- 分页控件

**数据接口**：
```
GET /api/products
参数：
- page: 页码
- pageSize: 每页数量
- region_id: 区域ID
- category_id: 类别ID
- manufacturer: 生产厂家
- supplier: 供货商
- status: 状态
- keyword: 搜索关键词
- sort_by: 排序字段
- sort_order: 排序方向（asc/desc）
返回：
{ "products": [...], "total": 100 }
```

#### 3.1.2 商品编辑页面

**功能描述**：支持商品的添加、编辑、修改操作，包含完整的商品属性配置。

**页面结构**：
- 基础属性表单：
  - 商品名称（必填）
  - 商品编码（必填，唯一）
  - 规格（必填）
  - 供货价（必填）
  - 医保类型（下拉选择：甲类/乙类/丙类）
  - 医保价
  - 生产厂家（必填）
  - 类别（下拉选择，必填）
  - 备注
- 核心配置表单：
  - 商品区域标识（下拉选择，与客户区域属性保持一致选项，必填项）
  - 供货商（下拉选择，用于批量维护管理）
  - 功能分类（下拉选择，用于批量维护管理）
  - 状态（下拉选择：上架/下架）
- 图片配置表单：
  - 图片库选择（支持多选）
  - 图片URL输入（支持多个URL输入）
  - 图片排序（拖拽排序）
  - 主图设置（单选）
- 保存/取消按钮

**数据接口**：
```
POST /api/products  # 添加商品
PUT /api/products/:id  # 编辑商品
DELETE /api/products/:id  # 删除商品
PATCH /api/products/:id/status  # 修改商品状态
```

#### 3.1.3 批量操作功能

**Excel批量导入**：
- 提供标准化导入模板下载
- 模板包含所有商品必填属性，明确标注「区域标识」为必填项
- 导入时校验数据格式和区域标识有效性
- 无效数据返回详细报错报告
- 支持增量导入和覆盖导入

**Excel批量导出**：
- 导出时包含所有商品完整属性及区域标识信息
- 支持按筛选条件导出
- 支持自定义导出字段

**批量维护**：
- 针对同一分类/供货商的商品，批量修改区域标识、供货价等公共属性
- 支持按筛选条件选择商品
- 支持预览修改结果
- 提供修改记录日志

**数据接口**：
```
POST /api/excel/import  # Excel导入
GET /api/excel/export  # Excel导出
GET /api/excel/template  # 下载导入模板
POST /api/products/batch-update  # 批量维护
```

#### 3.1.4 区域标识逻辑

- 商品区域标识为必填项，用于控制前台访问权限
- 管理员只能查看和管理自身区域内的商品
- 系统管理员可以查看和管理所有区域的商品
- 商品导入时校验区域标识的有效性和管理员权限
- 批量维护时确保修改后的区域标识不超出管理员权限范围

### 3.2 图片管理模块

#### 3.2.1 图片存储空间设计

**存储方案**：
- 采用本地文件系统存储，存储路径：`/var/opt/product-management/uploads/images/`
- 按日期创建子目录：`/var/opt/product-management/uploads/images/2024/01/13/`
- 保留图片原图文件名，不进行自动重命名
- 为图片生成缩略图，用于列表展示

**权限设置**：
- 确保CentOS Stream 9服务器上的文件权限正确（目录权限755，文件权限644）
- 使用Express静态文件服务提供图片访问

#### 3.2.2 图片管理页面

**功能描述**：提供图片的上传、管理、关联功能。

**页面结构**：
- 顶部筛选栏：
  - 文件名搜索框
  - 上传时间筛选（日期范围选择）
  - 关联商品数量筛选（下拉选择：全部/已关联/未关联）
  - 筛选按钮
- 操作栏：
  - 批量上传按钮
  - 批量删除按钮
  - 批量关联商品按钮
- 图片展示区：
  - 支持列表式/网格式切换
  - 每个图片卡片包含：
    - 图片预览（缩略图）
    - 文件名
    - 上传时间
    - 文件大小
    - 关联商品数量
    - 操作（查看原图/删除/关联商品）
- 分页控件

**数据接口**：
```
GET /api/images  # 获取图片列表
POST /api/images/upload  # 上传图片
DELETE /api/images/:id  # 删除图片
DELETE /api/images/batch-delete  # 批量删除图片
POST /api/images/batch-associate  # 批量关联商品
```

#### 3.2.3 图片关联功能

**功能描述**：实现图片与商品的快速关联。

**关联方式**：
1. 图片管理页关联：
   - 选择单个/多个图片
   - 选择关联区域
   - 选择关联分类
   - 选择关联商品（支持多选）
   - 确认关联

2. 商品编辑页关联：
   - 从图片库中选择图片（支持多选）
   - 设置图片排序
   - 设置主图
   - 保存关联

**数据接口**：
```
POST /api/products/:id/images  # 为商品添加图片
DELETE /api/products/:id/images/:imageId  # 移除商品图片
PUT /api/products/:id/images/sort  # 排序商品图片
PUT /api/products/:id/images/main  # 设置主图
```

### 3.3 人员管理模块

#### 3.3.1 人员列表页面

**功能描述**：展示所有用户数据，支持多条件筛选和管理操作。

**页面结构**：
- 顶部筛选栏：
  - 用户类型筛选（下拉选择：全部/系统管理员/管理员/普通用户）
  - 区域筛选（下拉选择）
  - 黑白名单状态筛选（下拉选择：全部/白名单/黑名单）
  - 用户状态筛选（下拉选择：全部/激活/禁用）
  - 搜索框（支持用户名、手机号、邮箱搜索）
  - 筛选按钮
- 操作栏：
  - 添加用户按钮
  - 批量添加黑白名单按钮
- 人员列表：
  - 复选框（用于批量操作）
  - 序号
  - 用户名
  - 角色
  - 区域标识
  - 手机号
  - 邮箱
  - 黑白名单状态
  - 用户状态
  - 最后登录时间
  - 操作（编辑/删除/设置黑白名单/查看日志）
- 分页控件

**数据接口**：
```
GET /api/users  # 获取用户列表
POST /api/users  # 添加用户
PUT /api/users/:id  # 编辑用户
DELETE /api/users/:id  # 删除用户
```

#### 3.3.2 权限管理

**系统管理员权限**：
- 可增加、删除、修改所有管理员和普通用户的资料
- 可配置与修改用户「区域属性」
- 可查看所有用户的登录记录和操作日志
- 可管理所有区域的数据

**普通管理员权限**：
- 仅可管理自身区域内的普通用户
- 可修改用户资料和区域属性（不可超出自身管理区域）
- 仅可查看和管理自身区域的数据

**数据接口**：
```
GET /api/users/logs  # 获取用户操作日志
GET /api/users/login-logs  # 获取用户登录记录
```

#### 3.3.3 黑白名单管理

**功能描述**：提供快速加入黑白名单、批量加入黑白名单的操作入口。

**功能实现**：
- 黑名单用户直接禁止登录系统
- 白名单用户不受其他访问限制（可跨区域访问，可选配置）
- 支持单个用户设置黑白名单
- 支持批量用户设置黑白名单
- 支持查看黑白名单用户列表

**数据接口**：
```
POST /api/users/:id/blacklist  # 将用户加入黑名单
POST /api/users/:id/whitelist  # 将用户加入白名单
POST /api/users/batch-blacklist  # 批量加入黑名单
POST /api/users/batch-whitelist  # 批量加入白名单
GET /api/users/blacklist  # 获取黑名单列表
GET /api/users/whitelist  # 获取白名单列表
```

## 4. 核心逻辑设计

### 4.1 区域权限控制逻辑

**设计原则**：
- 基于用户角色和区域属性的权限控制
- 最小权限原则
- 权限继承关系

**实现逻辑**：
1. 系统管理员：无区域限制，可访问所有数据
2. 普通管理员：
   - 只能访问和管理自身区域内的数据
   - 只能管理自身区域内的用户
   - 不能修改超出自身区域的区域标识
3. 普通用户：
   - 只能访问和管理自身区域内的数据
   - 不能修改区域标识

**权限中间件**：
```javascript
// regionAuth.js
const regionAuth = (req, res, next) => {
  const user = req.user;
  
  // 系统管理员跳过区域验证
  if (user.role === 'system_admin') {
    return next();
  }
  
  // 普通管理员和用户只能访问自身区域内的数据
  if (req.body.region_id && req.body.region_id !== user.region_id) {
    return res.status(403).json({ message: '无权限访问其他区域的数据' });
  }
  
  // 在查询参数中添加区域限制
  if (req.query) {
    req.query.region_id = user.region_id;
  } else {
    req.query = { region_id: user.region_id };
  }
  
  next();
};
```

### 4.2 数据验证逻辑

**验证层面**：
1. 路由参数验证
2. 请求体验证
3. 业务逻辑验证
4. 数据库约束验证

**关键验证点**：
- 区域标识的有效性和权限验证
- 商品数据的完整性和唯一性
- 用户数据的完整性和唯一性
- 文件上传的格式和大小验证

### 4.3 日志记录逻辑

**日志类型**：
- 操作日志：记录用户的所有操作
- 登录日志：记录用户的登录记录
- 系统日志：记录系统的运行状态
- 错误日志：记录系统的错误信息

**日志格式**：
```javascript
{
  timestamp: '2024-01-13T10:00:00.000Z',
  level: 'info',
  message: '用户添加商品',
  user: {
    id: 1,
    username: 'admin',
    role: 'admin',
    region_id: 1
  },
  action: 'add_product',
  resource: 'product',
  resource_id: 1,
  ip: '192.168.1.1',
  params: {
    name: '商品名称',
    code: 'PROD001',
    region_id: 1
  }
}
```

## 5. 数据库设计

### 5.1 现有表结构优化

**产品表（products）**：
- 新增字段：
  - `manufacturer`：生产厂家
  - `supplier`：供货商
  - `functional_category`：功能分类
  - `medical_insurance_type`：医保类型
  - `medical_insurance_price`：医保价

**用户表（users）**：
- 新增字段：
  - `blacklist`：布尔值，是否在黑名单
  - `whitelist`：布尔值，是否在白名单

**区域表（regions）**：
- 保持不变

**产品图片表（product_images）**：
- 保持不变

**文件上传表（file_uploads）**：
- 保持不变

### 5.2 新增表结构

**操作日志表（operation_logs）**：
```sql
CREATE TABLE `operation_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `action` varchar(50) NOT NULL,
  `resource` varchar(50) NOT NULL,
  `resource_id` int(11) DEFAULT NULL,
  `params` text,
  `ip` varchar(50) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `operation_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

**登录日志表（login_logs）**：
```sql
CREATE TABLE `login_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `ip` varchar(50) NOT NULL,
  `login_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `login_result` enum('success','failure') NOT NULL,
  `failure_reason` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `login_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

## 6. 接口文档

### 6.1 认证接口

**登录**：
```
POST /api/auth/login
参数：
{ "username": "admin", "password": "password" }
返回：
{ "token": "jwt_token", "user": { ... } }
```

**获取用户信息**：
```
GET /api/auth/me
返回：
{ "user": { ... } }
```

### 6.2 产品管理接口

**获取产品列表**：
```
GET /api/products
参数：
- page: 页码
- pageSize: 每页数量
- region_id: 区域ID
- category_id: 类别ID
- manufacturer: 生产厂家
- supplier: 供货商
- status: 状态
- keyword: 搜索关键词
- sort_by: 排序字段
- sort_order: 排序方向
返回：
{ "products": [...], "total": 100 }
```

**添加产品**：
```
POST /api/products
参数：
{ 
  "name": "商品名称",
  "code": "PROD001",
  "spec": "规格",
  "price": 100.00,
  "medical_insurance_type": "甲类",
  "medical_insurance_price": 80.00,
  "manufacturer": "生产厂家",
  "category_id": 1,
  "region_id": 1,
  "supplier": "供货商",
  "functional_category": "功能分类",
  "status": "active",
  "images": ["image_url_1", "image_url_2"]
}
返回：
{ "product": { ... } }
```

### 6.3 图片管理接口

**上传图片**：
```
POST /api/images/upload
参数：
- files: 图片文件（支持批量上传）
返回：
{ "images": [{ "id": 1, "file_name": "image.jpg", "file_path": "/uploads/images/image.jpg" }] }
```

**获取图片列表**：
```
GET /api/images
参数：
- page: 页码
- pageSize: 每页数量
- file_name: 文件名
- start_date: 开始日期
- end_date: 结束日期
- associated: 是否已关联
返回：
{ "images": [...], "total": 100 }
```

### 6.4 人员管理接口

**获取用户列表**：
```
GET /api/users
参数：
- page: 页码
- pageSize: 每页数量
- role: 角色
- region_id: 区域ID
- blacklist: 是否在黑名单
- whitelist: 是否在白名单
- status: 状态
- keyword: 搜索关键词
返回：
{ "users": [...], "total": 100 }
```

**添加用户**：
```
POST /api/users
参数：
{ 
  "username": "user1",
  "password": "password",
  "role": "user",
  "region_id": 1,
  "email": "user1@example.com",
  "phone": "13800138000",
  "status": "active"
}
返回：
{ "user": { ... } }
```

## 7. 部署方案

### 7.1 服务器配置

**操作系统**：CentOS Stream 9
**CPU**：4核或以上
**内存**：8GB或以上
**存储**：200GB或以上
**网络**：公网IP

### 7.2 环境配置

1. 安装Node.js 20.x
2. 安装MySQL 8.0
3. 创建数据库和用户
4. 配置环境变量
5. 安装依赖
6. 运行数据库迁移
7. 启动服务

### 7.3 安全配置

1. 配置防火墙，只开放必要端口
2. 配置HTTPS
3. 配置文件权限
4. 配置日志轮转
5. 配置定期备份

## 8. 测试计划

### 8.1 单元测试

- 测试模型验证
- 测试控制器逻辑
- 测试中间件功能

### 8.2 集成测试

- 测试API接口
- 测试数据库交互
- 测试文件上传功能

### 8.3 系统测试

- 测试完整业务流程
- 测试权限控制
- 测试性能和稳定性

## 9. 维护计划

### 9.1 日常维护

- 监控系统运行状态
- 查看日志
- 备份数据
- 更新依赖

### 9.2 定期维护

- 优化数据库性能
- 清理过期数据
- 检查文件存储
- 更新系统补丁

---

**文档版本**：v1.0
**文档作者**：系统开发团队
**创建日期**：2024-01-13
**更新日期**：2024-01-13