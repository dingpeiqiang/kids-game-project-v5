# 俄罗斯方块游戏 - 完整实现脚本
# PowerShell 版本

$ErrorActionPreference = "Stop"

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "俄罗斯方块游戏 - 完整实现" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$tetrisDir = Join-Path $projectRoot "tetris"
$snakeDir = Join-Path $projectRoot "games\snake"

# ========== 步骤 1: 生成资源 ==========
Write-Host "[步骤 1/5] 生成游戏资源..." -ForegroundColor Yellow
Set-Location $tetrisDir

# 检查 Node.js
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js 已安装：$nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ 未检测到 Node.js，请先安装 Node.js" -ForegroundColor Red
    exit 1
}

# 安装依赖并生成资源
if (-not (Test-Path "node_modules")) {
    Write-Host "正在安装依赖..." -ForegroundColor Gray
    & npm install
}

Write-Host "正在生成资源..." -ForegroundColor Gray
& node generate-resources.mjs

Write-Host "✅ 资源生成完成" -ForegroundColor Green
Write-Host ""

# ========== 步骤 2: 复制贪吃蛇代码 ==========
Write-Host "[步骤 2/5] 复制贪吃蛇代码..." -ForegroundColor Yellow
$destSnakeDir = Join-Path $tetrisDir "snake"

if (Test-Path $destSnakeDir) {
    Write-Host "正在删除旧版本..." -ForegroundColor Gray
    Remove-Item $destSnakeDir -Recurse -Force
}

Write-Host "正在复制代码..." -ForegroundColor Gray
Copy-Item -Path $snakeDir -Destination $destSnakeDir -Recurse -Force

# 清理 node_modules
$nodeModulesPath = Join-Path $destSnakeDir "node_modules"
if (Test-Path $nodeModulesPath) {
    Write-Host "正在清理 node_modules..." -ForegroundColor Gray
    Remove-Item $nodeModulesPath -Recurse -Force
}

Write-Host "✅ 代码复制完成" -ForegroundColor Green
Write-Host ""

# ========== 步骤 3: 修改配置文件 ==========
Write-Host "[步骤 3/5] 修改配置文件..." -ForegroundColor Yellow

# 修改 package.json
$packageJsonPath = Join-Path $destSnakeDir "package.json"
if (Test-Path $packageJsonPath) {
    $packageJson = Get-Content $packageJsonPath -Raw | ConvertFrom-Json
    $packageJson.name = "tetris"
    $packageJson.description = "俄罗斯方块游戏"
    $packageJson | ConvertTo-Json -Depth 100 | Out-File $packageJsonPath -Encoding UTF8 -NoNewline
    Write-Host "✅ package.json 已更新" -ForegroundColor Green
}

# ========== 步骤 4: 替换游戏逻辑 ==========
Write-Host "[步骤 4/5] 替换游戏逻辑..." -ForegroundColor Yellow

# 复制模板文件到目标位置
$templateFile = Join-Path $tetrisDir "PhaserGame_TEMPLATE.ts"
$targetFile = Join-Path $destSnakeDir "src\phaser\PhaserGame.ts"

if (Test-Path $templateFile) {
    # 备份原文件
    if (Test-Path $targetFile) {
        Copy-Item $targetFile "$targetFile.bak"
        Write-Host "✅ 原 PhaserGame.ts 已备份" -ForegroundColor Green
    }
    
    # 复制新文件
    Copy-Item $templateFile $targetFile
    Write-Host "✅ PhaserGame.ts 已替换为俄罗斯方块逻辑" -ForegroundColor Green
} else {
    Write-Host "⚠️  找不到模板文件：$templateFile" -ForegroundColor Yellow
}

# ========== 步骤 5: 修改 UI 文本 ==========
Write-Host "[步骤 5/5] 修改 UI 文本..." -ForegroundColor Yellow

$startViewPath = Join-Path $destSnakeDir "src\views\StartView.vue"
if (Test-Path $startViewPath) {
    $content = Get-Content $startViewPath -Raw -Encoding UTF8
    $content = $content -replace '贪吃蛇', '俄罗斯方块'
    $content = $content -replace 'Snake', 'Tetris'
    $content = $content -replace 'snake', 'tetris'
    Set-Content $startViewPath $content -Encoding UTF8 -NoNewline
    Write-Host "✅ StartView.vue 已更新" -ForegroundColor Green
}

Write-Host ""

# ========== 验证结果 ==========
Write-Host "[验证] 检查结果..." -ForegroundColor Yellow
$validationPassed = $true

# 检查资源文件
$publicDir = Join-Path $tetrisDir "public\themes\default"
if (Test-Path $publicDir) {
    $imageCount = (Get-ChildItem -Path (Join-Path $publicDir "images") -Recurse -File).Count
    $audioCount = (Get-ChildItem -Path (Join-Path $publicDir "audio") -Recurse -File).Count
    Write-Host "✅ 图片资源：$imageCount 张" -ForegroundColor Green
    Write-Host "✅ 音频资源：$audioCount 首" -ForegroundColor Green
} else {
    Write-Host "❌ 资源目录不存在" -ForegroundColor Red
    $validationPassed = $false
}

# 检查代码文件
if (Test-Path $targetFile) {
    Write-Host "✅ PhaserGame.ts 已创建" -ForegroundColor Green
} else {
    Write-Host "❌ PhaserGame.ts 不存在" -ForegroundColor Red
    $validationPassed = $false
}

# 检查 GTRS 配置
$gtrsPath = Join-Path $destSnakeDir "src\config\GTRS.json"
if (Test-Path $gtrsPath) {
    Write-Host "✅ GTRS.json 已生成" -ForegroundColor Green
} else {
    Write-Host "❌ GTRS.json 不存在" -ForegroundColor Red
    $validationPassed = $false
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan

if ($validationPassed) {
    Write-Host "✅ 俄罗斯方块游戏初始化完成!" -ForegroundColor Green
    Write-Host ""
    Write-Host "下一步操作:" -ForegroundColor Cyan
    Write-Host "1. 进入目录：cd tetris\snake" -ForegroundColor White
    Write-Host "2. 安装依赖：npm install" -ForegroundColor White
    Write-Host "3. 启动开发：npm run dev" -ForegroundColor White
    Write-Host "4. 访问地址：http://localhost:3002" -ForegroundColor White
    Write-Host ""
    Write-Host "游戏操作:" -ForegroundColor Cyan
    Write-Host "  ← → 或 A D : 左右移动" -ForegroundColor White
    Write-Host "  ↑ 或 W : 旋转" -ForegroundColor White
    Write-Host "  ↓ 或 S : 加速下落" -ForegroundColor White
    Write-Host "  空格 : 直接掉落到底部" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host "⚠️  初始化过程中出现错误，请检查上方错误信息" -ForegroundColor Yellow
}

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "按任意键继续..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
