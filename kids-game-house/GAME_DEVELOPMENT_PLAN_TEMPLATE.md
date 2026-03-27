# 🎮 通用游戏开发 Plan 模式模板

**版本**: v1.0.0  
**日期**: 2026-03-27  
**适用范围**: 所有儿童游戏平台的新游戏开发  
**遵循规范**: 游戏开发三阶段流程规范 🔴

---

## 📋 目录

1. [使用说明](#使用说明)
2. [第一阶段：设计与 GTRS 资源规范](#第一阶段设计与-gtrs-资源规范)
3. [第二阶段：资源生成与配置](#第二阶段资源生成与配置)
4. [第三阶段：代码实现与适配](#第三阶段代码实现与适配)
5. [验收清单](#验收清单)
6. [模板示例](#模板示例)

---

## 使用说明

### 适用场景

✅ **新游戏开发**: 从零开始创建新游戏  
✅ **游戏移植**: 将现有游戏移植到平台  
✅ **主题定制**: 为已有游戏创建新主题  

---

### 核心原则

🔴 **严格遵循三阶段顺序**:

```
第一阶段（设计） → 第二阶段（资源） → 第三阶段（代码）
     ↓                    ↓                  ↓
  输出文档           生成资源            代码实现
  GTRS 定义          文件配置            功能适配
```

⚠️ **禁止跨阶段**: 未完成前一阶段前，不得进入下一阶段

---

### 预计时间

| 阶段 | 预计时间 | 主要任务 |
|------|---------|---------|
| 第一阶段 | 2-3 天 | 设计文档 + GTRS 规范 |
| 第二阶段 | 3-5 天 | 资源制作 + 生成 + 校验 |
| 第三阶段 | 5-10 天 | 代码实现 + 测试 + 优化 |
| **总计** | **10-18 天** | **完整开发流程** |

---

## 第一阶段：设计与 GTRS 资源规范

### 🎯 阶段目标

- ✅ 明确游戏玩法规则
- ✅ 定义技术实现方案
- ✅ 制定 GTRS 资源规范
- ✅ 输出完整设计文档

---

### 📝 任务清单

#### 任务 1.1: 游戏概念设计

**输入**: 游戏创意/需求  
**输出**: 游戏概念文档

**检查清单**:
- [ ] 游戏名称（中文 + 英文 Code）
- [ ] 游戏类型（ACTION/PUZZLE/STRATEGY 等）
- [ ] 目标用户年级
- [ ] 核心玩法描述（100-200 字）
- [ ] 游戏特色亮点（3-5 点）
- [ ] 参考游戏（如有）

**AI 辅助指令**:
```
请帮我设计一个儿童游戏，要求：
1. 类型：[填写类型]
2. 目标年龄：[填写年级]
3. 教育目标：[如：训练反应能力]
4. 参考游戏：[可选]

请输出完整的游戏概念设计。
```

---

#### 任务 1.2: 游戏规则设计

**输入**: 游戏概念  
**输出**: 游戏规则详细说明

**检查清单**:
- [ ] 玩家控制方式（键盘/触摸/鼠标）
- [ ] 游戏目标（胜利条件）
- [ ] 失败条件
- [ ] 得分规则
- [ ] 游戏难度分级（简单/中等/困难）
- [ ] 特殊机制（道具、技能、关卡等）

**AI 辅助指令**:
```
基于以下游戏概念，请设计详细的游戏规则：
[粘贴游戏概念]

请包含：
1. 控制方式
2. 胜负条件
3. 得分规则
4. 难度设计
```

---

#### 任务 1.3: 技术架构设计

**输入**: 游戏规则  
**输出**: 技术实现方案

**检查清单**:
- [ ] Phaser 场景划分（Scene 列表）
- [ ] 核心游戏对象（GameObject 列表）
- [ ] 物理引擎需求（Arcade/Matter.js）
- [ ] 碰撞检测逻辑
- [ ] 数据存储方案（localStorage/Pinia）
- [ ] 音频需求列表（BGM + SFX）

**AI 辅助指令**:
```
基于以下游戏规则，请设计 Phaser 3 技术实现方案：
[粘贴游戏规则]

请包含：
1. Scene 划分（BootScene, GameScene, UIScene 等）
2. 核心 GameObject 列表
3. 物理引擎选择
4. 碰撞检测逻辑
```

---

#### 任务 1.4: GTRS 资源规范定义 ⭐

**输入**: 技术架构  
**输出**: GTRS 资源配置 JSON

**检查清单**:
- [ ] specMeta（规范元信息）
- [ ] themeInfo（主题基础信息）
- [ ] globalStyle（全局样式定义）
- [ ] resources.images.scene（场景资源）
- [ ] resources.images.sprite（精灵动画）
- [ ] resources.images.effect（特效资源）
- [ ] resources.images.icon（图标资源）
- [ ] resources.audio.bgm（背景音乐）
- [ ] resources.audio.effect（音效）
- [ ] Schema 校验通过

**GTRS 配置模板**:

```json
{
  "specMeta": {
    "specName": "GTRS",
    "specVersion": "1.0.0",
    "compatibleVersion": "1.0.0"
  },
  "themeInfo": {
    "themeId": "${GAME_ID}_default",
    "gameId": "${GAME_ID}",
    "themeName": "${游戏名称}默认主题",
    "isDefault": true,
    "author": "系统管理员",
    "description": "${游戏描述}"
  },
  "globalStyle": {
    "primaryColor": "${主色调}",
    "secondaryColor": "${辅助色}",
    "bgColor": "${背景色}",
    "textColor": "${文字颜色}"
  },
  "resources": {
    "images": {
      "scene": {
        "scene_bg_main": {
          "src": "/themes/${theme_id}/images/scene/bg_main.png",
          "type": "image/png",
          "alias": "主背景"
        }
      },
      "sprite": {
        "sprite_player": {
          "src": "/themes/${theme_id}/images/sprite/player.png",
          "type": "image/png",
          "alias": "玩家角色"
        }
      },
      "effect": {
        "effect_${name}": {
          "src": "/themes/${theme_id}/images/effect/${name}.png",
          "type": "image/png",
          "alias": "${特效名称}"
        }
      },
      "icon": {
        "icon_${name}": {
          "src": "/themes/${theme_id}/images/icon/${name}.png",
          "type": "image/png",
          "alias": "${图标名称}"
        }
      }
    },
    "audio": {
      "bgm": {
        "bgm_main": {
          "src": "/themes/${theme_id}/audio/bgm_main.mp3",
          "volume": 0.6,
          "loop": true
        },
        "bgm_gameplay": {
          "src": "/themes/${theme_id}/audio/bgm_gameplay.mp3",
          "volume": 0.5,
          "loop": true
        }
      },
      "effect": {
        "sfx_${action}": {
          "src": "/themes/${theme_id}/audio/sfx_${action}.mp3",
          "volume": 0.8
        }
      }
    }
  }
}
```

**AI 辅助指令**:
```
基于以下技术架构，请生成完整的 GTRS 资源配置 JSON：
[粘贴技术架构]

要求：
1. 符合 GTRS v1.0.0 规范
2. 包含所有图片资源（scene/sprite/effect/icon）
3. 包含所有音频资源（BGM/SFX）
4. 通过 Schema 校验
```

---

#### 任务 1.5: 游戏注册 SQL 准备

**输入**: 游戏信息 + GTRS 配置  
**输出**: register-${GAME_CODE}.sql

**检查清单**:
- [ ] INSERT INTO t_game（游戏信息）
- [ ] INSERT INTO t_theme_info（默认主题）
- [ ] config_json 字段包含完整 GTRS 配置
- [ ] 验证查询 SQL
- [ ] 回滚 SQL（可选）

**SQL 模板**:

```sql
-- ============================================
-- ${游戏名称} 游戏注册 SQL 脚本
-- 说明：将游戏注册到数据库
-- 创建时间：${DATE}
-- ============================================

-- 1. 在游戏表中注册新游戏
INSERT INTO t_game (
    game_code,
    game_name,
    category,
    grade,
    icon_url,
    cover_url,
    description,
    game_url,
    module_path,
    status,
    sort_order,
    consume_points_per_minute,
    create_time,
    update_time
) VALUES (
    '${GAME_CODE}',              -- 游戏 Code
    '${游戏名称}',                -- 游戏名称
    '${CATEGORY}',               -- 类型
    '${GRADE}',                  -- 年级
    '/themes/${theme_id}/images/icon.png',  -- 图标
    '',                          -- 封面图
    '${游戏描述}',                -- 描述
    'http://localhost:${PORT}',  -- 端口号
    '/games/${game_id}',         -- 模块路径
    1,                           -- 状态：active
    ${SORT_ORDER},               -- 排序
    1,                           -- 每分钟消耗积分
    UNIX_TIMESTAMP() * 1000,
    UNIX_TIMESTAMP() * 1000
) ON DUPLICATE KEY UPDATE
    game_name = VALUES(game_name),
    category = VALUES(category),
    grade = VALUES(grade),
    icon_url = VALUES(icon_url),
    description = VALUES(description),
    game_url = VALUES(game_url),
    status = VALUES(status),
    sort_order = VALUES(sort_order),
    update_time = VALUES(update_time);

-- 2. 插入默认主题
INSERT INTO t_theme_info (
    theme_name, 
    author_id,
    author_name,
    owner_type,
    owner_id,
    price,
    status,
    thumbnail_url,
    description,
    config_json,
    download_count,
    total_revenue,
    created_at,
    updated_at
)
SELECT 
    '${主题名称}',
    1,
    '系统管理员',
    'GAME',
    (SELECT game_id FROM t_game WHERE game_code = '${GAME_CODE}'),
    0,
    'on_sale',
    NULL,
    '${主题描述}',
    '[粘贴完整 GTRS JSON]',
    0,
    0,
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM t_theme_info 
    WHERE theme_name = '${主题名称}' 
    AND owner_id = (SELECT game_id FROM t_game WHERE game_code = '${GAME_CODE}')
);

-- 3. 验证查询
SELECT 
    game_id AS '游戏 ID',
    game_code AS '游戏代码',
    game_name AS '游戏名称',
    category AS '类型',
    grade AS '年级',
    game_url AS '游戏 URL',
    status AS '状态'
FROM t_game
WHERE game_code = '${GAME_CODE}';

-- 4. 完成提示
SELECT '✅ ${游戏名称}游戏注册完成！' AS '执行结果';
```

---

### ✅ 第一阶段验收标准

**必须完成项**:
- [x] 游戏概念文档（≥500 字）
- [x] 游戏规则详细说明
- [x] 技术架构设计方案
- [x] GTRS 资源配置 JSON（通过 Schema 校验）
- [x] 游戏注册 SQL 脚本

**交付物清单**:
- 📄 GAME_DESIGN.md（游戏设计文档）
- 📄 GTRS_CONFIG.json（GTRS 配置文件）
- 📄 register-${GAME_CODE}.sql（注册 SQL 脚本）

---

## 第二阶段：资源生成与配置

### 🎯 阶段目标

- ✅ 按 GTRS 规范生成所有资源文件
- ✅ 资源配置到 public/themes 目录
- ✅ 通过自动化校验
- ✅ 准备部署

---

### 📝 任务清单

#### 任务 2.1: 目录结构创建

**操作**:

```bash
# 创建主题目录
mkdir -p public/themes/${theme_id}/{images,audio}

# 创建子目录
mkdir -p public/themes/${theme_id}/images/{scene,sprite,effect,icon}
mkdir -p public/themes/${theme_id}/audio/{bgm,sfx}
```

**检查清单**:
- [ ] 目录结构符合 GTRS 规范
- [ ] 权限设置正确（755）
- [ ] .gitignore 配置（忽略临时文件）

---

#### 任务 2.2: 图片资源生成

**输入**: GTRS 配置中的图片列表  
**输出**: PNG 图片文件

**检查清单**:
- [ ] scene_bg_main.png（主背景）
- [ ] sprite_player_*.png（玩家精灵）
- [ ] effect_*.png（特效图片）
- [ ] icon_*.png（图标）
- [ ] 所有图片为 PNG-24 格式
- [ ] 尺寸符合规范（2 的幂次方）
- [ ] 命名符合 GTRS 规范

**AI 辅助指令**:
```
请帮我生成以下游戏资源图片：
1. 主背景：1920x1080，${风格描述}
2. 玩家精灵：64x64，${外观描述}
3. ${其他资源}

要求：
- PNG-24 格式，透明背景
- 符合 GTRS 命名规范
- 色彩风格统一
```

**工具推荐**:
- 🎨 Aseprite（像素艺术）
- 🎨 Photoshop（专业设计）
- 🖼️ Sharp（Node.js 批量处理）

---

#### 任务 2.3: 音频资源生成

**输入**: GTRS 配置中的音频列表  
**输出**: MP3 音频文件

**检查清单**:
- [ ] bgm_main.mp3（主旋律）
- [ ] bgm_gameplay.mp3（游戏进行）
- [ ] sfx_*.mp3（音效）
- [ ] ⚠️ **所有音频必须为 MP3 格式**
- [ ] BGM: 128kbps, 44.1kHz, 立体声
- [ ] SFX: 64kbps, 44.1kHz, 单/立体声
- [ ] 无 WAV/OGG/WEBM 格式

**AI 辅助指令**:
```
请帮我生成/转换以下音频资源：
1. 主旋律 BGM：${风格描述}，时长 2-3 分钟
2. 游戏进行 BGM：${风格描述}
3. ${音效名称}：${音效描述}

要求：
- MP3 格式（强制）
- BGM: 128kbps, 44.1kHz
- SFX: 64kbps, 44.1kHz
```

**转换命令**:
```bash
# WAV 转 MP3
ffmpeg -i input.wav -codec:a libmp3lame -b:a 128k output.mp3

# 批量转换
node scripts/batch-convert-audio.js themes/${theme_id}/
```

---

#### 任务 2.4: GTRS 配置文件生成

**输入**: 第一阶段的 GTRS_CONFIG.json  
**输出**: public/themes/${theme_id}/config.json

**操作**:

```bash
# 复制配置文件
cp GTRS_CONFIG.json public/themes/${theme_id}/config.json
```

**检查清单**:
- [ ] config.json 复制到正确位置
- [ ] JSON 格式正确（无语法错误）
- [ ] 所有资源路径指向正确
- [ ] 通过 Schema 校验

**校验命令**:
```bash
# Schema 校验
node scripts/validate-gtrs-schema.js public/themes/${theme_id}/config.json

# 资源完整性检查
node scripts/check-resources-existence.js public/themes/${theme_id}/

# 音频格式检查
node scripts/check-audio-format.js public/themes/${theme_id}/
```

---

#### 任务 2.5: 资源完整性校验

**检查清单**:

| # | 检查项 | 检查方法 | 预期结果 | 状态 |
|---|--------|---------|---------|------|
| 2.5.1 | GTRS Schema 校验 | Ajv 验证 | valid=true | ☐ |
| 2.5.2 | 所有图片存在 | 文件检查 | 100% 存在 | ☐ |
| 2.5.3 | 所有音频存在 | 文件检查 | 100% 存在 | ☐ |
| 2.5.4 | 音频格式为 MP3 | 扩展名检查 | 100% .mp3 | ☐ |
| 2.5.5 | 命名符合规范 | 正则匹配 | 100% 合规 | ☐ |
| 2.5.6 | 文件大小合理 | 统计检查 | 无超大文件 | ☐ |

**自动化校验脚本**:

```bash
#!/bin/bash
# validate-theme.sh

THEME_ID=$1

echo "🔍 开始资源校验..."

# 1. Schema 校验
echo "1. GTRS Schema 校验..."
node scripts/validate-gtrs-schema.js public/themes/${THEME_ID}/config.json
if [ $? -ne 0 ]; then
    echo "❌ Schema 校验失败"
    exit 1
fi

# 2. 资源存在性检查
echo "2. 资源完整性检查..."
node scripts/check-resources-existence.js public/themes/${THEME_ID}/
if [ $? -ne 0 ]; then
    echo "❌ 资源缺失"
    exit 1
fi

# 3. 音频格式检查
echo "3. 音频格式检查..."
node scripts/check-audio-format.js public/themes/${THEME_ID}/
if [ $? -ne 0 ]; then
    echo "❌ 音频格式不符合 MP3 要求"
    exit 1
fi

# 4. 命名规范检查
echo "4. 命名规范检查..."
node scripts/check-resource-naming.js public/themes/${THEME_ID}/
if [ $? -ne 0 ]; then
    echo "❌ 命名不规范"
    exit 1
fi

echo "✅ 所有校验通过！"
```

---

### ✅ 第二阶段验收标准

**必须完成项**:
- [x] 所有图片资源生成并放置到位
- [x] 所有音频资源生成并转换为 MP3
- [x] config.json 配置正确
- [x] 通过所有自动化校验（Schema/完整性/格式/命名）

**交付物清单**:
- 📁 public/themes/${theme_id}/images/（图片资源）
- 📁 public/themes/${theme_id}/audio/（音频资源）
- 📄 public/themes/${theme_id}/config.json（GTRS 配置）
- 📄 VALIDATION_REPORT.md（校验报告）

---

## 第三阶段：代码实现与适配

### 🎯 阶段目标

- ✅ 基于框架实现游戏逻辑
- ✅ 集成 GTRS 主题系统
- ✅ 通过所有测试验证
- ✅ 准备上线发布

---

### 📝 任务清单

#### 任务 3.1: 项目骨架搭建

**操作**:

```bash
# 从模板克隆游戏
cp -r games/template games/${GAME_ID}

# 或使用框架创建
cd kids-game-house
npm create game ${GAME_ID}
```

**检查清单**:
- [ ] 目录结构正确
- [ ] package.json 配置（游戏名称、端口）
- [ ] tsconfig.json（TypeScript 配置）
- [ ] vite.config.ts（构建配置）
- [ ] .env（环境变量）

**AI 辅助指令**:
```
请帮我基于游戏框架创建 ${GAME_NAME} 的项目骨架：
1. 游戏 ID: ${GAME_ID}
2. 游戏 Code: ${GAME_CODE}
3. 端口号：${PORT}

需要：
- 复制 template 目录
- 更新 package.json
- 更新配置文件
```

---

#### 任务 3.2: 游戏核心类实现

**输入**: 游戏规则 + 技术架构  
**输出**: 游戏核心逻辑代码

**检查清单**:
- [ ] 继承 GameEngine 基类
- [ ] 实现 preload() 资源预加载
- [ ] 实现 create() 场景创建
- [ ] 实现 update() 游戏循环
- [ ] 玩家控制逻辑
- [ ] 碰撞检测逻辑
- [ ] 得分系统
- [ ] 胜负判定

**代码模板**:

```typescript
// src/scenes/GameScene.ts
import { GameEngine } from '@kids-game/framework'

export class GameScene extends GameEngine {
  // 👉 游戏对象
  private player: Phaser.GameObjects.Sprite
  private enemies: Phaser.GameObjects.Sprite[] = []
  private score: number = 0
  
  // 👉 预加载资源
  protected preload(scene: Phaser.Scene): void {
    super.preload(scene)
    // 加载游戏特定资源
    this.load.image('player', 'games/${GAME_ID}/assets/player.png')
  }
  
  // 👉 创建场景
  protected create(scene: Phaser.Scene): void {
    super.create(scene)
    
    // 创建玩家
    this.player = scene.add.sprite(x, y, 'player')
    
    // 创建敌人
    this.createEnemies()
    
    // 设置碰撞
    this.setupCollisions()
    
    // 初始化分数
    this.score = 0
    this.updateScoreDisplay()
  }
  
  // 👉 游戏循环
  protected update(time: number, delta: number): void {
    super.update(time, delta)
    
    // 玩家移动
    this.handlePlayerMovement()
    
    // 碰撞检测
    this.checkCollisions()
  }
  
  // 👉 游戏特定方法
  private createEnemies(): void {
    // 实现敌人创建逻辑
  }
  
  private handlePlayerMovement(): void {
    // 实现玩家控制
  }
  
  private checkCollisions(): void {
    // 实现碰撞检测
  }
  
  private updateScoreDisplay(): void {
    // 更新分数显示
  }
}
```

**AI 辅助指令**:
```
请帮我实现 ${GAME_NAME} 的核心游戏逻辑：

游戏规则：
[粘贴游戏规则]

技术架构：
[粘贴技术架构]

要求：
1. 继承 GameEngine 基类
2. 实现 preload/create/update 方法
3. 包含玩家控制、碰撞检测、得分系统
4. 使用 TypeScript
```

---

#### 任务 3.3: GTRS 主题集成

**输入**: 第二阶段的 GTRS 配置  
**输出**: 主题加载与切换功能

**检查清单**:
- [ ] GTRSLoader 组件集成
- [ ] 主题从后端加载
- [ ] 资源动态加载
- [ ] 主题切换功能
- [ ] 降级处理（资源缺失时）

**代码示例**:

```typescript
// src/components/ThemeSelector.vue
<script setup lang="ts">
import { useThemeStore } from '@kids-game/framework/stores'

const themeStore = useThemeStore()

// 加载可用主题列表
await themeStore.loadAvailableThemes('${GAME_ID}')

// 切换主题
async function switchTheme(themeId: string) {
  await themeStore.switchTheme(themeId)
  // 重新加载游戏
  location.reload()
}
</script>
```

---

#### 任务 3.4: UI 组件实现

**检查清单**:
- [ ] 游戏主界面（GameUIOverlay）
- [ ] 分数显示组件
- [ ] 暂停菜单
- [ ] 游戏结束界面
- [ ] 难度选择界面
- [ ] 主题选择界面

**Vue 组件模板**:

```vue
<!-- src/components/GameUIOverlay.vue -->
<template>
  <div class="game-ui-overlay">
    <!-- 分数显示 -->
    <div class="score-display">
      <span>分数：{{ score }}</span>
    </div>
    
    <!-- 暂停按钮 -->
    <button @click="togglePause" class="pause-btn">
      {{ isPaused ? '继续' : '暂停' }}
    </button>
    
    <!-- 暂停菜单 -->
    <div v-if="isPaused" class="pause-menu">
      <button @click="resumeGame">继续游戏</button>
      <button @click="restartGame">重新开始</button>
      <button @click="quitGame">退出游戏</button>
    </div>
    
    <!-- 游戏结束界面 -->
    <div v-if="isGameOver" class="game-over">
      <h2>游戏结束</h2>
      <p>最终得分：{{ finalScore }}</p>
      <button @click="restartGame">再来一次</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useGameStore } from '@kids-game/framework/stores'

const gameStore = useGameStore()
const score = computed(() => gameStore.score)
const isPaused = ref(false)
const isGameOver = ref(false)
const finalScore = ref(0)

function togglePause() {
  isPaused.value = !isPaused.value
  gameStore.setPaused(isPaused.value)
}

function resumeGame() {
  isPaused.value = false
  gameStore.resume()
}

function restartGame() {
  gameStore.restart()
  isGameOver.value = false
}
</script>
```

---

#### 任务 3.5: 音频集成

**检查清单**:
- [ ] AudioManager 组件集成
- [ ] BGM 自动播放
- [ ] 音效触发播放
- [ ] 音量控制
- [ ] 静音功能

**代码示例**:

```typescript
// src/scenes/GameScene.ts
import { AudioManager } from '@kids-game/framework/components'

protected create(scene: Phaser.Scene): void {
  // ... 其他代码
  
  // 播放背景音乐
  const audioManager = new AudioManager(scene)
  audioManager.playBGM('bgm_main', { volume: 0.6, loop: true })
  
  // 播放音效（在事件中）
  this.events.on('player-eat-food', () => {
    audioManager.playSFX('sfx_eat', { volume: 0.8 })
  })
}
```

---

#### 任务 3.6: 数据持久化

**检查清单**:
- [ ] 最高分保存（localStorage）
- [ ] 游戏进度存档
- [ ] 用户设置保存
- [ ] 读档功能

**代码示例**:

```typescript
// src/utils/storage.ts
const STORAGE_KEY = '${GAME_ID}_save_data'

export interface SaveData {
  highScore: number
  unlockedLevels: number
  settings: {
    volume: number
    difficulty: string
  }
}

export function loadSaveData(): SaveData {
  const data = localStorage.getItem(STORAGE_KEY)
  return data ? JSON.parse(data) : getDefaultData()
}

export function saveSaveData(data: SaveData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

function getDefaultData(): SaveData {
  return {
    highScore: 0,
    unlockedLevels: 1,
    settings: {
      volume: 0.8,
      difficulty: 'medium'
    }
  }
}
```

---

#### 任务 3.7: 测试与调试

**检查清单**:
- [ ] 单元测试（Vitest）
- [ ] E2E 测试（Playwright）
- [ ] 性能测试（Lighthouse）
- [ ] 兼容性测试（多浏览器）
- [ ] AI 质量验证（83 项检查）

**测试命令**:

```bash
# 运行单元测试
npm run test:unit

# 运行 E2E 测试
npm run test:e2e

# 性能测试
npm run test:performance

# AI 质量验证
./ai-validation-workflow.sh ${GAME_ID}
```

---

#### 任务 3.8: 性能优化

**检查清单**:
- [ ] 首屏加载 < 3 秒
- [ ] 资源加载 < 5 秒
- [ ] FPS ≥ 60
- [ ] 内存占用 < 256MB
- [ ] 音频文件压缩
- [ ] 图片资源优化

**优化技巧**:

```typescript
// 1. 对象池复用
private createObjectPool(): void {
  this.enemiesPool = this.add.group({
    classType: Enemy,
    maxSize: 20,
    runChildUpdate: true
  })
}

// 2. 纹理图集
// 使用 TexturePacker 合并精灵图

// 3. 按需加载
protected async loadLevel(level: number): Promise<void> {
  // 只加载当前关卡所需资源
  const assets = await this.loadLevelAssets(level)
}
```

---

### ✅ 第三阶段验收标准

**必须完成项**:
- [x] 游戏核心功能完整实现
- [x] GTRS 主题正确集成
- [x] UI 组件齐全且美观
- [x] 音频系统正常工作
- [x] 通过所有自动化测试
- [x] AI 质量验证评分 ≥ 80 分

**交付物清单**:
- 📁 games/${GAME_ID}/（完整游戏代码）
- 📄 TEST_REPORT.md（测试报告）
- 📄 AI_VALIDATION_REPORT.md（AI 验证报告）
- 📄 DEPLOYMENT_GUIDE.md（部署指南）

---

## 验收清单

### 第一阶段验收（设计）

| # | 验收项 | 检查方法 | 状态 |
|---|--------|---------|------|
| 1.1 | 游戏概念文档完整 | 文档审查 | ☐ |
| 1.2 | 游戏规则详细清晰 | 逻辑审查 | ☐ |
| 1.3 | 技术架构合理可行 | 技术评审 | ☐ |
| 1.4 | GTRS 配置通过 Schema 校验 | 自动化校验 | ☐ |
| 1.5 | SQL 脚本可执行成功 | 数据库执行 | ☐ |

---

### 第二阶段验收（资源）

| # | 验收项 | 检查方法 | 状态 |
|---|--------|---------|------|
| 2.1 | 所有图片资源存在 | 文件检查 | ☐ |
| 2.2 | 所有音频为 MP3 格式 | 格式检查 | ☐ |
| 2.3 | 资源配置完整正确 | JSON 审查 | ☐ |
| 2.4 | 通过 GTRS Schema 校验 | 自动化校验 | ☐ |
| 2.5 | 资源命名符合规范 | 命名检查 | ☐ |

---

### 第三阶段验收（代码）

| # | 验收项 | 检查方法 | 状态 |
|---|--------|---------|------|
| 3.1 | 游戏功能完整实现 | 功能测试 | ☐ |
| 3.2 | GTRS 主题正常加载 | 集成测试 | ☐ |
| 3.3 | 性能指标达标 | 性能测试 | ☐ |
| 3.4 | 兼容性测试通过 | 多浏览器测试 | ☐ |
| 3.5 | AI 验证评分≥80 | AI 质量验证 | ☐ |

---

## 模板示例

### 完整示例：贪吃蛇游戏

#### 第一阶段输出

**文件**: `docs/GAME_DESIGN.md`

```markdown
# 贪吃蛇游戏设计文档

## 游戏概念
- **游戏名称**: 贪吃蛇
- **游戏 Code**: SNAKE
- **游戏类型**: ACTION
- **目标年级**: 三年级

## 核心玩法
控制蛇的方向，吃掉更多食物，挑战最高分！

## 游戏规则
1. 控制方式：方向键或 WASD
2. 胜利条件：无（挑战最高分）
3. 失败条件：蛇头撞到墙壁或自身
4. 得分规则：每吃一个食物得 10 分

## 技术架构
- Phaser 场景：BootScene, GameScene, UIScene
- 物理引擎：Arcade Physics
- 碰撞检测：圆形碰撞
```

**文件**: `GTRS_CONFIG.json`

```json
{
  "specMeta": {
    "specName": "GTRS",
    "specVersion": "1.0.0"
  },
  "themeInfo": {
    "themeId": "snake_default",
    "themeName": "贪吃蛇默认主题"
  },
  "resources": {
    "images": {
      "scene": {
        "scene_bg_main": {
          "src": "/themes/snake_default/images/scene/bg_main.png"
        }
      }
    }
  }
}
```

---

#### 第二阶段输出

**目录结构**:
```
public/themes/snake_default/
├── images/
│   ├── scene/bg_main.png
│   ├── sprite/player_head.png
│   └── food/apple.png
├── audio/
│   ├── bgm/bgm_main.mp3
│   └── sfx/sfx_eat.mp3
└── config.json
```

---

#### 第三阶段输出

**代码结构**:
```
games/snake/
├── src/
│   ├── scenes/
│   │   ├── BootScene.ts
│   │   ├── GameScene.ts
│   │   └── UIScene.ts
│   ├── components/
│   │   └── GameUIOverlay.vue
│   └── types/
│       └── snake.types.ts
├── package.json
└── README.md
```

---

### 快速启动模板

**Shell 脚本**:

```bash
#!/bin/bash
# create-new-game.sh

GAME_ID=$1
GAME_NAME=$2

echo "🎮 开始创建新游戏：$GAME_NAME"

# 第一阶段：设计
echo ""
echo "=== 第一阶段：设计与 GTRS 规范 ==="
mkdir -p docs
# AI 辅助生成设计文档...

# 第二阶段：资源
echo ""
echo "=== 第二阶段：资源生成 ==="
mkdir -p public/themes/${GAME_ID}/{images,audio}
# 生成资源...

# 第三阶段：代码
echo ""
echo "=== 第三阶段：代码实现 ==="
cp -r games/template games/${GAME_ID}
# 适配代码...

echo ""
echo "✅ 游戏创建完成！"
```

---

## 📞 常见问题

### Q: 可以跳过某个阶段吗？

**A**: ❌ **绝对不可以！** 三个阶段必须严格按顺序执行：
- 第一阶段未完成的 GTRS 定义，第二阶段无法生成资源
- 第二阶段资源未准备好，第三阶段代码无法测试
- 跨阶段会导致返工和质量问题

---

### Q: AI 可以在哪些环节辅助？

**A**: AI 可以在所有环节提供辅助：
- **第一阶段**: 生成设计文档、GTRS 配置、SQL 脚本
- **第二阶段**: 生成资源建议、转换音频、校验资源
- **第三阶段**: 生成代码框架、实现具体功能、编写测试

---

### Q: 如何评估游戏质量？

**A**: 使用 AI 质量验证工具：
```bash
./ai-validation-workflow.sh ${GAME_ID}
```
输出 83 项检查结果，综合评分 ≥ 80 分为合格。

---

**版本**: v1.0.0  
**最后更新**: 2026-03-27  
**维护者**: Sitech AI Team  
**状态**: ✅ 可立即使用，严格遵循三阶段流程规范！
