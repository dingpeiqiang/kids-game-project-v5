# 🤖 AI 开发指南 — 游戏模板

> **你是 AI，这是你开发新游戏的唯一入口文档。请完整阅读后再动手。**

---

## 一、你的任务边界

### ✅ 你只能修改这 5 类文件

| 文件 | 说明 |
|------|------|
| `src/scenes/GameScene.ts` | ⭐ **唯一必须重写的文件**，游戏逻辑全部写在这里 |
| `src/config/GTRS.json` | 填写游戏的主题资源路径（图片、音频） |
| `src/config/difficulty.json` | 填写游戏的难度配置参数 |
| `src/config/game-config.json` | 填写游戏的基础参数（格子数、速度等） |
| `src/config/game.config.ts` | 填写游戏 ID、名称、API 地址 |

### ❌ 你绝对不能修改的文件（框架层，已锁定）

```
src/router/index.ts           ← 路由已配置好，不需要改
src/App.vue                   ← 全局布局，不需要改
src/main.ts                   ← 初始化逻辑，不需要改
src/views/StartView.vue       ← 首页已完整，不需要改
src/views/DifficultyView.vue  ← 难度选择已完整，不需要改
src/views/GameView.vue        ← 游戏界面已完整，不需要改
src/views/GameOverView.vue    ← 结束界面已完整，不需要改
src/stores/game.ts            ← 状态管理，不需要改
src/stores/audio.ts           ← 音效系统，不需要改
src/stores/theme.ts           ← 主题系统，不需要改
src/stores/settings.ts        ← 设置，不需要改
src/types/level.ts            ← 关卡系统类型，不需要改
src/utils/uiResponsive.ts     ← 响应式 UI，不需要改
src/utils/gtrs-validator.ts   ← 资源校验，不需要改
src/components/**             ← 所有 UI 组件，不需要改
```

> **规则**：如果你发现上述文件"似乎需要修改"，说明你的思路方向错了。
> 回到 `GameScene.ts`，用框架提供的接口解决问题。

---

## 二、GameScene.ts 开发规范

`GameScene.ts` 继承自 `Phaser.Scene`，框架已提供基础能力，你只需实现游戏逻辑。

### 必须实现的方法（抽象方法，不实现会报错）

```typescript
// 1. 创建游戏对象（必须实现）
protected abstract createGameObjects(): void

// 2. 游戏主循环（必须实现）
protected abstract gameLoop(time: number, delta: number): void

// 3. 游戏结束处理（必须实现）
protected abstract handleGameOver(): void
```

### 可选覆盖的方法

```typescript
// 预加载资源（有外部资源时覆盖）
preload(): void

// 创建场景后的额外初始化（覆盖时必须调用 super.create()）
create(): void

// 屏幕尺寸变化响应（覆盖时重新布局）
protected onResize(gameSize: Phaser.Structs.Size): void
```

### 框架提供的工具（直接调用，不需要自己实现）

```typescript
// ─── 分数 ────────────────────────────────────────────
this.addScore(points: number)      // 加分（自动触发关卡升级检测）
this.score                          // 当前分数（只读）

// ─── 暂停 ────────────────────────────────────────────
this.pauseGame()                    // 暂停
this.resumeGame()                   // 恢复
this.togglePause()                  // 切换
this.isPaused                       // 当前是否暂停

// ─── 游戏结束标记 ─────────────────────────────────────
this.isGameOver                     // 当前是否结束

// ─── 屏幕适配（initAdapt() 后可用） ─────────────────────
this.screenW / this.screenH         // 屏幕尺寸
this.cellSize                        // 格子像素大小
this.gridCols / this.gridRows       // 格子数（从 game-config.json 读取）
this.offsetX / this.offsetY         // 游戏区域左上角偏移

// ─── 坐标转换 ─────────────────────────────────────────
this.gridToPixel(col, row)          // 格子左上角像素坐标
this.gridToPixelCenter(col, row)    // 格子中心像素坐标
```

### 与 Vue 层通信协议（事件）

框架已监听这些事件，**不需要你手动处理 Vue 层**：

```typescript
this.game.events.emit('ready')           // 游戏就绪（create() 末尾框架自动发送）
this.game.events.emit('score', score)    // 分数变化（addScore() 自动发送）
this.game.events.emit('gameover', score) // 游戏结束（handleGameOver() 里调用）
this.game.events.emit('paused')          // 已暂停（pauseGame() 自动发送）
this.game.events.emit('resumed')         // 已恢复（resumeGame() 自动发送）
```

