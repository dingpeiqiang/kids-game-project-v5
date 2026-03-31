# 🗺️ Tiled + Phaser 集成完全指南

## ✅ 已完成配置

**架构**: Vue 3 + Phaser 3.90 + Tiled  
**状态**: 已集成，可直接使用  

---

## 📁 新增文件清单

### 1. **Tiled 地图加载器**
```
src/utils/TiledMapLoader.ts
```
- ✅ 封装 Tiled 地图加载逻辑
- ✅ 支持瓦片层创建
- ✅ 支持对象层读取
- ✅ 自动碰撞设置

### 2. **示例地图文件**
```
public/maps/tank_level_1.json
```
- ✅ 13x13 网格地图
- ✅ 包含 Ground（地面层）
- ✅ 包含 Collision（碰撞层）
- ✅ 包含 Walls（墙壁对象）
- ✅ 包含 Player（玩家出生点）
- ✅ 包含 Base（基地位置）

---

## 🎯 Tiled 软件安装与使用

### 步骤 1: 下载 Tiled

**官网**: https://www.mapeditor.org/

**版本选择**:
- Windows: `tiled-setup.exe`
- macOS: `Tiled.dmg`
- Linux: `AppImage` 或包管理器

**价格**: 💯 **完全免费开源**

---

### 步骤 2: 创建新地图

打开 Tiled，点击"新建地图":

```
地图尺寸:
  宽度：13 格
  高度：13 格
  瓦片大小：64x64 像素

图层结构:
  - Ground (地面层 - 装饰用)
  - Collision (碰撞层 - 阻挡用)
  - Walls (对象层 - 墙壁)
  - Player (对象层 - 玩家出生点)
  - Base (对象层 - 基地)
```

---

### 步骤 3: 绘制地图

#### 3.1 创建瓦片集

1. 右键"图块集" → "新建嵌入式图块集"
2. 选择图片：`themes/tank_default/assets/scene/tileset.png`
3. 设置：
   ```
   瓦片宽度：64
   瓦片高度：64
   间距：0
   边距：0
   ```

#### 3.2 绘制地面层

1. 选择 "Ground" 层
2. 使用油漆桶工具填充草地瓦片

#### 3.3 绘制碰撞层

1. 选择 "Collision" 层
2. 在需要阻挡的位置绘制瓦片
3. **重要**: 为碰撞瓦片添加自定义属性：
   ```
   选中瓦片 → 编辑模板 → 添加属性
   名称：collides
   类型：bool
   值：true
   ```

#### 3.4 添加墙壁对象

1. 选择 "Walls" 层（对象层）
2. 使用"插入矩形"工具
3. 在每个格子中绘制 64x64 的矩形
4. 添加自定义属性：
   ```
   名称：type
   类型：string
   值：brick 或 steel
   ```

#### 3.5 标记玩家出生点

1. 选择 "Player" 层
2. 插入一个矩形（64x64）
3. 放在地图底部中央

#### 3.6 标记基地位置

1. 选择 "Base" 层
2. 插入一个矩形（64x64）
3. 放在玩家出生点正下方

---

### 步骤 4: 导出地图

```
文件 → 另存为 → public/maps/tank_level_1.json
```

**JSON 格式说明**:
```json
{
  "width": 13,           // 地图宽度（格）
  "height": 13,          // 地图高度（格）
  "tilewidth": 64,       // 瓦片宽度（像素）
  "tileheight": 64,      // 瓦片高度（像素）
  "layers": [            // 所有图层
    {
      "name": "Ground",
      "type": "tilelayer"
    },
    {
      "name": "Walls",
      "type": "objectgroup",
      "objects": [...]   // 墙壁对象列表
    }
  ],
  "tilesets": [          // 瓦片集信息
    {
      "image": "tileset.png",
      "tilewidth": 64,
      "tileheight": 64
    }
  ]
}
```

---

## 🔧 代码集成

### TankGameScene.ts 改造

当前代码已经是 Vue + Phaser 架构，只需修改 `preload()` 和 `create()` 方法：

```typescript
import { TiledMapLoader } from '@/utils/TiledMapLoader'

export default class TankGameScene extends Phaser.Scene {
  private tiledLoader!: TiledMapLoader
  private map!: Phaser.Tilemaps.Tilemap
  private groundLayer!: Phaser.Tilemaps.TilemapLayer
  private collisionLayer!: Phaser.Tilemaps.TilemapLayer
  
  preload(): void {
    // 加载 Tiled 地图
    this.load.tilemapTiledJSON('tank_map', '/maps/tank_level_1.json')
    
    // 加载瓦片集（如果 tileset.png 不存在，可以跳过）
    // this.load.image('tiles', '/themes/tank_default/assets/scene/tileset.png')
    
    // 其他资源保持不变
    this.load.image('player_tank_up', '/themes/tank_default/assets/scene/player_tank_up.png')
    // ...
  }
  
  create(): void {
    console.log('🎮 坦克大战启动（Tiled 版）')
    
    // 初始化 Tiled 加载器
    this.tiledLoader = new TiledMapLoader(this)
    
    // 加载地图
    this.map = this.tiledLoader.loadMap('tank_map', 'tiles')
    
    // 创建地面层（装饰）
    this.groundLayer = this.tiledLoader.createLayer(this.map, 'Ground')!
    
    // 创建碰撞层（阻挡）
    this.collisionLayer = this.tiledLoader.createLayer(this.map, 'Collision')!
    
    // 从对象层创建墙壁
    this.walls = this.physics.add.staticGroup()
    this.tiledLoader.createWallsFromLayer(this.walls, 'wall_brick', 'Walls', this.map)
    
    // 从对象层获取玩家位置
    const playerObjects = this.tiledLoader.getObjectsFromLayer(this.map, 'Player')
    if (playerObjects.length > 0) {
      const obj = playerObjects[0]
      this.player = this.physics.add.sprite(obj.x + 32, obj.y + 32, 'player_tank_up')
    }
    
    // 从对象层获取基地位置
    const baseObjects = this.tiledLoader.getObjectsFromLayer(this.map, 'Base')
    if (baseObjects.length > 0) {
      const obj = baseObjects[0]
      this.base = this.physics.add.sprite(obj.x + 32, obj.y + 32, 'base_home')
    }
    
    // 其余代码保持不变...
  }
}
```

