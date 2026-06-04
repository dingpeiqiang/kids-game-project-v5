# 太空射击游戏玩家生命值无限叠加功能

## 功能描述
在simple-game的太空射击游戏中，玩家的生命值（HP）现在可以无限叠加，不再有上限限制。

## 实现方式

### 修改前
```typescript
case 'heal': {
  const old = this.playerHP; 
  this.playerHP = Math.min(this.maxHP, this.playerHP + 1)  // 受maxHP限制
  // ...
}
```

### 修改后
```typescript
case 'heal': {
  const old = this.playerHP
  this.playerHP += 1  // 移除上限限制，生命值可以无限叠加
  this.maxHP = this.playerHP  // 同步更新maxHP
  // ...
}
```

## 关键改动

1. **移除Math.min限制**：不再使用`Math.min(this.maxHP, this.playerHP + 1)`来限制生命值
2. **直接累加**：每次获得治疗道具时，`playerHP`直接+1
3. **同步maxHP**：同时更新`maxHP`以匹配当前`playerHP`，确保显示正确

## 游戏体验影响

### 正面效果
- ✅ 玩家可以通过收集治疗道具不断累积生命值
- ✅ 高关卡时可以拥有极高的生命值，增加生存能力
- ✅ 符合"无限成长"的游戏设计理念
- ✅ HUD显示会实时更新显示当前生命值（如 ❤️ 50/50）

### 平衡性考虑
- 治疗道具掉落率保持在合理范围（约8%-15%，随关卡提升）
- Boss战仍然具有挑战性，因为敌人攻击频率和伤害也会随关卡增加
- 玩家需要主动躲避子弹，不能仅依赖高生命值

## 相关文件
- `kids-game-house/games/simple-game/src/games/spaceshooter/scene.ts` (第418-425行)

## 测试建议
1. 启动游戏并进入太空射击模式
2. 收集多个治疗道具（💚）
3. 观察右上角HUD的生命值显示
4. 确认生命值可以超过初始的5点，并且没有上限
5. 验证受伤时生命值正确减少
6. 验证死亡条件仍然是 playerHP <= 0

## 技术说明
- `playerHP`：当前生命值
- `maxHP`：最大生命值（用于显示比例和UI）
- 两者保持同步，确保UI显示准确
- Canvas渲染器会根据这两个值计算血条比例和显示文本
