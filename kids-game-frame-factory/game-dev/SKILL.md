# game-dev - 儿童游戏开发指南

## 定位

这是一个游戏开发 Skill，帮你基于现有游戏快速创建新游戏。

**核心理念**：不要从零开始，参考真实游戏 + 修改参数 = 新游戏

**架构基础**：基于贪吃蛇游戏中的可复用框架代码（位于 `games/snake/src/components/`），包含：
- **核心层**：ResourceLoader、AdaptationManager、AudioManager 等
- **编排器**：GameOrchestrator 统一调度各组件
- **渲染层**：BackgroundRenderer、GridRenderer、ParticleRenderer 等

## 快速开始（6 步标准流程）

### 📋 完整开发流程

```
阶段 0 → 阶段 1 → 阶段 2 → 阶段 3 → 阶段 4 → 阶段 5
游戏设计   资源生成   游戏注册   编码实现   测试验证   优化迭代
```

---

### 🔴 阶段 0：游戏设计（必须先完成！）

**输出物**：
- ✅ 《游戏概念设计书》（1-2 页）
- ✅ 《游戏设计文档 (GDD)》（使用模板）
- ✅ 《设计评审记录》

**核心要求**：
- ✅ 玩法简单（一眼看懂，30 秒上手）
- ✅ 规则简单（不超过 5 条）
- ✅ 数值简单（整数计算）
- ✅ 内容轻量（单局 3-5 分钟）

**参考文档**：
- [网页小游戏设计指南](./docs/WEB_GAME_DESIGN_GUIDE.md) - 🎯 简单卡通解压
- [游戏设计模板](../../kids-game-house/docs/GAME_DESIGN_TEMPLATE.md)

**检查点**：
- [ ] GDD 已编写完成
- [ ] 已通过评审会议
- [ ] 所有人签字确认

---

### 🟠 阶段 1：资源生成（从 GDD 到资源）

**任务**：根据 GDD 生成游戏资源

**步骤**：
```bash
# 1. 进入工具目录
cd kids-game-house/tools/theme-resource-generator

# 2. 安装依赖
npm install

# 3. 从 GDD 自动生成资源
npm run generate -- \
  -g ../../games/my-game/GAME_DESIGN_DOCUMENT.md \
  -o ../../games/my-game/public/assets/themes/my-game \
  -t my-game-theme \
  -s cartoon
```

**输出**：
- ✅ 图片资源（PNG 格式）
- ✅ 音频资源（WAV/MP3 格式）
- ✅ GTRS.json 配置文件

**参考文档**：
- [高质量资源生成指南](./docs/RESOURCE_GENERATION_GUIDE.md)
- [资源生成脚本技术规范](../../kids-game-house/tools/theme-resource-generator/README.md)

**检查点**：
- [ ] 所有资源已生成到正确目录
- [ ] GTRS.json 配置正确
- [ ] 资源质量符合要求

---

### 🟡 阶段 2：游戏注册（数据库注册）

**任务**：将游戏注册到平台数据库

**步骤**：
```bash
# 1. 编写注册 SQL 脚本
vim register-game.sql

# 2. 执行注册（确保数据库存在）
mysql -u root -p kids_game < register-game.sql
```

**关键要点**：
- ✅ `status = 2`（已上架，前台可见）
- ✅ `game_url` 必须是完整 HTTP URL
- ✅ 必须包含 `USE kids_game` 语句

**参考文档**：
- [注册脚本编写规范](./docs/REGISTER_SCRIPT_SPECIFICATION.md) - ⚠️ 必读！
- [游戏注册 SQL 模板](./templates/register-game.template.sql)

**检查点**：
- [ ] SQL 脚本已编写
- [ ] 数据库注册成功
- [ ] 游戏在前台可见

---

### 🟢 阶段 3：编码实现（按设计实现）

**任务**：实现游戏特定逻辑

**核心步骤**：

#### 3.1 复制并重命名
```bash
# 1. 复制参考游戏
cp -r ../snake my-game
cd my-game

# 2. 重命名（避免贪吃蛇代码污染）
# - 修改 package.json
# - 全局替换 Snake → MyGame
# - 重命名 Vue 文件、Store、路由
```

