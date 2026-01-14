# 系统在线开发部署说明

## 目标环境
- **服务器地址**：1.15.13.153
- **域名**：http://cqxsg.cloud/
- **操作系统**：CentOS Stream 9 64bit

## 1. 部署前期准备

### 1.1 服务器环境检查

| 步骤编号 | 操作名称 | 执行命令 | 配置说明 | 验证方法 |
|---------|---------|---------|---------|---------|
| 1.1.1 | 检查系统版本 | `cat /etc/centos-release` | 确认CentOS Stream 9系统 | 输出包含"CentOS Stream release 9" |
| 1.1.2 | 检查网络连通性 | `ping -c 3 www.baidu.com` | 验证服务器网络连接正常 | 显示网络响应 |
| 1.1.3 | 检查端口可用性 | `ss -tuln | grep -E '22|80|443|8080'` | 查看必要端口是否已开放 | 显示端口监听状态 |
| 1.1.4 | 更新系统软件包 | `yum update -y` | 确保系统软件包为最新版本 | 无错误输出 |

### 1.2 安全配置

| 步骤编号 | 操作名称 | 执行命令 | 配置说明 | 验证方法 |
|---------|---------|---------|---------|---------|
| 1.2.1 | 配置firewalld防火墙 | `firewall-cmd --permanent --add-port=22/tcp`<br>`firewall-cmd --permanent --add-port=80/tcp`<br>`firewall-cmd --permanent --add-port=443/tcp`<br>`firewall-cmd --permanent --add-port=8080/tcp`<br>`firewall-cmd --reload` | 开放必要端口 | `firewall-cmd --list-ports` 显示已开放端口 |
| 1.2.2 | 禁用不必要的服务 | `systemctl disable postfix cups avahi-daemon` | 禁用不需要的系统服务 | 无错误输出 |
| 1.2.3 | 设置SSH密钥认证 | 建议使用SSH密钥登录，禁用密码登录 | 提升服务器安全性 | 可正常使用密钥登录 |

### 1.3 项目准备

| 步骤编号 | 操作名称 | 执行命令 | 配置说明 | 验证方法 |
|---------|---------|---------|---------|---------|
| 1.3.1 | 前端项目打包 | `cd /var/opt/product-management/frontend`<br>`npm install`<br>`npm run build` | 生成前端打包产物 | 生成`dist`目录 |
| 1.3.2 | 后端项目打包 | `cd /var/opt/product-management/backend`<br>`npm install`<br>`npm run build` | 生成后端打包产物 | 生成`dist`目录 |
| 1.3.3 | 准备上传文件 | 收集以下文件：<br>- 前端`dist`目录<br>- 后端`dist`目录<br>- 图片存储空间模板<br>- Excel导入模板 | 确保所有文件准备就绪 | 文件存在且完整 |

## 2. 基础环境搭建

### 2.1 安装JDK 17

| 步骤编号 | 操作名称 | 执行命令 | 配置说明 | 验证方法 |
|---------|---------|---------|---------|---------|
| 2.1.1 | 安装JDK 17 | `yum install java-17-openjdk-devel -y` | 安装Java 17开发环境 | `java -version` 显示版本17 |
| 2.1.2 | 配置环境变量 | `echo 'export JAVA_HOME=/usr/lib/jvm/java-17-openjdk' >> ~/.bashrc`<br>`echo 'export PATH=$JAVA_HOME/bin:$PATH' >> ~/.bashrc`<br>`source ~/.bashrc` | 配置Java环境变量 | `echo $JAVA_HOME` 显示正确路径 |

### 2.2 安装MySQL 8.0

