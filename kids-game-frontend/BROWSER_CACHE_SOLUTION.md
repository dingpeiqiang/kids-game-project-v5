# 前端浏览器缓存解决方案

## 🎯 问题描述

前端发布新版本后，用户浏览器可能仍然使用旧版本的缓存文件，导致：
- ❌ 新功能无法生效
- ❌ Bug 修复无效
- ❌ 样式错乱
- ❌ JavaScript 错误

---

## ✅ 解决方案（四层防护）

### **第1层：文件名哈希（核心）**

Vite 自动为所有资源文件添加内容哈希：

```javascript
// vite.config.ts
build: {
  rollupOptions: {
    output: {
      entryFileNames: 'assets/[name].[hash].js',    // main.a1b2c3d4.js
      chunkFileNames: 'assets/[name].[hash].js',     // vendor.e5f6g7h8.js
      assetFileNames: 'assets/[name].[hash].[ext]',  // style.i9j0k1l2.css
    }
  }
}
```

**效果：**
- ✅ 文件内容变化 → 文件名变化 → 浏览器重新下载
- ✅ 文件内容不变 → 文件名不变 → 使用缓存（节省流量）

---

### **第2层：HTTP 缓存头（Nginx）**

#### **策略1：带哈希的文件 - 长期缓存**

```nginx
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
    # 文件名包含哈希（如 .a1b2c3d4.）
    if ($request_uri ~* "\.[a-f0-9]{8}\.") {
        expires 1y;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
    # 文件名不包含哈希
    else {
        expires 1h;
        add_header Cache-Control "public, max-age=3600, must-revalidate";
    }
}
```

**效果：**
- `main.a1b2c3d4.js` → 缓存1年（immutable，永不检查更新）
- `main.js` → 缓存1小时（必须重新验证）

#### **策略2：HTML 文件 - 不缓存**

```nginx
location ~* \.html$ {
    expires -1;
    add_header Cache-Control "no-cache, no-store, must-revalidate";
    add_header Pragma "no-cache";
    add_header Expires "0";
}

location / {
    try_files $uri $uri/ /index.html;
    add_header Cache-Control "no-cache, no-store, must-revalidate";
}
```

**效果：**
- ✅ `index.html` 每次请求都从服务器获取
- ✅ HTML 中引用的 JS/CSS 文件名已变化，浏览器会下载新版本

---

### **第3层：HTML Meta 标签（兜底）**

在 `index.html` 中添加：

```html
<head>
  <!-- 防止 HTML 缓存 -->
  <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
  <meta http-equiv="Pragma" content="no-cache">
  <meta http-equiv="Expires" content="0">
</head>
```

**效果：**
- ✅ 即使 Nginx 配置失效，HTML 也不会被缓存
- ✅ 双重保障

---

### **第4层：版本检测（用户体验）**

自动检测新版本并提示用户刷新：

```typescript
// src/utils/version.ts
class VersionManager {
  async checkForUpdate(): Promise<boolean> {
    const response = await fetch('/version.json?t=' + Date.now());
    const versionInfo = await response.json();
    
    if (versionInfo.version !== this.currentVersion) {
      this.showUpdateNotification(versionInfo.version);
      return true;
    }
    return false;
  }
}
```

**效果：**
- ✅ 每5分钟自动检查一次
- ✅ 发现新版本 → 弹出提示 → 用户点击刷新
- ✅ 无需用户手动清除缓存

---

## 📊 缓存策略对比

| 资源类型 | 缓存时间 | 更新机制 | 示例 |
|---------|---------|---------|------|
| **带哈希的 JS/CSS** | 1年 | 文件名变化 | `main.a1b2c3d4.js` |
| **不带哈希的资源** | 1小时 | 重新验证 | `logo.png` |
| **HTML 文件** | 不缓存 | 每次请求 | `index.html` |
| **version.json** | 不缓存 | 每次请求 | `version.json?t=xxx` |

---

## 🚀 部署流程

### **方式1：使用部署脚本（推荐）**

```bash
# 赋予执行权限
chmod +x deploy-frontend.sh

# 部署到默认服务器
./deploy-frontend.sh

# 部署到指定服务器
./deploy-frontend.sh 192.168.1.100
```

**脚本自动完成：**
1. ✅ 构建新版本（生成 version.json）
2. ✅ 上传文件到服务器
3. ✅ 重启 Nginx
4. ✅ 验证部署成功

