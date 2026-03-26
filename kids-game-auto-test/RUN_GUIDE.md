# 🚀 Kids Game Auto Test - 一键运行指南

**目标**: 3 分钟内完成安装并运行第一次测试  
**前置条件**: Node.js 18+, npm 9+, Git（可选）

---

## ⚡ 超快速启动（推荐新手）

### Windows PowerShell - 一行命令搞定

```powershell
cd kids-game-auto-test; .\setup.ps1; npm run test:game -- --game=plane-shooter
```

**说明**:
- `cd kids-game-auto-test` - 进入项目目录
- `.\setup.ps1` - 自动安装所有依赖
- `npm run test:game -- --game=plane-shooter` - 运行第一个测试

**预期耗时**: ~5 分钟

---

## 📋 分步执行（详细版）

### Step 1: 确认环境

```bash
# 检查 Node.js
node --version
# 应该显示：v18.x.x 或更高

# 检查 npm
npm --version
# 应该显示：9.x.x 或更高

# 检查游戏是否运行（可选）
curl http://localhost:8081/
# 应该返回 HTML 内容
```

---

### Step 2: 安装依赖

#### 方式 A: 使用 PowerShell 脚本（推荐）

```powershell
cd kids-game-auto-test
.\setup.ps1
```

**脚本会自动**:
- ✅ 检查 Node.js 安装
- ✅ 检查 Python 安装（用于 AI 分析）
- ✅ 检查 FFmpeg 安装（用于视频录制）
- ✅ 自动安装所有 NPM 依赖

#### 方式 B: 手动安装

```powershell
cd kids-game-auto-test
npm install
```

---

### Step 3: 配置游戏 URL

编辑 `config/test-config.json`:

```json
{
  "games": {
    "plane-shooter": {
      "name": "Plane Shooter (飞机大战)",
      "url": "http://localhost:8081/"
    },
    "snake": {
      "name": "Snake (贪吃蛇)",
      "url": "http://localhost:3005/"
    }
  }
}
```

**提示**: 确保 URL 与实际游戏端口一致！

---

### Step 4: 运行第一个测试

#### 选项 A: 测试单个游戏（推荐首次）

```bash
# 测试飞机大战
npm run test:game -- --game=plane-shooter

# 测试贪吃蛇
npm run test:game -- --game=snake

# 测试坦克大战
npm run test:game -- --game=tank-battle

# 测试植物大战僵尸
npm run test:game -- --game=plants-vs-zombie
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

#### 选项 B: 测试所有游戏

```bash
# 有界面模式（可以看到浏览器操作）
npm run test:all

# 无头模式（不显示浏览器，更快）
npm run test:all -- --headless

# 录制测试过程
npm run test:all -- --record
```

---

### Step 5: 查看测试报告

测试完成后，报告自动生成在 `reports/` 目录：

```bash
# Windows
start reports\report-*.html

# Linux/Mac
open reports/report-*.html

# 或直接在文件管理器中打开
explorer reports
```

**报告包含**:
- ✅ 测试结果总览（通过率、失败项）
- ✅ 性能指标图表（加载时间、帧率）
- ✅ 问题列表（错误、警告）
- ✅ 截图和录屏（如果启用）
- ✅ AI 评分和建议（如果启用 AI）

---

## 🎯 常用命令速查

### 测试命令

```bash
# 测试所有游戏
npm run test:all

# 测试单个游戏
npm run test:game -- --game=GAME_NAME

# 无头模式
npm run test:all -- --headless

# 录制测试
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

## 🔧 故障排除

### 问题 1: setup.ps1 无法运行

**错误**: 
```
无法加载文件，因为在此系统上禁止运行脚本
```

**解决方案**:
```powershell
# 临时允许执行脚本
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# 然后重新运行
.\setup.ps1
```

---

### 问题 2: Puppeteer 下载失败

**错误**: 
```
Failed to download Chromium
```

**解决方案**:
```bash
# 使用国内镜像
export PUPPETEER_DOWNLOAD_HOST=https://npmmirror.com/mirrors/chromium-browser-snapshots

# Windows PowerShell
$env:PUPPETEER_DOWNLOAD_HOST="https://npmmirror.com/mirrors/chromium-browser-snapshots"

# 重新安装
npm install puppeteer
```

---

### 问题 3: 无法连接游戏服务器

**错误**: 
```
ERR_CONNECTION_REFUSED
```

