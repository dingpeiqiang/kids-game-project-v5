# Phaser Vite 配置说明

## 问题
Phaser.js 在 Vite 开发环境中每次修改代码都会触发热更新(HMR)，导致游戏重新加载，影响开发体验。

## 解决方案

### ✅ 已实施的配置（推荐）

#### 1. **CDN 加载 Phaser**（index.html）
```html
<script src="https://cdn.jsdelivr.net/npm/phaser@3.70.0/dist/phaser.min.js"></script>
```

**优点：**
- ✅ 完全避免 Vite HMR 影响
- ✅ 利用浏览器缓存，不重复下载
- ✅ 减少打包体积
- ✅ 加载速度更快（CDN）

#### 2. **Vite 配置优化**（vite.config.ts）
```typescript
optimizeDeps: {
  exclude: ['phaser'] // 排除 Phaser，不进行预构建
}

build: {
  rollupOptions: {
    external: ['phaser'], // 构建时作为外部依赖
    output: {
      globals: {
        phaser: 'Phaser'
      }
    }
  }
}

watch: {
  ignored: [
    '**/*.png', '**/*.jpg', // 忽略游戏资源文件
    '**/*.mp3', '**/*.wav', // 忽略音频文件
    '**/phaser*.js'          // 忽略 Phaser 文件
  ]
}
```

#### 3. **代码适配**（PhaserGame.ts）
```typescript
// 优先使用全局 Phaser（CDN），降级使用本地导入
const Phaser = window.Phaser || (await import('phaser')).default
```

---

## 其他可选方案

### 方案 A：仅配置 Vite 排除 HMR（不推荐）

```typescript
// vite.config.ts
optimizeDeps: {
  exclude: ['phaser'], // 排除预构建
  include: []          // 或者强制预构建并缓存
}

server: {
  watch: {
    ignored: ['**/phaser*.js']
  }
}
```

**缺点：** 仍会受 Vite 依赖预构建影响，缓存效果不如 CDN。

### 方案 B：使用 public 目录（适用于小项目）

将 Phaser 库文件放到 `public/lib/phaser.min.js`，然后：
```html
<script src="/lib/phaser.min.js"></script>
```

**缺点：** 需要手动管理版本更新。

---

## 验证方法

### 1. 检查网络请求
打开浏览器 DevTools → Network 标签：
- ✅ 应该看到 Phaser 从 CDN 加载（带缓存）
- ✅ 不应该看到 Phaser 相关的 HMR 请求

### 2. 测试热更新
修改任意 Vue/TS 文件：
- ✅ 页面应该快速刷新，不影响游戏状态
- ✅ 控制台不应该有 Phaser 相关的重新加载日志

### 3. 检查构建产物
运行 `npm run build`：
- ✅ dist 目录不应该包含 phaser.js
- ✅ HTML 文件应该包含 CDN 引用

---

## 注意事项

1. **CDN 可用性**
   - 如果 CDN 不可访问，代码会自动降级使用本地 Phaser
   - 建议保留 `package.json` 中的 phaser 依赖作为备份

2. **版本一致性**
   - 确保 CDN 版本与 package.json 中的版本一致
   - 当前版本：`3.70.0`

3. **生产环境**
   - 生产构建时会将 Phaser 标记为外部依赖
   - 最终用户也会从 CDN 加载，加快首屏速度

---

## 性能对比

| 方案 | 首次加载 | 热更新速度 | 缓存效果 |
|------|---------|-----------|---------|
| **CDN 加载** ⭐ | 快 | 极快 | 最佳 |
| Vite 预构建 | 慢 | 快 | 一般 |
| node_modules | 最慢 | 慢 | 差 |

---

## 相关文件

- `index.html` - CDN 引用
- `vite.config.ts` - Vite 配置
- `src/components/game/PhaserGame.ts` - Phaser 导入适配
