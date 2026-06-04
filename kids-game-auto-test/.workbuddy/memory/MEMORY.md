# MEMORY.md - kids-game-auto-test 项目长期记忆

## 项目概述

`kids-game-auto-test` 是一个基于 **Playwright** 的游戏自动化测试平台（v1.2.0），测试对象为 kids-game-project-v5 中的 4 款游戏（飞机大战、贪吃蛇、坦克大战、植物大战僵尸）。

## 项目结构
- `src/index.js`：入口，Commander CLI 参数解析
- `src/orchestrator.js`：测试协调器核心
- `src/game-simulator.js`：**Playwright** 游戏操作（已从 Puppeteer 迁移）
- `src/performance-monitor.js`：性能指标采集（Playwright page.evaluate + page.metrics）
- `src/log-analyzer.js`：浏览器日志收集（Playwright 事件）
- `src/ai-experience-analyzer.js`：AI 体验评分（当前为 mock）
- `src/report-generator.js`：HTML / JSON / Excel 报告生成
- `src/utils/logger.js`：Winston 日志
- `src/utils/helpers.js`：通用工具函数（withRetry、takeScreenshot 等）
- `src/config/config-loader.js`：配置加载器
- `config/test-config.json`：游戏 URL、性能阈值等配置
- `setup.js`：**跨平台安装脚本**，自动安装 npm 依赖 + Playwright 浏览器

## 关键架构约定（2026-03-27 Playwright 迁移后）

1. **Playwright 三层模型**：
   ```
   chromium.launch() → browser.newContext({ recordVideo?, viewport }) → context.newPage()
   ```
   - `browser.engine` 字段配置引擎（默认 chromium），支持 chromium/firefox/webkit
   - 视频录制通过 `context.recordVideo.dir` 开启，`--record` 参数触发

2. **生命周期顺序**（重要！）：
   ```
   launchBrowser() → logAnalyzer.startCollecting(page) → runTests()（含 goto）→ measure(page) → analyze(page) → closeBrowser()
   ```
   - `startCollecting` **必须在** `page.goto()` 前调用
   - `PerformanceMonitor.measure(page)` **不重新导航**

3. **Playwright vs Puppeteer API 差异**：
   - `waitUntil: 'networkidle'`（Playwright）vs `'networkidle0'`（Puppeteer）
   - `request.failure()` 返回字符串（Playwright）vs `{ errorText }` 对象（Puppeteer）
   - `page.metrics()` 是 Playwright 的 Chromium-only 方法（返回 CDP 指标）
   - 视频录制：`page.video().path()`（Playwright 独有）

4. **性能阈值**来自 `config/test-config.json`（`performance.thresholds`）

5. **截图**：测试失败/错误时自动截图，保存到 `screenshots/{gameName}/`

6. **并发模式**：`--parallel` 参数触发 `Promise.allSettled()`，每个游戏独立浏览器实例

## 安装流程

```bash
node setup.js                    # 安装依赖 + chromium + 冒烟验证（推荐）
node setup.js --all-browsers     # 安装依赖 + 全部浏览器
node setup.js --check-only       # 仅检测环境
node setup.js --mirror           # 镜像加速（国内用户）
node setup.js --skip-verify      # 跳过冒烟测试
npm run install:browsers         # 单独安装 chromium
npm run install:browsers:all     # 安装全部浏览器
```

**已安装组件（2026-03-27）：**
- Playwright 1.58.2（npm）
- Chromium v145.0.7632.6（playwright chromium v1208）
- 路径：`%LOCALAPPDATA%\ms-playwright\chromium-1208`

## 历史修复记录

### 2026-03-27（第一轮优化）
- 修复日志分析器从未收集到数据的 Bug
- 修复性能监控重复导航的 Bug
- 新增 helpers.js 工具模块
- 版本升至 1.1.0

### 2026-03-27（第二轮：Playwright 迁移）
- 底层从 Puppeteer 完整迁移至 Playwright
- 新增 setup.js 安装脚本（跨平台）
- 新增视频录制支持
- 新增 dialog 自动 dismiss
- 移除 puppeteer 依赖，版本升至 1.2.0

