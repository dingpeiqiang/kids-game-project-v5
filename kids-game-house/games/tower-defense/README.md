# Tower Defense Game - 完全 TypeScript 重构

## 🎯 项目概述
这是一个完全重构的塔防游戏，从原始的 JavaScript + Webpack 4.x 迁移到了 TypeScript + Vite 5.x 架构。

## 🏗️ 架构特性

### 1. TypeScript 类型安全
- 所有实体类都使用严格的 TypeScript 类型定义
- 接口定义确保组件间的契约一致性
- 编译时错误检测，减少运行时问题

### 2. 现代化构建工具
- Vite 5.x 提供闪电般快速的开发服务器启动
- 原生 ES 模块支持
- 按需编译，提升开发体验

### 3. 组件化架构
- **Enemy.ts**: 敌人类，负责路径移动和生命值管理
- **Turret.ts**: 炮塔类，负责瞄准和射击逻辑
- **Bullet.ts**: 子弹类，负责飞行轨迹和碰撞检测
- **GameScene.ts**: 游戏场景，协调所有游戏对象

### 4. 游戏功能
- 波次敌人系统
- 炮塔放置机制
- 射程和伤害系统
- 资源管理（GTRS 规范）

## 📁 目录结构

```
src/
├── components/           # Vue 组件
├── config/              # 游戏配置
│   └── phaserConfig.ts  # Phaser 配置
├── entities/            # 游戏实体
│   ├── Enemy.ts         # 敌人类
│   ├── Turret.ts        # 炮塔类
│   └── Bullet.ts        # 子弹类
├── scenes/              # 游戏场景
│   └── GameScene.ts     # 主游戏场景
├── types/               # TypeScript 类型定义
│   ├── Enemy.ts
│   ├── Turret.ts
│   ├── Bullet.ts
│   ├── GameConfig.ts
│   └── Path.ts
├── utils/               # 工具类
│   └── Logger.ts
└── main.ts              # 应用入口
```

## 🎮 游戏玩法

1. **放置炮塔**: 点击绿色高亮区域放置炮塔
2. **防御基地**: 阻止敌人到达右下角的红色基地
3. **升级系统**: 通过击败敌人获得资源升级炮塔
4. **波次挑战**: 每波敌人数量递增

## 🚀 快速开始

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 构建生产版本
npm run build
```

## 🔧 资源生成

游戏资源使用 Sharp 库程序化生成：

```bash
npm run generate:resources
```

这将生成所有必需的图像资源，包括：
- 敌人 (enemy.png)
- 炮塔 (turret.png) 
- 基地 (base.png)
- 子弹 (bullet.png)
- 光标 (cursor.png)

## 📊 性能优化

- **对象池**: 子弹对象复用，减少 GC 压力
- **碰撞优化**: 使用 Arcade Physics 进行高效碰撞检测
- **内存管理**: 及时回收不再使用的对象
- **渲染优化**: 分层渲染，减少绘制调用

## 🎨 GTRS 资源规范

游戏遵循 GTRS (Game Theme Resource Standard) 规范：
- `/themes/tower_default/GTRS.json` - 资源配置
- `/themes/tower_default/assets/scene/` - 游戏资源

## 🧪 测试

游戏包含完整的单元测试和集成测试：
- 实体行为测试
- 碰撞检测测试
- 游戏逻辑测试
- 性能基准测试

## 📈 扩展性

代码架构设计为高度可扩展：
- 新敌人类型只需继承 Enemy 类
- 新炮塔类型只需扩展 Turret 类
- 新游戏模式可在 GameScene 基础上扩展