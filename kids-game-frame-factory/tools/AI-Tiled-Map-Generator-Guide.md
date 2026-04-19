# 🤖 AI 辅助 Tiled 地图生成指南

本指南帮助你利用 AI 快速生成符合 Mario 游戏格式的 Tiled 地图。

---

## 📋 目录
1. [Tiled 地图格式说明](#tiled-地图格式说明)
2. [AI 提示词模板](#ai-提示词模板)
3. [关卡生成示例](#关卡生成示例)
4. [验证和导入流程](#验证和导入流程)

---

## 🎯 Tiled 地图格式说明

Mario 游戏使用的 Tiled 地图需要包含以下图层：

### 必需图层
1. **`world`** - 地形图层（tilelayer）
   - 包含所有地面、砖块、管道等地形
   - 必须设置碰撞属性

2. **`modifiers`** - 道具和修饰层（objectgroup）
   - 道具位置（蘑菇、星星、金币等）
   - 管道连接点
   - 房间定义

3. **`enemies`** - 敌人生成层（objectgroup）
   - Goomba 和 Turtle 的生成位置

### 瓦片 ID 映射
```
1 = 地面砖
2-4 = 装饰性砖块
5 = 终点旗杆
10-15 = 问号砖
20-30 = 管道
40-42 = 动画问号砖
45 = Goomba（敌人）
46 = Turtle（敌人）
```

---

## 💡 AI 提示词模板

### 模板 1：生成完整关卡地图

```markdown
请帮我生成一个符合 Tiled JSON 格式的 Mario 风格关卡地图。

## 要求：
1. 地图尺寸：宽度 200-300 格，高度 15 格
2. 瓦片大小：16x16 像素
3. 使用正交（orthogonal）方向

## 必需图层：
1. "world" 图层 - 地形图层（tilelayer）
   - 包含完整的地面、砖块、管道
   - 终点旗杆在地图最右侧
   
2. "modifiers" 图层 - 修饰层（objectgroup）
   - 添加 3-5 个蘑菇道具（type: "powerUp", name: "mushroom"）
   - 添加 1-2 个星星道具（type: "powerUp", name: "star"）
   - 添加 1 个 1up 道具（type: "powerUp", name: "1up"）
   - 添加 2-3 个管道（type: "pipe"）
   - 添加 2 个房间定义（type: "room", name: "room1" 和 "room2"）

3. "enemies" 图层 - 敌人生成层（objectgroup）
   - 添加 8-12 个 Goomba（name: "goomba"）
   - 添加 2-3 个 Turtle（name: "turtle"）

## 参考格式：
{
  "compressionlevel": -1,
  "height": 15,
  "infinite": false,
  "layers": [
    {
      "data": [1,1,1,...],
      "height": 15,
      "id": 1,
      "name": "world",
      "opacity": 1,
      "properties": [{"name": "time", "type": "string", "value": "1000"}],
      "type": "tilelayer",
      "visible": true,
      "width": 237,
      "x": 0,
      "y": 0
    },
    {
      "draworder": "topdown",
      "id": 2,
      "name": "modifiers",
      "objects": [
        {
          "gid": 12,
          "height": 16,
          "id": 2,
          "name": "mushroom",
          "rotation": 0,
          "type": "powerUp",
          "visible": true,
          "width": 16,
          "x": 336,
          "y": 160
        }
      ],
      "opacity": 1,
      "type": "objectgroup",
      "visible": false,
      "x": 0,
      "y": 0
    },
    {
      "draworder": "topdown",
      "id": 3,
      "name": "enemies",
      "objects": [
        {
          "gid": 45,
          "height": 16,
          "id": 8,
          "name": "goomba",
          "rotation": 0,
          "type": "",
          "visible": true,
          "width": 16,
          "x": 384,
          "y": 208
        }
      ],
      "opacity": 1,
      "type": "objectgroup",
      "visible": false,
      "x": 0,
      "y": 0
    }
  ],
  "nextlayerid": 4,
  "nextobjectid": 158,
  "orientation": "orthogonal",
  "properties": [{"name": "mapProp", "type": "string", "value": "123"}],
  "renderorder": "right-down",
  "tiledversion": "1.4.3",
  "tileheight": 16,
  "tilesets": [
    {
      "columns": 11,
      "firstgid": 1,
      "image": "../images/super-mario.png",
      "imageheight": 90,
      "imagewidth": 198,
      "margin": 1,
      "name": "SuperMarioBros-World1-1",
      "spacing": 2,
      "tilecount": 55,
      "tileheight": 16,
      "tiles": [
        {"id": 4, "properties": [{"name": "worldsEnd", "type": "bool", "value": true}]},
        {"id": 10, "properties": [{"name": "coin", "type": "string", "value": "true"}, {"name": "powerUp", "type": "string", "value": "coin"}]},
        {"id": 11, "properties": [{"name": "powerUp", "type": "string", "value": "mushroom"}]},
        {"id": 40, "properties": [{"name": "callback", "type": "string", "value": "questionMark"}, {"name": "collide", "type": "bool", "value": true}]}
      ],
      "tilewidth": 16
    }
  ],
  "tilewidth": 16,
  "type": "map",
  "version": 1.4,
  "width": 237
}

## 注意事项：
- world 图层的 data 数组需要填充实际的瓦片 ID（用 1 表示地面）
- 敌人和道具的 y 坐标应该在 160-224 范围内（地面上方）
- 终点旗杆用瓦片 ID 5
- 只返回 JSON，不要添加其他文本说明
```

---

### 模板 2：生成特定主题关卡

```markdown
请生成一个 [主题描述] 风格的 Mario 关卡。

## 关卡特点：
- 难度：[简单/中等/困难]
- 关卡长度：[短/中/长]
- 特殊元素：[如：更多管道、更多跳跃、水下场景等]

## 要求：
- [具体要求 1]
- [具体要求 2]

[然后粘贴上面的完整要求和格式]
```

---

## 🎮 关卡生成示例

### 示例 1：简单的教学关卡

```markdown
请生成一个简单的 Mario 教学关卡，适合新手玩家。

## 关卡特点：
- 难度：简单
- 关卡长度：短（约 150 格宽）
- 敌人较少，主要让玩家熟悉操作

## 要求：
1. 开头区域平坦，让玩家适应移动
2. 只有 3-4 个 Goomba 敌人
3. 1 个蘑菇道具帮助玩家变大
4. 终点在地图右侧

[然后粘贴完整的格式要求]
```

### 示例 2：复杂的挑战关卡

```markdown
请生成一个有挑战性的 Mario 关卡。

## 关卡特点：
- 难度：困难
- 关卡长度：长（约 300 格宽）
- 包含大量跳跃、多个管道、各种敌人

## 要求：
1. 多个高低起伏的平台
2. 5-6 个管道连接
3. 15+ 个敌人（Goomba + Turtle）
4. 多个隐藏道具
5. 需要精准跳跃的区域

[然后粘贴完整的格式要求]
```

---

## ✅ 验证和导入流程

### 步骤 1：验证 JSON
1. 将 AI 生成的 JSON 复制
2. 使用在线 JSON 验证工具检查格式
3. 确保所有必需图层都存在

### 步骤 2：保存文件
1. 将验证通过的 JSON 保存到 `kids-game-house/games/mario/src/assets/maps/` 目录
2. 命名为 `level2.json`、`level3.json` 等

### 步骤 3：更新配置
在 `config.ts` 中添加新关卡：

```typescript
levels: [
  { id: 1, name: 'World 1-1', mapKey: 'map-level1', mapFile: 'assets/maps/super-mario.json' },
  { id: 2, name: 'World 1-2', mapKey: 'map-level2', mapFile: 'assets/maps/level2.json' },
  { id: 3, name: 'World 1-3', mapKey: 'map-level3', mapFile: 'assets/maps/level3.json' },
]
```

### 步骤 4：测试游戏
1. 运行 `npm run dev`
2. 测试关卡是否正常加载
3. 验证碰撞、敌人、道具是否正常工作

---

## 🛠️ 常见问题

### Q: AI 生成的地图无法加载？
A: 检查：
1. JSON 格式是否正确
2. 图层名称是否正确（world、modifiers、enemies）
3. 瓦片集配置是否与现有地图一致

### Q: 敌人不显示？
A: 检查：
1. enemies 图层的对象是否正确
2. 敌人的 y 坐标是否正确（应该在地面上方）

### Q: 碰撞有问题？
A: 检查：
1. world 图层的瓦片是否设置了 collide 属性
2. 参考现有地图的瓦片属性配置

---

## 📚 相关资源

- [Tiled 官方文档](https://doc.mapeditor.org/)
- [Phaser Tilemap 文档](https://photonstorm.github.io/phaser3-docs/Phaser.Tilemaps.Tilemap.html)
- 项目中的示例地图：`super-mario.json`

---

**版本**: v1.0  
**更新日期**: 2026-04-18