---

## 三、标准开发流程（5步）

### 第 1 步：填写游戏元信息

编辑 `src/config/game.config.ts`：

```typescript
export const GAME_CODE = 'my-puzzle'      // 游戏唯一 ID（与目录名一致）
export const GAME_NAME = '拼图游戏'
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'
```

### 第 2 步：配置难度参数

编辑 `src/config/difficulty.json`，定义 easy/normal/hard 三档：

```json
{
  "easy":   { "speed": 200, "gridCols": 15, "gridRows": 12, "description": "简单" },
  "normal": { "speed": 150, "gridCols": 20, "gridRows": 15, "description": "普通" },
  "hard":   { "speed": 100, "gridCols": 25, "gridRows": 18, "description": "困难" }
}
```

### 第 3 步：配置资源路径

编辑 `src/config/GTRS.json`，填写实际的图片/音频路径：

```json
{
  "resources": {
    "images": { "scene": [{ "id": "player", "src": "/images/my-puzzle/player.png" }] },
    "audio":  { "bgm": [], "effect": [] }
  }
}
```

> 资源文件放在 `public/images/{gameId}/` 和 `public/audio/{gameId}/`

### 第 4 步：实现 GameScene.ts（核心工作）

```typescript
import GameScene from '@/scenes/GameScene'

export default class MyGameScene extends GameScene {

  // ─── 你的游戏对象 ──────────────────────────────────────────────
  private player!: Phaser.GameObjects.Image
  // ...

  preload(): void {
    this.load.image('player', '/images/my-puzzle/player.png')
  }

  create(): void {
    super.create()          // ⚠️ 必须调用，初始化框架基础功能
    // 初始化你的游戏逻辑...
  }

  // ✅ 必须实现：创建游戏对象
  protected createGameObjects(): void {
    const pos = this.gridToPixelCenter(5, 5)
    this.player = this.add.image(pos.x, pos.y, 'player')
  }

  // ✅ 必须实现：游戏主循环
  protected gameLoop(time: number, delta: number): void {
    // 每帧调用，delta 单位毫秒
    // this.updatePlayer(delta)
    // this.checkCollisions()
  }

  // ✅ 必须实现：游戏结束
  protected handleGameOver(): void {
    if (this.isGameOver) return
    this.isGameOver = true
    // 播放结束动画...
    this.time.delayedCall(500, () => {
      this.game.events.emit('gameover', this.score)
    })
  }
}
```

### 第 5 步：注册到 PhaserGame.vue（如需替换场景）

`PhaserGame.vue` 默认引用 `GameScene`。如果你新建了子类（如 `MyGameScene`），
需要修改 `src/components/game/PhaserGame.vue` 中的 scene 引用：

```typescript
// src/components/game/PhaserGame.vue
import MyGameScene from '@/scenes/MyGameScene'  // 改为你的子类
// ...
scene: [MyGameScene]
```

---

## 四、关卡系统说明

框架内置 20 关，**你不需要实现关卡逻辑**，框架自动处理：

- `this.addScore(points)` → 自动检测是否升关 → 自动触发 LevelTransitionOverlay 动画
- 每关的速度/障碍物/分数要求见 `src/types/level.ts`

如果你的游戏有自定义关卡逻辑，在 `gameLoop()` 中自行判断，然后调用：

```typescript
const gameStore = useGameStore()
gameStore.checkLevelUp()  // 手动触发关卡检测
```

---

## 五、音效使用

框架内置 WebAudio 合成音效，无需外部音频文件：

```typescript
import { useAudioStore } from '@/stores/audio'

const audio = useAudioStore()
audio.playClickSound()   // 点击音
audio.playWinSound()     // 胜利音
audio.playDieSound()     // 失败音
audio.playEatSound()     // 吃到物品音
```

---

## 六、常见错误与解决

