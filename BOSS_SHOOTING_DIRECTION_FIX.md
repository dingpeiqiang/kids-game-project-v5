# 太空射击游戏Boss射击方向修复说明

## 问题描述
在simple-game下的太空射击游戏中，部分Boss的射击方向出现了反向的问题，子弹向上发射而不是向下朝向玩家。

## 问题原因
在Canvas坐标系中，Y轴向下为正方向，但原有的代码在计算子弹速度分量时没有正确处理这一点，导致：
1. 使用 `Math.sin(angle)` 计算vy时，当angle在某些象限时会得到负值
2. 追踪弹直接使用 `(dy / dist)` 而没有考虑dy的正负号
3. 扇形弹幕的角度计算没有确保向下的分量

## 修复方案
对所有Boss射击逻辑中的vy分量使用 `Math.abs()` 确保子弹始终有向下的速度分量：

### 1. 最终Boss (final_boss)
- **环形弹幕攻击**：`vy: Math.abs(Math.sin(angle)) * 3`
- **扇形攻击**：`vy: Math.abs(4 + this.difficulty * 0.5)`

### 2. 普通Boss敌人
- **扇形攻击**：`vy: Math.abs(4 + this.difficulty * 0.8)`

### 3. 关卡Boss (Lv1-Lv9)
所有攻击模式都进行了修复：

- **aimed (瞄准)**：`vy: Math.abs(Math.sin(ang)) * spd`
- **spread (散射)**：`vy: Math.abs(Math.sin(ang)) * spd`
- **barrage (弹幕)**：`vy: Math.abs(Math.sin(ang)) * (spd + 0.8)`
- **spiral (螺旋)**：`vy: Math.abs(Math.sin(ang)) * s`
- **laser_sweep (激光扫射)**：`vy: Math.abs(Math.sin(ang)) * spd * 1.6`
- **shockwave (冲击波)**：`vy: Math.abs(Math.sin(ang)) * spd`
- **homing (追踪)**：`vy: Math.abs(dy / dist) * homingSpd`

## 修改文件
- `kids-game-house/games/simple-game/src/games/spaceshooter/scene.ts`

## 测试建议
1. 启动游戏并进入太空射击模式
2. 观察各个关卡Boss的射击方向
3. 确认所有子弹都向下发射朝向玩家
4. 特别测试：
   - 最终Boss的三种攻击模式
   - Lv1-Lv9各关Boss的不同攻击模式
   - 追踪弹是否正确跟随玩家

## 技术说明
在Canvas 2D坐标系中：
- X轴：向右为正
- Y轴：**向下为正**（这是关键！）

因此，从上方Boss向下方玩家发射子弹时，vy必须为正值。使用 `Math.abs()` 可以确保无论角度如何计算，vy始终为正，保证子弹向下飞行。