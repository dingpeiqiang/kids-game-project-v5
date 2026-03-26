# GTRS 根路径支持 - 自适应 IP 和端口

## 📋 需求背景

### 用户需求
> "没有 http 的，要以所加载页面的 ip 端口为准加载"

### 实际场景

在不同环境部署时，IP 和端口可能会变化：

| 环境 | URL | IP:Port |
|------|-----|---------|
| **开发环境** | `http://localhost:5173` | localhost:5173 |
| **测试环境** | `http://192.168.1.100:8080` | 192.168.1.100:8080 |
| **生产环境** | `https://kids-game.com` | kids-game.com:443 |

**问题**: 如果使用完整的 URL（如 `http://localhost:5173/games/...`），更换环境时需要修改代码。

**解决**: 使用**根路径**（如 `/games/...`），让浏览器自动使用当前页面的 IP 和端口。

---

## ✅ 解决方案

### 核心思路

> **使用根路径（以 `/` 开头），浏览器会自动拼接当前页面的协议、IP 和端口**

### 工作原理

```
用户访问页面：http://localhost:5173/game/snake
资源路径：/games/snake-vue3/themes/default/images/scene/food_apple.png
实际请求：http://localhost:5173/games/snake-vue3/themes/default/images/scene/food_apple.png
```

当部署到不同环境时：

```
用户访问页面：http://192.168.1.100:8080/game/snake
资源路径：/games/snake-vue3/themes/default/images/scene/food_apple.png
实际请求：http://192.168.1.100:8080/games/snake-vue3/themes/default/images/scene/food_apple.png
```

---

## 🔧 修改详情

### 1. URL 校验器扩展

**文件**: `snake-vue3/src/utils/gtrs-validator.ts`

**新增逻辑**:
```typescript
// ⭐ 新增：支持以 / 开头的根路径（会自动使用当前页面的 IP 和端口）
// 例如：/games/snake-vue3/themes/default/images/scene/food_apple.png
// 实际请求：http://当前页面 IP:端口/games/snake-vue3/themes/default/images/scene/food_apple.png
if (url.startsWith('/') && !url.startsWith('//')) {
  return true
}
```

**关键点**:
- ✅ `url.startsWith('/')` - 必须以 `/` 开头
- ✅ `!url.startsWith('//')` - 排除协议相对路径（如 `//example.com/file.png`）

### 2. 资源路径简化

**文件**: `snake-vue3/src/views/StartView.vue`

**修改前**:
```typescript
scene: {
  food_apple: {
    src: '/public/games/snake-vue3/themes/default/images/scene/food_apple.png',
    type: 'png',
    alias: '苹果'
  }
}
```

**修改后**:
```typescript
scene: {
  food_apple: {
    src: '/games/snake-vue3/themes/default/images/scene/food_apple.png',
    type: 'png',
    alias: '苹果'
  }
}
```

**变化**:
- ❌ 移除 `/public/` 前缀
- ✅ 直接使用 `/games/` 作为根路径

---

## 📊 支持的 URL 格式总览

| 类型 | 示例 | 解析结果 | 状态 |
|------|------|---------|------|
| **HTTP URL** | `http://localhost:5173/img.png` | 固定地址 | ✅ |
| **HTTPS URL** | `https://example.com/img.png` | 固定地址 | ✅ |
| **相对路径** | `./assets/img.png` | 相对当前路由 | ✅ |
| **上级目录** | `../assets/img.png` | 相对上级目录 | ✅ |
| **assets 目录** | `assets/img.png` | 相对当前目录 | ✅ |
| **后端资源** | `/resources/img.png` | 根路径 + resources | ✅ |
| **/public/ 路径** | `/public/games/img.png` | 根路径 + public | ✅ |
| **⭐ 根路径** | `/games/snake/img.png` | **根路径 + games** | ✅ **NEW** |
| **十六进制颜色** | `#1a1a2e` | CSS 颜色 | ✅ |
| **RGB 颜色** | `rgb(26, 26, 46)` | CSS 颜色 | ✅ |
| **RGBA 颜色** | `rgba(26, 26, 46, 0.9)` | CSS 颜色 | ✅ |

---

## 🎯 实际应用示例

### 开发环境

```
用户访问：http://localhost:5173/game/snake
↓
GTRS JSON:
{
  "resources": {
    "images": {
      "scene": {
        "food_apple": {
          "src": "/games/snake-vue3/themes/default/images/scene/food_apple.png"
        }
      }
    }
  }
}
↓
Phaser 实际请求：
http://localhost:5173/games/snake-vue3/themes/default/images/scene/food_apple.png
✅ 加载成功
```

### 生产环境

