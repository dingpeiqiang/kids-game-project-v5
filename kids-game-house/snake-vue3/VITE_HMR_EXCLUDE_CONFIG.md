# Vite 热更新（HMR）排除配置指南

## 🎯 配置目标

通过配置 Vite，让特定文件不参与热更新（HMR），从而：
- ✅ 减少不必要的页面刷新
- ✅ 提高开发效率
- ✅ 避免大型资源文件触发重载

## 📋 已配置排除的文件

### 1. 依赖和系统文件
```typescript
'**/node_modules/**',  // npm 依赖包
'**/.git/**',          // Git 版本控制
'**/dist/**'           // 构建输出目录
```

### 2. 大型资源文件
```typescript
'**/*.png',   // PNG 图片
'**/*.jpg',   // JPG 图片
'**/*.jpeg',  // JPEG 图片
'**/*.gif',   // GIF 动图
'**/*.svg',   // SVG 矢量图
'**/*.mp3',   // MP3 音频
'**/*.wav',   // WAV 音频
'**/*.ogg'    // OGG 音频
```

**为什么排除这些文件？**
- 🖼️ **图片文件**：修改后不会自动在浏览器中更新，需要手动刷新
- 🎵 **音频文件**：浏览器会缓存，热更新无效
- 📦 **大文件**：每次变更都触发 HMR 会影响性能

### 3. 文档文件
```typescript
'**/*.md',      // Markdown 文档
'**/docs/**'    // 文档目录
```

**为什么排除？**
- 📝 文档修改不影响代码运行
- 避免编辑 README 时触发页面刷新

### 4. 构建产物
```typescript
'**/build/**',    // 构建输出
'**/output/**'    // 其他输出目录
```

## 🔧 配置说明

### 完整配置代码

```typescript
// vite.config.ts
export default defineConfig({
  server: {
    port: 3005,
    host: true,
    // 配置 HMR
    hmr: {
      overlay: true // 显示错误遮罩
    },
    // 排除特定文件的热更新
    watch: {
      ignored: [
        // ... 排除列表
      ]
    }
  }
})
```

### 各配置项说明

#### `server.hmr.overlay`
- **作用**：编译错误时是否在浏览器显示错误遮罩
- **默认值**：`true`
- **建议**：保持开启，方便调试

#### `server.watch.ignored`
- **作用**：指定哪些文件不应该被 Vite 监听
- **格式**：glob 模式数组
- **效果**：这些文件变化时不会触发 HMR

## 🎨 自定义排除规则

### 根据你的需求添加

#### 示例 1：排除特定目录
```typescript
watch: {
  ignored: [
    '**/public/assets/large-images/**',  // 排除大型图片目录
    '**/src/temp/**',                     // 排除临时文件
    '**/backup/**'                        // 排除备份文件
  ]
}
```

#### 示例 2：排除特定类型文件
```typescript
watch: {
  ignored: [
    '**/*.log',          // 日志文件
    '**/*.bak',          // 备份文件
    '**/*.tmp',          // 临时文件
    '**/tsconfig.json'   // TypeScript 配置（修改需重启）
  ]
}
```

#### 示例 3：排除游戏素材目录
```typescript
watch: {
  ignored: [
    'src/assets/games/snake-shooter/sounds/**',  // 声音文件
    'public/images/games/**/*.png',              // 游戏图片
    'src/data/**/*.json'                         // 数据文件
  ]
}
```

## 📊 Glob 模式说明

### 常用通配符

| 符号 | 含义 | 示例 | 匹配 |
|------|------|------|------|
| `*` | 匹配任意数量字符（不包括 `/`） | `*.js` | `app.js`, `index.js` |
| `**` | 匹配任意数量字符（包括 `/`） | `**/*.js` | `src/app.js`, `test/unit/test.js` |
| `?` | 匹配单个字符 | `*.j?s` | `js`, `jsx` |
| `[abc]` | 匹配括号内任一字符 | `*.[jt]s` | `.js`, `.ts` |
| `!` | 否定模式 | `!*.min.js` | 除了 `.min.js` 之外的文件 |

### 实用示例

```typescript
// 排除所有测试文件
'!**/*.test.ts',
'!**/*.spec.ts',

// 排除所有环境配置文件
'**/.env*',

// 排除 node_modules 但保留某个包
'!**/node_modules/**',
'node_modules/@my-org/my-package/**',

// 排除特定大小的文件
'assets/large/*.{png,jpg}',
```

## 🔍 验证配置是否生效

### 方法 1：观察控制台

启动开发服务器：
```bash
npm run dev
```

修改被排除的文件，观察控制台：
- ✅ **无输出** → 配置生效，文件被忽略
- ❌ **显示 "change" 日志** → 文件仍在监听

### 方法 2：检查浏览器

1. 打开浏览器开发者工具 → Console
2. 修改被排除的文件
3. 观察是否有 `[vite] hmr update` 日志
   - ✅ **无日志** → 配置生效
   - ❌ **有日志** → 配置未生效