| 步骤编号 | 操作名称 | 执行命令 | 配置说明 | 验证方法 |
|---------|---------|---------|---------|---------|
| 2.2.1 | 安装MySQL 8.0 | `yum install mysql-server -y` | 安装MySQL服务器 | `systemctl status mysqld` 显示运行状态 |
| 2.2.2 | 启动MySQL服务 | `systemctl start mysqld`<br>`systemctl enable mysqld` | 设置开机自启 | `systemctl is-enabled mysqld` 显示enabled |
| 2.2.3 | 设置root密码 | `mysql_secure_installation` | 初始化MySQL安全配置 | 可使用新密码登录 |
| 2.2.4 | 配置远程访问 | `mysql -u root -p`<br>`CREATE USER 'admin'@'%' IDENTIFIED BY 'Password123!';`<br>`GRANT ALL PRIVILEGES ON *.* TO 'admin'@'%' WITH GRANT OPTION;`<br>`FLUSH PRIVILEGES;`<br>`exit;` | 创建远程访问用户并授权 | 可从外部连接MySQL |
| 2.2.5 | 配置MySQL参数 | `vi /etc/my.cnf`<br>添加以下内容：<br>`[mysqld]`<br>`character-set-server=utf8mb4`<br>`collation-server=utf8mb4_unicode_ci`<br>`max_connections=1000` | 配置字符集和最大连接数 | `systemctl restart mysqld` 重启服务 |
| 2.2.6 | 创建项目数据库 | `mysql -u root -p`<br>`CREATE DATABASE product_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`<br>`exit;` | 创建项目数据库 | 数据库创建成功 |

### 2.3 安装Redis

| 步骤编号 | 操作名称 | 执行命令 | 配置说明 | 验证方法 |
|---------|---------|---------|---------|---------|
| 2.3.1 | 安装Redis | `yum install redis -y` | 安装Redis服务 | `systemctl status redis` 显示运行状态 |
| 2.3.2 | 配置Redis | `vi /etc/redis.conf`<br>修改以下内容：<br>`bind 127.0.0.1`<br>`protected-mode yes`<br>`requirepass YourRedisPassword`<br>`daemonize yes`<br>`maxmemory 256mb`<br>`maxmemory-policy allkeys-lru` | 配置Redis参数 | `systemctl restart redis` 重启服务 |
| 2.3.3 | 设置开机自启 | `systemctl enable redis` | 配置Redis开机自启 | `systemctl is-enabled redis` 显示enabled |
| 2.3.4 | 验证Redis | `redis-cli -a YourRedisPassword ping` | 测试Redis连接 | 输出PONG |

### 2.4 安装Nginx

| 步骤编号 | 操作名称 | 执行命令 | 配置说明 | 验证方法 |
|---------|---------|---------|---------|---------|
| 2.4.1 | 安装Nginx | `yum install nginx -y` | 安装Nginx服务 | `systemctl status nginx` 显示运行状态 |
| 2.4.2 | 启动Nginx服务 | `systemctl start nginx`<br>`systemctl enable nginx` | 设置开机自启 | `systemctl is-enabled nginx` 显示enabled |
| 2.4.3 | 验证Nginx | `curl http://localhost` | 测试Nginx默认页面 | 显示Nginx欢迎页面 |

### 2.5 安装必要依赖工具

| 步骤编号 | 操作名称 | 执行命令 | 配置说明 | 验证方法 |
|---------|---------|---------|---------|---------|
| 2.5.1 | 安装Git | `yum install git -y` | 安装Git版本控制 | `git --version` 显示版本信息 |
| 2.5.2 | 安装Node.js | `curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -`<br>`yum install -y nodejs` | 安装Node.js 20.x | `node --version` 显示v20.x.x |
| 2.5.3 | 安装npm | `npm install -g npm@latest` | 安装最新版npm | `npm --version` 显示最新版本 |
| 2.5.4 | 安装PM2 | `npm install -g pm2` | 安装PM2进程管理器 | `pm2 --version` 显示版本信息 |

## 3. 项目部署步骤

### 3.1 上传项目文件