### 2026-03-27（第四轮：游戏场景 + 趋势报告）
- **game-scenarios/** 四款游戏场景全部完整实现（plane/snake/tank/pvz）
- **report-generator.js**：集成 TrendAnalyzer + Chart.js 趋势图，历史数据 ≥2 份时自动显示
- **examples/demo-report.js**：无需游戏服务器可预览完整报告（`--open/--multi`）
- **package.json**：新增 test:smoke/test:ci/test:debug/report:demo 等 8 个快捷命令

### 2026-03-27（第九轮：Web 监控面板 + 结果上报，v1.4.0）
- **src/dashboard-server.js**：原生 http 轻量 Web 面板，SSE 实时推送，RESTful API，内置暗色主题单页应用，端口 9090，支持任务重试/日志查看
- **src/result-reporter.js**：JUnit XML（CI 标准格式）+ CSV（BOM Excel 友好）+ 后端 API 上报（POST /api/test/report）
- **src/pipeline.js**：新增 `--dashboard/--dashboard-port/--dashboard-open/--report-backend/--junit/--csv` 参数，Dashboard 在 Step3 后启动
- **package.json**：版本 1.4.0，新增 `dashboard / dashboard:ci` 命令，`pipeline:ci` 加 `--junit`
- **README.md**：新增完整流水线/监控面板/后端对接/结果上报四大章节，含 GitLab CI 示例
- **src/api-client.js**：原生 http/https 封装，JWT 自动管理，`isReachable()` 检测，`rawGet/rawPost` 返回完整响应（供断言用），支持环境变量
- **src/api-test-runner.js**：API 测试执行器，14 种断言类型，后端不可达自动 SKIPPED
- **src/code-scanner.js**：新增 apiMode 选项，从 `GET /api/game/list` 拉取并与本地扫描结果合并
- **src/test-case-generator.js**：新增 `API_BASE_TEST_CASES`（6 全局）+ `API_GAME_TEST_CASES`（4 游戏级），`generateApiSuite()` 方法
- **src/pipeline.js**：新增 `--api-mode / --api-only / --backend-url` 等参数，子集 Proxy 隔离 UI 与 API 任务
- **package.json**：版本升至 1.3.0，新增 pipeline:api / pipeline:api-only / pipeline:api-ci 等命令
- **验证**：后端不可达时 4 阶段流水线正常走完，API 任务优雅 SKIPPED，零崩溃
- **src/code-scanner.js**：扫描 kids-game-house/games/，识别游戏类型，深度分析 12 个特性（difficulty/theme/collision/movement/shooting/audio/score/level/pause/restart/health/resource）
- **src/test-case-generator.js**：基础用例 6 个 + 特性用例 12 个 + 游戏类型专属用例，支持 P0/P1/P2 过滤
- **src/task-manager.js**：任务状态机（PENDING→QUEUED→RUNNING→PASSED/FAILED/SKIPPED），持久化到 tasks/*.json，EventEmitter 事件通知
- **src/task-monitor.js**：Playwright 真实执行，14 种断言类型，并发执行，失败截图，run.log 记录
- **src/pipeline.js**：完整流水线入口（4阶段），--scan-only/--generate-only/--headless/--concurrency/--priority/--report
- **package.json**：新增 pipeline / pipeline:scan / pipeline:generate / pipeline:headless / pipeline:ci / pipeline:p0 命令
- **验证**：扫描 26ms / 生成 74 用例 / 完整运行 4 任务 12s SKIPPED（服务器未运行），零崩溃
- **helpers.js**：新增 `checkUrlReachable` + `withTimeout` 工具函数
- **orchestrator.js**：启动前并发 ping 所有 URL（`_preflightCheck`），不可达直接 SKIPPED；`withTimeout` 包裹单游戏超时；状态判断修正（WARNING 不污染 FAILED）
- **base-scenario.js 重写**：`action({ soft })` / `waitForAny()` / `tryClick()` / `measureFPS()` / `assertCanvasHasContent(soft)` — 全面鲁棒化
- **4 个游戏场景全部升级 v2**：使用 softAssert/waitForAny/tryClick，非关键步骤软断言
- **performance-monitor.js**：每个指标独立 8s 超时，互不阻塞
- **ai-experience-analyzer.js**：stability 维度接入真实 jsErrors/failedRequests 数据
- **console-reporter.js**：支持 SKIPPED 状态展示
- **验证**：服务器未运行时 4 游戏全 SKIPPED，12ms 完成，无崩溃
- **实际安装**：Playwright 1.58.2 + Chromium v145（冒烟测试通过）
- **setup.js 重写**：新增冒烟验证阶段、`--mirror/--verbose/--skip-verify` 参数、5阶段流程
- **game-simulator.js**：networkidle 超时自动降级 load；waitForLoad 支持 6 种选择器 + canvas 首帧检测
- **config-loader.js 重写**：支持环境变量覆盖（BROWSER_ENGINE/TEST_TIMEOUT/GAME_URL_*等）、.env 文件加载
- **package.json**：playwright 版本更新为 ^1.58.0
- **README.md**：全新完整文档（安装/运行/配置/环境变量/FAQ/架构）
