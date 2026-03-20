# 贪吃蛇游戏主题系统测试指南

## 🧪 测试步骤

### 1. 启动游戏开发服务器

```bash
cd kids-game-house/snake-vue3
npm run dev
```

### 2. 验证主题初始化

打开浏览器访问：http://localhost:5173（或实际端口）

**预期结果**：
- 游戏正常加载
- 默认使用经典绿色主题
- 控制台无错误信息

### 3. 测试主题切换功能

在浏览器控制台中执行：

```javascript
// 获取主题 store
import { useThemeStore } from './src/stores/theme'
const themeStore = useThemeStore()

// 查看当前主题
console.log('当前主题:', themeStore.currentTheme)

// 查看主题列表
console.log('主题列表:', themeStore.themeList)

// 切换到糖果主题
themeStore.switchTheme('candy')
console.log('切换后的主题:', themeStore.currentTheme)

// 切换到太空主题
themeStore.switchTheme('space')

// 切换到海洋主题
themeStore.switchTheme('ocean')

// 切换到暗黑主题
themeStore.switchTheme('dark')

// 恢复到经典主题
themeStore.switchTheme('classic')
```

### 4. 验证 CSS 变量

在浏览器控制台中执行：

```javascript
// 检查 CSS 变量是否设置
const root = document.documentElement
const styles = getComputedStyle(root)

console.log('主题颜色变量:')
console.log('--theme-primary:', styles.getPropertyValue('--theme-primary'))
console.log('--theme-background:', styles.getPropertyValue('--theme-background'))
console.log('--theme-text:', styles.getPropertyValue('--theme-text'))
console.log('--theme-shadow:', styles.getPropertyValue('--theme-shadow'))
```

**预期结果**：
- 所有 CSS 变量都有正确的值
- 切换主题后，变量值会相应改变

### 5. 验证 Tailwind 主题类

创建测试页面或使用现有页面，添加以下 HTML：

```html
<div class="p-4">
  <h2 class="text-2xl font-bold mb-4">主题测试</h2>
  
  <!-- 测试背景色 -->
  <div class="bg-theme-background p-4 mb-2">
    背景色测试 (bg-theme-background)
  </div>
  
  <!-- 测试文字颜色 -->
  <div class="text-theme-text p-4 mb-2">
    文字颜色测试 (text-theme-text)
  </div>
  
  <!-- 测试主色按钮 -->
  <button class="bg-theme-primary text-white px-4 py-2 rounded-theme mb-2">
    主色按钮 (bg-theme-primary)
  </button>
  
  <!-- 测试阴影效果 -->
  <div class="shadow-theme p-4 mb-2">
    阴影效果测试 (shadow-theme)
  </div>
  
  <!-- 测试发光效果 -->
  <div class="shadow-theme-glow p-4 mb-2">
    发光效果测试 (shadow-theme-glow)
  </div>
  
  <!-- 测试边框 -->
  <div class="border border-theme p-4 mb-2">
    边框效果测试 (border-theme)
  </div>
  
  <!-- 测试圆角 -->
  <button class="rounded-theme bg-theme-surface px-4 py-2">
    圆角按钮 (rounded-theme)
  </button>
</div>
```

**预期结果**：
- 所有主题类都正确应用样式
- 切换主题后，样式自动更新

### 6. 测试本地存储

```javascript
// 检查 localStorage 中是否保存了主题偏好
console.log('保存的主题 ID:', localStorage.getItem('snake-theme-preference'))

// 切换主题后再次检查
themeStore.switchTheme('candy')
console.log('新的主题 ID:', localStorage.getItem('snake-theme-preference'))

// 刷新页面后，主题应该保持不变
location.reload()
```

**预期结果**：
- localStorage 中保存了主题 ID
- 刷新页面后，主题自动恢复到上次选择的主题

### 7. 测试主题资源配置

```javascript
// 查看主题的资源配置
const theme = themeStore.currentTheme
console.log('蛇头资源:', theme.assets.snakeHead)
console.log('食物资源:', theme.assets.food)
console.log('特殊食物资源:', theme.assets.specialFood)
console.log('背景资源:', theme.assets.background)
```

**预期结果**：
- 每个主题都有完整的资源配置
- 资源配置的类型和值都正确

### 8. 测试音效配置

```javascript
// 查看音效配置
console.log('BGM 配置:', theme.sounds.bgm)
console.log('吃食物音效:', theme.sounds.eat)
console.log('死亡音效:', theme.sounds.die)
console.log('胜利音效:', theme.sounds.victory)
```

**预期结果**：
- 每个音效都有 enabled 和 volume 配置
- 配置值合理（volume 在 0-1 之间）

## 📊 测试报告模板

### 基础功能测试

| 测试项 | 预期结果 | 实际结果 | 状态 |
|--------|----------|----------|------|
| 主题初始化 | 默认经典主题 | | ⬜ |
| 切换到糖果主题 | 主题正确切换 | | ⬜ |
| 切换到太空主题 | 主题正确切换 | | ⬜ |
| 切换到海洋主题 | 主题正确切换 | | ⬜ |
| 切换到暗黑主题 | 主题正确切换 | | ⬜ |
| CSS 变量设置 | 所有变量正确设置 | | ⬜ |
| Tailwind 主题类 | 样式正确应用 | | ⬜ |
| 本地存储 | 主题偏好被保存 | | ⬜ |
| 刷新页面恢复 | 主题自动恢复 | | ⬜ |

### 资源配置测试

| 测试项 | 预期结果 | 实际结果 | 状态 |
|--------|----------|----------|------|
| 蛇头资源配置 | 类型和值正确 | | ⬜ |
| 蛇身资源配置 | 类型和值正确 | | ⬜ |
| 食物资源配置 | 类型和值正确 | | ⬜ |
| 背景资源配置 | 类型和值正确 | | ⬜ |
| 音效资源配置 | enabled 和 volume 正确 | | ⬜ |

### UI 组件测试

| 测试项 | 预期结果 | 实际结果 | 状态 |
|--------|----------|----------|------|
| 开始按钮 | 使用主题颜色 | | ⬜ |
| 分数面板 | 使用主题背景色 | | ⬜ |
| 游戏背景 | 使用主题背景 | | ⬜ |
| 网格线 | 使用主题颜色 | | ⬜ |

## 🐛 已知问题

在此记录测试中发现的问题...

## ✅ 通过标准

所有测试项都应该通过，且：
- 无明显视觉错误
- 无控制台错误
- 主题切换流畅
- 样式正确应用
- 本地存储正常工作

---

**测试日期**: __________  
**测试人员**: __________  
**测试结果**: ⬜ 通过 / ⬜ 失败