```
用户访问：https://kids-game.com/game/snake
↓
GTRS JSON:
{
  "resources": {
    "images": {
      "scene": {
        "food_apple": {
          "src": "/games/snake-vue3/themes/default/images/scene/food_apple.png"
        }
      }
    }
  }
}
↓
Phaser 实际请求：
https://kids-game.com/games/snake-vue3/themes/default/images/scene/food_apple.png
✅ 加载成功
```

---

## 💡 技术细节

### 为什么移除 `/public/`？

#### Vite 项目结构

```
snake-vue3/
├── public/              # 静态资源目录（源文件）
│   └── games/
│       └── snake-vue3/
├── dist/                # 构建输出目录
│   └── games/           # public/ 的内容会复制到这里
└── src/
```

#### 访问路径

- **开发环境**: 
  - 源文件：`snake-vue3/public/games/...`
  - 访问 URL: `http://localhost:5173/games/...` (不是 `/public/games/...`)

- **生产环境**:
  - 构建后：`dist/games/...`
  - 访问 URL: `https://your-domain.com/games/...`

**结论**: `/public/` 是文件系统路径，不是 URL 路径。URL 应该直接使用 `/games/...`

### 根路径 vs 相对路径

| 路径类型 | 示例 | 优点 | 缺点 | 适用场景 |
|---------|------|------|------|---------|
| **根路径** | `/games/snake/img.png` | ✅ 始终有效<br>✅ 不受路由影响<br>✅ 环境自适应 | ❌ 需要配置代理 | 游戏资源、静态资源 |
| **相对路径** | `./img.png` | ✅ 灵活<br>✅ 可移植 | ❌ 受路由影响<br>❌ 多级路由易出错 | 组件内资源 |
| **完整 URL** | `http://localhost:5173/img.png` | ✅ 明确 | ❌ 环境切换需修改 | CDN 资源 |

---

## 🔧 Nginx 配置示例

如果使用根路径，需要配置 Nginx 代理：

```nginx
server {
    listen 80;
    server_name kids-game.com;
    
    # 前端页面
    location / {
        root /var/www/kids-game;
        try_files $uri $uri/ /index.html;
    }
    
    # ⭐ 游戏资源（关键配置）
    location /games/ {
        alias /var/www/kids-game/dist/games/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
    
    # 后端 API 代理
    location /api/ {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## 📝 最佳实践

### 1. 使用根路径

```typescript
// ✅ 推荐：使用根路径
scene: {
  food_apple: {
    src: '/games/snake-vue3/themes/default/images/scene/food_apple.png',
    type: 'png',
    alias: '苹果'
  }
}

// ❌ 避免：使用完整 URL
scene: {
  food_apple: {
    src: 'http://localhost:5173/games/snake-vue3/themes/default/images/scene/food_apple.png',
    type: 'png',
    alias: '苹果'
  }
}
```

### 2. 组织资源目录

```
snake-vue3/
├── public/
│   └── games/
│       └── snake-vue3/
│           └── themes/
│               ├── default/          # 默认主题
│               │   ├── images/
│               │   │   └── scene/
│               │   └── audio/
│               └── custom-theme/     # 自定义主题
│                   ├── images/
│                   └── audio/
└── dist/             # 构建后
    └── games/
        └── snake-vue3/
            └── themes/
                └── ...
```

### 3. 检查资源是否存在

```bash
# 开发环境
ls snake-vue3/public/games/snake-vue3/themes/default/images/scene/

# 生产环境（构建后）
ls snake-vue3/dist/games/snake-vue3/themes/default/images/scene/
```

---

## 🎉 验证结果

### 测试步骤

1. **启动开发服务器**:
   ```bash
   cd snake-vue3
   npm run dev
   ```

2. **访问游戏**:
   ```
   http://localhost:5173/game/snake
   ```

3. **检查网络请求**:
   ```
   DevTools → Network → 查看图片请求
   
   Request URL: http://localhost:5173/games/snake-vue3/themes/default/images/scene/food_apple.png
   Status: 200 OK ✅
   ```

4. **GTRS 校验**:
   ```console
   🔍 开始 GTRS 严格校验：贪吃蛇 - 清新绿
   📋 GTRS JSON 生成完成，开始 Schema 校验...
   ✅ GTRS 严格校验通过：校验通过
   ```

---

## ✅ 总结

### 问题
- 需要使用 HTTP 完整 URL，无法适应不同环境

### 原因
- URL 校验器不支持根路径格式

### 解决
- 扩展校验器，支持以 `/` 开头的根路径
- 移除 `/public/` 前缀，使用正确的 URL 路径

### 结果
- ✅ GTRS 严格校验通过
- ✅ Phaser 正常加载资源
- ✅ 环境自适应（自动使用当前页面的 IP 和端口）
- ✅ 部署时无需修改代码

---

**修复时间**: 2026-03-20  
**状态**: ✅ 已完成  
**影响范围**: 所有使用 GTRS 校验的游戏  
**向后兼容**: ✅ 完全兼容
