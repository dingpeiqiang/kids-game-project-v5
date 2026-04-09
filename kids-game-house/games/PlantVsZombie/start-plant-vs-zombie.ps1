# PlantVsZombie Vite 启动脚本
Write-Host "🌻 正在启动 PlantVsZombie 游戏 (Vite 模式)..." -ForegroundColor Green
Write-Host ""

# 检查 node_modules 是否存在
if (-not (Test-Path "node_modules")) {
    Write-Host "⚠️  检测到未安装依赖，正在安装..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ 依赖安装失败！" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ 依赖安装完成" -ForegroundColor Green
    Write-Host ""
}

# 生成资产（如果尚未生成）
if (-not (Test-Path "public/assets")) {
    Write-Host "🎨 正在生成游戏资产..." -ForegroundColor Yellow
    npm run assets:generate
    if ($LASTEXITCODE -ne 0) {
        Write-Host "⚠️  资产生成失败，但将继续启动..." -ForegroundColor Yellow
    } else {
        Write-Host "✅ 资产生成完成" -ForegroundColor Green
    }
    Write-Host ""
}

# 编译关卡数据（如果存在）
if (Test-Path "data/levels") {
    Write-Host "📋 正在编译关卡数据..." -ForegroundColor Yellow
    npm run levels:compile
    if ($LASTEXITCODE -ne 0) {
        Write-Host "⚠️  关卡编译失败，但将继续启动..." -ForegroundColor Yellow
    } else {
        Write-Host "✅ 关卡编译完成" -ForegroundColor Green
    }
    Write-Host ""
}

Write-Host "🚀 启动 Vite 开发服务器..." -ForegroundColor Cyan
Write-Host "📍 游戏将在 http://localhost:5176 运行" -ForegroundColor Cyan
Write-Host "💡 提示: 按 Ctrl+C 停止服务器" -ForegroundColor Gray
Write-Host ""

npm run dev
