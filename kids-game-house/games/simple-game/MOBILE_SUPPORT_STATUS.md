# Simple-Game 移动端支持状态报告

## 概述

本文档跟踪 simple-game 下所有游戏的移动端支持状态。

**统计时间**: 2026-05-16  
**总游戏数**: 24个

---

## ✅ 已支持移动端的游戏 (18个)

### 完全支持（触摸事件 + Canvas适配）

1. **dodge** (轻量躲避) ✅
   - 支持拖拽移动
   - 同时监听 mousedown/mousemove 和 touchstart/touchmove
   - 文件: `dodge.ts`

2. **pop** (气球砰砰) ✅
   - 支持点击气球
   - 文件: `pop.ts`

3. **fruitSlice** (水果切切) ✅
   - 支持滑动切割
   - 文件: `fruitSlice.ts`

4. **cookieCut** (切饼干) ✅
   - 支持滑动切割
   - 文件: `cookieCut.ts`

5. **neonRun** (霓虹跑酷) ✅
   - 支持点击切换车道
   - 文件: `neonRun.ts`

6. **starCatcher** (星星捕手) ✅
   - 支持鼠标/触摸控制
   - 文件: `starCatcher.ts`

7. **slimeJump** (史莱姆跳) ✅
   - 支持鼠标/触摸控制
   - 文件: `slimeJump.ts`

8. **snake** (贪吃蛇) ✅
   - 支持方向按钮点击
   - 使用 addEventListener 绑定 touchstart
   - 文件: `snake.ts`

9. **whackMole** (打地鼠) ✅
   - 支持点击地鼠
   - 使用 addEventListener 绑定 touchstart
   - 文件: `whackMole.ts`

10. **racingRun** (极速赛车) ✅
    - 支持拖拽控制赛车
    - 文件: `racingRun.ts`

11. **rpgShooter** (星际猎手) ✅
    - 支持触摸控制移动
    - 文件: `rpgShooter.ts`

12. **dragonShooter** (打龙小游戏) ✅
    - 目录结构游戏，有完整的 input.ts
    - 文件: `dragonShooter/input.ts`

13. **rpgShooterTowerDefense** (RPG塔防射击) ✅
    - 目录结构游戏，有完整的输入处理
    - 文件: `rpgShooterTowerDefense/input.ts`

14. **towerDefense** (星际塔防) ✅
    - 目录结构游戏，GameEngine 中有触摸支持
    - 文件: `towerDefense/GameEngine.ts`

15. **stack3d** (3D堆叠乐园) ✅
    - 目录结构游戏，GameEngine 中有触摸支持
    - 文件: `stack3d/GameEngine.ts`

16. **bubbleShooter** (泡泡龙) ✅
    - 目录结构游戏
    - 文件: `bubbleShooter/`

17. **eliminate** (极速消除) ✅
    - 刚刚添加了移动端支持
    - 使用 mobileHelper 工具
    - 文件: `eliminate.ts`

18. **tetris** (方块消除) ✅
    - 目录结构游戏
    - 文件: `tetris/`

---

## 🔄 需要优化的游戏 (6个)

### 高优先级（热门游戏）

1. **sort** (色彩排序) ⚠️
   - 当前只使用 onclick
   - 需要添加 touchstart 支持
   - 文件: `sort.ts`

2. **jewelMatch** (宝石消消乐) ⚠️
   - 当前只使用 onclick
   - 需要添加 touchstart 支持
   - 文件: `jewelMatch.ts`

3. **bouncePath** (弹珠迷宫) ⚠️
   - 当前只使用 mousemove
   - 需要添加 touchmove 支持
   - 文件: `bouncePath.ts`

4. **memoryMatch** (翻牌配对) ⚠️
   - 当前只使用 onclick
   - 需要添加 touchstart 支持
   - 文件: `memoryMatch.ts`

5. **colorTap** (颜色Tap) ⚠️
   - 当前只使用 onclick
   - 需要添加 touchstart 支持
   - 文件: `colorTap.ts`

6. **stack** (叠叠乐) ⚠️
   - 当前只使用 onclick
   - 需要添加 touchstart 支持
   - 文件: `stack.ts`

---

## 📊 支持率统计

| 类别 | 数量 | 百分比 |
|------|------|--------|
| 已支持 | 18 | 75% |
| 待优化 | 6 | 25% |
| **总计** | **24** | **100%** |

---

## 🎯 优化计划

### Phase 1: 核心游戏优化（已完成）
- [x] eliminate (极速消除) - 使用 mobileHelper 统一方案
- [x] 创建 mobileHelper 工具库
- [x] 编写移动端优化指南

### Phase 2: 剩余游戏优化（进行中）
- [ ] sort (色彩排序)
- [ ] jewelMatch (宝石消消乐)
- [ ] bouncePath (弹珠迷宫)
- [ ] memoryMatch (翻牌配对)
- [ ] colorTap (颜色Tap)
- [ ] stack (叠叠乐)

### Phase 3: 测试与完善
- [ ] 真机测试所有游戏
- [ ] 性能优化（低端设备）
- [ ] UI 细节调整
- [ ] 用户体验改进

---

## 🔧 优化工具

### mobileHelper.ts
位置: `kids-game-house/games/simple-game/src/utils/mobileHelper.ts`

提供以下功能：
- `isMobile()` - 检测移动设备
- `getCanvasScale()` - 获取Canvas缩放比例
- `bindCanvasEvents()` - 统一绑定鼠标和触摸事件
- `getPointerPos()` - 获取统一的指针坐标
- `createVirtualJoystick()` - 创建虚拟摇杆
- `createMobileButton()` - 创建移动端按钮
- `resizeCanvasForMobile()` - 调整Canvas尺寸
- `injectMobileStyles()` - 注入移动端样式

### 使用示例

```typescript
import { bindCanvasEvents, getPointerPos, resizeCanvasForMobile } from '../utils/mobileHelper'

// 初始化
const canvas = document.getElementById('mainGameCanvas') as HTMLCanvasElement
resizeCanvasForMobile(canvas)

// 事件处理
const handleClick = (e: MouseEvent | TouchEvent) => {
  const pos = getPointerPos(e, canvas)
  const mx = pos.x
  const my = pos.y
  // ... 游戏逻辑
}

// 绑定事件
canvas.onclick = null
canvas.onmousedown = null
bindCanvasEvents(canvas, handleClick)
```

---

## 📝 注意事项

1. **事件绑定规范**
   - 必须同时绑定 click 和 touchstart
   - touchstart 需要设置 `{ passive: false }`
   - 在事件处理中调用 `e.preventDefault()` 防止页面滚动

2. **Canvas 适配**
   - 移动端自动缩小到 85% 尺寸
   - 保持原始分辨率，只调整显示尺寸
   - 避免模糊和失真

3. **UI 元素**
   - 按钮大小至少 44x44px（Apple HIG 标准）
   - 文字大小不小于 14px
   - 确保足够的点击区域

4. **性能考虑**
   - 减少粒子数量（移动端减半）
   - 降低渲染频率
   - 及时清理事件监听器

---

## 🚀 下一步行动

1. **立即执行**
   - 优化剩余的 6 个游戏
   - 每个游戏预计需要 15-30 分钟

2. **短期目标**
   - 完成所有游戏的移动端支持
   - 达到 100% 支持率

3. **长期目标**
   - 添加更多移动端专属功能
   - 优化性能和用户体验
   - 收集用户反馈持续改进

---

**维护者**: AI Assistant  
**最后更新**: 2026-05-16