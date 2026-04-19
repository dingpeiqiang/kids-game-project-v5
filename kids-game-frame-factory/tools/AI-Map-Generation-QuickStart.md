# 🚀 AI 地图生成快速开始

## 3 步生成新关卡

---

### 第 1 步：用 AI 生成地图

复制这个提示词，发送给 AI（ChatGPT、Claude 等）：

```
请帮我生成一个符合 Tiled JSON 格式的 Mario 风格关卡地图。

## 要求：
1. 地图尺寸：宽度 200 格，高度 15 格
2. 瓦片大小：16x16 像素
3. 使用正交（orthogonal）方向

## 必需图层：
1. "world" 图层 - 地形图层（tilelayer）
   - 包含完整的地面、砖块、管道
   - 终点旗杆在地图最右侧（瓦片 ID 5）
   
2. "modifiers" 图层 - 修饰层（objectgroup）
   - 添加 3 个蘑菇道具（type: "powerUp", name: "mushroom"）
   - 添加 1 个星星道具（type: "powerUp", name: "star"）
   - 添加 1 个 1up 道具（type: "powerUp", name: "1up"）
   - 添加 2 个管道（type: "pipe"）
   - 添加 2 个房间定义（type: "room", name: "room1" 和 "room2"）

3. "enemies" 图层 - 敌人生成层（objectgroup）
   - 添加 8 个 Goomba（name: "goomba"）
   - 添加 2 个 Turtle（name: "turtle"）

## 格式参考：
请参考 super-mario.json 的完整结构，只返回 JSON。
```

---

### 第 2 步：保存和验证

1. 将 AI 生成的 JSON 保存为：
   `kids-game-house/games/mario/src/assets/maps/level2.json`

2. 验证地图：
   ```bash
   cd kids-game-frame-factory/tools
   node tiled-map-helper.js validate level2.json
   ```

---

### 第 3 步：添加到游戏

在 `kids-game-house/games/mario/src/scripts/config.ts` 中添加：

```typescript
levels: [
  { id: 1, name: 'World 1-1', mapKey: 'map-level1', mapFile: 'assets/maps/super-mario.json' },
  { id: 2, name: 'World 1-2', mapKey: 'map-level2', mapFile: 'assets/maps/level2.json' },
],
```

运行游戏测试！ 🎮

---

## 🛠️ 实用命令

```bash
# 列出所有地图
node tiled-map-helper.js list

# 验证地图
node tiled-map-helper.js validate level2.json

# 创建基础地图模板
node tiled-map-helper.js create level2.json 200

# 格式化地图
node tiled-map-helper.js format level2.json
```

---

## 📝 提示词变化

### 简单关卡
```
难度：简单，长度：短（150格），敌人：3-4个
```

### 中等关卡
```
难度：中等，长度：中（220格），敌人：10-12个，一些跳跃
```

### 困难关卡
```
难度：困难，长度：长（280格），敌人：15+个，复杂跳跃
```