| 步骤编号 | 操作名称 | 执行命令 | 配置说明 | 验证方法 |
|---------|---------|---------|---------|---------|
| 3.1.1 | 创建项目目录 | `mkdir -p /opt/product-management/backend`<br>`mkdir -p /opt/product-management/frontend`<br>`mkdir -p /opt/product-management/uploads/images`<br>`mkdir -p /opt/product-management/templates` | 创建项目目录结构 | 目录创建成功 |
| 3.1.2 | 上传前端文件 | 使用SCP或SFTP将前端`dist`目录上传至`/opt/product-management/frontend/` | 上传前端打包产物 | 文件上传成功 |
| 3.1.3 | 上传后端文件 | 使用SCP或SFTP将后端`dist`目录上传至`/opt/product-management/backend/` | 上传后端打包产物 | 文件上传成功 |
| 3.1.4 | 上传模板文件 | 使用SCP或SFTP将Excel导入模板上传至`/opt/product-management/templates/` | 上传项目模板文件 | 文件上传成功 |
| 3.1.5 | 配置文件权限 | `chmod -R 755 /opt/product-management/`<br>`chmod -R 775 /opt/product-management/uploads/` | 设置目录和文件权限 | 权限设置正确 |

### 3.2 后端项目部署

| 步骤编号 | 操作名称 | 执行命令 | 配置说明 | 验证方法 |
|---------|---------|---------|---------|---------|
| 3.2.1 | 配置application.yml | `vi /opt/product-management/backend/config/config.js` | 修改以下配置：<br>- 数据库连接信息<br>- Redis连接信息<br>- 域名配置<br>- 图片存储路径：`/opt/product-management/uploads/images/`<br>- 区域标识核心配置 | 配置文件修改正确 |
| 3.2.2 | 安装后端依赖 | `cd /opt/product-management/backend`<br>`npm install` | 安装后端项目依赖 | 依赖安装成功 |
| 3.2.3 | 配置PM2启动 | `pm2 start npm --name "product-management-backend" -- start`<br>`pm2 save`<br>`pm2 startup` | 使用PM2管理后端进程 | `pm2 status` 显示运行状态 |
| 3.2.4 | 验证后端接口 | `curl http://localhost:8080/api/health` | 测试后端健康检查接口 | 返回健康状态信息 |

### 3.3 前端项目部署

| 步骤编号 | 操作名称 | 执行命令 | 配置说明 | 验证方法 |
|---------|---------|---------|---------|---------|
| 3.3.1 | 配置Nginx | `vi /etc/nginx/conf.d/product-management.conf` | 添加以下内容：<br>```<br>server {<br>    listen 80;<br>    server_name cqxsg.cloud;<br>    <br>    location / {<br>        root /opt/product-management/frontend/dist;<br>        index index.html;<br>        try_files $uri $uri/ /index.html;<br>    }<br>    <br>    location /api/ {<br>        proxy_pass http://localhost:8080/api/;<br>        proxy_set_header Host $host;<br>        proxy_set_header X-Real-IP $remote_addr;<br>        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;<br>        proxy_set_header X-Forwarded-Proto $scheme;<br>    }<br>    <br>    location /uploads/ {<br>        alias /opt/product-management/uploads/;<br>        expires 30d;<br>    }<br>}<br>``` | 配置Nginx反向代理和静态资源 | 配置文件修改正确 |
| 3.3.2 | 重启Nginx | `nginx -t`<br>`systemctl restart nginx` | 测试并重启Nginx服务 | 无错误输出 |
| 3.3.3 | 验证前端访问 | `curl http://localhost` | 测试前端页面访问 | 显示前端页面内容 |

### 3.4 图片存储空间配置

| 步骤编号 | 操作名称 | 执行命令 | 配置说明 | 验证方法 |
|---------|---------|---------|---------|---------|
| 3.4.1 | 创建存储目录 | `mkdir -p /opt/product-management/uploads/images`<br>`mkdir -p /opt/product-management/uploads/excel` | 创建图片和Excel存储目录 | 目录创建成功 |
| 3.4.2 | 配置目录权限 | `chmod -R 775 /opt/product-management/uploads/`<br>`chown -R nginx:nginx /opt/product-management/uploads/` | 设置目录读写权限 | 权限设置正确 |
| 3.4.3 | 配置Nginx访问控制 | 在Nginx配置中添加访问控制 | 禁止匿名访问敏感资源 | 需认证才能访问 |
| 3.4.4 | 验证图片上传 | 通过前端上传图片功能测试 | 图片上传成功并可访问 | 图片显示正常 |