#### 3.2 实现游戏逻辑
- ✅ 修改 `src/scenes/ComponentGameScene.ts`
- ✅ 实现 `src/logic/GameManager.ts`
- ✅ 实现 `src/control/InputHandler.ts`
- ✅ 修改 `src/ui/GameView.vue`

**参考文档**：
- [实现游戏逻辑](./docs/IMPLEMENT_GAME_LOGIC.md) - 🔥 最关键！
- [重命名检查清单](./docs/RENAME_CHECKLIST.md) - ⚠️ 避免污染

**检查点**：
- [ ] 所有贪吃蛇代码已替换
- [ ] 游戏逻辑已实现
- [ ] UI 组件已适配

---

### 🔵 阶段 4：测试验证（确保可用）

**任务**：全面测试游戏功能

**测试步骤**：
```bash
# 1. 启动开发服务器
npm run dev

# 2. 访问游戏
http://localhost:5173/games/my-game

# 3. 测试核心功能
- 游戏能否正常启动
- 控制是否流畅
- 分数系统是否正常
- 道具效果是否正常
- 难度选择是否正常
```

**测试清单**：
- [ ] 游戏可以正常启动
- [ ] 无控制台错误
- [ ] 所有功能正常工作
- [ ] 性能稳定（60 FPS）
- [ ] 多设备适配良好

**参考文档**：
- [测试指南](./docs/TESTING_GUIDE.md)
- [故障排查手册](./docs/TROUBLESHOOTING.md)

---

### 🟣 阶段 5：优化迭代（持续改进）

**任务**：根据测试反馈优化

**优化方向**：
- ✅ 性能优化（减少卡顿）
- ✅ 体验优化（操作更流畅）
- ✅ 视觉优化（画面更精美）
- ✅ 音效优化（配音更完整）

**持续迭代**：
- 收集用户反馈
- 修复发现的问题
- 添加新功能和内容
- 定期更新版本

---

### 📚 完整参考文档

**阶段 0 - 游戏设计**：
- [网页小游戏设计指南](./docs/WEB_GAME_DESIGN_GUIDE.md) - 🎯 简单卡通解压
- [游戏设计模板](../../kids-game-house/docs/GAME_DESIGN_TEMPLATE.md)
- [商用质量标准](./docs/COMMERCIAL_QUALITY_STANDARD.md) - （可选参考）

**阶段 1 - 资源生成**：
- [高质量资源生成指南](./docs/RESOURCE_GENERATION_GUIDE.md) - 🎨 使用专业工具
- [GTRS 资源配置规范](./docs/GTRS_GUIDE.md) - 📋 v1.0.0 标准
- [资源生成脚本技术规范](../../kids-game-house/tools/theme-resource-generator/README.md)

**阶段 2 - 游戏注册**：
- [注册脚本编写规范](./docs/REGISTER_SCRIPT_SPECIFICATION.md) - ⚠️ 必读！status=2/game_url 格式
- [游戏注册 SQL 模板](./templates/register-game.template.sql)
- [数据库配置修复指南](../../kids-game-house/games/plane-shooter/REGISTER_GAME_DB_FIX.md)

**阶段 3 - 编码实现**：
- [实现游戏逻辑](./docs/IMPLEMENT_GAME_LOGIC.md) - 🔥 最关键！避免还是贪吃蛇
- [重命名检查清单](./docs/RENAME_CHECKLIST.md) - ⚠️ 避免贪吃蛇代码污染
- [完整流程指南](./docs/FULL_WORKFLOW.md) - ⭐ 生成资源→注册→测试顺序

**阶段 4 - 测试验证**：
- [测试指南](./docs/TESTING_GUIDE.md) - 🧪 全面测试清单
- [故障排查手册](./docs/TROUBLESHOOTING.md) - 🔧 常见问题解决

**阶段 5 - 优化迭代**：
- [性能优化指南](./docs/PERFORMANCE_OPTIMIZATION.md)
- [用户体验优化](./docs/UX_OPTIMIZATION.md)

**综合文档**：
- [游戏开发指南](./docs/GAME_DEV_GUIDE.md) - 📖 完整的开发流程
- [项目结构说明](./PROJECT_STRUCTURE.md)
- [模板文件](./templates/) - 📝 可复用的配置模板

## 项目结构（三层架构）

