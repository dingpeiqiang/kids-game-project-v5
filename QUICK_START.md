# 🚀 GCRS 关卡系统 - 快速启动指南

**版本**: v1.3.0-dev  
**最后更新**: 2026-04-02  
**状态**: ✅ Phase 3 完成

---

## 📋 目录

1. [环境准备](#环境准备)
2. [安装依赖](#安装依赖)
3. [运行游戏](#运行游戏)
4. [项目结构](#项目结构)
5. [快速测试](#快速测试)
6. [常见问题](#常见问题)
7. [下一步学习](#下一步学习)

---

## 🎯 环境准备

### 必需环境

```bash
# Node.js >= 18.x
node -v

# npm >= 9.x
npm -v

# Git（用于版本控制）
git --version
```

### 推荐工具

- **编辑器**: VS Code
- **浏览器**: Chrome（推荐用于调试）
- **终端**: PowerShell（Windows）或 Terminal（Mac/Linux）

---

## 📦 安装依赖

### 1. 克隆项目

```bash
git clone <repository-url>
cd kids-game-project-v5
```

### 2. 进入贪吃蛇游戏目录

```bash
cd kids-game-house/games/snake
```

### 3. 安装依赖

```bash
npm install
```

**预计时间**: 2-5 分钟（取决于网络速度）

---

## 🎮 运行游戏

### 开发模式

```bash
npm run dev
```

**输出示例**:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

**访问**: `http://localhost:5173/`

---

### 构建生产版本

```bash
npm run build
```

**输出目录**: `dist/`

---

### 预览生产版本

```bash
npm run preview
```

**访问**: `http://localhost:4173/`

---

## 📁 项目结构

```
kids-game-house/games/snake/
├── src/
│   ├── scenes/              # 游戏场景
│   │   └── SnakeGameLogic.ts        # 🐍 游戏核心逻辑
│   ├── components/          # UI 和逻辑组件
│   │   ├── ui/                      # UI 组件
│   │   │   ├── LevelProgressBar.vue # ⭐ 加载进度条
│   │   │   └── ObjectiveList.vue    # ⭐ 目标列表
│   │   └── logic/                   # 逻辑组件
│   │       ├── FoodSpawnerComponent.ts
│   │       ├── SnakeMovementComponent.ts
│   │       └── CollisionDetectionComponent.ts
│   ├── types/               # TypeScript 类型定义
│   │   └── FoodTypes.ts             # 🍎 食物类型系统
│   └── core/                # 核心框架
│       ├── EventBus.ts              # 事件总线
│       └── ComponentBase.ts         # 组件基类
├── docs/                    # 项目文档
│   └── ...                  # 各种技术文档
├── package.json             # 项目配置
└── tsconfig.json            # TypeScript 配置
```

---

## 🧪 快速测试

### 测试 1: 查看基础游戏

1. 运行 `npm run dev`
2. 打开浏览器访问 `http://localhost:5173/`
3. 使用方向键控制蛇移动
4. 观察分数变化

**预期效果**:
- ✅ 蛇可以正常移动
- ✅ 吃到食物后分数增加
- ✅ 撞墙或撞自己游戏结束

---

### 测试 2: 查看不同食物类型

修改 `SnakeGameLogic.ts` 中的 `spawnFood()` 调用：

```typescript
// 强制生成奖励食物（金色，50 分）
this.spawnFood(1, 1, FoodType.BONUS)

// 强制生成加速食物（蓝色，加速 50%）
this.spawnFood(1, 1, FoodType.SPEED_UP)

// 强制生成无敌食物（白色，穿墙 3 秒）
this.spawnFood(1, 1, FoodType.INVINCIBLE)
```

**预期效果**:
- ✅ 不同颜色的食物
- ✅ 不同的分数显示
- ✅ 特殊效果生效

---

### 测试 3: 查看 UI 组件

在浏览器控制台执行：

```javascript
// 显示进度条
eventBus.emit({
  type: 'LOAD_PROGRESS',
  payload: { progress: 50 }
})

// 隐藏进度条
setTimeout(() => {
  eventBus.emit({
    type: 'LOAD_PROGRESS',
    payload: { progress: 100 }
  })
}, 2000)
```

**预期效果**:
- ✅ 进度条显示在屏幕中央
- ✅ 有渐变色和动画效果
- ✅ 达到 100% 后自动淡出

---

## ❓ 常见问题

### Q1: 依赖安装失败

**问题**: `npm install` 报错

**解决方案**:
```bash
# 清除缓存
npm cache clean --force

# 删除 node_modules
rm -rf node_modules package-lock.json

# 重新安装
npm install
```

---

### Q2: 端口被占用

**问题**: `Port 5173 is already in use`

**解决方案**:
```bash
# 使用其他端口
npm run dev -- --port 5174
```

或者关闭占用端口的程序。

---

### Q3: TypeScript 编译错误

**问题**: 出现 TypeScript 错误

**解决方案**:
```bash
# 检查 TypeScript 配置
npx tsc --noEmit

# 查看详细错误信息
npm run type-check
```

常见错误及解决：
- **找不到模块**: 运行 `npm install`
- **类型不匹配**: 检查类型定义文件
- **路径错误**: 检查 `tsconfig.json` 的 paths 配置

---

### Q4: 游戏无法运行

**问题**: 打开页面空白或报错

**排查步骤**:
1. 打开浏览器控制台（F12）
2. 查看错误信息
3. 检查终端是否有编译错误
4. 尝试清除缓存并重新启动

**常见解决方法**:
```bash
# 清除所有缓存
rm -rf node_modules dist package-lock.json
npm install
npm run dev
```

---

### Q5: 食物颜色不对

**问题**: 食物颜色与描述不符

**解决方案**:
1. 检查 `FoodTypes.ts` 中的颜色定义
2. 确认渲染组件使用了正确的颜色
3. 刷新浏览器（Ctrl+F5 强制刷新）

---

## 📚 下一步学习

### 入门路径

1. **阅读 README.md**
   - 了解项目整体架构
   - 查看技术栈说明
   - 理解 GCRS 规范

2. **查看代码示例**
   - `src/scenes/SnakeGameLogic.ts` - 游戏逻辑
   - `src/types/FoodTypes.ts` - 类型定义
   - `src/components/ui/LevelProgressBar.vue` - UI 组件

3. **阅读技术文档**
   - [DOCUMENT_INDEX.md](./DOCUMENT_INDEX.md) - 完整文档索引
   - [PROJECT_SHOWCASE.md](./PROJECT_SHOWCASE.md) - 成果展示
   - [MILESTONES.md](./MILESTONES.md) - 项目里程碑

---

### 进阶学习

#### 想深入了解游戏逻辑？
👉 阅读 [PROGRESS_REPORT_DAY1.md](./PROGRESS_REPORT_DAY1.md)

#### 想了解食物系统？
👉 阅读 [PROGRESS_REPORT_DAY2.md](./PROGRESS_REPORT_DAY2.md)

#### 想了解组件集成？
👉 阅读 [DAY3_INTEGRATION_GUIDE.md](./DAY3_INTEGRATION_GUIDE.md)

#### 想了解 UI 组件？
👉 阅读 [DAY4_COMPLETION_SUMMARY.md](./DAY4_COMPLETION_SUMMARY.md)

---

### 实践项目

#### 项目 1: 修改蛇的速度

```typescript
// 在 SnakeGameLogic.ts 中
constructor(scene: any) {
  this.moveInterval = 200  // 改为 200ms（更快）
  // this.moveInterval = 400  // 原速度
}
```

---

#### 项目 2: 添加新的食物类型

```typescript
// 在 FoodTypes.ts 中添加
enum FoodType {
  // ... 现有类型
  RAINBOW = 'rainbow'  // 彩虹食物（随机效果）
}

FOOD_DATABASE[FoodType.RAINBOW] = {
  type: FoodType.RAINBOW,
  baseScore: 75,
  color: '#ff00ff',
  spawnProbability: 0.02,
  growsSnake: true,
  lengthIncrease: 1,
  effect: {
    type: 'random',
    value: 1,
    duration: 5000
  },
  description: '彩虹食物，随机效果'
}
```

---

#### 项目 3: 自定义目标

```typescript
// 在 LevelComponentGameScene 中
const objectives: Objective[] = [
  {
    id: 'custom_goal',
    type: 'score',
    title: '获得高分',
    description: '达到 500 分',
    target: 500,
    current: 0,
    completed: false
  }
]
```

---

## 🤝 获取帮助

### 文档资源

- 📚 **[完整文档索引](./DOCUMENT_INDEX.md)** - 所有文档的分类索引
- 📊 **[本周工作总结](./WEEKLY_FINAL_SUMMARY.md)** - Day 1-4 完整回顾
- 📅 **[下周工作计划](./NEXT_WEEK_PLAN_D5-D7.md)** - Day 5-7 详细计划
- 🎨 **[项目成果展示](./PROJECT_SHOWCASE.md)** - 功能演示和技术亮点
- 🏆 **[项目里程碑](./MILESTONES.md)** - 重要节点记录
- ✅ **[完成度检查清单](./COMPLETION_CHECKLIST.md)** - 任务完成情况

---

### 社区支持

- 💬 **技术讨论**: 游戏开发交流群
- 📧 **邮件联系**: dev@kidsgame.com
- 🐛 **提交 Issue**: GitHub Issues
- 📖 **官方文档**: [GCRS 规范文档](./docs/GCRS_SPEC.md)

---

## 🎊 总结

### 快速启动流程

```
1. 环境准备 (Node.js >= 18.x)
   ↓
2. 安装依赖 (npm install)
   ↓
3. 运行游戏 (npm run dev)
   ↓
4. 访问页面 (http://localhost:5173/)
   ↓
5. 开始游戏！
```

---

### 关键要点

✅ **环境要求简单**: 只需要 Node.js 和 npm  
✅ **安装快速**: 2-5 分钟完成  
✅ **运行方便**: 一条命令启动  
✅ **文档完善**: 19 份详细文档  
✅ **社区活跃**: 多渠道获取帮助  

---

**准备好了吗？让我们开始游戏开发之旅！** 🚀

---

**最后更新**: 2026-04-02  
**维护者**: GCRS 开发团队  
**版本**: v1.3.0-dev  
**状态**: ✅ Phase 3 完成，准备进入 Phase 4