**解决方案**:
```bash
# 1. 检查游戏是否运行
curl http://localhost:8081/

# 2. 如果没有运行，启动游戏
cd ..\kids-game-house
.\start-all-games.bat

# 3. 确认游戏可访问后，重新运行测试
cd ..\kids-game-auto-test
npm run test:game -- --game=plane-shooter
```

---

### 问题 4: 测试超时

**错误**: 
```
TimeoutError: Navigation timeout of 60000 ms exceeded
```

**解决方案**:

1. **检查网络连接**
   ```bash
   ping localhost
   ```

2. **增加超时配置**
   编辑 `config/test-config.json`:
   ```json
   {
     "browser": {
       "timeout": 120000  // 增加到 2 分钟
     }
   }
   ```

3. **检查游戏是否卡住**
   - 在浏览器中手动访问游戏 URL
   - 确认游戏可以正常加载

---

### 问题 5: AI 分析不可用

**错误**: 
```
Python is not installed
```

**解决方案**:

**方案 A: 安装 Python（推荐）**

```bash
# 1. 从 python.org 下载安装 Python 3.8+
# 2. 安装时勾选 "Add Python to PATH"
# 3. 验证安装
python --version

# 4. 安装 AI 依赖
pip install -r ai/requirements.txt
```

**方案 B: 禁用 AI 功能**

编辑 `config/test-config.json`:
```json
{
  "ai": {
    "enabled": false
  }
}
```

---

## 📊 测试检查清单

### 运行前检查 ☑️

- [ ] ☑️ Node.js 已安装（v18+）
- [ ] ☑️ npm 已安装（v9+）
- [ ] ☑️ 游戏服务器正在运行
- [ ] ☑️ 游戏 URL 可访问
- [ ] ☑️ 配置文件已更新

### 运行中观察 👀

- [ ] 👀 浏览器正常启动
- [ ] 👀 页面成功加载
- [ ] 👀 测试步骤按预期执行
- [ ] 👀 控制台无严重错误

### 运行后验证 ✅

- [ ] ✅ 测试报告生成
- [ ] ✅ 查看测试结果
- [ ] ✅ 检查性能指标
- [ ] ✅ 分析 AI 评分（如果启用）

---

## 🎓 最佳实践

### ✅ DO（推荐做法）

- ✅ **先运行单个游戏测试** - 熟悉流程
- ✅ **使用无头模式** - 提高测试速度
- ✅ **定期运行测试** - 持续监控质量
- ✅ **保存历史报告** - 对比趋势
- ✅ **及时修复问题** - 不要忽略失败

### ❌ DON'T（避免的做法）

- ❌ **不要在生产环境运行** - 可能影响真实用户
- ❌ **不要忽略失败测试** - 及时调查原因
- ❌ **不要只依赖自动化** - 保留人工测试
- ❌ **不要在低配机器全量测试** - 可能资源不足

---

## 📈 性能优化建议

### 加快测试速度

```bash
# 1. 使用无头模式
npm run test:all -- --headless

# 2. 并行测试多个游戏（修改 orchestrator.js）
# 见 README.md 高级功能章节

# 3. 减少不必要的等待
# 修改 game-simulator.js 中的 sleep 时间
```

### 减少资源占用

```bash
# 1. 一次只测试一个游戏
npm run test:game -- --game=plane-shooter

# 2. 关闭录制功能
npm run test:all  # 不要加 --record 参数

# 3. 限制浏览器实例数量
# 修改 config 中的并发设置
```

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

### 文档资源

- 📘 [README.md](./README.md) - 完整使用指南
- 🚀 [QUICK_START.md](./QUICK_START.md) - 5 分钟快速开始
- 📊 [PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md) - 架构设计
- 📝 [GIT_COMMIT_GUIDE.md](./GIT_COMMIT_GUIDE.md) - Git 提交指南

### 示例代码

- 💻 [examples/custom-test.js](./examples/custom-test.js) - 自定义测试示例

### 技术支持

- 📧 邮件：team@kidsgame.com
- 💬 技术群：Kids Game Dev
- 🌐 Wiki: http://wiki.kidsgame.com/auto-test

---

## 🎉 恭喜！

**你已经成功运行了第一个自动化测试！**

**接下来**:
1. 📊 查看测试报告，了解游戏质量
2. 🔄 定期运行测试，持续监控
3. 🛠️ 根据需要添加自定义测试
4. 📚 学习更多高级功能

---

**最后更新**: 2026-03-26  
**维护者**: Kids Game Team  
**版本**: 1.0.0

🚀 **祝测试愉快！让自动化成为你的超能力！**