```
my-game/
├── src/
│   ├── components/             # 组件目录
│   │   ├── core/               # 🔧 核心层（从 snake 复制，禁止修改）
│   │   │   ├── ResourceLoader.ts      # GTRS 资源加载
│   │   │   ├── AdaptationManager.ts   # 屏幕适配管理
│   │   │   └── AudioManager.ts        # 音频管理
│   │   ├── rendering/          # 🎨 渲染层（从 snake 复制，可扩展）
│   │   │   ├── BackgroundRenderer.ts  # 背景渲染
│   │   │   ├── GridRenderer.ts        # 网格渲染
│   │   │   └── ParticleRenderer.ts    # 粒子渲染
│   │   ├── game/               # 🎮 游戏编排
│   │   │   └── GameOrchestrator.ts    # 游戏编排器
│   │   ├── logic/              # 🧠 游戏逻辑层（需要修改）
│   │   │   ├── GameManager.ts         # 游戏管理器
│   │   │   └── CollisionSystem.ts     # 碰撞系统
│   │   ├── control/            # 🎛️ 控制层（需要修改）
│   │   │   └── InputHandler.ts        # 输入处理
│   │   └── ui/                 # 💎 UI 组件层（需要修改）
│   │       ├── StartView.vue          # 开始界面
│   │       ├── GameView.vue           # 游戏界面
│   │       └── GameOverView.vue       # 结束界面
│   ├── config/
│   │   ├── GTRS.json           # GTRS 资源配置
│   │   └── difficulty.json     # 难度配置
│   ├── phaser/                 # Phaser 游戏逻辑
│   │   ├── PhaserGame.ts       # 游戏主类
│   │   └── game.ts             # 游戏配置
│   ├── scenes/                 # Phaser 场景
│   │   └── ComponentGameScene.ts
│   └── stores/                 # Pinia 状态管理
├── register-game.sql           # 数据库注册
├── generate-resources.mjs      # 资源生成脚本
└── package.json
```

**架构说明**：
- **🔧 核心层**：所有游戏共用，从 snake 复制，禁止修改
- **🎨 渲染层**：通用渲染器，从 snake 复制，可按需扩展
- **🎮 编排层**：GameOrchestrator 统一调度
- **🧠 逻辑层**：每个游戏的特定业务逻辑，需要自己实现
- **💎 UI 层**：游戏特定的界面展示

## 关键开发指南

### 屏幕适配（4 层配合）

1. **index.html**: `viewport-fit=cover` + `env(safe-area-inset-*)` body padding
2. **App.vue**: `100vw × 100vh` + `overflow: hidden`
3. **GameView.vue**: `h-screen w-full overflow-hidden` + `touch-action: none`
4. **Phaser config**: `mode: RESIZE` + `width: '100%', height: '100%'`

### GTRS 资源规范（v1.0.0）

**4个顶级字段**：`specMeta` / `themeInfo` / `globalStyle` / `resources`

**资源结构**：
```json
{
  "resources": {
    "images": {
      "scene": { "background": "xxx.png" },
      "items": { "food": "xxx.png" }
    },
    "audio": {
      "bgm": { "main": "xxx.mp3" },
      "effect": { "eat": "xxx.mp3" }
    }
  }
}
```

### UI 缩放工具

使用 `useResponsiveUI()` 工具函数（设计基准 720×1280）：
```typescript
import { useResponsiveUI } from '@/utils/uiResponsive'

const { uiScaleRef } = useResponsiveUI()
```

### Pinia Store 集成

游戏 store 需要同时维护 Phaser 内部状态和 UI 状态：
- `gameStore`: 游戏核心状态（分数、生命、道具效果）
- 通过 `onScoreChange`、`onGameOver` 等回调与 Phaser 通信

### UI 组件使用

```vue
<GameButton 
  text="开始游戏" 
  :fontSize="26"
  :width="200"
  :height="60"
  @click="handleStart"
/>

<DifficultySelector 
  :difficulties="difficulties"
  v-model="selectedDifficulty"
/>
```

## 常见任务

### 创建新游戏（6 步精简版）

⚠️ **重要**: 在开始之前，必须先完成**设计先行阶段 0**（GDD 评审通过）！

