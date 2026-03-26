# 清理并重新安装依赖的 PowerShell 脚本
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "snake-vue3 项目依赖修复工具" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 切换到当前目录
Set-Location $PSScriptRoot

# 检查 node_modules 是否存在
if (Test-Path "node_modules") {
    Write-Host "[检查] 发现 node_modules 目录" -ForegroundColor Yellow
    
    # 检查 vite 是否存在
    if (-not (Test-Path "node_modules\vite")) {
        Write-Host "[警告] vite 未安装，需要重新安装依赖" -ForegroundColor Red
        Write-Host ""
        Write-Host "正在删除旧的 node_modules..." -ForegroundColor Yellow
        Remove-Item -Recurse -Force "node_modules" -ErrorAction SilentlyContinue
        
        if (Test-Path "package-lock.json") {
            Write-Host "正在删除 package-lock.json..." -ForegroundColor Yellow
            Remove-Item -Force "package-lock.json" -ErrorAction SilentlyContinue
        }
    } else {
        Write-Host "[检查] vite 已存在" -ForegroundColor Green
    }
} else {
    Write-Host "[检查] node_modules 不存在" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "开始安装依赖..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 执行 npm install
npm install

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "依赖安装成功！" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "正在启动开发服务器..." -ForegroundColor Cyan
    Write-Host ""
    
    # 启动开发服务器
    npm run dev
} else {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "依赖安装失败！请检查网络连接和 Node.js 版本" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "建议：" -ForegroundColor Yellow
    Write-Host "1. 检查 Node.js 是否安装：node -v" -ForegroundColor White
    Write-Host "2. 检查 npm 是否可用：npm -v" -ForegroundColor White
    Write-Host "3. 尝试使用淘宝镜像：npm config set registry https://registry.npmmirror.com" -ForegroundColor White
    Write-Host ""
    pause
}
