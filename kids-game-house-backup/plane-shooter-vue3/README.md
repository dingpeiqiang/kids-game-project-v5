# 🎮 飞机大战 (Plane Shooter)

**基于游戏开发规范 v1.0.3 创建**  
**创建日期**: 2026-03-26  
**游戏类型**: STG (Shoot 'em up) / 纵向卷轴射击

---

## 📋 项目状态

### ✅ 第一阶段：设计与 GTRS 资源规范 - **已完成**

- [x] 游戏设计文档 (`game-design.md`)
- [x] GTRS Schema 定义
- [x] 资源清单 (`resource-list.md`)

### ✅ 第二阶段：GTRS 资源配置生成 - **已完成**

- [x] 资源生成脚本 (`scripts/generate-resources.mjs`)
- [x] NPM 包配置 (`scripts/package.json`)
- [x] PowerShell 执行脚本 (`generate-resources.ps1`)

### ⏳ 第三阶段：代码克隆与适配 - **待执行**

- [ ] 复制贪吃蛇项目框架
- [ ] 适配 Phaser 游戏逻辑
- [ ] 测试验证

### ⏳ 第四阶段：游戏注册与部署 - **待执行**

- [ ] 执行 SQL 注册脚本
- [ ] 部署到生产环境
- [ ] 验证上线

---

## 🚀 快速开始

### 方式一：使用 PowerShell 脚本（推荐）

```bash
cd kids-game-house/plane-shooter-vue3
.\generate-resources.ps1
```

脚本会自动：
1. ✅ 检查 Node.js 环境
2. 📦 安装 Sharp 依赖
3. 🎨 生成所有游戏资源
4. ✅ 验证输出文件

### 方式二：手动执行

```bash
# 1. 进入 scripts 目录
cd kids-game-house/plane-shooter-vue3/scripts

# 2. 安装依赖
npm install

# 3. 生成资源
npm run generate
# 或
node generate-resources.mjs

# 4. 验证输出
ls ../public/themes/default/assets/
```

---

## 📁 生成的文件

### 图片资源 (22 张)

| 类别 | 数量 | 位置 |
|------|------|------|
| Scene 场景 | 3 | `public/themes/default/assets/scene/` |
| Sprite 精灵 | 10 | `public/themes/default/assets/sprite/` |
| Icon 图标 | 5 | `public/themes/default/assets/icon/` |
| Effect 特效 | 4 | `public/themes/default/assets/effect/` |

### 音频资源 (9 首)

| 类别 | 数量 | 位置 |
|------|------|------|
| BGM 背景音乐 | 4 | `public/themes/default/assets/audio/` |
| SFX 音效 | 5 | `public/themes/default/assets/audio/` |

### 配置文件 (2 份)

- `public/themes/default/GTRS.json` - 运行时配置
- `src/config/GTRS.json` - 源代码配置

---

## 🎨 资源配置详情

### 玩家飞机
- **尺寸**: 60×80 像素
- **颜色**: 绿色系 (#4ade80)
- **特点**: 流线型机身、蓝色驾驶舱

### 敌机系列
1. **小型敌机** (40×40) - 红色侦察机，直线飞行
2. **中型敌机** (50×60) - 紫色轰炸机，左右摆动
3. **大型敌机** (80×80) - 金色战舰，追踪玩家
4. **Boss** (150×150) - 巨型母舰，复杂弹幕

### 道具系统
- 🔫 **武器强化** - 升级子弹等级
- ⚡ **速度提升** - 移动速度 +30%
- 🛡️ **护盾** - 抵挡一次伤害
- ❤️ **生命回复** - 生命值 +1
- 💥 **全屏炸弹** - 清除所有敌人

---

## 🎵 音频设计

### 背景音乐 (BGM)
- `bgm_main.wav` - 主菜单音乐 (180s, 440Hz)
- `bgm_gameplay.wav` - 游戏进行音乐 (120s, 523Hz)
- `bgm_victory.wav` - 胜利音乐 (30s, 659Hz)
- `bgm_defeat.wav` - 失败音乐 (20s, 330Hz)

### 音效 (SFX)
- `effect_fire.wav` - 射击音效 (0.2s)
- `effect_explosion.wav` - 爆炸音效 (0.5s)
- `effect_hit.wav` - 击中音效 (0.15s)
- `effect_powerup.wav` - 道具拾取音效 (0.3s)
- `effect_button_click.wav` - UI 点击音效 (0.1s)

---

## 📝 下一步操作

### 1. 复制项目框架

```bash
cd kids-game-house
copy -Recurse snake-vue3 plane-shooter-vue3-complete
```

### 2. 修改 package.json

```json
{
  "name": "plane-shooter-vue3",
  "version": "1.0.0",
  "description": "飞机大战游戏"
}
```

### 3. 实现 Phaser 游戏逻辑

需要修改的核心文件:
- `src/phaser/scenes/PlaneShooterScene.ts` - 游戏主场景
- `src/stores/game.ts` - 游戏状态管理
- `src/views/StartView.vue` - 开始界面文本

### 4. 注册到数据库

```bash
mysql -u root -p kids_game_platform < register-game.sql
```

---

## 🔧 技术栈

- **前端框架**: Vue 3 + TypeScript + Vite
- **游戏引擎**: Phaser 3 (通过 CDN 引入)
- **状态管理**: Pinia
- **样式方案**: Tailwind CSS
- **资源生成**: Sharp (PNG) + 原生 WAV 生成
- **GTRS 规范**: v1.0.0 主题资源配置标准

---

## 📊 游戏参数

```javascript
// 画布尺寸
GAME_WIDTH = 720
GAME_HEIGHT = 1280

// 网格系统
GRID_SIZE = 40
GRID_COLS = 18
GRID_ROWS = 32

// 玩家配置
player: {
  width: 60,
  height: 80,
  speed: 10,
  health: 3,
  fireRate: 200
}
```

---

## ✅ 检查清单

### 资源生成完成后
- [x] 背景图片生成成功
- [x] 玩家飞机 sprite 生成成功
- [x] 敌机 sprite 生成成功 (4 种)
- [x] 子弹 sprite 生成成功 (4 种)
- [x] 道具图标生成成功 (5 种)
- [x] 爆炸特效生成成功 (4 帧)
- [x] BGM 音频生成成功 (4 首)
- [x] SFX 音效生成成功 (5 首)
- [x] GTRS 配置生成并复制到两个位置

### 准备进入第三阶段
- [ ] 已阅读游戏设计文档
- [ ] 已理解 GTRS 资源配置
- [ ] 准备好贪吃蛇源码作为参考
- [ ] 了解 Phaser 游戏引擎基础

---

## 📚 参考文档

- [游戏开发规范](../../../GAME_DEVELOPMENT_STANDARD.md)
- [游戏设计文档](./game-design.md)
- [资源清单](./resource-list.md)
- [贪吃蛇实现参考](../snake-vue3/)

---

## 🎯 验收标准

### 功能完整性
- [ ] 玩家飞机可正常移动和自动射击
- [ ] 敌机按设计模式生成和移动
- [ ] 碰撞检测准确无误
- [ ] 道具系统正常工作
- [ ] 得分系统正确计算
- [ ] 游戏流程完整

### 性能指标
- [ ] 平均帧率 ≥ 55 FPS
- [ ] 内存占用 < 200MB
- [ ] 加载时间 < 5 秒
- [ ] 无明显卡顿和延迟

### 用户体验
- [ ] 操作简单易上手
- [ ] 视觉效果清晰美观
- [ ] 音效反馈及时
- [ ] 难度曲线合理

---

## 📞 问题排查

### 资源生成失败
1. 检查 Node.js 版本是否 >= 16
2. 确认 npm 依赖安装成功
3. 查看控制台错误信息

### GTRS 校验失败
1. 检查 JSON 格式是否正确
2. 确认资源路径存在且正确
3. 参考 GTRS 规范文档

### 游戏无法启动
1. 确认端口未被占用 (默认 8081)
2. 检查浏览器控制台错误
3. 验证主题是否已加载

---

**最后更新**: 2026-03-26  
**维护者**: AI Assistant  
**版本**: v1.0.0