### 方法 3：使用 Vite 调试

在 `vite.config.ts` 中添加调试日志：

```typescript
export default defineConfig({
  // ...
  server: {
    watch: {
      ignored: [
        '**/*.md',
        // 添加调试
        ...process.env.DEBUG === 'vite:watch' 
          ? ['!**/debug-test.md'] 
          : []
      ]
    }
  }
})
```

## ⚠️ 注意事项

### 1. 排除后如何刷新？

**问题**：如果排除了某些文件，修改后如何看到效果？

**解决方案：**

#### A. 手动刷新浏览器
```
Ctrl + R (Windows/Linux)
Cmd + R (Mac)
```

#### B. 保存未被排除的依赖文件
例如：排除的是图片，可以保存引用该图片的 Vue 组件

#### C. 使用 Vite 客户端 API
```typescript
// 在需要的手动触发的文件中
if (import.meta.hot) {
  import.meta.hot.accept(() => {
    // 手动处理热更新
  })
}
```

### 2. 不要排除关键文件

❌ **不要排除：**
```typescript
'**/*.vue',     // Vue 组件
'**/*.ts',      // TypeScript 源码
'**/*.css',     // 样式文件
'src/**/*'      // 所有源码
```

✅ **应该排除：**
```typescript
'**/*.md',      // 文档
'**/*.png',     // 图片
'**/node_modules/**'  // 依赖
```

### 3. 配置优先级

Vite 的配置优先级：
```
1. server.watch.ignored（最高优先级）
2. optimizeDeps.include/exclude
3. build.rollupOptions
```

## 🎯 最佳实践

### 贪吃蛇游戏推荐配置

```typescript
watch: {
  ignored: [
    // 系统文件
    '**/node_modules/**',
    '**/.git/**',
    '**/dist/**',
    
    // 大型资源（不会频繁修改）
    'public/sounds/**/*.mp3',
    'public/images/**/*.png',
    'src/assets/games/snake/**/*.jpg',
    
    // 文档和说明
    '**/*.md',
    '**/docs/**',
    '**/README*',
    
    // 构建产物
    '**/build/**',
    '**/output/**',
    '**/*.log',
    
    // 配置文件（修改需重启）
    '**/tsconfig.json',
    '**/package.json',
    
    // 环境变量（Vite 会自动处理）
    '**/.env*'
  ]
}
```

### 性能对比

#### 配置前
```
修改图片 → 触发 HMR → 页面刷新 → 耗时 2-3 秒
修改文档 → 触发 HMR → 页面刷新 → 耗时 2-3 秒
```

#### 配置后
```
修改图片 → 无反应 → 0 秒
修改文档 → 无反应 → 0 秒
修改代码 → 正常 HMR → 局部更新 → 耗时 <0.1 秒
```

## 🛠️ 故障排查

### 问题 1：配置不生效

**检查清单：**
1. ✅ 配置文件路径正确：`vite.config.ts`
2. ✅ 配置层级正确：`server.watch.ignored`
3. ✅ glob 模式语法正确
4. ✅ 重启 Vite 开发服务器

**解决方法：**
```bash
# 清除缓存
rm -rf node_modules/.vite

# 重新启动
npm run dev
```

### 问题 2：误排除了重要文件

**症状：**
- 修改代码后页面不更新
- 需要手动刷新才能看到效果

**解决方法：**
1. 检查 `watch.ignored` 列表
2. 移除误排除的模式
3. 重启 Vite

### 问题 3：某些文件还是触发 HMR

**可能原因：**
- glob 模式不够精确
- 文件被多个地方引用

**解决方法：**
```typescript
// 更精确的模式
'!**/src/assets/**/*.png',  // 排除 src/assets 下所有 PNG

// 或使用绝对路径
resolve(__dirname, 'src/assets/images/**')
```

## 📝 总结

### 核心原则

1. **排除不直接影响运行的文件**
   - 图片、音频、视频
   - 文档、说明
   - 构建产物

2. **保留源代码文件**
   - `.vue`, `.ts`, `.js`
   - `.css`, `.scss`
   - `.html`

3. **平衡便利性和性能**
   - 不要过度排除
   - 确保开发体验流畅

### 当前配置效果

✅ **已优化：**
- 图片修改不触发刷新
- 音频修改不触发刷新
- 文档修改不触发刷新
- 依赖包修改不触发刷新

✅ **保留功能：**
- Vue 组件热更新
- TypeScript 类型检查
- 样式热更新
- 逻辑代码热更新

### 进一步优化建议

如果你的项目有特殊情况，可以：
1. 添加更多针对性的排除规则
2. 使用 `manualChunks` 分割大型依赖
3. 配置 `optimizeDeps.include` 精确预构建

记住：**好的配置 = 更快的开发速度 + 更好的开发体验** 🚀
