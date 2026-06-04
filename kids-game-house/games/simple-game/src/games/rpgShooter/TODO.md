# 📋 RPG Shooter 模块化重构 - TODO清单

## ✅ 已完成 (40%)

### 基础设施
- [x] 创建 rpgShooter 目录
- [x] 建立模块结构
- [x] 配置 TypeScript

### 核心模块
- [x] **config.ts** - 游戏配置常量
  - [x] 游戏基础参数
  - [x] 等级属性表
  - [x] 敌人类型定义
  - [x] 掉落物配置
  
- [x] **types.ts** - TypeScript类型定义
  - [x] PlayerBullet
  - [x] EnemyBullet（弹幕系统）
  - [x] Enemy
  - [x] Particle
  - [x] FloatText
  - [x] Drop
  - [x] Star
  - [x] ComboReward
  - [x] Boss
  - [x] GameState
  
- [x] **state.ts** - 状态管理
  - [x] createInitialState()
  - [x] resetState()
  
- [x] **player.ts** - 玩家逻辑
  - [x] initPlayerStats()
  - [x] levelUp() - 含华丽特效
  - [x] updatePlayer() - 双模式控制
  - [x] playerHit() - 护盾系统
  
- [x] **bullets.ts** - 子弹系统
  - [x] shoot() - 自动瞄准
  - [x] updatePlayerBullets()
  - [x] spawnEnemyBullet() - 弹幕地狱
  - [x] updateEnemyBullets()
  
- [x] **index.ts** - 模块导出
  - [x] 导出配置
  - [x] 导出类型
  - [x] 导出函数

### 文档系统
- [x] REFACTOR_GUIDE.md - 重构指南
- [x] MODULE_README.md - API文档
- [x] IMPLEMENTATION_SUMMARY.md - 实施总结
- [x] QUICKSTART.md - 快速开始
- [x] TODO.md - 本文件

---

## 🚧 进行中 (0%)

无

---

## ⏳ 待完成 (60%)

### Phase 1: 核心系统（高优先级）

#### enemies.ts - 敌人系统
预计代码量: ~250行
预计时间: 4-6小时

- [ ] spawnEnemy() - 根据难度生成敌人
  - [ ] 随机位置生成
  - [ ] 根据difficulty选择类型
  - [ ] Boss波次逻辑
  
- [ ] updateEnemies() - 更新敌人
  - [ ] 追踪玩家AI
  - [ ] 速度限制
  - [ ] 边界检查
  - [ ] 出屏移除
  
- [ ] drawEnemy() - 绘制敌人
  - [ ] Circle - 圆形基础敌人
  - [ ] Diamond - 菱形中型敌人
  - [ ] Hex - 六边形重型敌人
  - [ ] Boss - 三角形Boss
  - [ ] Fast - 流线型快速敌人 ⭐新增
  - [ ] Tank - 方形坦克敌人 ⭐新增
  
- [ ] 特殊行为
  - [ ] Fast敌人快速移动
  - [ ] Tank敌人高血量
  - [ ] Boss多阶段战斗

**优先级**: 🔴🔴🔴🔴🔴  
**依赖**: config.ts, types.ts  
**测试要点**: 敌人生成、移动、绘制

---

#### collision.ts - 碰撞检测
预计代码量: ~150行
预计时间: 2-3小时

- [ ] rectCollide() - 矩形碰撞检测
- [ ] circleCollide() - 圆形碰撞检测

- [ ] checkBulletEnemyCollision() - 子弹击中敌人
  - [ ] 伤害计算
  - [ ] 穿透逻辑
  - [ ] 击杀处理
  - [ ] 连击系统
  - [ ] 经验获取
  - [ ] 掉落生成
  
- [ ] checkPlayerEnemyCollision() - 玩家撞敌人
  - [ ] 护盾检测
  - [ ] 受伤处理
  - [ ] 无敌时间
  
- [ ] checkPlayerDropCollision() - 拾取掉落物
  - [ ] HP恢复
  - [ ] EXP获取
  - [ ] 道具收集
  - [ ] 自动收集逻辑
  
- [ ] checkExplosionDamage() - 爆炸范围伤害

**优先级**: 🔴🔴🔴🔴🔴  
**依赖**: types.ts, player.ts  
**测试要点**: 各种碰撞场景

---

#### powerups.ts - 道具系统
预计代码量: ~300行
预计时间: 5-7小时

- [ ] spawnDrop() - 生成掉落物
  - [ ] 概率计算
  - [ ] 位置生成
  - [ ] 道具箱随机绑定
  
- [ ] usePowerup() - 使用道具
  - [ ] ☢️ nuke - 核弹清场
  - [ ] ⚡ laser - 激光弹幕
  - [ ] ❄️ freeze - 时间冻结
  - [ ] 🛡️ shield - 护盾叠加
  - [ ] ✨ score2x - 双倍分数
  - [ ] 👾 clone - 分身弹
  
