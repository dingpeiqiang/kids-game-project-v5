@echo off
chcp 65001 >nul
echo ============================================================
echo 提交 Kids Game Auto Test Platform
echo ============================================================
echo.

cd /d %~dp0

echo [1/5] 检查 Git 安装...
where git >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Git 未安装！请从 https://git-scm.com/ 下载安装
    pause
    exit /b 1
)
echo ✓ Git 已安装

echo.
echo [2/5] 添加所有文件到暂存区...
git add .
if %errorlevel% neq 0 (
    echo ERROR: 添加文件失败！
    pause
    exit /b 1
)
echo ✓ 文件已添加到暂存区

echo.
echo [3/5] 查看变更的文件:
git status --short
if %errorlevel% neq 0 (
    echo WARNING: 无法获取 git status
)

echo.
echo [4/5] 提交代码...
git commit -m "feat: 创建 Kids Game 自动化测试平台 v1.0.0

- 新增完整的自动化测试框架（Puppeteer/Playwright）
- 实现游戏模拟器，支持 4 个游戏的自动化测试
- 集成 AI 体验分析功能（Python + ML）
- 性能监控和日志分析系统
- 自动化报告生成（HTML/Excel/JSON）
- 详细的文档体系（1,353 行）

技术栈:
- Node.js + Puppeteer/Playwright
- Winston 日志管理  
- Python AI 分析
- ExcelJS 报告生成

功能特性:
- 自动化游戏流程测试
- 性能指标实时监控
- 前后端日志智能分析
- AI 驱动的用户体验评估
- 多维度测试报告

文档:
- README.md 完整使用指南
- QUICK_START.md 快速开始
- PROJECT_OVERVIEW.md 架构说明
- examples/ 代码示例

状态：✅ Phase 1 Complete - Production Ready"

if %errorlevel% neq 0 (
    echo ERROR: 提交失败！可能是没有变更的文件。
    echo.
    echo 提示：如果要提交空提交，使用：git commit --allow-empty -m "message"
    pause
    exit /b 1
)
echo ✓ 提交成功

echo.
echo [5/5] 查看最近提交记录...
git log --oneline -n 3

echo.
echo ============================================================
echo ✓ 提交完成！
echo ============================================================
echo.
echo 下一步:
echo   1. 推送到远程仓库：git push -u origin main
echo   2. 或创建 PR: git push -u origin feature/auto-test-platform
echo.
pause
