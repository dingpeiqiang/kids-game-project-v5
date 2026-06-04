# ❓ GCRS 关卡系统 - 常见问题解答（FAQ）

**版本**: v1.3.0-dev  
**创建时间**: 2026-04-02  
**最后更新**: 2026-04-02

---

## 📋 目录

1. [环境配置](#环境配置)
2. [安装问题](#安装问题)
3. [运行问题](#运行问题)
4. [开发相关](#开发相关)
5. [代码问题](#代码问题)
6. [性能优化](#性能优化)
7. [文档资源](#文档资源)

---

## 🔧 环境配置

### Q1: 需要什么版本的 Node.js？

**A**: 需要 Node.js >= 18.x

**检查方法**:
```bash
node -v
```

**升级方法**:
```bash
# Windows (使用 nvm)
nvm install 18
nvm use 18

# Mac/Linux
nvm install 18
nvm use 18
```

---

### Q2: 需要使用什么编辑器？

**A**: 推荐使用 VS Code，获得最佳的 TypeScript 和 Vue 支持

**推荐插件**:
- Volar (Vue 语言支持)
- ESLint
- Prettier
- TypeScript Hero

---

### Q3: 如何配置 TypeScript？

**A**: 项目已经包含了完整的 TypeScript 配置

**配置文件**:
- `tsconfig.json` - 主配置
- `tsconfig.node.json` - Node 环境配置

**关键配置项**:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

---

## 📦 安装问题

### Q4: npm install 失败怎么办？

**常见错误及解决方案**:

**错误 1**: `npm ERR! network timeout`
```bash
# 切换淘宝镜像
npm config set registry https://registry.npmmirror.com
npm install
```

**错误 2**: `npm ERR! code ENOENT`
```bash
# 清除缓存
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

**错误 3**: `npm ERR! code ERESOLVE`
```bash
# 使用 --legacy-peer-deps
npm install --legacy-peer-deps
```

---

### Q5: 依赖安装很慢怎么办？

**解决方案**:

1. **使用国内镜像**:
```bash
npm config set registry https://registry.npmmirror.com
```

2. **使用 yarn 或 pnpm**:
```bash
# 安装 yarn
npm install -g yarn
yarn config set registry https://registry.npmmirror.com
yarn install

# 安装 pnpm
npm install -g pnpm
pnpm config set registry https://registry.npmmirror.com
pnpm install
```

3. **只安装生产依赖**（如果只需要运行）:
```bash
npm install --production
```

---

## 🚀 运行问题

### Q6: 启动开发服务器报错

**错误**: `Port 5173 is already in use`

**解决方案**:
```bash
# 方案 1: 使用其他端口
npm run dev -- --port 5174

# 方案 2: 关闭占用端口的程序
# Windows
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# Mac/Linux
lsof -i :5173
kill -9 <PID>
```

---

### Q7: 页面空白，控制台报错

**常见错误及解决**:

**错误 1**: `Failed to load module`
```bash
# 清除缓存并重新启动
rm -rf node_modules/.vite
npm run dev -- --force
```

**错误 2**: `[Vue warn]: Component is missing template or render function`
```bash
# 检查文件路径和导入是否正确
# 确保 .vue 文件存在且语法正确
```

**错误 3**: `Phaser is not defined`
```bash
# 确保 Phaser 已正确安装
npm install phaser
```

---

### Q8: 热更新不工作

**解决方案**:

1. **检查 Vite 配置**:
```typescript
// vite.config.ts
export default defineConfig({
  server: {
    hmr: true
  }
})
```

2. **重启开发服务器**:
```bash
# 停止当前服务器（Ctrl+C）
npm run dev
```

3. **清除缓存**:
```bash
rm -rf node_modules/.vite
npm run dev -- --force
```

---

## 💻 开发相关

### Q9: 如何添加新的食物类型？

**步骤**:

1. **在 FoodTypes.ts 中添加枚举**:
```typescript
enum FoodType {
  // ... 现有类型
  CUSTOM = 'custom'  // 新类型
}
```

2. **添加配置**:
```typescript
FOOD_DATABASE[FoodType.CUSTOM] = {
  type: FoodType.CUSTOM,
  baseScore: 150,
  color: '#ff00ff',
  spawnProbability: 0.01,
  growsSnake: true,
  lengthIncrease: 2,
  effect: {
    type: 'score_multiplier',
    value: 2,
    duration: 10000
  }
}
```

3. **在游戏中使用**:
```typescript
gameLogic.spawnFood(5, 5, FoodType.CUSTOM)
```

---

### Q10: 如何修改蛇的移动速度？

**方法 1**: 修改全局速度
```typescript
// SnakeGameLogic.ts
constructor(scene: any) {
  this.moveInterval = 200  // 改为 200ms（更快）
}
```

**方法 2**: 动态调整速度
```typescript
// 加速道具
gameState.snakeSpeed *= 1.5

// 减速道具
gameState.snakeSpeed *= 0.7
```

---

### Q11: 如何实现新的游戏状态？

**步骤**:

1. **扩展 GameState 类型**:
```typescript
type GameState = 'IDLE' | 'PLAYING' | 'PAUSED' | 'GAME_OVER' | 'CUSTOM_STATE'
```

2. **在 SnakeGameLogic 中实现**:
```typescript
case 'CUSTOM_STATE':
  // 自定义状态逻辑
  this.handleCustomState()
  break
```

3. **添加相应的事件**:
```typescript
enum GameEventType {
  // ...
  CUSTOM_STATE_CHANGED
}
```

---

### Q12: 如何添加新的 UI 组件？

**步骤**:

1. **创建 Vue 组件**:
```vue
<!-- src/components/ui/MyComponent.vue -->
<template>
  <div class="my-component">
    <!-- 内容 -->
  </div>
</template>

<script lang="ts">
export default defineComponent({
  name: 'MyComponent',
  props: {
    // Props 定义
  },
  emits: [
    // Emits 定义
  ],
  setup(props, { emit }) {
    // 逻辑
  }
})
</script>

<style scoped>
.my-component {
  /* 样式 */
}
</style>
```

2. **在游戏场景中使用**:
```typescript
// LevelComponentGameScene.ts
import MyComponent from '../components/ui/MyComponent.vue'

create() {
  const app = createApp(MyComponent, { /* props */ })
  app.mount('#ui-container')
}
```

---

## 🐛 代码问题

### Q13: TypeScript 报错 "Cannot find module"

**解决方案**:

1. **检查路径映射**:
```json
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@components/*": ["./src/components/*"]
    }
  }
}
```

2. **重新加载 TypeScript**:
- VS Code: `Ctrl+Shift+P` → "TypeScript: Restart TS Server"

3. **检查文件路径**:
```bash
# 确保导入路径正确
import MyComponent from '@/components/MyComponent.vue'
```

---

### Q14: Vue 组件 Props 类型警告

**错误**: `Invalid prop: type check failed`

**解决方案**:
```typescript
// ❌ 错误的写法
props: {
  title: String  // 应该使用构造函数
}

// ✅ 正确的写法
props: {
  title: { 
    type: String,
    required: true
  }
}
```

---

### Q15: EventBus 内存泄漏

**问题**: 事件监听器没有清理

**解决方案**:
```typescript
// 在组件销毁时清理
onUnmounted(() => {
  eventBus.off(GameEventType.SCORE_CHANGED, myCallback)
})
```

**最佳实践**:
```typescript
// 使用 once 监听一次性事件
eventBus.once(GameEventType.GAME_START, () => {
  // 只执行一次
})

// 或使用 WeakMap 管理监听器
const listeners = new WeakMap()
```

---

## ⚡ 性能优化

### Q16: 游戏帧率低怎么办？

**优化建议**:

1. **减少绘制调用**:
```typescript
// ❌ 每帧创建新对象
update() {
  this.add.sprite(x, y, 'texture')
}

// ✅ 复用对象
private sprite!: Phaser.GameObjects.Sprite

update() {
  this.sprite.setPosition(x, y)
}
```

2. **使用对象池**:
```typescript
class FoodPool {
  private pool: Food[] = []
  
  acquire(): Food {
    return this.pool.pop() || createNewFood()
  }
  
  release(food: Food): void {
    this.pool.push(food)
  }
}
```

3. **优化碰撞检测**:
```typescript
// 使用空间分区（四叉树）
const nearbyEntities = quadTree.query(nearbyRect)
```

---

### Q17: 内存占用过高

**排查方法**:
```javascript
// Chrome DevTools
console.memory.usedJSHeapSize
console.memory.totalJSHeapSize
```

**优化建议**:

1. **及时清理无用对象**:
```typescript
destroy() {
  this.snake = null
  this.foods.forEach(food => food.destroy())
}
```

2. **避免全局变量**:
```typescript
// ❌ 不好的做法
let globalSnake = null

// ✅ 好的做法
class Game {
  private snake: Snake | null = null
}
```

3. **使用弱引用**:
```typescript
const weakRef = new WeakRef(object)
```

---

### Q18: 加载时间长

**优化建议**:

1. **资源懒加载**:
```typescript
// 只加载当前需要的资源
preload() {
  this.load.image('player', 'assets/player.png')
  // 其他资源稍后加载
}
```

2. **压缩资源**:
```bash
# 使用 Texture Packer 合并图片
# 压缩音频和视频文件
```

3. **显示加载进度**:
```typescript
this.load.on('progress', (value: number) => {
  console.log(`Loading: ${value * 100}%`)
})
```

---

## 📚 文档资源

### Q19: 在哪里可以找到完整文档？

**文档索引**:
- 📚 **[DOCUMENT_INDEX.md](./DOCUMENT_INDEX.md)** - 完整文档索引
- 📖 **[API_REFERENCE.md](./API_REFERENCE.md)** - API 参考文档
- 🗺️ **[LEARNING_PATH.md](./LEARNING_PATH.md)** - 学习路线图
- 🧠 **[KNOWLEDGE_MAP.md](./KNOWLEDGE_MAP.md)** - 知识地图
- 📁 **[PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)** - 项目结构
- 🚀 **[QUICK_START.md](./QUICK_START.md)** - 快速开始指南

---

### Q20: 如何贡献文档？

**步骤**:

1. **Fork 项目**
2. **创建分支**:
```bash
git checkout -b docs/my-feature
```

3. **编写文档**
4. **提交 PR**:
```bash
git add .
git commit -m "docs: 添加 xxx 文档"
git push origin docs/my-feature
```

---

## 🆘 获取帮助

###  still 遇到问题？

1. **查看错误日志**:
```bash
# 查看详细错误信息
npm run dev -- --debug

# 查看浏览器控制台
# F12 → Console
```

2. **搜索 Issue**:
- GitHub Issues
- Stack Overflow
- 技术论坛

3. **联系社区**:
- 💬 技术讨论群
- 📧 dev@kidsgame.com
- 🐛 提交 Issue

---

## 📊 常见问题分类统计

| 类别 | 问题数 | 高频问题 |
|------|--------|----------|
| 环境配置 | 3 | ⭐⭐⭐ |
| 安装问题 | 2 | ⭐⭐⭐⭐ |
| 运行问题 | 3 | ⭐⭐⭐⭐⭐ |
| 开发相关 | 4 | ⭐⭐⭐⭐ |
| 代码问题 | 3 | ⭐⭐⭐ |
| 性能优化 | 3 | ⭐⭐ |
| 文档资源 | 2 | ⭐ |

---

## 🎯 快速查找

### 按关键词查找

**安装**: Q4, Q5  
**运行**: Q6, Q7, Q8  
**食物**: Q9  
**蛇**: Q10  
**UI**: Q12  
**TypeScript**: Q13, Q14  
**性能**: Q16, Q17, Q18  
**文档**: Q19, Q20  

---

**最后更新**: 2026-04-02  
**维护者**: GCRS 开发团队  
**版本**: v1.3.0-dev  
**状态**: Phase 3 完成，准备进入 Phase 4