- [ ] updateDrops() - 更新掉落物
  - [ ] 重力下落
  - [ ] 生命周期
  - [ ] 自动收集
  - [ ] 磁吸效果
  
- [ ] 道具效果实现
  - [ ] laserTimer - 激光持续射击
  - [ ] freezeTimer - 敌人静止
  - [ ] cloneTimer - 子弹分裂
  - [ ] score2xTimer - 分数翻倍
  - [ ] shieldCount - 护盾层数

**优先级**: 🔴🔴🔴🔴⚪  
**依赖**: config.ts, types.ts  
**测试要点**: 道具使用、效果持续时间

---

### Phase 2: 增强体验（中优先级）

#### particles.ts - 粒子特效
预计代码量: ~150行
预计时间: 2-3小时

- [ ] explode() - 爆炸特效
  - [ ] 基础粒子
  - [ ] 环形冲击波
  - [ ] 颜色渐变
  
- [ ] createLevelUpEffect() - 升级特效
  - [ ] 30个放射粒子
  - [ ] 双色交替
  - [ ] 屏幕震动
  
- [ ] createComboEffect() - 连击光环
  - [ ] 金色光环
  - [ ] 旋转效果
  
- [ ] updateParticles() - 更新粒子
  - [ ] 位置更新
  - [ ] 重力影响
  - [ ] 生命周期
  
- [ ] drawParticles() - 绘制粒子
  - [ ] 透明度渐变
  - [ ] 大小缩放

**优先级**: 🔴🔴🔴⚪⚪  
**依赖**: types.ts  
**测试要点**: 特效流畅度、性能

---

#### rendering.ts - 渲染系统
预计代码量: ~400行
预计时间: 6-8小时

- [ ] drawBackground() - 背景
  - [ ] 渐变背景
  - [ ] 星空动画
  - [ ] 科技网格
  
- [ ] drawPlayer() - 玩家
  - [ ] 八边形主体
  - [ ] 引擎火焰
  - [ ] 核心发光
  - [ ] 武器指示
  - [ ] 等级显示
  - [ ] 无敌闪烁
  
- [ ] drawBullets() - 子弹
  - [ ] 玩家子弹（拖尾）
  - [ ] 敌人子弹
  - [ ] 发光效果
  
- [ ] drawEnemies() - 敌人
  - [ ] 6种敌人绘制
  - [ ] 血条显示
  - [ ] 发光效果
  
- [ ] drawDrops() - 掉落物
  - [ ] 呼吸动画
  - [ ] 图标显示
  
- [ ] drawHUD() - HUD界面
  - [ ] 时间显示
  - [ ] 分数显示
  - [ ] 经验条
  - [ ] 血条
  - [ ] 能量条 ⭐新增
  - [ ] 属性加成显示
  - [ ] 道具效果指示器
  - [ ] 连击显示
  
- [ ] drawFloatTexts() - 浮动文字
  - [ ] 上升动画
  - [ ] 淡出效果
  - [ ] 阴影发光
  
- [ ] applyScreenEffects() - 屏幕特效
  - [ ] 震动效果
  - [ ] 闪屏效果
  - [ ] 能量满光环 ⭐新增
  
- [ ] drawStartScreen() - 开始界面
- [ ] drawGameOver() - 结束界面
  - [ ] 统计数据
  - [ ] 重新开始提示

**优先级**: 🔴🔴🔴🔴⚪  
**依赖**: 所有模块  
**测试要点**: 渲染性能、视觉效果

---

### Phase 3: 完善细节（低优先级）

#### input.ts - 输入处理
预计代码量: ~100行
预计时间: 1-2小时

- [ ] setupInputHandlers() - 设置事件监听
- [ ] handleMouseMove() - 鼠标移动
- [ ] handleTouchStart() - 触摸开始
- [ ] handleTouchMove() - 触摸移动
- [ ] handleTouchEnd() - 触摸结束
- [ ] handleKeyDown() - 键盘按下
- [ ] handleKeyUp() - 键盘释放
- [ ] handleClick() - 点击事件
  - [ ] 开始游戏
  - [ ] 重新开始

**优先级**: 🔴🔴⚪⚪⚪  
**依赖**: types.ts  
**测试要点**: 各种输入设备

---

#### audio.ts - 音效管理（可选）
预计代码量: ~80行
预计时间: 1小时

- [ ] playShoot() - 射击音效
- [ ] playExplosion() - 爆炸音效
- [ ] playLevelUp() - 升级音效
- [ ] playCollect() - 收集音效
- [ ] playHit() - 受伤音效
- [ ] setVolume() - 音量控制
- [ ] mute() - 静音

**优先级**: 🔴⚪⚪⚪⚪  
**依赖**: audioService  
**测试要点**: 音效同步

---

#### utils.ts - 工具函数
预计代码量: ~50行
预计时间: 0.5小时

- [ ] clamp() - 数值限制
- [ ] lerp() - 线性插值
- [ ] distance() - 距离计算
- [ ] angle() - 角度计算
- [ ] randomRange() - 随机范围
- [ ] formatTime() - 时间格式化

