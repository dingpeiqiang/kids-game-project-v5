# 🚀 飞机大战游戏 - 快速启动脚本
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "🎮 飞机大战游戏启动检查" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

$gameDir = "games\plane-shooter"
$port = 8085

# 1. 检查是否在正确的目录
Write-Host "📂 检查目录结构..." -ForegroundColor Yellow
if (Test-Path $gameDir) {
    Write-Host "✅ 游戏目录存在：$gameDir" -ForegroundColor Green
} else {
    Write-Host "❌ 游戏目录不存在！" -ForegroundColor Red
    Write-Host "请确保在 kids-game-house 目录下运行此脚本" -ForegroundColor Yellow
    exit 1
}

# 2. 检查 package.json
Write-Host ""
Write-Host "📄 检查配置文件..." -ForegroundColor Yellow
if (Test-Path "$gameDir\package.json") {
    $packageJson = Get-Content "$gameDir\package.json" -Raw | ConvertFrom-Json
    Write-Host "✅ 游戏名称：$($packageJson.name)" -ForegroundColor Green
    Write-Host "✅ 游戏描述：$($packageJson.description)" -ForegroundColor Green
    
    if ($packageJson.name -eq "plane-shooter-game") {
        Write-Host "✅ 配置正确，这是飞机大战游戏！" -ForegroundColor Green
    } else {
        Write-Host "⚠️  配置可能不正确，请检查 package.json" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ package.json 不存在！" -ForegroundColor Red
    exit 1
}

# 3. 检查关键文件
Write-Host ""
Write-Host "🔍 检查关键文件..." -ForegroundColor Yellow

$requiredFiles = @(
    "src\views\GameView.vue",
    "src\phaser\PhaserGame.ts",
    "src\router\index.ts",
    "public\themes\default\GTRS.json"
)

$allFilesExist = $true
foreach ($file in $requiredFiles) {
    $filePath = Join-Path $gameDir $file
    if (Test-Path $filePath) {
        Write-Host "✅ $file" -ForegroundColor Green
    } else {
        Write-Host "❌ $file (缺失)" -ForegroundColor Red
        $allFilesExist = $false
    }
}

if (-not $allFilesExist) {
    Write-Host ""
    Write-Host "⚠️  部分关键文件缺失，可能影响游戏运行" -ForegroundColor Yellow
}

# 4. 检查 node_modules
Write-Host ""
Write-Host "📦 检查依赖安装..." -ForegroundColor Yellow
if (Test-Path "$gameDir\node_modules") {
    Write-Host "✅ 依赖已安装" -ForegroundColor Green
} else {
    Write-Host "⚠️  依赖未安装，正在自动安装..." -ForegroundColor Yellow
    Write-Host ""
    
    Set-Location $gameDir
    npm install
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ 依赖安装完成" -ForegroundColor Green
    } else {
        Write-Host "❌ 依赖安装失败！" -ForegroundColor Red
        Write-Host "请手动运行：cd $gameDir; npm install" -ForegroundColor Yellow
        Set-Location ..
        exit 1
    }
    
    Set-Location ..
}

# 5. 启动开发服务器
Write-Host ""
Write-Host "🚀 启动开发服务器..." -ForegroundColor Green
Write-Host "端口：http://localhost:$port" -ForegroundColor Cyan
Write-Host ""
Write-Host "按 Ctrl+C 可停止服务器" -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

Set-Location $gameDir
npm run dev
