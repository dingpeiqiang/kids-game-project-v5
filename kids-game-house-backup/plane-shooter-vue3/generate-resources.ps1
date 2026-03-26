# ============================================
# 飞机大战游戏资源生成脚本
# 说明：安装依赖并生成所有游戏资源
# 创建时间：2026-03-26
# ============================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🎮 飞机大战 资源生成器" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 获取当前脚本所在目录
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
cd $scriptDir

Write-Host "📂 工作目录：$scriptDir" -ForegroundColor Yellow
Write-Host ""

# 步骤 1: 检查 Node.js
Write-Host "📋 步骤 1: 检查 Node.js 环境..." -ForegroundColor Green
if (Get-Command node -ErrorAction SilentlyContinue) {
    $nodeVersion = node --version
    Write-Host "✅ Node.js 已安装：$nodeVersion" -ForegroundColor Green
} else {
    Write-Host "❌ Node.js 未安装，请先安装 Node.js" -ForegroundColor Red
    Write-Host "下载地址：https://nodejs.org/" -ForegroundColor Yellow
    pause
    exit 1
}

# 步骤 2: 安装依赖
Write-Host ""
Write-Host "📦 步骤 2: 安装 Sharp 依赖..." -ForegroundColor Green
npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ 依赖安装失败" -ForegroundColor Red
    pause
    exit 1
}

Write-Host "✅ 依赖安装完成" -ForegroundColor Green

# 步骤 3: 生成资源
Write-Host ""
Write-Host "🎨 步骤 3: 开始生成游戏资源..." -ForegroundColor Green
node generate-resources.mjs

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ 资源生成失败" -ForegroundColor Red
    pause
    exit 1
}

# 步骤 4: 验证输出
Write-Host ""
Write-Host "✅ 步骤 4: 验证生成的文件..." -ForegroundColor Green

$publicDir = Join-Path $scriptDir "..\public\themes\default"
$srcConfigDir = Join-Path $scriptDir "..\src\config"

$checks = @(
    @{Path = Join-Path $publicDir "assets\scene\background.png"; Name = "背景图片"},
    @{Path = Join-Path $publicDir "assets\scene\stars.png"; Name = "星空图片"},
    @{Path = Join-Path $publicDir "assets\sprite\player_plane.png"; Name = "玩家飞机"},
    @{Path = Join-Path $publicDir "assets\audio\bgm_main.wav"; Name = "背景音乐"},
    @{Path = Join-Path $publicDir "GTRS.json"; Name = "GTRS 配置"},
    @{Path = Join-Path $srcConfigDir "GTRS.json"; Name = "源代码配置"}
)

$allPassed = $true
foreach ($check in $checks) {
    if (Test-Path $check.Path) {
        Write-Host "  ✅ $($check.Name): 存在" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $($check.Name): 缺失" -ForegroundColor Red
        $allPassed = $false
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
if ($allPassed) {
    Write-Host "🎉 所有资源生成成功！" -ForegroundColor Green
    Write-Host ""
    Write-Host "📂 输出位置:" -ForegroundColor Yellow
    Write-Host "  - 公共资源：$publicDir" -ForegroundColor White
    Write-Host "  - 配置文件：$srcConfigDir" -ForegroundColor White
    Write-Host ""
    Write-Host "下一步操作:" -ForegroundColor Yellow
    Write-Host "  1. 复制 plane-shooter-vue3 整个项目目录" -ForegroundColor White
    Write-Host "  2. 修改 package.json 中的游戏名称" -ForegroundColor White
    Write-Host "  3. 实现 Phaser 游戏逻辑" -ForegroundColor White
    Write-Host "  4. 执行 register-game.sql 注册到数据库" -ForegroundColor White
} else {
    Write-Host "⚠️  部分文件生成失败，请检查错误信息" -ForegroundColor Yellow
}
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

pause
