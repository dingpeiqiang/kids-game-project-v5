# 🎮 关卡系统完整指南

## 📋 系统概述

已为游戏添加了完整的关卡系统，包含3个不同难度的关卡，大幅提升游戏可玩性！

---

## ✨ 新增功能

### 1. 关卡管理器 (LevelManager)
**文件**: `src/scripts/objects/levelManager.ts`

**功能**:
- ✅ 管理3个精心设计的关卡
- ✅ 关卡解锁系统
- ✅ 星级评定（1-3星）
- ✅ 进度持久化（localStorage）
- ✅ 关卡数据统计

### 2. 关卡选择界面 (LevelSelectUI)
**文件**: `src/scripts/objects/levelSelectUI.ts`

**功能**:
- ✅ 美观的卡片式UI
- ✅ 显示关卡难度、星级、目标
- ✅ 锁定/解锁状态可视化
- ✅ 流畅的动画效果

### 3. 关卡完成界面 (LevelCompleteUI)
**文件**: `src/scripts/objects/levelCompleteUI.ts`

**功能**:
- ✅ 成绩展示（距离、星级）
- ✅ 星级动画效果
- ✅ 重试/下一关按钮
- ✅ 优雅的过渡动画

---

## 🗺️ 关卡设计

### 第1关：新手之路 ⭐
- **难度**: 简单
- **地形**: 平缓的草地
- **目标**: 500米
- **特点**: 
  - 坡度平缓
  - 一座桥梁
  - 适合练习基本操作
  
**星级要求**:
- ⭐ 300米
- ⭐⭐ 400米
- ⭐⭐⭐ 500米

---

### 第2关：山地挑战 ⭐⭐
- **难度**: 中等
- **地形**: 起伏的山地
- **目标**: 800米
- **特点**:
  - 明显的上下坡
  - 两座桥梁
  - 考验平衡控制

**星级要求**:
- ⭐ 500米
- ⭐⭐ 650米
- ⭐⭐⭐ 800米

---

### 第3关：极限越野 ⭐⭐⭐
- **难度**: 困难
- **地形**: 陡峭悬崖和峡谷
- **目标**: 1200米
- **特点**:
  - 极陡的坡度
  - 三座桥梁
  - 仅高手能通过

**星级要求**:
- ⭐ 700米
- ⭐⭐ 950米
- ⭐⭐⭐ 1200米

---

## 🎯 游戏玩法

### 基本流程

1. **启动游戏** → 自动加载第1关
2. **驾驶车辆** → 尽可能行驶更远
3. **达成目标** → 获得星级评价
4. **解锁新关** → 挑战更高难度
5. **重复挑战** → 争取3星完美

### 关卡选择

按 **L键** 或点击屏幕上的关卡按钮打开关卡选择界面：

```
┌─────────────────────────────────────┐
│       🏁 选择关卡              ✕    │
│                                     │
│  ┌──────┐ ┌──────┐ ┌──────┐       │
│  │关卡1 │ │关卡2 │ │关卡3 │       │
│  │新手  │ │山地  │ │极限  │       │
│  │⭐⭐⭐│ │⭐⭐ ☆│ │🔒    │       │
│  └──────┘ └──────┘ └──────┘       │
└─────────────────────────────────────┘
```

### 关卡完成

到达终点或翻车后显示完成界面：

```
┌──────────────────────────┐
│   🎉 关卡完成！          │
│   新手之路               │
│                          │
│   行驶距离: 523m         │
│                          │
│      ⭐ ⭐ ⭐           │
│                          │
│  [🔄 重试]  [➡️ 下一关] │
└──────────────────────────┘
```

---

## 🔧 技术实现

### 关卡数据结构

```typescript
interface LevelData {
  id: number                    // 关卡ID
  name: string                  // 关卡名称
  description: string           // 描述
  difficulty: 'easy'|'medium'|'hard'
  terrain1Path: string          // SVG地形路径
  terrain2Path: string
  carStartPosition: {x, y}
  bridgePositions: [...]        // 桥梁位置
  targetDistance: number        // 目标距离
  stars: { one, two, three }   // 星级要求
}
```

### 进度保存

使用 localStorage 自动保存：
```javascript
{
  "unlockedLevels": [1, 2, 3],
  "levelStars": {
    "1": 3,
    "2": 2,
    "3": 1
  }
}
```

### 星级计算

```typescript
calculateStars(distance, level):
  if distance >= level.stars.three: return 3
  if distance >= level.stars.two: return 2
  if distance >= level.stars.one: return 1
  return 0
```

---

## 📊 游戏进度

