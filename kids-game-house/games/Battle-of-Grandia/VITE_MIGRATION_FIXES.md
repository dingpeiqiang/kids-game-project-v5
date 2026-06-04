# Battle of Grandia - Vite 迁移修复记录

## 问题与解决方案

### 1. ❌ global is not defined
**错误信息：**
```
Uncaught ReferenceError: global is not defined
    at node_modules/phaser/src/polyfills/requestAnimationFrame.js
```

**原因：**
Phaser 3 的某些版本依赖 Node.js 的 `global` 对象，但浏览器环境中不存在。

**解决方案：**
- ✅ 在 `vite.config.js` 的 `define` 中添加：`global: 'globalThis'`
- ✅ 在 `vite.config.js` 的 `optimizeDeps.esbuildOptions` 中添加相同定义
- ✅ 在 `index.html` 头部添加 polyfill 脚本

**文件修改：**
- `vite.config.js` - 添加 global 定义
- `index.html` - 添加 polyfill 和 phaser-example 容器

---

### 2. ❌ require is not defined
**错误信息：**
```
Uncaught ReferenceError: require is not defined
    at API.js:3:15
```

**原因：**
`src/Objects/API.js` 使用了 CommonJS 的 `require('node-fetch')`，但 Vite 使用 ES 模块。

**解决方案：**
- ✅ 移除 `const fetch = require('node-fetch');`
- ✅ 浏览器原生支持 `fetch` API，无需额外导入
- ✅ 改进错误处理，添加 console.error 日志
- ✅ 返回合理的默认值而不是调用 error.json()

**文件修改：**
- `src/Objects/API.js` - 移除 require，使用原生 fetch

---

### 3. ✅ 其他优化

#### 添加了 phaser-example 容器
```html
<div id="phaser-example"></div>
```
确保游戏画布有正确的挂载点。

#### 改进了样式
```css
#phaser-example {
  width: 800px;
  height: 640px;
}
```
明确设置游戏容器尺寸。

---

## 验证清单

- [x] Vite 开发服务器正常启动
- [x] 无 `global is not defined` 错误
- [x] 无 `require is not defined` 错误
- [x] 游戏画布正确显示
- [x] 页面自动打开浏览器
- [x] 热更新正常工作

---

## 技术要点

### Vite vs Webpack 差异

| 特性 | Webpack | Vite |
|------|---------|------|
| 模块系统 | 支持 CommonJS 和 ES Modules | 主要使用 ES Modules |
| 全局对象 | 自动 polyfill | 需要手动配置 |
| 开发服务器 | 较慢（打包后服务） | 极快（按需编译） |
| 热更新 | 较慢 | 即时 |

### Phaser 在 Vite 中的注意事项

1. **全局对象**：必须定义 `global` 为 `globalThis`
2. **资源加载**：Vite 自动处理静态资源
3. **依赖优化**：需要在 `optimizeDeps` 中声明 Phaser
4. **DefinePlugin**：使用 `define` 选项替代

---

## 相关文件

- `vite.config.js` - Vite 配置文件
- `index.html` - 入口 HTML
- `package.json` - 依赖和脚本
- `src/index.js` - 游戏主入口
- `src/Objects/API.js` - API 调用模块

---

## 后续建议

1. **升级 Phaser**：考虑升级到 Phaser 3.60+，对 Vite 支持更好
2. **TypeScript**：可以考虑迁移到 TypeScript 获得更好的类型安全
3. **代码分割**：利用 Vite 的代码分割功能优化加载性能
4. **PWA**：可以添加 PWA 支持，让游戏离线可用

---

**最后更新：** 2026-04-05
**状态：** ✅ 所有问题已解决