**优先级**: ⚪⚪⚪⚪⚪  
**依赖**: 无  
**测试要点**: 函数正确性

---

### 整合与优化

#### 主文件重构
预计代码量: ~200行
预计时间: 3-4小时

- [ ] 创建新的 rpgShooter.ts
- [ ] 导入所有模块
- [ ] 实现 gameLoop
- [ ] 整合update逻辑
- [ ] 整合render逻辑
- [ ] 测试完整流程
- [ ] 性能优化

**优先级**: 🔴🔴🔴🔴🔴  
**依赖**: 所有模块  
**测试要点**: 整体功能、性能

---

#### 性能优化
预计时间: 4-6小时

- [ ] 对象池实现
  - [ ] 子弹对象池
  - [ ] 粒子对象池
  - [ ] 敌人对象池
  
- [ ] 渲染优化
  - [ ] 视锥剔除
  - [ ] 批量绘制
  - [ ] 离屏缓存
  
- [ ] 碰撞优化
  - [ ] 空间分区
  - [ ]  Broad-phase检测
  
- [ ] 内存优化
  - [ ] 减少GC
  - [ ] 及时清理

**优先级**: 🔴🔴🔴⚪⚪  
**依赖**: 核心功能完成  
**测试要点**: FPS、内存占用

---

#### 测试与调试
预计时间: 6-8小时

- [ ] 单元测试
  - [ ] player.ts 测试
  - [ ] bullets.ts 测试
  - [ ] collision.ts 测试
  - [ ] powerups.ts 测试
  
- [ ] 集成测试
  - [ ] 完整游戏流程
  - [ ] 边界情况
  - [ ] 压力测试
  
- [ ] 性能测试
  - [ ] FPS监测
  - [ ] 内存分析
  - [ ] 瓶颈定位
  
- [ ] Bug修复
  - [ ] 已知问题列表
  - [ ] 回归测试

**优先级**: 🔴🔴🔴🔴⚪  
**依赖**: 主要功能完成  
**测试要点**: 稳定性、性能

---

## 📊 进度统计

| 阶段 | 模块数 | 已完成 | 进度 |
|------|--------|--------|------|
| Phase 1 | 3 | 0 | 0% |
| Phase 2 | 2 | 0 | 0% |
| Phase 3 | 3 | 0 | 0% |
| **总计** | **12** | **5** | **40%** |

### 代码量统计

| 类型 | 行数 |
|------|------|
| 已完成 | ~1,500 |
| 待完成 | ~2,500 |
| **总计** | **~4,000** |

### 时间估算

| 任务 | 预计时间 |
|------|---------|
| Phase 1 | 11-16小时 |
| Phase 2 | 8-11小时 |
| Phase 3 | 10-15小时 |
| **总计** | **29-42小时** |

---

## 🎯 里程碑

### Milestone 1: 核心玩法 ✅
- [x] 基础架构
- [x] 玩家系统
- [x] 子弹系统
- [ ] 敌人系统
- [ ] 碰撞检测

**目标日期**: Day 2

---

### Milestone 2: 完整体验 🚧
- [ ] 道具系统
- [ ] 粒子特效
- [ ] 渲染系统
- [ ] 输入处理

**目标日期**: Day 4

---

### Milestone 3: 优化发布 📅
- [ ] 性能优化
- [ ] 测试完善
- [ ] 文档更新
- [ ] 正式发布

**目标日期**: Day 7

---

## 💡 每日计划建议

### Day 1: 准备日 ✅
- [x] 创建目录结构
- [x] 编写核心模块
- [x] 编写文档

### Day 2: 敌人系统
- [ ] 实现 enemies.ts
- [ ] 实现 collision.ts
- [ ] 测试敌人生成和移动

### Day 3: 道具与特效
- [ ] 实现 powerups.ts
- [ ] 实现 particles.ts
- [ ] 测试道具效果

### Day 4: 渲染系统
- [ ] 实现 rendering.ts
- [ ] 整合所有绘制函数
- [ ] 优化视觉效果

### Day 5: 输入与整合
- [ ] 实现 input.ts
- [ ] 重构主文件
- [ ] 完整流程测试

### Day 6: 性能优化
- [ ] 对象池实现
- [ ] 渲染优化
- [ ] 性能测试

### Day 7: 测试发布
- [ ] 单元测试
- [ ] Bug修复
- [ ] 文档完善
- [ ] 发布

---

## 🔥 紧急任务

当前最优先需要完成的：

1. **enemies.ts** - 没有敌人游戏无法进行
2. **collision.ts** - 没有碰撞检测游戏无法交互
3. **rendering.ts** - 没有渲染看不到画面

---

## 📝 备注

- 每个模块完成后立即测试
- 保持代码风格一致
- 及时更新文档
- 遇到难题先查文档
- 定期备份代码

---

**最后更新**: 2026-05-04  
**下次更新**: 完成 enemies.ts 后
