# 贪吃蛇Loading弹窗调试指南

## 🔍 如果看不到Loading弹窗

### 1. 检查浏览器控制台
打开浏览器开发者工具 (F12)，查看Console是否有以下日志：
```
🎮 开始游戏按钮被点击
✅ Loading弹窗已显示: true
🎨 使用主题 ID: xxx
🔍 开始检查游戏资源...
```

如果没有看到日志，说明点击事件没有触发。

### 2. 检查按钮状态
- 按钮是否显示 "🔍 检查资源中..."？
- 按钮是否被disabled了？

如果是，说明代码已经执行，但弹窗可能被隐藏了。

### 3. 检查CSS问题
在Elements面板中检查：
- 搜索 `.check-overlay` 元素是否存在
- 检查它的 `display` 属性是否为 `flex`
- 检查 `z-index` 是否为 `99999`
- 检查是否被其他元素覆盖

### 4. 常见原因

#### A. 父容器限制
如果主容器有 `transform`、`filter` 或 `perspective` 属性，会导致 `position: fixed` 失效。

**解决方法**：将弹窗移到body层级，或使用 `position: absolute` + 全屏尺寸。

#### B. z-index不够高
其他元素可能有更高的z-index。

**已修复**：已将z-index提高到 `99999`。

#### C. 渲染问题
Vue可能没有正确检测到状态变化。

**解决方法**：刷新页面或重启开发服务器。

### 5. 临时调试代码

在 `startGame` 函数开头添加alert测试：

```typescript
const startGame = async () => {
  alert('点击了开始游戏！') // 添加这行
  
  if (isChecking.value) {
    return
  }
  // ... 其余代码
}
```

如果alert弹出了但loading没显示，说明是渲染/CSS问题。

### 6. 强制显示测试

在浏览器控制台执行：

```javascript
// 获取Vue组件实例（需要在Vue DevTools中操作）
// 或者直接在控制台执行：
document.querySelector('.check-overlay').style.display = 'flex'
document.querySelector('.check-overlay').style.zIndex = '999999'
```

### 7. 检查HTML结构

确保HTML结构正确：
```html
<div class="check-overlay">  <!-- 应该是fixed定位 -->
  <div class="check-modal">   <!-- 弹窗内容 -->
    ...
  </div>
</div>
```

## 🚀 快速修复

如果上述方法都不行，尝试以下修复：

1. **清除浏览器缓存** (Ctrl+Shift+Delete)
2. **重启开发服务器**
3. **强制刷新页面** (Ctrl+Shift+R)

## ✅ 预期效果

点击"开始游戏"后应该看到：
1. 按钮文字变为 "🔍 检查资源中..."
2. 屏幕中央出现深色半透明遮罩
3. 显示白色弹窗："正在检测游戏资源"
4. 绿色进度条从0%到100%
5. 4个步骤依次高亮显示
6. 完成后跳转到难度选择页
