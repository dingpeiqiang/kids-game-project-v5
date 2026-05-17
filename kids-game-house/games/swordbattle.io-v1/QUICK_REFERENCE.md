# Swordbattle.io 离线模式 - 快速参考卡

## 🚀 一键启动

```bash
npm run dev
# 访问 http://localhost:3000
```

## 🎮 操作指南

| 按键 | 功能 |
|------|------|
| W / ↑ | 向上移动 |
| S / ↓ | 向下移动 |
| A / ← | 向左移动 |
| D / → | 向右移动 |
| 鼠标移动 | 瞄准方向 |
| 左键点击 | 挥剑攻击 |

## 📊 游戏系统

### 属性系统
- **生命值**: 100（初始）
- **移动速度**: 5（初始）
- **攻击力**: 25 + 等级×5
- **攻击范围**: 150 像素
- **攻击角度**: 60° 扇形

### 升级系统
```
Level 1 → 2: 需要 100 金币
Level 2 → 3: 需要 200 金币
Level 3 → 4: 需要 300 金币
...
每级奖励:
  ❤️ 最大生命 +20
  ⚡ 移动速度 +0.5
  💚 生命值回满
```

### 奖励系统
- 击杀 Bot: +50 金币
- Bot 重生: 3 秒后
- 同时存在: 5 个 Bot

## 🔧 配置调整

### config.json
```json
{
  "offlineMode": true,    // true=离线, false=在线
  "botCount": 5           // Bot 数量 (建议 1-10)
}
```

### 修改玩家速度
`GameScene.js` 第 2432 行：
```javascript
speed: 8,  // 改这个数字
```

### 修改攻击伤害
`GameScene.js` 第 2673 行：
```javascript
const killed = bot.takeDamage(50);  // 改这个数字
```

## 🐛 快速调试

### 查看控制台
```javascript
// 在浏览器控制台输入
console.log('Player:', game.scene.scenes[0].localPlayer);
console.log('Bots:', game.scene.scenes[0].bots.length);
```

### 检查错误
打开浏览器开发者工具（F12）→ Console 标签
- ✅ 无红色错误 = 正常
- ⚠️ 黄色警告 = 可忽略

### 性能监控
```javascript
// 在控制台输入
game.scene.scenes[0].game.loop.actualFps
```

## 📁 重要文件

| 文件 | 用途 |
|------|------|
| `src/Bot.js` | AI 机器人逻辑 |
| `src/GameScene.js` | 游戏主场景 |
| `config.json` | 游戏配置 |
| `test-offline-mode.js` | 自动化测试 |

## 📖 文档索引

| 文档 | 内容 |
|------|------|
| [FINAL_OFFLINE_REPORT.md](FINAL_OFFLINE_REPORT.md) | 完整迁移报告 |
| [OFFLINE_MODE_COMPLETE.md](OFFLINE_MODE_COMPLETE.md) | 离线模式说明 |
| [PURE_FRONTEND_IMPLEMENTATION.md](PURE_FRONTEND_IMPLEMENTATION.md) | 实施指南 |
| [GAMESCENE_RUNTIME_FIX.md](GAMESCENE_RUNTIME_FIX.md) | 错误修复记录 |

## ✅ 测试命令

```bash
# 运行自动化测试
npm test

# 或
npm run test:offline

# 预期结果: 26/26 通过
```

## 🎯 常见问题

**Q: 游戏无法启动？**  
A: 检查 Node.js 版本（需要 14+），运行 `npm install`

**Q: 看不到 Bot？**  
A: 确保 `config.json` 中 `"offlineMode": true`

**Q: 移动不流畅？**  
A: 检查浏览器是否开启硬件加速

**Q: 如何保存进度？**  
A: 当前版本不支持，刷新会重置

**Q: 可以联机吗？**  
A: 设置 `"offlineMode": false` 并启动后端服务器

## 💡 技巧提示

1. **快速升级**: 连续击杀同一个 Bot（它会在 3 秒后重生）
2. **保持血量**: 远离多个 Bot，逐个击破
3. **升级时机**: 攒够金币立即升级，获得属性提升
4. **走位技巧**: 利用边界困住 Bot

## 🌟 快捷键

| 组合键 | 功能 |
|--------|------|
| F11 | 全屏模式 |
| F5 | 刷新页面 |
| Ctrl+R | 硬刷新（清除缓存） |

## 📞 获取帮助

1. 查看控制台错误信息
2. 阅读相关文档
3. 运行 `npm test` 检查配置
4. 检查浏览器兼容性

---

**版本**: v1.0.0-offline  
**更新**: 2026-04-10  
**状态**: ✅ 生产就绪

🎮 祝游戏愉快！