🎯 **设计理念**: 网页小游戏 = 简单 + 卡通 + 解压
   - ✅ 玩法简单（一眼看懂，30 秒上手）
   - ✅ 规则简单（不超过 5 条，没有复杂系统）
   - ✅ 数值简单（整数计算，不要公式）
   - ✅ 内容轻量（单局 3-5 分钟，随时可停）
   - ✅ 画面卡通（圆润可爱，颜色鲜艳）
   - ✅ 音效轻松（清脆悦耳，不吵闹）

1. **复制参考游戏**
   ```bash
   cp -r ../snake my-game
   cd my-game
   ```

2. **重命名代码**（⚠️ 最关键步骤）
   - 修改 `package.json` 的 name 和 displayName
   - 全局替换 Snake → MyGame（除 core/、rendering/ 外）
   - 重命名 Vue 文件、Store、路由
   - 📋 **必须执行**: [完整重命名检查清单](./docs/RENAME_CHECKLIST.md)

3. **复制框架代码**（必须保留）
   ```bash
   cp -r ../snake/src/components/core ./src/components/
   cp -r ../snake/src/components/rendering/*.ts ./src/components/rendering/
   cp -r ../snake/src/components/game/GameOrchestrator.ts ./src/components/game/
   ```

4. **修改配置**（基础设置）
   - GTRS.json: gameId, gameName, themeName
   - difficulty.json: 难度参数
   - phaser/game.ts: 游戏规则（⚠️ 这只是框架，不是真实游戏逻辑）

5. **⚠️ 按设计实现游戏逻辑**（最关键！决定游戏内容）
   
   ⚠️ **问题根源**：如果你测试发现还是贪吃蛇，说明这一步没做！
   
   **必须完成的任务**：
   
   ### 5.1 修改 Phaser 游戏场景
   
   编辑 `src/scenes/ComponentGameScene.ts`（或你的游戏场景文件）：
   
   ```typescript
   // ❌ 错误：这里还是调用贪吃蛇的逻辑
   import { SnakeGameManager } from '../logic/SnakeGameManager';
   
   // ✅ 正确：使用你自己的游戏管理器
   import { MyGameManager } from '../logic/MyGameManager';
   
   export class ComponentGameScene extends Phaser.Scene {
     private gameManager: MyGameManager;
     
     create() {
       // ⚠️ 这里必须初始化你自己的游戏逻辑
       this.gameManager = new MyGameManager(this);
       this.gameManager.start();
     }
     
     update(time: number, delta: number) {
       // ⚠️ 每帧调用你的游戏逻辑
       if (this.gameManager) {
         this.gameManager.update(time, delta);
       }
     }
   }
   ```
   
   ### 5.2 实现游戏管理器
   
   创建 `src/logic/MyGameManager.ts`：
   
   ```typescript
   export class MyGameManager {
     private scene: Phaser.Scene;
     private player: Phaser.GameObjects.Sprite;
     private enemies: Phaser.GameObjects.Group;
     private bullets: Phaser.GameObjects.Group;
     
     constructor(scene: Phaser.Scene) {
       this.scene = scene;
     }
     
     start() {
       // ⚠️ 初始化你的游戏元素
       this.createPlayer();
       this.createEnemies();
       this.setupControls();
     }
     
     update(time: number, delta: number) {
       // ⚠️ 每帧更新游戏状态
       this.updatePlayer();
       this.updateEnemies();
       this.checkCollisions();
     }
     
     private createPlayer() {
       // TODO: 创建玩家（飞机、坦克、角色等）
     }
     
     private createEnemies() {
       // TODO: 创建敌人（敌机、僵尸、障碍物等）
     }
     
     private setupControls() {
       // TODO: 设置控制（触摸、键盘、鼠标）
     }
     
     private updatePlayer() {
       // TODO: 更新玩家位置、状态
     }
     
     private updateEnemies() {
       // TODO: 更新敌人 AI、移动
     }
     
     private checkCollisions() {
       // TODO: 碰撞检测（子弹击中、玩家受伤等）
     }
   }
   ```
   
   ### 5.3 修改 UI 组件
   
   编辑 `src/ui/GameView.vue`：
   
   ```vue
   <template>
     <div class="game-view">
       <!-- ⚠️ 这里显示的是你的游戏 UI，不是贪吃蛇的 -->
       <div class="score-panel">{{ score }}分</div>
       <div class="health-bar">生命：{{ health }}</div>
       <PhaserGame ref="phaserGame" />
     </div>
   </template>
   
   <script setup lang="ts">
   // TODO: 实现你的游戏 UI 逻辑
   const score = ref(0);
   const health = ref(3);
   </script>
   ```
   
   ### 5.4 检查清单（确保不是贪吃蛇）
   
   - [ ] **Phaser 场景**：是否调用了你自己的 GameManager？
   - [ ] **游戏管理器**：是否实现了你的游戏逻辑？
   - [ ] **玩家对象**：是蛇还是飞机/坦克/其他？
   - [ ] **敌对对象**：是食物还是敌人/障碍？
   - [ ] **控制方式**：是方向键还是射击/移动？
   - [ ] **碰撞规则**：是吃食物得分还是打敌人得分？
   - [ ] **UI 展示**：显示的是什么内容？
   
   ⚠️ **如果以上任何一项还是贪吃蛇的内容，说明你没改！**

