# RPG Shooter 测试指南

## 📋 测试概述

本指南介绍如何测试RPG Shooter模块化系统的各个部分。

## 🚀 快速开始

### 1. 运行所有测试
```bash
npm test
```

### 2. 运行测试并查看覆盖率
```bash
npm run test:coverage
```

### 3. 监听模式（开发时使用）
```bash
npm test -- --watch
```

---

## 🧪 测试类型

### 1. 单元测试 (Unit Tests)
测试单个函数的功能

**示例**: 测试玩家升级功能
```typescript
import { createInitialState } from '../state';
import { levelUp } from '../player';

test('levelUp should increase player level', () => {
  const state = createInitialState();
  const initialLevel = state.playerLevel;
  
  levelUp(state);
  
  expect(state.playerLevel).toBe(initialLevel + 1);
});
```

### 2. 集成测试 (Integration Tests)
测试多个模块的协作

**示例**: 测试完整的战斗流程
```typescript
test('complete combat flow', () => {
  const state = createInitialState();
  
  // 生成敌人
  spawnEnemy(state);
  
  // 射击
  shoot(state);
  
  // 检测碰撞
  checkBulletEnemyCollisions(state);
  
  // 验证敌人被击中
  expect(state.enemies.length).toBeLessThan(1);
});
```

### 3. 视觉测试 (Visual Tests)
手动测试视觉效果

**步骤**:
1. 启动开发服务器: `npm run dev`
2. 打开浏览器访问游戏
3. 检查以下内容:
   - ✅ 粒子特效是否流畅
   - ✅ 子弹拖尾是否正常
   - ✅ 屏幕震动是否有反馈
   - ✅ UI显示是否正确

---

## 📝 测试清单

### ✅ 核心功能测试

#### 配置模块 (config.ts)
- [ ] GAME_CONFIG常量是否正确
- [ ] LEVEL_STATS属性是否合理
- [ ] ENEMY_TYPES定义是否完整

#### 状态管理 (state.ts)
- [ ] createInitialState() 创建正确的初始状态
- [ ] resetState() 正确重置状态
- [ ] 所有字段都有默认值

#### 玩家系统 (player.ts)
- [ ] initPlayerStats() 正确初始化属性
- [ ] levelUp() 提升等级并恢复HP
- [ ] updatePlayer() 正确处理输入
- [ ] playerHit() 正确处理受伤

#### 子弹系统 (bullets.ts)
- [ ] shoot() 创建子弹
- [ ] 追踪子弹正确转向
- [ ] 子弹出界后被移除
- [ ] 敌人弹幕正确生成

#### 敌人系统 (enemies.ts)
- [ ] spawnEnemy() 从四个方向生成
- [ ] 敌人正确追踪玩家
- [ ] 6种敌人类型都能绘制
- [ ] 敌人出界后被移除

#### 碰撞检测 (collision.ts)
- [ ] rectCollide() 正确检测矩形碰撞
- [ ] circleCollide() 正确检测圆形碰撞
- [ ] 子弹击中敌人造成伤害
- [ ] 玩家撞到敌人会受伤
- [ ] 掉落物被正确拾取

#### 道具系统 (powerups.ts)
- [ ] spawnDrop() 按概率生成掉落
- [ ] usePowerup() 正确使用6种道具
- [ ] 道具效果持续时间正确
- [ ] 自动收集功能正常

#### 粒子特效 (particles.ts)
- [ ] createExplosion() 创建爆炸粒子
- [ ] createLevelUpEffect() 创建升级特效
- [ ] updateParticles() 正确更新位置
- [ ] 粒子生命周期结束后移除

#### 渲染系统 (rendering.ts)
- [ ] drawBackground() 绘制星空背景
- [ ] drawPlayer() 绘制玩家角色
- [ ] drawHUD() 显示完整UI
- [ ] 屏幕震动和闪光效果

---

## 🔍 手动测试步骤

### 测试1: 基本游戏流程

1. **启动游戏**
   ```bash
   npm run dev
   ```

2. **打开浏览器**
   - 访问: http://localhost:5173 (或显示的端口)
   - 选择RPG Shooter游戏

3. **测试内容**
   - [ ] 点击屏幕开始游戏
   - [ ] 移动鼠标/触摸控制玩家
   - [ ] 观察自动射击
   - [ ] 击杀敌人获得经验
   - [ ] 升级时查看特效
   - [ ] 90秒后游戏结束
   - [ ] 点击重新开始

### 测试2: 弹幕系统

1. **等待难度提升** (约30秒后)
2. **观察敌人行为**
   - [ ] Boss发射环形弹幕
   - [ ] Hex敌人发射追踪弹
   - [ ] 需要躲避敌人子弹

3. **测试躲避**
   - [ ] 成功躲避弹幕
   - [ ] 被子弹击中会受伤
   - [ ] 无敌时间闪烁

### 测试3: 道具系统

1. **击杀敌人获取道具箱**
2. **使用道具**
   - [ ] ☢️ 核弹清屏
   - [ ] ⚡ 激光弹幕
   - [ ] ❄️ 时间冻结
   - [ ] 🛡️ 护盾叠加
   - [ ] ✨ 双倍分数
   - [ ] 👾 分身弹

3. **验证效果**
   - [ ] 道具效果持续正确时间
   - [ ] HUD显示剩余时间
   - [ ] 特效视觉反馈

### 测试4: 连击系统