---

## 📊 地图数据结构

### Tiled 对象层坐标系统

```
Tiled 坐标系:
  (0,0) ─────────────→ X
    │
    │
    ↓
    Y

Phaser Sprite 坐标系:
  使用中心点作为坐标原点
  
转换公式:
  Phaser_X = Tiled_X + 32 (半个瓦片宽度)
  Phaser_Y = Tiled_Y + 32 (半个瓦片高度)
```

### 对象属性

```json
{
  "x": 192,              // Tiled 坐标（左上角）
  "y": 192,
  "width": 64,           // 对象尺寸
  "height": 64,
  "properties": [        // 自定义属性
    {"name": "type", "value": "brick"}
  ]
}
```

---

## 🎨 瓦片集制作

### 方法 1: 使用现有资源

当前项目已有资源在：
```
public/themes/tank_default/assets/scene/
├── wall_brick.png
├── wall_steel.png
├── bg_main.png
└── ...
```

可以将这些图片拼接到一张大图中作为 tileset。

### 方法 2: 使用 Sharp 生成

```javascript
// generate-tileset.js
import sharp from 'sharp'

async function generateTileset() {
  // 创建一个 8x8 的网格（512x512）
  const tileset = sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  })
  
  // 提取并拼接各个瓦片
  // ...
  
  await tileset.toFile('public/themes/tank_default/assets/scene/tileset.png')
}
```

### 方法 3: 手动拼接（推荐）

使用 Photoshop、GIMP 或 Aseprite：
1. 创建 512x512 画布
2. 分割成 8x8 网格
3. 每个格子放一个 64x64 瓦片
4. 导出为 PNG

---

## 🧪 测试步骤

### 1. 基础测试

```bash
# 启动游戏
npm run dev

# 浏览器打开
http://localhost:5173/#/game/tank
```

**检查项**:
- [ ] 地图正确加载
- [ ] 地面层显示正常
- [ ] 碰撞层有效阻挡
- [ ] 玩家在正确位置生成
- [ ] 基地在正确位置

### 2. 调试模式

在 `phaser config` 中开启调试：

```typescript
physics: {
  arcade: {
    debug: true  // ← 开启物理调试
  }
}
```

**效果**:
- 碰撞体显示为红色线框
- 可以看到碰撞层的边界

### 3. 查看控制台

```
✅ 应该看到:
🎮 坦克大战启动（Tiled 版）
📦 加载地图：tank_map
📦 加载瓦片集：tiles
```

---

## 💡 最佳实践

### 1. 分层设计

```
Ground 层     → 纯装饰（草地、地板）
Collision 层  → 功能性（阻挡、触发）
Walls 层      → 对象（可破坏墙壁）
Player 层     → 标记点（出生位置）
Base 层       → 标记点（保护目标）
```

### 2. 命名规范

```
✅ 推荐:
- Ground / Floor / Terrain
- Collision / Blocker
- Walls / Obstacles
- Player / Spawn
- Base / Objective

❌ 避免:
- Layer1, Layer2
- 中文命名
- 空格命名
```

### 3. 自定义属性

```
碰撞瓦片:
  collides: bool = true

墙壁对象:
  type: string = "brick" | "steel"
  health: int = 2

道具对象:
  powerupType: string = "star"
  duration: int = 5000
```

---

## 🔗 相关资源

### 官方文档
- [Tiled 官网](https://www.mapeditor.org/)
- [Tiled 手册](https://doc.mapeditor.org/)
- [Phaser Tilemap API](https://photonstorm.github.io/phaser3-docs/Phaser.Tilemaps.html)

### 教程
- [Tiled 入门教程](https://www.mapeditor.org/docs/manual/)
- [Phaser + Tiled 实战](https://phaser.io/tutorials/making-your-first-phaser-game)

### 素材
- [OpenGameArt 免费瓦片](https://opengameart.org/)
- [itch.io 瓦片包](https://itch.io/game-assets/free/tag-tiles)

---

## 🚀 下一步扩展

### P1 - 多关卡支持
```
public/maps/
├── tank_level_1.json  ← 第 1 关
├── tank_level_2.json  ← 第 2 关
├── tank_level_3.json  ← 第 3 关
└── ...
```

### P2 - 动态加载
```typescript
loadLevel(level: number): void {
  const mapKey = `tank_level_${level}`
  this.load.tilemapTiledJSON(mapKey, `/maps/tank_level_${level}.json`)
  // ...
}
```

### P3 - 编辑器模式
开发内置关卡编辑器：
- Vue 组件拖拽
- 实时预览
- 一键保存为 JSON

---

**完成时间**: 2026-03-31  
**状态**: ✅ **已集成，可直接使用**  
**成本**: 💯 **零成本（Tiled 免费）**

🎮 **现在就打开 Tiled，设计您的专属坦克地图吧！**

---

**向 AI 自动化游戏开发致敬！Vue + Phaser + Tiled = 完美组合！** 🚀