6. **生成资源、注册与测试**（⚠️ 顺序很重要！）
   
   **步骤 6.1：生成 GTRS 资源**（⚠️ 关键！决定资源质量）
   
   ⚠️ **重要**：不要使用简单的 `generate-resources.mjs`（只能生成几何图形）！
   
   **推荐方案 A：使用专业工具**（高质量 ✅）
   ```bash
   # 进入工具目录
   cd kids-game-house/tools/theme-resource-generator
   
   # 从 GDD 自动生成高质量资源
   npm run generate -- \
     -g ../../games/plane-shooter/GAME_DESIGN_DOCUMENT.md \
     -o ../../games/plane-shooter/public/assets/themes/plane-shooter \
     -t plane-shooter-theme \
     -s cartoon  # cartoon/realistic/pixel/minimalist
   
   # ✅ 优势：
   # - 自动解析 GDD 中的资源需求
   # - 使用 Canvas 绘制高质量图片
   # - 严格校验，不允许降级方案
   # - 支持多种美术风格
   ```
   
   **备选方案 B：自定义脚本**（仅原型验证 ❌）
   ```bash
   # 仅当无法使用专业工具时
   cd kids-game-house/games/plane-shooter
   node generate-resources.mjs
   
   # ⚠️ 劣势：
   # - 只能生成简单几何图形
   # - 需要手动配置每个资源
   # - 不符合 GDD 规范
   # - 质量差，无法用于正式版本
   ```
   
   📖 **详细指南**: [RESOURCE_GENERATION_GUIDE.md](./docs/RESOURCE_GENERATION_GUIDE.md)
   
   ✅ **验证**：检查是否生成了高质量的 PNG 文件（不是方块/圆形）
   
   **步骤 6.2：注册游戏到数据库**
   ```bash
   # 修改 register-game.sql 中的游戏配置
   # 然后执行 SQL 注册
   mysql -u root -p kids_game < register-game.sql
   
   # ✅ 验证：查询数据库确认已注册
   # SELECT * FROM t_game WHERE game_name = '你的游戏名';
   ```
   
   **步骤 6.3：启动开发服务器测试**
   ```bash
   # 安装依赖（如果需要）
   npm install
   
   # 启动开发服务器
   npm run dev
   
   # ✅ 访问游戏 URL 测试（如 http://localhost:5173/games/plane-shooter/）
   ```
   
   ⚠️ **重要提醒**：
   - **必须先注册再测试**，否则前端无法找到游戏配置
   - **必须先生成资源再注册**，否则 GTRS 路径会错误
   - 使用最新的 `register-game.template.sql` 模板！

### 添加新难度

编辑 `src/config/difficulty.json`：
```json
{
  "difficulties": [
    { "id": "easy", "label": "简单", "gridCols": 20, "gridRows": 15, "speed": 200 },
    { "id": "normal", "label": "普通", "gridCols": 25, "gridRows": 18, "speed": 150 }
  ]
}
```

### 添加道具效果

在 `src/phaser/game.ts` 的 `ItemEffects` 接口中添加新效果，然后在 `ComponentGameScene.ts` 的碰撞处理中调用。

### 修改 GTRS 主题

编辑 `src/config/GTRS.json`，参考 `kids-game-house/shared/schemas/gtrs-schema.json` 验证格式。

## 技术规范