### 解锁机制

- **初始**: 只解锁第1关
- **完成关卡**: 自动解锁下一关
- **完全通关**: 所有3关都解锁

### 星级系统

每个关卡最多可获得3星：
- ⭐ = 达到基本要求
- ⭐⭐ = 良好表现
- ⭐⭐⭐ = 完美通关

### 重玩价值

- 🔄 可以重复挑战已完成的关卡
- 🎯 争取更高的星级评价
- 🏆 追求全3星完美通关

---

## 🎨 UI特性

### 关卡选择界面

**视觉设计**:
- 半透明黑色背景 (85%不透明度)
- 卡片式布局，清晰直观
- 颜色编码难度（绿/橙/红）
- 星级可视化显示

**交互动画**:
- 淡入淡出效果
- 卡片悬停高亮
- 平滑过渡动画

### 完成界面

**庆祝元素**:
- 大号标题和表情符号
- 金色距离显示
- 逐星显示动画
- 弹跳星星效果

**操作按钮**:
- 橙色重试按钮
- 绿色下一关按钮
- 悬停变亮效果

---

## 🚀 集成步骤

### 需要修改的文件

1. **MainScene.ts** - 集成关卡系统
   ```typescript
   import LevelManager from '../objects/levelManager'
   import LevelSelectUI from '../objects/levelSelectUI'
   import LevelCompleteUI from '../objects/levelCompleteUI'
   
   // 添加成员变量
   levelManager!: LevelManager
   levelSelectUI!: LevelSelectUI
   levelCompleteUI!: LevelCompleteUI
   
   // create() 中初始化
   this.levelManager = new LevelManager()
   this.levelSelectUI = new LevelSelectUI(this, this.levelManager)
   this.levelCompleteUI = new LevelCompleteUI(this)
   
   // 加载当前关卡数据
   this.loadLevel(this.levelManager.getCurrentLevel())
   ```

2. **添加键盘快捷键**
   ```typescript
   // 在 KeyboardController 中添加
   private keyL: Phaser.Input.Keyboard.Key | null = null
   
   // 检测 L 键
   if (this.keyL?.isDown) {
     this.scene.levelSelectUI.show((levelId) => {
       this.scene.loadLevel(levelId)
     })
   }
   ```

3. **关卡加载方法**
   ```typescript
   loadLevel(levelId: number) {
     const level = this.levelManager.getLevel(levelId)
     if (!level) return
     
     // 清理旧对象
     this.terrains.forEach(t => t.destroy())
     this.car.bodies.forEach(b => b.destroy())
     
     // 创建新地形
     const terrain1 = new Terrain(this, level.terrain1Path, ...)
     const terrain2 = new Terrain(this, level.terrain2Path, ...)
     
     // 创建新车
     this.car = new Car(this, level.carStartPosition.x, ...)
     
     // 创建桥梁
     level.bridgePositions.forEach(pos => {
       new Bridge(this, pos.x, pos.y, pos.width, pos.height)
     })
   }
   ```

4. **关卡完成检测**
   ```typescript
   update() {
     // ... 现有代码
     
     // 检测是否完成关卡
     const currentLevel = this.levelManager.getCurrentLevel()
     const distance = this.scoreManager.getScore()
     
     if (distance >= currentLevel.targetDistance && !this.levelCompleted) {
       this.levelCompleted = true
       const stars = this.levelManager.calculateStars(distance, currentLevel)
       this.levelManager.saveLevelStars(currentLevel.id, stars)
       
       // 显示完成界面
       this.levelCompleteUI.show(
         distance,
         stars,
         currentLevel.name,
         () => this.nextLevel(),  // 下一关
         () => this.retryLevel()  // 重试
       )
     }
   }
   ```

---

## 💡 扩展建议

### 短期扩展
1. **更多关卡** - 添加到10个关卡
2. **时间挑战** - 限时模式
3. **收集品** - 金币、道具
4. **成就系统** - 特殊挑战

### 长期规划
5. **自定义关卡** - 玩家创建分享
6. **在线排行** - 全球竞争
7. **车辆解锁** - 不同性能的车
8. **多人模式** - 实时竞速

---

## 🎉 总结

关卡系统为游戏带来了：
- ✅ **明确目标** - 不再是无尽驾驶
- ✅ ** progression** - 逐步提升难度
- ✅ **重玩价值** - 争取更高星级
- ✅ **成就感** - 解锁和完成反馈

现在游戏有了完整的结构和持久的吸引力！

---

*版本: 3.0 - Level System Added*  
*关卡数: 3*  
*总目标距离: 2500米*
