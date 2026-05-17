# Catch The Cat - 优化版本

## 🎮 游戏简介

这是一个经典的围堵小猫游戏的优化版本。玩家需要点击网格上的圆点放置墙壁，试图围住小猫，不让它逃到边界。

## ✨ 优化内容

### 1. 技术栈升级
- ✅ 升级 Webpack 4 → Webpack 5
- ✅ 升级 TypeScript 3.x → 5.7.x
- ✅ 升级所有依赖包到最新版本
- ✅ 修复 Node.js 24.x 兼容性问题
- ✅ 支持热模块替换 (HMR)
- ✅ 修复 FakeXMLHttpRequest 类型转换错误

### 2. AI 算法增强
- ✅ 新增 `advancedSolver` - 更智能的猫 AI
  - 使用启发式搜索算法
  - 考虑多个因素：距离边界、可用路径、未来选择等
  - 猫会更难被围住，游戏更具挑战性

### 3. 音效系统
- ✅ 新增 `SoundManager` 音效管理器
- ✅ 使用 Web Audio API 生成动态音效
- ✅ 包含以下音效：
  - 点击音效
  - 放置墙壁音效
  - 猫移动音效
  - 胜利音效
  - 失败音效
  - 重置/撤销音效
- ✅ 新增音效开关按钮（🔊/🔇）

### 4. 视觉改进
- ✅ 现代化渐变背景
- ✅ 响应式设计，支持移动端
- ✅ 美化的游戏容器和阴影效果
- ✅ 中文界面和游戏说明
- ✅ 更好的用户体验
- ✅ 方块悬停高亮效果
- ✅ 墙壁放置弹跳动画
- ✅ 胜利光环特效

### 5. 性能优化
- ✅ 启用 webpack 缓存
- ✅ 优化构建输出
- ✅ 自动清理旧的构建文件

### 6. 计分系统
- ✅ 智能计分算法
  - 基础分 1000
  - 移动次数越少加分越多
  - 剩余可用格子额外加分
  - 难度越高倍数加成越高
- ✅ 实时显示分数和步数
- ✅ 分数变化动画效果

### 7. 难度级别系统
- ✅ 四种难度级别：
  - **简单**：初始墙壁 5 个，适合新手
  - **普通**：初始墙壁 8 个，平衡挑战
  - **困难**：初始墙壁 10 个，需要策略
  - **专家**：初始墙壁 12 个，极限挑战
- ✅ 难度显示在左上角

### 8. Bug 修复
- ✅ 修复 `Cannot convert object to primitive value` 错误
  - 问题原因：FakeXMLHttpRequest 在处理 SVG 数据时，期望字符串类型但收到对象
  - 解决方案：在 [FakeXHRLoader.ts](file://d:/工作/sitech/项目/研发/git_workspace/AI/kids-game-project-v5/kids-game-house/games/catch-the-cat/src/lib/FakeXHRLoader.ts) 中添加类型检查和转换
  - 增强 [fake-xml-http-request.js](file://d:/工作/sitech/项目/研发/git_workspace/AI/kids-game-project-v5/kids-game-house/games/catch-the-cat/src/lib/fake-xml-http-request.js) 的容错性

## 🚀 快速开始

### 安装依赖
```bash
npm install
```

### 开发模式
```bash
npm run dev
```
游戏将在 http://localhost:8080 自动打开

### 生产构建
```bash
npm run build
```
构建文件将输出到 `dist` 目录

## 🎯 游戏玩法

1. 点击网格上的小圆点放置墙壁
2. 你每点击一次，小猫就会移动一步
3. 目标是将小猫完全围住，让它无路可走
4. 如果小猫到达边界并逃脱，游戏失败

## 🛠️ 技术细节

### 项目结构
```
catch-the-cat/
├── src/
│   ├── scenes/          # 游戏场景
│   │   └── mainScene.ts # 主场景（计分、难度、动画控制）
│   ├── sprites/         # 游戏精灵（猫、墙壁等）
│   │   ├── block.ts              # 方块（带悬停动画）⭐
│   │   ├── cat.ts                # 猫精灵
│   │   ├── resetButton.ts       # 重置按钮
│   │   ├── undoButton.ts        # 撤销按钮
│   │   ├── statusBar.ts        # 状态栏
│   │   ├── creditText.ts       # 版权信息
│   │   ├── scoreDisplay.ts     # 计分显示 ⭐
│   │   └── soundToggleButton.ts # 音效开关 ⭐
│   ├── solvers/         # AI 求解器
│   │   ├── defaultSolver.ts      # 默认求解器
│   │   ├── nearestSolver.ts      # 最近路径求解器
│   │   └── advancedSolver.ts     # 高级启发式求解器
│   ├── utils/           # 工具类
│   │   └── soundManager.ts       # 音效管理器
│   ├── lib/             # 库文件
│   ├── game.ts          # 游戏主类（含难度配置）⭐
│   └── index.ts         # 入口文件
├── public/              # 静态资源
├── assets/              # 图片资源
├── webpack.config.js    # Webpack 配置
├── tsconfig.json        # TypeScript 配置
└── package.json         # 项目配置
```

### AI 求解器说明

#### Advanced Solver（高级求解器）
使用多维度评分系统：
- **距离边界**: 越远得分越高（权重 10）
- **距离中心**: 越近越好（权重 -2）
- **可用邻居**: 越多越好（权重 15）
- **周围墙壁**: 越少越好（权重 -20）
- **被困风险**: 立即扣分（-100）
- **未来选择**: 前瞻性评估（权重 5）

### 自定义求解器

你可以创建自己的 AI 求解器：

```typescript
// src/solvers/mySolver.ts
export default function mySolver(blocksIsWall: boolean[][], i: number, j: number): number {
    // 返回 0-5 表示方向，-1 表示放弃
    return 0; // 一直向左
}
```

然后在 `mainScene.ts` 中使用：
```typescript
import mySolver from "../solvers/mySolver";
cat.solver = mySolver;
```

## 📝 待办事项

- [x] 添加难度级别选择
- [x] 添加计分系统
- [ ] 添加排行榜
- [ ] 支持自定义网格大小
- [x] 添加音效开关
- [ ] 支持主题切换
- [x] 添加动画过渡效果
- [ ] 添加难度选择界面

## 📄 License

MIT License

## 🙏 致谢

原始游戏思路和猫咪图片来源于 [www.gamedesign.jp](https://www.gamedesign.jp/flash/chatnoir/chatnoir.html)

---

**享受游戏！** 🐱
