# 🔧 Snake2 关卡显示问题诊断与修复

**创建时间**: 2026-04-05  
**状态**: 🔄 诊断中

---

## 🚨 问题现象

用户反馈：**snake2 看不到游戏关卡**

可能的原因：
1. ❌ 路由配置错误
2. ❌ 关卡配置文件路径错误
3. ❌ 关卡加载器故障
4. ❌ 组件渲染问题
5. ❌ 资源加载失败

---

## 🔍 诊断步骤

### 步骤 1: 验证文件存在 ✅

已确认以下文件存在：

```
✅ config/levels/snake_level_1.json (2.1KB)
✅ config/levels/snake_level_2.json (2.4KB)
✅ config/levels/snake_level_3.json (2.5KB)
```

---

### 步骤 2: 检查路由配置 ✅

当前路由配置：

```typescript
// src/router/index.ts
{
  path: '/game',
  name: 'game',
  component: ComponentSnakeGame  // ✅ 新架构
},
{
  path: '/game-legacy',
  name: 'game-legacy',
  component: SnakeGame  // ✅ 旧架构
}
```

**结论**: 路由配置正确

---

### 步骤 3: 检查关卡加载逻辑

关卡通过 `SnakeLevelLoader` 加载：

```typescript
// src/utils/SnakeLevelLoader.ts
static async loadFromJSON(levelId: string): Promise<SnakeLevelConfig> {
  const url = `/config/levels/${levelId}.json`
  const response = await fetch(url)
  return response.json()
}
```

**潜在问题**:
- ⚠️ Vite 可能不识别 `/config` 目录
- ⚠️ 需要配置为静态资源

---

## 💡 解决方案

### 方案 1: 配置 Vite 支持（推荐）

编辑 `vite.config.ts`，添加公共资源目录配置：

```typescript
export default defineConfig({
  // ... 其他配置
  
  publicDir: 'public',  // 确保 public 目录被识别
  
  server: {
    port: 3006,
    host: true,
    // 添加静态文件代理
    proxy: {
      '/config': {
        target: 'http://localhost:3006',
        changeOrigin: true
      }
    }
  }
})
```

---

### 方案 2: 移动配置文件到 src 目录

将关卡配置移动到 `src/config/levels/` 目录：

```bash
# 创建新目录
mkdir -p src/config/levels

# 复制文件
cp config/levels/*.json src/config/levels/

# 更新加载路径
# SnakeLevelLoader.ts 中的路径改为：
const url = `/src/config/levels/${levelId}.json`
```

---

### 方案 3: 使用 import 导入（最可靠）

修改 `SnakeLevelLoader.ts`，使用 ES6 import：

```typescript
// 预加载所有关卡配置
const levelConfigs: Record<string, any> = {
  'snake_level_1': () => import('../config/levels/snake_level_1.json'),
  'snake_level_2': () => import('../config/levels/snake_level_2.json'),
  'snake_level_3': () => import('../config/levels/snake_level_3.json')
}

static async loadFromJSON(levelId: string): Promise<SnakeLevelConfig> {
  if (this.cache.has(levelId)) {
    return this.cache.get(levelId)!
  }
  
  const loader = levelConfigs[levelId]
  if (!loader) {
    throw new Error(`Unknown level: ${levelId}`)
  }
  
  const module = await loader()
  const config = module.default as SnakeLevelConfig
  
  this.cache.set(levelId, config)
  return config
}
```

---

### 方案 4: 检查 ComponentSnakeGame 组件

查看组件是否正确调用了关卡加载：

```vue
<script setup lang="ts">
// 检查是否有类似代码
const loadLevel = async () => {
  try {
    const config = await SnakeLevelLoader.loadFromJSON('snake_level_1')
    console.log('✅ 关卡加载成功:', config)
    
    // 启动游戏
    startGame(config)
  } catch (error) {
    console.error('❌ 关卡加载失败:', error)
  }
}
</script>
```

---

## 🔧 快速诊断脚本

在浏览器控制台运行以下代码：

```javascript
// 1. 检查路由
console.log('当前路由:', window.location.pathname)

// 2. 尝试直接访问关卡文件
fetch('/config/levels/snake_level_1.json')
  .then(res => res.json())
  .then(data => console.log('✅ 关卡文件可访问:', data))
  .catch(err => console.error('❌ 无法访问关卡文件:', err))

// 3. 检查组件是否挂载
const app = document.querySelector('#app')
console.log('App 元素:', app)

// 4. 查看 Vue DevTools
// 如果有安装 Vue DevTools，检查组件树
```

---

## 📝 执行步骤

### 立即修复（推荐方案 3）

我将自动执行以下操作：

1. ✅ 修改 `SnakeLevelLoader.ts` 使用 import
2. ✅ 确保类型定义正确
3. ✅ 测试加载逻辑

---

## 🎯 验证方法

修复后，访问游戏应该能看到：

```
✅ 开始界面 → 点击"开始游戏"
✅ 难度选择 → 选择难度
✅ 游戏加载 → 显示进度条
✅ 游戏画面 → 蛇、食物、网格都可见
```

---

**等待 AI 自动执行修复...** 🤖