### 3.5 数据库初始化

| 步骤编号 | 操作名称 | 执行命令 | 配置说明 | 验证方法 |
|---------|---------|---------|---------|---------|
| 3.5.1 | 导入初始化SQL | `mysql -u root -p product_management < /opt/product-management/backend/init.sql` | 导入项目初始化数据 | 数据导入成功 |
| 3.5.2 | 验证数据库数据 | `mysql -u root -p product_management -e "SELECT * FROM users LIMIT 1;"` | 验证系统管理员账号存在 | 显示管理员账号信息 |
| 3.5.3 | 验证区域标识数据 | `mysql -u root -p product_management -e "SELECT * FROM regions;"` | 验证默认区域标识存在 | 显示区域标识列表 |

## 4. 域名配置与生效

### 4.1 配置域名解析

| 步骤编号 | 操作名称 | 执行命令 | 配置说明 | 验证方法 |
|---------|---------|---------|---------|---------|
| 4.1.1 | 登录域名控制台 | 在域名注册商平台登录 | 进入域名管理界面 | 登录成功 |
| 4.1.2 | 添加A记录 | 将域名`cqxsg.cloud`解析至IP`1.15.13.153` | 设置A记录或CNAME记录 | 域名解析设置成功 |
| 4.1.3 | 验证域名解析 | `nslookup cqxsg.cloud`<br>`ping cqxsg.cloud` | 验证域名是否已生效 | 显示正确的IP地址 |

### 4.2 配置Nginx域名绑定

| 步骤编号 | 操作名称 | 执行命令 | 配置说明 | 验证方法 |
|---------|---------|---------|---------|---------|
| 4.2.1 | 配置Nginx域名 | `vi /etc/nginx/conf.d/product-management.conf` | 修改server_name为`cqxsg.cloud` | 配置文件修改正确 |
| 4.2.2 | 重启Nginx服务 | `nginx -t`<br>`systemctl restart nginx` | 使配置生效 | 无错误输出 |

### 4.3 验证域名访问

| 步骤编号 | 操作名称 | 执行命令 | 配置说明 | 验证方法 |
|---------|---------|---------|---------|---------|
| 4.3.1 | 访问前台页面 | `curl http://cqxsg.cloud` | 测试域名访问前台 | 显示前端页面内容 |
| 4.3.2 | 访问后台页面 | `curl http://cqxsg.cloud/admin` | 测试域名访问后台 | 显示后台登录页面 |
| 4.3.3 | 验证API接口 | `curl http://cqxsg.cloud/api/health` | 测试域名访问API | 返回健康状态信息 |

## 5. 测试与优化

### 5.1 功能测试

| 步骤编号 | 操作名称 | 执行命令 | 配置说明 | 验证方法 |
|---------|---------|---------|---------|---------|
| 5.1.1 | 测试登录功能 | 访问http://cqxsg.cloud/admin 登录 | 使用系统管理员账号登录 | 登录成功并进入后台 |
| 5.1.2 | 测试商品管理 | 在后台添加、编辑、删除商品 | 验证商品管理功能正常 | 商品操作成功 |
| 5.1.3 | 测试图片上传 | 上传商品图片并关联 | 验证图片上传和关联功能 | 图片显示正常 |
| 5.1.4 | 测试区域访问控制 | 使用不同区域的管理员账号登录 | 验证只能访问自身区域数据 | 权限控制有效 |
| 5.1.5 | 测试Excel导入/导出 | 使用Excel模板导入和导出商品 | 验证Excel功能正常 | 导入导出成功 |

### 5.2 性能优化

