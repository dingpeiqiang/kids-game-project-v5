# Simple-Game API 地址配置指南

## 问题说明

部署到云服务器后，simple-game 仍然访问 `localhost:8080`，导致 API 请求失败。

## 解决方案（已实施）

### ✅ 采用相对路径 + Nginx 反向代理方案

**核心原理：**
1. **前端构建**：使用相对路径 `/api`，不固化服务器 IP
2. **Nginx 代理**：在容器内将 `/api/` 转发到后端服务
3. **Docker 网络**：通过容器名称 `kids-game-backend` 通信

**优势：**
- ✅ 前端无需知道后端地址
- ✅ 支持动态部署（IP 变化无需重新构建）
- ✅ 避免 CORS 跨域问题
- ✅ 与主前端（frontend）架构一致

---

### 方案二：Docker Compose 环境变量注入（不适用）

**注意：** Vite 在构建时将环境变量固化到 JS 代码中，运行时注入无效。

---

### 方案三：Nginx 反向代理（✅ 已采用）

已在 `docker/nginx/simple-game.conf` 中配置：

```nginx
server {
    listen 80;
    server_name localhost;
    
    root /usr/share/nginx/html;
    index index.html;

    # SPA 路由支持
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API 代理到后端（通过 Docker 网络）
    location /api/ {
        proxy_pass http://kids-game-backend:8080/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

**工作流程：**
```
用户浏览器
    ↓ 请求 http://8.136.156.190:3001/api/game/list
simple-game Nginx (端口 80)
    ↓ 代理转发
http://kids-game-backend:8080/api/game/list
    ↓ 响应
返回 JSON 数据
```

---

## 当前配置状态

✅ 已创建 `.env.production` 文件，使用相对路径 `/api`
✅ 已创建 `docker/nginx/simple-game.conf` Nginx 配置文件
✅ 已更新 `Dockerfile.simple-game` 复制自定义 Nginx 配置
✅ API 代理：`/api/` → `http://kids-game-backend:8080/api/`

## 部署步骤

### 1. 重新构建镜像

```powershell
cd d:\工作\sitech\项目\研发\git_workspace\AI\kids-game-project-v5
.\docker\build-images.ps1 -Service simple-game
```

**构建过程：**
```
[builder] Vite 构建 → 使用 .env.production (VITE_API_BASE=/api)
[nginx] 复制 simple-game.conf → /etc/nginx/conf.d/default.conf
[nginx] 复制 dist/ → /usr/share/nginx/html
```

### 2. 上传到服务器

```bash
scp docker-images/simple-game.tar root@8.136.156.190:/tmp/
```

### 3. 部署到服务器

```bash
ssh root@8.136.156.190
cd /opt/docker
./scripts/deploy-from-images.sh
# 选择选项 5) simple-game 镜像加载 + 部署
```

### 4. 验证 API 地址

**方法一：浏览器开发者工具**
```
1. 打开 http://8.136.156.190:3001/
2. 按 F12 打开开发者工具
3. 切换到 Network（网络）标签
4. 刷新页面
5. 查看 API 请求：
   ✅ 应该是：/api/game/list （相对路径）
   ✅ 实际请求：http://8.136.156.190:3001/api/game/list
   ✅ Nginx 转发：http://kids-game-backend:8080/api/game/list
```

**方法二：检查 Nginx 配置**
```bash
# 在服务器上
docker exec kids-game-simple-game cat /etc/nginx/conf.d/default.conf | grep proxy_pass
# 应该看到：proxy_pass http://kids-game-backend:8080/api/;
```

## 常见问题

### Q1: 修改 .env.production 后需要重新构建吗？
**A:** 是的，Vite 在构建时会将环境变量固化到 JavaScript 代码中。

### Q2: 为什么使用相对路径而不是绝对路径？
**A:** 
- **相对路径**：前端无需知道后端地址，由 Nginx 代理转发
- **绝对路径**：IP 变化需重新构建，不支持动态部署
- **架构一致**：与主前端（frontend）保持一致

### Q3: Docker 网络中如何访问后端？
**A:** 通过容器名称 `kids-game-backend`，Docker Compose 自动创建网络。

### Q4: 开发环境和生产环境的区别？
**A:** 
- **开发**：`.env` → `localhost:8080` → Vite 代理
- **生产**：`.env.production` → `/api` → Nginx 代理 → `kids-game-backend:8080`

### Q5: 如果后端服务不在 Docker 中怎么办？
**A:** 修改 `docker/nginx/simple-game.conf` 中的 `proxy_pass` 地址：
```nginx
location /api/ {
    proxy_pass http://8.136.156.190:8080/api/;  # 改为实际 IP
    ...
}
```

### Q6: 如何调试 API 请求？
**A:** 
1. 浏览器 F12 → Network 标签
2. 查看请求 URL 是否为 `/api/...`
3. 检查响应状态码（200 = 成功）
4. 查看 Nginx 日志：`docker logs kids-game-simple-game`

## 相关文件

- `.env` - 开发环境配置
- `.env.production` - 生产环境配置
- `vite.config.ts` - Vite 构建配置
- `src/services/apiClient.ts` - API 客户端实现
- `docker/Dockerfile.simple-game` - Docker 构建文件
