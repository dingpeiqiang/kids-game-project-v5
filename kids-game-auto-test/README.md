# Kids Game Auto Test Platform

> 基于 **Playwright** 的 Kids Game 自动化测试平台  
> 覆盖功能测试、性能监控、日志分析、AI 体验评分、后端 API 测试、实时 Web 监控面板

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)](https://nodejs.org)
[![Playwright](https://img.shields.io/badge/Playwright-1.58%2B-2EAD33)](https://playwright.dev)
[![Version](https://img.shields.io/badge/version-1.4.0-blue)](#)

---

## 目录

- [支持游戏](#支持游戏)
- [快速开始](#快速开始)
- [安装详解](#安装详解)
- [运行测试](#运行测试)
- [完整流水线（Pipeline）](#完整流水线pipeline)
- [Web 监控面板](#web-监控面板)
- [后端 API 对接](#后端-api-对接)
- [测试结果上报](#测试结果上报)
- [配置说明](#配置说明)
- [环境变量](#环境变量)
- [测试报告](#测试报告)
- [项目结构](#项目结构)
- [常见问题](#常见问题)

---

## 支持游戏

| 游戏 Key | 游戏名 | 默认端口 | 类型 |
|---|---|---|---|
| `plane-shooter` | 飞机大战 | 8081 | 射击 |
| `snake` | 贪吃蛇 | 3005 | 街机 |
| `tank-battle` | 坦克大战 | 3002 | 动作 |
| `plants-vs-zombie` | 植物大战僵尸 | 3004 | 策略 |

---

## 快速开始

### 1. 安装依赖 + Playwright 浏览器

```bash
node setup.js
```

> **中国用户**（npm/Playwright 下载慢）：
> ```bash
> node setup.js --mirror
> ```

### 2. 启动游戏服务（确保游戏在对应端口运行）

```bash
# 示例：在 kids-game-project-v5 目录启动各游戏
cd ../plane-shooter && npm run dev
cd ../snake        && npm run dev
# ... 其他游戏同理
```

### 3. 运行测试

```bash
npm run test:all:headless      # 无头模式，测试全部游戏
npm run test:all:parallel      # 并发模式（更快）
node src/index.js --game=snake # 测试单个游戏
```

### 4. 启动完整流水线（推荐）

```bash
npm run pipeline:ci            # 扫描→生成→执行→报告（CI 推荐）
npm run dashboard              # 启动 Web 监控面板并自动打开浏览器
```

---

## 完整流水线（Pipeline）

Pipeline 将自动完成：**扫描游戏代码 → 生成测试用例 → 创建任务 → 监控执行**。

```bash
# 基础运行
node src/pipeline.js

# 常用组合
node src/pipeline.js --headless --report                  # 无头 + HTML 报告
node src/pipeline.js --headless --report --junit          # 额外生成 JUnit XML（CI 集成）
node src/pipeline.js --api-mode --headless --report       # UI + API 双测
node src/pipeline.js --api-only --junit                   # 纯 API 测试
node src/pipeline.js --dashboard --dashboard-open         # 实时监控面板

# npm 快捷命令
npm run pipeline              # 基础运行
npm run pipeline:headless     # 无头 + HTML 报告
npm run pipeline:ci           # CI 推荐（P0+P1 + JUnit + 并发=2）
npm run pipeline:api          # API+UI 双测
npm run pipeline:api-only     # 纯 API 测试
npm run dashboard             # 监控面板（自动打开浏览器）
npm run dashboard:ci          # CI 监控模式（无头 + JUnit + 报告）
```

### Pipeline CLI 参数

| 参数 | 说明 | 默认值 |
|---|---|---|
| `--headless` | 无头浏览器（CI 推荐） | false |
| `--concurrency <n>` | 并发任务数 | 1 |
| `--priority <p>` | 优先级过滤 P0/P1/P2 | P0,P1,P2 |
| `--scan-only` | 只扫描代码 | - |
| `--generate-only` | 扫描+生成用例 | - |
| `--clear-tasks` | 执行前清空完成任务 | - |
| `--report` | 生成 HTML 报告 | - |
| `--junit` | 生成 JUnit XML（CI）| - |
| `--csv` | 生成 CSV 报告 | - |
| `--api-mode` | UI + API 双测 | - |
| `--api-only` | 纯 API 测试 | - |
| `--backend-url <url>` | 后端地址 | http://localhost:8080 |
| `--backend-user <u>` | 后端用户名 | admin |
| `--backend-pass <p>` | 后端密码 | admin123 |
| `--dashboard` | 启动 Web 监控面板 | - |
| `--dashboard-port <n>` | 面板端口 | 9090 |
| `--dashboard-open` | 自动打开浏览器 | - |
| `--report-backend` | 将结果上报至后端 | - |

---

## Web 监控面板

启动后可在浏览器中实时查看所有测试任务的执行状态：

```bash
# 方式一：pipeline 附带启动
node src/pipeline.js --headless --dashboard --dashboard-open

# 方式二：npm 快捷命令
npm run dashboard
```

面板功能：
- **实时 SSE 推送**：任务状态变化即时展示，无需手动刷新
- **状态过滤**：按 RUNNING / QUEUED / PASSED / FAILED 过滤
- **游戏名搜索**：快速定位指定游戏的任务
- **进度条**：展示每个任务的用例执行进度
- **日志查看**：点击「日志」按钮查看任务详细运行日志
- **重试**：对已完成任务点击「↺ 重试」重新加入队列

默认地址：`http://localhost:9090`

---

## 后端 API 对接

平台支持与 kids-game-backend（Spring Boot，端口 8080）集成：

```bash
# 启动时连接后端，获取游戏列表并执行 API 测试
node src/pipeline.js --api-mode --backend-url=http://localhost:8080

# 只跑 API 测试（不启动浏览器）
node src/pipeline.js --api-only --backend-url=http://localhost:8080
```

**API 测试用例（自动生成）：**

| 类型 | 用例 | 断言 |
|---|---|---|
| 全局 | 登录接口 / 游戏列表 / 今日统计 / 仪表盘 | HTTP 2xx + 业务 code + 字段验证 |
| 游戏级 | 游戏详情 / 按 code 查询 / 配置 / 启动会话 | 字段存在 + 类型 + 响应时间 |
| 安全 | 未授权访问 | HTTP 401/403 |

后端不可达时，所有 API 任务自动 **SKIPPED**，流水线正常完成。

---

## 测试结果上报

### JUnit XML（推荐 CI 使用）

```bash
node src/pipeline.js --junit
```

生成到 `reports/junit-{timestamp}.xml`，可直接导入 Jenkins / GitLab CI / GitHub Actions：

```yaml
# GitLab CI 示例
test:
  script:
    - node src/pipeline.js --headless --junit
  artifacts:
    reports:
      junit: reports/junit-*.xml
```

### CSV 报告

```bash
node src/pipeline.js --csv
```

生成到 `reports/test-results-{timestamp}.csv`，含 BOM 可直接用 Excel 打开。

### 上报后端 API

```bash
node src/pipeline.js --api-mode --report-backend
```

测试完成后将汇总结果 POST 到 `POST /api/test/report`。

---

### setup.js 参数

| 参数 | 说明 |
|------|------|
| `(无参数)` | 安装 npm 依赖 + Chromium + 验证 |
| `--all-browsers` | 安装 Chromium + Firefox + WebKit |
| `--skip-browsers` | 仅安装 npm 依赖，不下载浏览器 |
| `--check-only` | 仅检测环境，不安装任何内容 |
| `--force` | 强制重新安装浏览器 |
| `--skip-verify` | 跳过安装后冒烟测试 |
| `--mirror` | 使用 npmmirror.com 加速（推荐国内用户）|
| `--verbose` | 显示详细安装日志 |

```bash
node setup.js --check-only      # 仅检测环境
node setup.js --force           # 强制重新安装浏览器
node setup.js --all-browsers    # 安装全部浏览器
node setup.js --mirror          # 镜像加速安装
```

### 手动安装浏览器

```bash
npm run install:browsers         # 安装 Chromium
npm run install:browsers:all     # 安装全部浏览器
npx playwright install chromium  # 等价命令
```

---

## 运行测试

### npm 脚本

```bash
# 基础测试
npm run test:all             # 全部游戏（有头模式）
npm run test:all:headless    # 全部游戏（无头，CI 推荐）
npm run test:all:parallel    # 全部游戏（并发无头，最快）

# 单游戏
npm run test:game            # 需配合 --game 参数
node src/index.js --game=snake --headless

# 视频录制
npm run test:record          # 全部游戏 + 录制视频
node src/index.js --game=snake --record

# 工具
npm run setup:check          # 检测环境
npm run clean                # 清理 reports/screenshots/videos
```

### CLI 参数

```bash
node src/index.js [options]

  --mode <mode>       测试模式：all | single | performance | ai  (default: all)
  --game <name>       指定游戏 key（见上方表格）
  --headless          无头模式（无浏览器窗口）
  --record            录制测试视频（保存到 videos/）
  --parallel          并发测试所有游戏
  --timeout <ms>      全局超时，单位毫秒  (default: 60000)
  --config <path>     自定义配置文件路径
  -V, --version       输出版本号
```

**示例：**

```bash
# 无头 + 录制
node src/index.js --game=plane-shooter --headless --record

# 并发 + 自定义超时
node src/index.js --mode=all --parallel --headless --timeout=90000

# 使用自定义配置
node src/index.js --config=./my-config.json

# 开启调试日志
DEBUG=1 node src/index.js --game=snake
```

---

## 配置说明

配置文件：`config/test-config.json`

### 浏览器配置

```json
{
  "browser": {
    "engine": "chromium",          // chromium | firefox | webkit
    "defaultViewport": { "width": 1920, "height": 1080 },
    "timeout": 60000,              // 默认超时（ms）
    "slowMo": 0,                   // 操作间延迟（ms，调试用）
    "recordVideo": false           // 全局视频录制开关
  }
}
```

### 性能阈值

```json
{
  "performance": {
    "thresholds": {
      "loadTime": 5000,     // 页面加载时间上限（ms）
      "frameRate": 30,      // 最低帧率（FPS）
      "memoryUsage": 512,   // 最大内存（MB）
      "lcpTime": 2500       // Largest Contentful Paint（ms）
    }
  }
}
```

### 添加新游戏

在 `config/test-config.json` 的 `games` 对象中添加：

```json
{
  "games": {
    "my-new-game": {
      "name": "My New Game (新游戏)",
      "url": "http://localhost:3006/",
      "type": "arcade",
      "testScenarios": [
        "start_screen",
        "movement_control",
        "collision_detection"
      ]
    }
  }
}
```

支持的 `testScenarios`：

| 场景 | 说明 |
|------|------|
| `start_screen` | 检测开始页面和按钮 |
| `difficulty_selection` | 检测难度选择 |
| `theme_selection` | 检测皮肤/主题切换 |
| `gameplay_flow` | 点击开始并检测游戏激活 |
| `shooting_mechanism` | Space 键射击 |
| `movement_control` | 方向键移动 |
| `collision_detection` | 碰撞检测基础验证 |
| `plant_placement` | 点击格子放置植物（PvZ） |
| `food_collection` | 食物/物品收集（贪吃蛇） |

---

## 环境变量

可通过环境变量或项目根目录的 `.env` 文件覆盖配置：

```bash
# 浏览器
BROWSER_ENGINE=firefox        # 使用 Firefox 引擎
TEST_TIMEOUT=90000            # 全局超时（ms）
TEST_RECORD=true              # 开启视频录制

# 游戏 URL 覆盖（适用于 CI 环境）
GAME_URL_SNAKE=http://10.0.1.5:3005/
GAME_URL_PLANE_SHOOTER=http://10.0.1.5:8081/

# 性能阈值覆盖
PERF_LOAD_TIME=8000           # 允许更慢的加载时间
PERF_FRAME_RATE=24            # 允许更低的帧率

# AI 分析
AI_ENABLED=false              # 禁用 AI 分析
```

`.env` 文件示例（项目根目录）：

```dotenv
BROWSER_ENGINE=chromium
TEST_TIMEOUT=60000
TEST_RECORD=false
GAME_URL_SNAKE=http://localhost:3005/
AI_ENABLED=true
```

> **优先级**：系统环境变量 > `.env` 文件 > `config/test-config.json`

---

## 测试报告

测试完成后，报告保存在 `reports/` 目录：

| 格式 | 文件 | 说明 |
|------|------|------|
| HTML | `report-YYYY-MM-DD.html` | 可视化报告，可直接浏览器打开 |
| JSON | `report-YYYY-MM-DD.json` | 原始数据，可供 CI/CD 解析 |
| Excel | `report-YYYY-MM-DD.xlsx` | 电子表格，便于分享和对比 |

其他产物：

- `screenshots/` — 测试失败时自动截图
- `videos/` — 开启 `--record` 时的录制视频

---

## 项目结构

```
kids-game-auto-test/
├── config/
│   └── test-config.json        # 主配置文件
├── src/
│   ├── index.js                # CLI 入口
│   ├── orchestrator.js         # 测试协调器（核心）
│   ├── game-simulator.js       # Playwright 游戏操作
│   ├── performance-monitor.js  # 性能指标采集
│   ├── log-analyzer.js         # 浏览器日志收集
│   ├── ai-experience-analyzer.js  # AI 体验评分
│   ├── report-generator.js     # 报告生成（HTML/JSON/Excel）
│   ├── config/
│   │   └── config-loader.js    # 配置加载 + 环境变量覆盖
│   └── utils/
│       ├── logger.js           # Winston 日志
│       └── helpers.js          # 工具函数（withRetry / sleep 等）
├── reports/                    # 测试报告输出
├── screenshots/                # 失败截图
├── videos/                     # 录制视频
├── setup.js                    # 安装脚本
└── package.json
```

---

## 常见问题

### Q: Playwright 浏览器下载很慢？

```bash
node setup.js --mirror
# 或者手动设置镜像：
set PLAYWRIGHT_DOWNLOAD_HOST=https://npmmirror.com/mirrors/playwright/
npx playwright install chromium
```

### Q: 游戏页面加载超时？

在 `config/test-config.json` 中增加超时时间：

```json
{ "browser": { "timeout": 90000 } }
```

或者用环境变量临时覆盖：

```bash
TEST_TIMEOUT=120000 node src/index.js --game=snake
```

### Q: 测试显示 `WARNED` 状态？

`WARNED` 表示无严重错误，但有性能阈值超标或控制台警告。查看 HTML 报告了解具体问题。

### Q: 如何只跑性能测试？

```bash
node src/index.js --mode=performance
```

### Q: 并发模式下浏览器内存占用过高？

并发模式 (`--parallel`) 会为每个游戏启动独立浏览器实例。  
可改为串行模式：

```bash
node src/index.js --mode=all --headless   # 不加 --parallel
```

### Q: `npm install` 报错（Windows）？

以管理员权限运行：

```powershell
# 在 PowerShell 管理员模式下
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
node setup.js
```

---

## 技术架构

```
CLI (index.js)
    └── TestOrchestrator
           ├── GameSimulator       ← Playwright: browser/context/page
           ├── PerformanceMonitor  ← Navigation Timing + page.metrics()
           ├── LogAnalyzer         ← console/request/response/pageerror
           ├── AIExperienceAnalyzer
           └── ReportGenerator     ← HTML / JSON / Excel
```

**Playwright 三层模型：**

```
chromium.launch()
  └── browser.newContext({ viewport, recordVideo? })
         └── context.newPage()
                └── page.goto() → test scenarios → page.video().path()
```

---

*最后更新：2026-03-27 | v1.2.0*
