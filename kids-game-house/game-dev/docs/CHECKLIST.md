# 游戏开发检查清单

基于贪吃蛇克隆新游戏时的检查项。

## Phase 1: 项目初始化

- [ ] 复制参考游戏目录
- [ ] 修改 `package.json`（name、displayName、version）
- [ ] 修改目录名为新游戏名

## Phase 2: 重命名和重构

- [ ] 重命名所有 TypeScript 类
  - [ ] `PhaserGame` → 新类名
  - [ ] `ComponentGameScene` → 新场景类名
- [ ] 重命名所有 Vue 组件
  - [ ] `Snake*View.vue` → `Game*View.vue`
- [ ] 更新路由配置 `src/router/index.ts`
- [ ] 更新 `main.ts` 中的组件注册

## Phase 3: GTRS 配置

- [ ] 修改 `src/config/GTRS.json`
  - [ ] `specMeta.gameId`
  - [ ] `specMeta.gameName`
  - [ ] `specMeta.ownerId`
  - [ ] `themeInfo.themeName`
  - [ ] 更新资源引用
- [ ] 验证 GTRS 格式（`validateGTRS()`）

## Phase 4: 游戏逻辑

- [ ] 修改 `src/phaser/game.ts`
  - [ ] 更新 `GameConfig` 接口
  - [ ] 更新 `DIFFICULTY_CONFIGS`
  - [ ] 更新 `ItemEffects` 接口（如需要）
- [ ] 修改 `src/scenes/ComponentGameScene.ts`
  - [ ] 实现新游戏规则
  - [ ] 更新碰撞检测
  - [ ] 更新道具生成逻辑
- [ ] 修改 `src/phaser/PhaserGame.ts`（如需要）

## Phase 5: Pinia Store

- [ ] 修改 `src/stores/game.ts`
  - [ ] 更新初始状态
  - [ ] 添加新动作（actions）
  - [ ] 添加新获取器（getters）
- [ ] 确保与 Phaser 游戏的回调集成正确

## Phase 6: UI 界面

- [ ] 修改开始界面 `StartView.vue`
  - [ ] 更新标题
  - [ ] 更新按钮文案
  - [ ] 更新样式
- [ ] 修改难度选择 `DifficultyView.vue`
  - [ ] 更新难度选项
  - [ ] 更新描述文字
- [ ] 修改游戏界面 `GameView.vue`
  - [ ] 调整 HUD 布局（如需要）
- [ ] 修改结束界面 `GameOverView.vue`
  - [ ] 更新显示内容
  - [ ] 更新按钮文案

## Phase 7: 资源准备

- [ ] 替换场景图片
  - [ ] 背景图
  - [ ] 地面/墙壁
- [ ] 替换道具图片
  - [ ] 食物
  - [ ] 增益道具
- [ ] 替换角色图片
  - [ ] 玩家
  - [ ] 敌人（如有）
- [ ] 替换音效
  - [ ] 背景音乐
  - [ ] 游戏音效

## Phase 8: 国际化

- [ ] 更新 `src/locales/zh.json`
- [ ] 更新 `src/locales/en.json`

## Phase 9: 数据库注册

- [ ] 修改 `register-game.sql`
  - [ ] `@GAME_ID`
  - [ ] `@GAME_NAME`
  - [ ] `@GAME_CODE`
  - [ ] `@GAME_EMOJI`
  - [ ] `@DESCRIPTION`
- [ ] 执行 SQL

## Phase 10: 测试

- [ ] 开发服务器运行正常
- [ ] 开始界面正常显示
- [ ] 难度选择正常
- [ ] 游戏开始正常
- [ ] 游戏逻辑正确
- [ ] 道具效果正常
- [ ] 游戏结束正常
- [ ] 返回主界面正常
- [ ] TypeScript 编译无错误
- [ ] `npx tsc --noEmit` 通过

## Phase 11: 构建发布

- [ ] `npm run build` 成功
- [ ] 生产环境测试通过
- [ ] 推送到 Git

## 常见问题排查

| 问题 | 可能原因 | 解决方案 |
|------|----------|----------|
| 编译错误 | 类名未全部重命名 | 全局搜索旧名称 |
| 游戏黑屏 | 资源未加载 | 检查 `preload` 方法 |
| 碰撞失效 | 物理系统配置错误 | 检查 `arcade` 配置 |
| 样式错乱 | 屏幕适配问题 | 检查 4 层适配 |
| 声音不播放 | 音频未预加载 | 检查 `preload` 中的音频加载 |