| 步骤编号 | 操作名称 | 执行命令 | 配置说明 | 验证方法 |
|---------|---------|---------|---------|---------|
| 5.2.1 | 优化Nginx配置 | `vi /etc/nginx/nginx.conf` | 添加以下优化配置：<br>`worker_processes auto;`<br>`worker_connections 1024;`<br>`gzip on;`<br>`gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript;` | 提升Nginx性能 | 配置文件修改正确 |
| 5.2.2 | 优化MySQL查询 | `vi /etc/my.cnf` | 添加以下优化配置：<br>`query_cache_type = 1`<br>`query_cache_size = 64M`<br>`innodb_buffer_pool_size = 512M` | 提升MySQL查询效率 | 配置文件修改正确 |
| 5.2.3 | 优化Redis缓存 | `vi /etc/redis.conf` | 调整Redis内存限制和缓存策略 | 提升Redis性能 | 配置文件修改正确 |

### 5.3 异常排查

| 步骤编号 | 操作名称 | 执行命令 | 配置说明 | 验证方法 |
|---------|---------|---------|---------|---------|
| 5.3.1 | 检查端口占用 | `lsof -i :8080` | 查看端口8080占用情况 | 显示占用端口的进程 |
| 5.3.2 | 查看后端日志 | `pm2 logs product-management-backend` | 查看后端应用日志 | 显示应用运行日志 |
| 5.3.3 | 查看Nginx日志 | `tail -f /var/log/nginx/access.log`<br>`tail -f /var/log/nginx/error.log` | 查看Nginx访问和错误日志 | 显示Nginx运行日志 |
| 5.3.4 | 检查数据库连接 | `mysql -u admin -p -h localhost product_management` | 测试数据库连接 | 连接成功 |
| 5.3.5 | 检查Redis连接 | `redis-cli -a YourRedisPassword ping` | 测试Redis连接 | 输出PONG |

### 5.4 后期维护

| 步骤编号 | 操作名称 | 执行命令 | 配置说明 | 验证方法 |
|---------|---------|---------|---------|---------|
| 5.4.1 | 定期备份数据库 | `mysqldump -u root -p product_management > /opt/backup/product_management_$(date +%Y%m%d).sql` | 定期备份数据库 | 生成备份文件 |
| 5.4.2 | 定期备份图片 | `tar -czf /opt/backup/images_$(date +%Y%m%d).tar.gz /opt/product-management/uploads/images` | 定期备份图片文件 | 生成备份文件 |
| 5.4.3 | 更新项目版本 | 使用PM2重启后端应用 | 部署新版本项目 | 应用更新成功 |
| 5.4.4 | 监控系统状态 | `top`<br>`df -h`<br>`free -h` | 监控系统资源使用情况 | 显示系统状态信息 |

## 6. 系统管理员账号

- **用户名**：admin
- **密码**：Admin123456
- **初始角色**：系统管理员
- **登录地址**：http://cqxsg.cloud/admin

## 7. 常见问题解决

### 7.1 端口占用问题
```bash
# 查看端口占用情况
lsof -i :端口号

# 终止占用端口的进程
kill -9 进程ID
```

### 7.2 数据库连接失败
```bash
# 检查数据库服务状态
systemctl status mysqld

# 检查数据库连接配置
vi /opt/product-management/backend/config/config.js

# 测试数据库连接
mysql -u 用户名 -p -h 主机名 数据库名
```

### 7.3 图片上传失败
```bash
# 检查目录权限
ls -la /opt/product-management/uploads/images/

# 检查Nginx配置
vi /etc/nginx/conf.d/product-management.conf

# 检查后端图片配置
vi /opt/product-management/backend/config/config.js
```

### 7.4 Nginx错误
```bash
# 测试Nginx配置
nginx -t

# 查看Nginx错误日志
tail -f /var/log/nginx/error.log
```

### 7.5 后端服务无法启动
```bash
# 查看PM2日志
pm2 logs product-management-backend

# 检查配置文件
vi /opt/product-management/backend/config/config.js

# 检查依赖安装
cd /opt/product-management/backend && npm install
```

---

**部署文档版本**：v1.0
**创建日期**：2024-01-13
**适用环境**：CentOS Stream 9 64bit