1. **快速击杀敌人**
2. **观察连击数**
   - [ ] 连击数增加
   - [ ] 分数倍率提升
   - [ ] 5连击触发特效
   - [ ] 10连击触发奖励

3. **断连测试**
   - [ ] 停止击杀3秒
   - [ ] 连击重置为0

### 测试5: 能量系统

1. **击杀敌人积累能量**
2. **观察能量条**
   - [ ] 能量逐渐增加
   - [ ] 满能量显示光环
   - [ ] 收集范围扩大

3. **能量衰减**
   - [ ] 停止击杀
   - [ ] 能量缓慢减少

### 测试6: 视觉效果

1. **粒子特效**
   - [ ] 升级时30个粒子放射
   - [ ] 爆炸有冲击波
   - [ ] 子弹有拖尾
   - [ ] 受伤有红色粒子

2. **屏幕特效**
   - [ ] 受伤时屏幕震动
   - [ ] 升级时屏幕闪光
   - [ ] 核弹清屏强烈震动

3. **UI显示**
   - [ ] 血条颜色变化
   - [ ] 经验条平滑增长
   - [ ] 浮动文字上升淡出
   - [ ] HUD信息完整

---

## 🐛 常见问题排查

### 问题1:  TypeScript编译错误

**症状**: 运行测试时报TypeScript错误

**解决**:
```bash
# 检查类型错误
npx tsc --noEmit

# 修复后重新测试
npm test
```

### 问题2:  模块导入失败

**症状**: Cannot find module 'xxx'

**解决**:
```bash
# 检查index.ts导出
cat rpgShooter/index.ts

# 确保路径正确
import { xxx } from './rpgShooter';  # 不是 './rpgShooter/xxx'
```

### 问题3:  游戏无法启动

**症状**: npm run dev 报错

**解决**:
```bash
# 清除缓存
rm -rf node_modules/.vite

# 重新安装依赖
npm install

# 重新启动
npm run dev
```

### 问题4:  性能问题

**症状**: 帧率低、卡顿

**排查**:
1. 打开浏览器开发者工具
2. 查看Performance标签
3. 检查:
   - 粒子数量是否过多
   - 是否有内存泄漏
   - Canvas绘制是否优化

**优化建议**:
- 限制同时存在的粒子数量
- 使用对象池重用对象
- 减少不必要的绘制调用

---

## 📊 性能测试

### FPS测试

```typescript
// 在gameLoop中添加FPS监测
let frameCount = 0;
let lastTime = Date.now();

function monitorFPS() {
  frameCount++;
  const now = Date.now();
  
  if (now - lastTime >= 1000) {
    console.log('FPS:', frameCount);
    frameCount = 0;
    lastTime = now;
  }
}
```

**目标**: 
- ✅ 最低60 FPS
- ⚠️ 警告: 低于45 FPS
- ❌ 危险: 低于30 FPS

### 内存测试

```javascript
// 浏览器控制台
performance.memory.usedJSHeapSize
performance.memory.totalJSHeapSize
```

**监控**:
- 内存是否持续增长（泄漏）
- GC频率是否过高
- 对象数量是否失控

---

## ✅ 测试通过标准

### 功能测试
- [ ] 所有单元测试通过
- [ ] 集成测试无错误
- [ ] 手动测试清单全部完成

### 性能测试
- [ ] FPS稳定在60以上
- [ ] 内存使用稳定
- [ ] 无明显卡顿

### 视觉测试
- [ ] 所有特效正常显示
- [ ] UI布局正确
- [ ] 动画流畅

### 兼容性测试
- [ ] Chrome浏览器正常
- [ ] Firefox浏览器正常
- [ ] 移动端触摸正常
- [ ] 不同分辨率适配

---

## 🎯 自动化测试脚本

创建 `tests/rpgShooter.test.ts`:

```typescript
import { createInitialState } from '../src/games/rpgShooter/state';
import { levelUp } from '../src/games/rpgShooter/player';
import { shoot } from '../src/games/rpgShooter/bullets';
import { spawnEnemy } from '../src/games/rpgShooter/enemies';

describe('RPG Shooter Core Functions', () => {
  test('initial state is correct', () => {
    const state = createInitialState();
    expect(state.playerLevel).toBe(1);
    expect(state.playerHP).toBe(6);
    expect(state.score).toBe(0);
  });

  test('level up increases level', () => {
    const state = createInitialState();
    levelUp(state);
    expect(state.playerLevel).toBe(2);
  });

  test('shoot creates bullets', () => {
    const state = createInitialState();
    state.gameStarted = true;
    state.targetX = 300;
    state.targetY = 200;
    
    shoot(state);
    
    expect(state.bullets.length).toBeGreaterThan(0);
  });

  test('spawn enemy creates enemies', () => {
    const state = createInitialState();
    state.gameStarted = true;
    
    spawnEnemy(state);
    
    expect(state.enemies.length).toBeGreaterThan(0);
  });
});
```

运行测试:
```bash
npm test
```

---

## 📞 获取帮助

遇到问题？

1. **查看文档**
   - MODULE_README.md - API参考
   - QUICKSTART.md - 快速开始
   - FINAL_COMPLETE.md - 完整功能列表

2. **检查代码**
   - 查看对应模块源码
   - 检查类型定义
   - 阅读注释说明

3. **调试技巧**
   ```typescript
   // 打印状态
   console.log('State:', state);
   
   // 检查特定值
   console.log('Player HP:', state.playerHP);
   console.log('Enemies:', state.enemies.length);
   ```

---

**祝测试顺利！** 🎮✨