### **方式2：手动部署**

```bash
# 1. 构建
npm run build

# 2. 查看版本
cat dist/version.json

# 3. 上传
scp -r dist/* root@SERVER:/path/to/nginx/html/

# 4. 重启 Nginx
ssh root@SERVER "docker compose restart frontend"
```

---

## 🔍 验证缓存策略

### **1. 检查文件名哈希**

```bash
ls dist/assets/
# 应该看到：
# index.a1b2c3d4.js
# vendor.e5f6g7h8.js
# style.i9j0k1l2.css
```

### **2. 检查 HTTP 响应头**

```bash
# 检查 JS 文件
curl -I http://localhost:3000/assets/main.a1b2c3d4.js
# 应该看到：
# Cache-Control: public, max-age=31536000, immutable

# 检查 HTML 文件
curl -I http://localhost:3000/
# 应该看到：
# Cache-Control: no-cache, no-store, must-revalidate
```

### **3. 浏览器开发者工具**

1. 打开 DevTools → Network 标签
2. 刷新页面
3. 查看资源：
   - ✅ JS/CSS 文件：Status 200 (from disk cache) 或 304
   - ✅ HTML 文件：Status 200 (每次都从服务器获取)
   - ✅ 文件名包含哈希值

---

## 💡 最佳实践

### **1. 版本号管理**

每次构建自动生成唯一版本号：

```json
// dist/version.json
{
  "version": "20260426-143052",
  "buildTime": "2026-04-26T06:30:52.000Z",
  "gitCommit": "abc123"
}
```

### **2. Service Worker（可选）**

如果需要离线支持，可以使用 Service Worker：

```javascript
// service-worker.js
self.addEventListener('install', (event) => {
  // 跳过等待，立即激活
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // 清除旧缓存
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => caches.delete(key))
      );
    })
  );
});
```

### **3. CDN 配置**

如果使用 CDN，确保：
- ✅ CDN 遵循源站的 Cache-Control 头
- ✅ 设置 CDN 缓存刷新策略
- ✅ 使用版本号作为查询参数强制刷新

---

## 🐛 常见问题

### **Q1: 用户仍然看到旧版本？**

**原因：**
- 用户浏览器缓存了旧的 `index.html`

**解决：**
1. 确认 Nginx 配置正确（HTML 不缓存）
2. 让用户按 `Ctrl+F5` 强制刷新
3. 版本检测会自动提示用户

### **Q2: 如何强制所有用户更新？**

**方法1：修改 Nginx 配置**
```nginx
# 临时将所有资源缓存时间改为 0
add_header Cache-Control "no-cache";
```

**方法2：更改文件名前缀**
```javascript
// vite.config.ts
assetFileNames: 'assets/v2/[name].[hash].[ext]'  // 改变路径
```

**方法3：推送通知**
通过 WebSocket 或后端 API 推送更新通知

### **Q3: 开发环境如何处理缓存？**

Vite 开发服务器已经处理了：
- ✅ HMR（热模块替换）
- ✅ 无缓存
- ✅ 实时编译

无需额外配置。

---

## 📈 性能优化建议

### **1. 合理设置缓存时间**

| 资源类型 | 推荐缓存时间 | 理由 |
|---------|------------|------|
| 带哈希的 JS/CSS | 1年 | 文件名变化即代表内容变化 |
| 图片/字体 | 1个月 | 较少更新 |
| API 响应 | 根据业务 | 动态数据不宜过长 |
| HTML | 不缓存 | 确保最新版本 |

### **2. 使用 CDN**

- ✅ 静态资源托管到 CDN
- ✅ CDN 边缘节点缓存
- ✅ 降低服务器负载

### **3. 压缩资源**

```nginx
gzip on;
gzip_types text/css application/javascript;
gzip_min_length 1024;
```

---

## 🎯 总结

**四层防护体系：**

1. **文件名哈希** → 内容变化自动更新
2. **HTTP 缓存头** → 精确控制缓存策略
3. **HTML Meta** → 兜底保障
4. **版本检测** → 主动提示用户

**优势：**
- ✅ 用户始终获取最新版本
- ✅ 未变化的资源使用缓存（节省流量）
- ✅ 自动化，无需人工干预
- ✅ 兼容所有浏览器

**部署后效果：**
- 🚀 新用户：首次加载正常
- 🚀 老用户：自动检测更新，提示刷新
- 🚀 带宽优化：只下载变化的文件
