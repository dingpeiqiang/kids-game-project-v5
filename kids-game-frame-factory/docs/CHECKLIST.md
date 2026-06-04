# 游戏开发检查清单

基于 frame-factory 模板创建新游戏时的检查项。

---

## Phase 1：项目初始化

- [ ] 使用脚本初始化（`init-game.ps1` 或 `init-game.sh`），或手动复制 `game-template`
- [ ] 确认 `package.json` 的 `name` 已更新为 `@kids-game/my-game`
- [ ] 确认所有 `__GAME_ID__` / `__GAME_NAME__` 占位符已替换
- [ ] `npm install` 依赖安装成功

---

## Phase 2：配置文件

- [ ] `src/config/GTRS.json`
  - [ ] `specMeta.gameId` = 你的游戏 ID
  - [ ] `specMeta.gameType` = 你的游戏 ID  
  - [ ] `themeInfo.themeId` = `{gameId}_default`
  - [ ] `themeInfo.themeName` 已设置
  - [ ] `resources.images.scene` 中定义了游戏所需图片
  - [ ] `resources.audio.bgm` / `resources.audio.effect` 已配置

- [ ] `src/config/difficulty.json`
  - [ ] 三个难度的 `gridCols` / `gridRows` 符合游戏规则
  - [ ] `speed` 参数合理（毫秒/步，越小越快）
  - [ ] `scoreMultiplier` 设置合理

- [ ] `src/config/game-config.json`
  - [ ] `gameId` / `gameName` 已更新

---

## Phase 3：游戏场景实现

- [ ] `src/scenes/GameScene.ts`
  - [ ] `preload()` 方法：使用 `themeStore.getImageUrl()` 加载图片
  - [ ] `preload()` 方法：使用 `themeStore.getAudioUrl()` 加载音频
  - [ ] `create()` 方法：调用了 `super.create()`（初始化适配参数）
  - [ ] `createGameObjects()` 方法：创建了游戏特定对象
  - [ ] `gameLoop()` 方法：实现了游戏主逻辑
  - [ ] `handleGameOver()` 方法：调用了 `super.handleGameOver()`
  - [ ] 使用 `this.gridToPixelCenter()` / `this.gridToPixel()` 做坐标转换
  - [ ] 使用 `this.addScore()` 增加分数（会自动触发 Vue 层更新）

---

## Phase 4：资源文件

- [ ] 图片放置在 `public/images/{gameId}/`
- [ ] 音频放置在 `public/audio/{gameId}/`
- [ ] 音频格式为 `.mp3`
- [ ] GTRS.json 中的 `src` 路径与实际文件路径一致（不含 `/public/` 前缀）

---

## Phase 5：UI 界面

- [ ] `StartView.vue`：标题、描述已更新
- [ ] `DifficultyView.vue`：难度描述文字已更新（与 difficulty.json 一致）
- [ ] `GameOverView.vue`：确认显示效果正常
- [ ] `GameView.vue`：HUD 显示正常（分数、暂停按钮）

---

## Phase 6：数据库注册

- [ ] `register-game.sql` 中的游戏代码和名称已确认
- [ ] 执行 SQL 注册游戏
- [ ] 从数据库验证游戏记录存在

---

## Phase 7：功能测试

### 基本流程

- [ ] 开发服务器 `npm run dev` 启动正常
- [ ] 开始界面 → 难度选择 → 游戏 → 结束 流程完整
- [ ] 「返回」按钮各界面均可正常返回

### 游戏功能

- [ ] 游戏画面正常渲染
- [ ] 玩家控制响应正常（键盘/触摸）
- [ ] 分数实时更新（HUD 显示）
- [ ] 游戏结束正确触发
- [ ] 三种难度差异正确体现

### 暂停功能

- [ ] 暂停按钮有效
- [ ] ESC 键暂停/恢复有效
- [ ] 暂停弹窗显示正确
- [ ] 「继续游戏」恢复正常

### 屏幕适配

- [ ] 在不同屏幕宽高比下正常显示（测试 375×667、414×896、768×1024）
- [ ] 游戏区域居中
- [ ] 无横向/纵向滚动条

### 音频

- [ ] 背景音乐正常播放
- [ ] 游戏音效正常播放
- [ ] 暂停时 BGM 暂停，恢复时继续

---

## Phase 8：代码质量

- [ ] `npx tsc --noEmit` 无类型错误
- [ ] 无 `console.error` 输出
- [ ] 无 `@ts-ignore` 滥用
- [ ] 未使用 `confirm()` / `alert()`（禁止）

---

## Phase 9：构建发布

- [ ] `npm run build` 成功
- [ ] 构建产物无报错
- [ ] 生产环境测试正常

---

## 常见问题速查

| 问题 | 可能原因 | 解决方案 |
|------|---------|---------|
| 游戏黑屏/空白 | 资源未正确加载 | 检查 `preload()` 中的加载路径 |
| 分数不更新 | 事件链断裂 | 确认 `addScore()` 调用，检查 `PhaserGame.vue` 事件监听 |
| 暂停无效 | ESC 监听缺失 | 检查 `create()` 中 `super.create()` 是否调用 |
| 屏幕适配错误 | 4层配合缺失 | 检查 index.html meta + App.vue 样式 + Phaser Scale.RESIZE |
| 音频不播放 | 浏览器自动播放限制 | 需要用户交互后再播放，正常现象 |
| TypeScript 报错 | Phaser 类型缺失 | 确认 `import Phaser from 'phaser'`（不用 declare const） |