| 错误现象 | 原因 | 解决 |
|----------|------|------|
| 游戏界面空白 | `createGameObjects()` 未调用 `initAdapt()` | 确保 `super.create()` 已调用 |
| 分数不更新 | 直接修改 `this.score` | 改用 `this.addScore(points)` |
| 暂停无效 | 自己管理了暂停状态 | 使用 `this.isPaused` + `this.pauseGame()` |
| 结束后无法返回 | 没有 emit 'gameover' | 在 `handleGameOver()` 末尾加 `this.game.events.emit('gameover', this.score)` |
| 屏幕适配错乱 | 覆盖了 `create()` 但未调 `super.create()` | 在覆盖的 `create()` 第一行加 `super.create()` |
| TypeScript 报错 | 抽象方法未实现 | 确认三个 `abstract` 方法都已实现 |

---

## 七、数据库注册

游戏开发完成、本地验证通过后，执行 `register-game.sql` 将游戏注册到平台数据库。

### t_game 关键字段说明

游戏信息存储在 **`t_game`** 表（不是 `game` 表）：

| 字段 | 必填 | 说明 | 示例 |
|------|------|------|------|
| `game_code` | ✅ | 游戏唯一编码，与目录名一致 | `puzzle` |
| `game_name` | ✅ | 游戏名称 | `拼图游戏` |
| `game_url` | ✅ | 游戏访问地址（独立部署 URL）| `http://localhost:5173` |
| `category` | ✅ | 分类：`MATH`/`LANGUAGE`/`SCIENCE`/`ART`/`PUZZLE` | `PUZZLE` |
| `grade` | ✅ | 适龄阶段 | `一年级`、`3-6岁` |
| `description` | ✅ | 游戏描述 | |
| `tags` | - | 标签，逗号分隔 | `益智,休闲` |
| `icon_url` | - | 图标 URL（可为 NULL）| |
| `cover_url` | - | 封面 URL（可为 NULL）| |
| `resource_url` | - | 资源 CDN 地址（可为 NULL）| |
| `game_config` | - | 透传给游戏的 JSON 配置（可为 NULL）| |
| `module_path` | - | 前端嵌入模式路径（独立部署填 NULL）| |
| `creator_id` | - | 创建人用户 ID（可为 NULL）| |
| `status` | ✅ | `0`=草稿，`2`=已上架（初始填 0，测试后改 2）| |
| `publish_time` | - | 上架时间，毫秒时间戳（上架时自动填入）| |
| `create_time`/`update_time` | - | 毫秒时间戳（`UNIX_TIMESTAMP(NOW()) * 1000`）| |
| `deleted` | ✅ | 逻辑删除，插入时填 `0` | |

> ⚠️ **已废弃字段**：`total_play_count`、`total_play_duration`、`average_rating` 已移至 `t_game_statistics` 表，**INSERT 时不要包含这些字段**。

### theme_info 主题表说明

主题表是 **`theme_info`**（不是 `t_theme_info`），时间字段是 **`DATETIME`** 类型（不是毫秒时间戳）：

| 字段 | 说明 |
|------|------|
| `owner_type` | 固定填 `'GAME'` |
| `owner_id` | 对应 `t_game.game_id` |
| `status` | `'on_sale'`=上架，`'offline'`=下架，`'pending'`=待审核 |
| `config_json` | 完整的 GTRS v1.0.0 JSON（从 `src/config/GTRS.json` 复制）|
| `created_at`/`updated_at` | 填 `NOW()`（DATETIME，不是时间戳）|

### 执行步骤

1. 打开 `register-game.sql`
2. 替换必填占位符：`__GAME_CODE__`、`__GAME_NAME__`、`__GAME_URL__`、`__CATEGORY__`、`__GRADE__`、`__DESCRIPTION__`
3. 在 MySQL 客户端**分步执行**（先看第 2 步的 game_id，再决定后续）
4. 游戏测试通过后执行上架语句（脚本第 5 步）：
   ```sql
   UPDATE t_game
   SET status = 2, publish_time = UNIX_TIMESTAMP(NOW()) * 1000, update_time = UNIX_TIMESTAMP(NOW()) * 1000
   WHERE game_code = '__GAME_CODE__' AND deleted = 0;
   ```

### 绑定主题（可选）

取消 `register-game.sql` 中第 3、4 步的注释，将 `src/config/GTRS.json` 内容压缩填入 `__GTRS_JSON__` 后执行。  
查询已有主题：
```sql
SELECT theme_id, theme_name FROM theme_info WHERE owner_type = 'GAME' AND owner_id = @game_id;
```
