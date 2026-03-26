# 🚀 Kids Game 自动化测试平台 - 快速启动指南

**目标**: 5 分钟内开始第一次自动化测试  
**前置条件**: Node.js 18+, npm 9+

---

## ⚡ 一键安装（推荐）

### Windows PowerShell

```powershell
cd kids-game-auto-test
.\setup.ps1
```

**预期输出**:
```
========================================
  Kids Game Auto Test Platform
========================================

Checking Node.js...
✓ Node.js version: v18.x.x

Checking Python...
✓ Python version: 3.x.x

Checking FFmpeg...
✓ FFmpeg is available

Installing NPM packages...
✓ All dependencies installed successfully!

Next Steps:
  1. Review config/test-config.json
  2. Configure game URLs and test scenarios
  3. Run: npm run test:all
```

---

## 🎯 第一次运行测试

### Step 1: 确保游戏服务器运行

```bash
# 在 kids-game-house 目录
cd ..\kids-game-house

# 启动所有游戏
.\start-all-games.bat
```

确认以下 URL 可访问：
- http://localhost:8081/ (Plane Shooter)
- http://localhost:3005/ (Snake)
- http://localhost:3002/ (Tank Battle)
- http://localhost:3004/ (Plants vs Zombie)

---

### Step 2: 运行第一个测试

```bash
cd kids-game-auto-test

# 测试单个游戏（推荐首次）
npm run test:game -- --game=plane-shooter

# 或者测试所有游戏
npm run test:all
```

**预期输出**:
```
========================================
  Kids Game Auto Test Platform v1.0.0
========================================
Mode: single
Game: plane-shooter
========================================

[INFO] Launching browser...
[INFO] ✓ Browser launched
[INFO] Navigating to http://localhost:8081/...
[INFO] ✓ Page loaded in 1234ms

[Test] Start Screen...
[INFO] ✓ Start screen test: PASSED

[Test] Difficulty Selection...
[INFO] ✓ Difficulty selection test completed

[Test] Theme Selection...
[INFO] ✓ Theme selection test completed

[Test] Gameplay...
[INFO] ✓ Gameplay test completed

[INFO] ✓ Executed 6 test scenarios
[INFO] ✓ Browser closed

✓ Game plane-shooter completed: PASSED
```

---

## 📊 查看测试报告

测试完成后，报告自动生成在 `reports/` 目录：

```bash
# 打开 HTML 报告
start reports/report-2026-03-26-11-00-00.html

# 或查看所有报告
ls reports/
```

**报告内容**:
- ✅ 测试结果总览
- ✅ 详细测试项
- ✅ 性能指标图表
- ✅ 问题列表
- ✅ 截图和录屏

---

## 🔧 常用命令速查

### 测试命令

```bash
# 测试所有游戏
npm run test:all

# 测试单个游戏
npm run test:game -- --game=GAME_NAME

# 无头模式（不显示浏览器）
npm run test:all -- --headless

# 录制测试过程
npm run test:all -- --record

# 性能测试
npm run test:performance

# AI 分析（需要 Python）
npm run test:ai-analysis
```

### 报告命令

```bash
# 生成 HTML 报告
npm run report

# 生成 Excel 报告
npm run report -- --format=excel

# 生成 JSON 报告
npm run report -- --format=json
```

### 清理命令

```bash
# 清理临时文件
npm run clean

# 清理所有报告和日志
npm run clean -- --all
```

---

## 🎨 配置指南

### 添加新游戏

编辑 `config/test-config.json`:

```json
{
  "games": {
    "new-game": {
      "name": "New Game",
      "url": "http://localhost:PORT/",
      "type": "arcade",
      "testScenarios": [
        "start_screen",
        "gameplay_flow"
      ]
    }
  }
}
```

### 修改性能阈值

```json
{
  "performance": {
    "thresholds": {
      "loadTime": 3000,  // 3 秒
      "frameRate": 60,   // 60 FPS
      "memoryUsage": 256 // 256 MB
    }
  }
}
```

### 启用/禁用 AI 分析

```json
{
  "ai": {
    "enabled": true,    // 或 false
    "features": {
      "visualQuality": true,
      "userExperience": true
    }
  }
}
```

---

## 🐛 故障排除

### 问题 1: 无法连接游戏服务器

**错误**: `ERR_CONNECTION_REFUSED`

**解决方案**:
```bash
# 1. 检查游戏是否运行
curl http://localhost:8081/

# 2. 如果没有运行，启动游戏
cd ..\kids-game-house
.\start-all-games.bat
```

---

### 问题 2: Puppeteer 下载失败

**错误**: `Failed to download Chromium`

**解决方案**:
```bash
# 使用国内镜像
export PUPPETEER_DOWNLOAD_HOST=https://npmmirror.com/mirrors/chromium-browser-snapshots

# 重新安装
npm install puppeteer
```

---

### 问题 3: 测试超时

**错误**: `TimeoutError: Navigation timeout of 60000 ms exceeded`

**解决方案**:
1. 检查网络连接
2. 增加 timeout 配置
3. 检查游戏是否卡住

---

## 📈 最佳实践

### ✅ 推荐做法

1. **每天运行测试**
   ```bash
   # 添加到每日构建
   npm run test:all -- --headless
   ```

2. **保存历史报告**
   ```bash
   # 定期备份 reports 目录
   ```

3. **持续改进测试场景**
   - 根据 Bug 添加新测试
   - 优化现有测试
   - 提高测试覆盖率

### ❌ 避免的做法

1. ❌ 不要在生产环境运行
2. ❌ 不要忽略失败的测试
3. ❌ 不要只依赖自动化测试

---

## 🎓 学习资源

### 文档

- [完整 README](./README.md)
- [API 文档](./docs/API.md)
- [示例代码](./examples/)

### 视频教程

- Puppeteer 入门
- Playwright 高级用法
- AI 分析实战

### 社区

- Stack Overflow: #puppeteer #playwright
- GitHub Issues
- 内部技术分享

---

## 🎯 下一步

### 今天完成

- [x] ✅ 安装依赖
- [x] ✅ 运行第一个测试
- [ ] ⏳ 查看所有游戏的报告
- [ ] ⏳ 理解报告内容

### 本周完成

- [ ] ⏳ 配置 CI/CD 集成
- [ ] ⏳ 添加自定义测试场景
- [ ] ⏳ 设置邮件通知
- [ ] ⏳ 对比历史数据

### 本月完成

- [ ] ⏳ 实现 100% 测试覆盖
- [ ] ⏳ 建立质量基线
- [ ] ⏳ 优化性能指标
- [ ] ⏳ 培训团队成员

---

## 📞 获取帮助

### 内部支持

- **技术支持群**: Kids Game Dev
- **邮件**: team@kidsgame.com
- **Wiki**: http://wiki.kidsgame.com/auto-test

### 外部资源

- Puppeteer Docs: https://pptr.dev/
- Playwright Docs: https://playwright.dev/
- MDN Web Docs: https://developer.mozilla.org/

---

**最后更新**: 2026-03-26  
**维护者**: Kids Game Team  
**版本**: 1.0.0

🚀 **祝测试愉快！**
