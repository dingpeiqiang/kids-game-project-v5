# 🎯 新目录结构 - 快速参考卡

**更新日期**: 2026-03-26  
**状态**: ✅ 已完成迁移

---

## 📂 一分钟了解新结构

### 核心概念

```
🔧 tools/      → 所有开发工具（集中管理）
🎮 games/      → 所有游戏项目（独立清晰）
📦 resources/  → 公共资源库（高效复用）
📚 docs/       → 统一文档库（易于查找）
```

---

## 🚀 常用命令速查

### 创建新游戏

```bash
# 使用模板快速创建
cd tools/shared-scripts
node create-game.ps1 -GameName my-new-game -Template shooter
```

### 生成游戏资源

```bash
# 方法 1: 使用 GTRS 生成器
cd tools/gtrs-generator/src
node generate-resources.mjs --game=my-new-game

# 方法 2: PowerShell
.\generate-resources.ps1 -GameName my-new-game
```

### 转换音频格式

```bash
# 在任意游戏目录
cd games/my-new-game

# 使用统一工具
..\..\tools\audio-converter\convert-to-mp3.ps1 -InputDir public\themes\default\assets\audio
```

### 启动游戏开发

```bash
# 进入对应游戏目录
cd games/plane-shooter

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 访问 http://localhost:8081
```

### 部署游戏

```bash
# 部署单个游戏
cd tools/shared-scripts
.\deploy-game.ps1 -GameName plane-shooter -Environment production

# 部署所有游戏
.\deploy-all-games.ps1
```

---

## 📁 目录位置速查

| 我要找... | 位置 | 示例 |
|----------|------|------|
| **资源生成工具** | `tools/gtrs-generator/src/` | `generate-resources.mjs` |
| **音频转换工具** | `tools/audio-converter/` | `convert-to-mp3.ps1` |
| **我的游戏** | `games/{game-name}/` | `games/plane-shooter/` |
| **公共素材** | `resources/` | `resources/images/backgrounds/` |
| **开发文档** | `docs/development-guide/` | `QUICK_START.md` |
| **工具手册** | `docs/tools-manual/` | `AUDIO_CONVERSION_GUIDE.md` |
| **游戏设计** | `docs/game-designs/` | `plane-shooter-design.md` |

---

## 🔍 常见问题快速解答

### Q: 如何添加新游戏？

**A**: 
```bash
1. 在 games/ 下创建目录
2. 复制模板或使用创建工具
3. 修改 package.json 和配置
4. 生成游戏资源
```

### Q: 工具升级怎么办？

**A**: 
```bash
1. 在 tools/ 中更新工具
2. 测试工具功能
3. 通知团队升级内容
✅ 所有游戏自动受益
```

### Q: 如何共享资源？

**A**: 
```bash
1. 将资源放到 resources/
2. 按类型分类（images/audio/fonts）
3. 更新资源索引
4. 在游戏中引用
```

### Q: 文档放哪里？

**A**: 
```bash
- 开发指南 → docs/development-guide/
- 工具说明 → docs/tools-manual/
- 游戏设计 → docs/game-designs/{game-name}.md
```

---

## ⚡ 对比：之前 vs 现在

| 任务 | 之前 | 现在 |
|------|------|------|
| **找工具** | ❌ 每个游戏翻一遍 | ✅ tools/ 一目了然 |
| **加游戏** | ❌ 复制大量代码 | ✅ 使用模板快速创建 |
| **转音频** | ❌ 每个游戏写脚本 | ✅ 统一工具一次搞定 |
| **查文档** | ❌ 到处找 .md 文件 | ✅ docs/ 分类清晰 |
| **用资源** | ❌ 重复存储浪费 | ✅ 公共资源库复用 |

---

## 🎯 最佳实践小贴士

### ✅ DO (推荐)

- ✅ 使用统一的工具目录
- ✅ 遵循命名规范（小写 + 连字符）
- ✅ 公共资源放到 resources/
- ✅ 文档及时更新到 docs/
- ✅ 使用版本控制管理变更

### ❌ DON'T (避免)

- ❌ 在每个游戏中复制工具
- ❌ 使用大写字母或空格命名
- ❌ 私有化公共资源
- ❌ 文档散落在各处
- ❌ 跳过测试直接上线

---

## 📞 需要帮助？

### 快速链接

- 📖 [完整设计方案](./REFACTOR_DIRECTORY_STRUCTURE_PROPOSAL.md)
- 🚀 [详细迁移指南](./MIGRATION_GUIDE.md)
- ✅ [完成报告](./REFACTOR_COMPLETE.md)
- 🛠️ [工具 README](./tools/README.md)

### 联系团队

- 💬 技术讨论群
- 📧 团队邮件列表
- 📝 Wiki 知识库

---

## 🎊 成功口诀

```
工具集中用 tools/
游戏独立在 games/
资源共享 resources/
文档统一 docs/

命名规范要牢记
团队协作更高效
新人上手更容易
项目管理更清晰
```

---

**打印此卡片贴在桌前，快速适应新架构！** 📌

**最后更新**: 2026-03-26  
**维护者**: Lingma AI Assistant

🚀 **让我们一起享受更高效的开发体验！**