- **IDE 沙箱**：禁止原生 `confirm()`/`alert()`,用 ElMessageBox/ElMessage
- **音频格式**:统一 `.mp3`
- **类型检查**:用 `npx tsc --noEmit`（非 vue-tsc）
- **组件导入**:游戏 UI 组件用 `@/components/ui/` 本地导入
- **框架代码**:核心层和渲染层代码禁止修改，只能扩展
- **设计先行**:必须先完成 GDD 设计文档并通过评审（阶段 0）

## 关键决策点

### 选择哪个参考游戏？

| 游戏类型 | 推荐模板 | 复杂度 |
|---------|---------|--------|
| 网格移动类 | snake/ | ⭐⭐⭐ |
| 射击类 | tank-battle/ | ⭐⭐⭐⭐ |
| 益智类 | snake/ | ⭐⭐ |
| 动作类 | tank-battle/ | ⭐⭐⭐⭐ |

### 需要哪些可选表？

| 功能需求 | 需要的表 |
|---------|---------|
| 自定义参数 | t_game_config |
| 排行榜 | t_leaderboard_config |
| 多种模式 | t_game_mode_config |
| 都不需要 | 只注册必需表 (t_game + t_theme_info) |

## 常见陷阱

### ❌ 重命名不彻底（最常见！）

**问题场景**：复制贪吃蛇后，只改了部分名字，导致其他游戏里还有 `SnakeGame`、`snakeStore` 等代码。

**后果**：
- 运行时可能引用错误的 store
- 路由冲突
- 代码难以维护

**正确做法**：
```bash
# 1. 使用 IDE 的「在文件中查找」功能
#    搜索：snake|Snake （排除 core/ 和 rendering/ 目录）

# 2. 逐个检查搜索结果，确认是否需要替换

# 3. 使用验证命令检查残留
grep -r "snake\|Snake" src/ --exclude-dir=core --exclude-dir=rendering

# 4. 如果发现残留，批量替换
# VSCode: Ctrl+Shift+H → 输入查找和替换内容 → 全部替换
```

**典型错误示例**：
```typescript
// ❌ 错误：store 还是 snake
import { useSnakeStore } from '@/stores/snake'
const gameStore = useSnakeStore() // 应该用 useMyGameStore

// ❌ 错误：路由还是指向 SnakeGameView
{ path: '/plane-shooter', component: () => import('@/views/SnakeGameView.vue') }

// ✅ 正确：完全重命名
import { useMyGameStore } from '@/stores/my-game'
const gameStore = useMyGameStore()

{ path: '/plane-shooter', component: () => import('@/views/PlaneShooterGameView.vue') }
```

### ❌ 忘记复制框架代码
```bash
# 错误：直接删除会破坏框架
rm -rf src/components/*

# 正确：从 snake 复制
cp -r ../snake/src/components/core ./src/components/
```

### ❌ 忘记更新路由
```typescript
// 错误：路由指向旧组件
{ path: '/my-game', component: () => import('@/views/SnakeGameView.vue') }

// 正确：路由指向新组件
{ path: '/my-game', component: () => import('@/views/MyGameGameView.vue') }
```

### ❌ 只注册游戏，不注册主题
```sql
-- 错误：缺少主题注册
INSERT INTO t_game (...) VALUES (...);

-- 正确：同时注册游戏和主题
INSERT INTO t_game (...) VALUES (...);
INSERT INTO t_theme_info (...) VALUES (...);
```

### ❌ 修改了框架代码
```typescript
// 错误：修改了核心层代码
// src/components/core/ResourceLoader.ts 被修改

// 正确：只修改游戏特定层
// src/phaser/game.ts 实现自己的逻辑
```

## 更多信息

- 📖 **游戏开发完整指南**：[docs/GAME_DEV_GUIDE.md](./docs/GAME_DEV_GUIDE.md)
- 📦 **GTRS 资源规范**：[docs/GTRS_GUIDE.md](./docs/GTRS_GUIDE.md)
- ✅ **检查清单**：[docs/CHECKLIST.md](./docs/CHECKLIST.md)
- 📋 **重命名快速参考**：[QUICK_REFERENCE.md](./QUICK_REFERENCE.md) ⭐ 新增！
- 🐍 **贪吃蛇游戏源码**：`kids-game-house/games/snake/`
- 🏗️ **可复用框架代码**：`kids-game-house/games/snake/src/components/`
- 📚 **设计先行文档**：`kids-game-house/docs/README_DESIGN_FIRST.md`
