# Kids Game Framework 模板

本目录包含创建新游戏时所需的模板文件。

## 模板文件

| 文件 | 说明 | 使用方法 |
|------|------|----------|
| `register-game.sql` | 游戏数据库注册 SQL | 复制到游戏目录，替换变量后执行 |
| `GTRS.json` | GTRS 主题资源模板 | 复制到游戏主题目录，替换占位符 |

---

## 快速开始

### 1. 创建游戏注册 SQL

```bash
# 复制模板
cp templates/register-game.sql games/my-game/register-game.sql

# 编辑文件，替换以下变量：
# {{GAME_CODE}}      - 游戏代码，如 MY_GAME
# {{GAME_NAME}}      - 游戏中文名
# {{GATEGORY}}       - 分类
# {{DESCRIPTION}}    - 游戏简介
# ... 其他参数
```

### 2. 创建游戏主题

```bash
# 复制 GTRS 模板
cp templates/GTRS.json games/my-game/public/themes/default/GTRS.json

# 编辑 GTRS.json：
# 1. 替换 {{THEME_NAME}} 为实际主题名
# 2. 替换资源占位符为实际 key（如 {{BGM_MAIN}} -> bgm_menu）
# 3. 放入实际资源文件到对应目录
```

---

## 游戏项目结构

使用框架创建的新游戏应遵循以下结构：

```
games/
└── my-game/
    ├── public/
    │   └── themes/
    │       └── default/
    │           ├── GTRS.json
    │           ├── audio/
    │           │   ├── bgm_main.mp3
    │           │   └── ...
    │           └── images/
    │               ├── scene/
    │               └── icon/
    │
    ├── src/
    │   ├── components/
    │   │   ├── game/
    │   │   │   └── MyGame.vue      # 游戏主组件
    │   │   └── ui/
    │   ├── stores/
    │   │   └── game.ts            # 游戏状态 store
    │   ├── types/
    │   │   └── game.ts            # 游戏类型定义
    │   ├── utils/
    │   │   └── ...
    │   ├── views/
    │   │   ├── StartView.vue      # 开始页面
    │   │   └── GameOverView.vue   # 结束页面
    │   ├── router/
    │   │   └── index.ts
    │   ├── App.vue
    │   └── main.ts
    │
    ├── register-game.sql          # 数据库注册脚本
    ├── package.json
    ├── vite.config.ts
    └── tsconfig.json
```

---

## 主题资源结构说明

### GTRS.json 结构

```json
{
  "specMeta": {           // 规范元数据
    "specName": "GTRS",
    "specVersion": "1.0.0"
  },
  "globalStyle": {        // 全局样式
    "primaryColor": "#4ade80",
    "bgColor": "#1a1a2e"
  },
  "resources": {          // 资源定义
    "audio": {
      "bgm": {},          // 背景音乐
      "effect": {},       // 音效
      "voice": {}        // 语音
    },
    "images": {
      "scene": {},        // 场景图
      "effect": {},       // 特效图
      "icon": {},         // 图标
      "ui": {},           // UI 图
      "login": {}         // 登录图
    },
    "video": {}
  }
}
```

### 资源 key 命名规范

- **音频 (audio)**:
  - BGM: `bgm_{场景}`，如 `bgm_menu`, `bgm_gameplay`, `bgm_gameover`
  - 音效: `effect_{事件}`，如 `effect_click`, `effect_hit`, `effect_score`

- **图片 (images)**:
  - 场景: `{类型}_{名称}`，如 `player_hero`, `enemy_monster`, `food_apple`
  - 背景: `bg_{类型}`，如 `bg_main`, `bg_level1`
  - UI: `ui_{名称}`，如 `ui_button`, `ui_panel`

---

## SQL 模板变量说明

| 变量 | 说明 | 示例值 |
|------|------|--------|
| `{{GAME_CODE}}` | 游戏代码（大写） | `SNAKE`, `TETRIS` |
| `{{GAME_NAME}}` | 游戏中文名 | `贪吃蛇`, `俄罗斯方块` |
| `{{CATEGORY}}` | 分类 | `puzzle`, `action`, `arcade` |
| `{{DESCRIPTION}}` | 简介 | `经典贪吃蛇游戏...` |
| `{{SORT_ORDER}}` | 排序 | `1`, `5`, `10` |
| `{{CONSUME_POINTS}}` | 每分钟消耗 | `1`, `2` |
| `{{GAME_PATH}}` | 目录路径 | `snake-vue3` |
| `{{GRID_WIDTH}}` | 区域宽度 | `30` |
| `{{GRID_HEIGHT}}` | 区域高度 | `20` |
| `{{CELL_SIZE}}` | 格子大小 | `20` |
| `{{EASY_SPEED}}` | 简单速度 | `150` |
| `{{NORMAL_SPEED}}` | 普通速度 | `100` |
| `{{HARD_SPEED}}` | 困难速度 | `60` |
| `{{ENABLE_TOUCH}}` | 触摸控制 | `1` |
| `{{ENABLE_KEYBOARD}}` | 键盘控制 | `1` |

---

## 使用框架 UI 组件

创建游戏时可以直接使用框架提供的 UI 组件：

```vue
<script setup lang="ts">
import { 
  StartView, 
  GameOverView, 
  GameContainer,
  DifficultySelector,
  type DifficultyConfig 
} from '@kids-game/framework'

// 难度配置
const difficultyConfig: DifficultyConfig = {
  levels: [
    { id: 'easy', name: 'Easy', nameCN: '简单', params: { speed: 150 } },
    { id: 'normal', name: 'Normal', nameCN: '普通', params: { speed: 100 } },
    { id: 'hard', name: 'Hard', nameCN: '困难', params: { speed: 60 } }
  ],
  defaultId: 'normal'
}
</script>

<template>
  <!-- 开始页面 -->
  <StartView 
    game-name="我的游戏"
    :high-score="100"
    @start="handleStart"
  >
    <template #title>
      <h1>🎮 我的游戏</h1>
    </template>
  </StartView>

  <!-- 游戏容器 -->
  <GameContainer
    :status="gameStatus"
    :score="score"
    :high-score="highScore"
    @input="handleInput"
  >
    <template #game>
      <!-- Phaser 画布 -->
    </template>
  </GameContainer>

  <!-- 结束页面 -->
  <GameOverView
    :score="score"
    :high-score="highScore"
    :is-new-record="isNewRecord"
    @replay="handleReplay"
    @home="handleHome"
  />
</template>
```
