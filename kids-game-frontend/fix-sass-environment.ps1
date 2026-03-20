# 修复 Sass 环境问题 - PowerShell 脚本
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "修复 Sass 环境问题" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/4] 删除 node_modules 目录..." -ForegroundColor Yellow
try {
    Remove-Item -Path "node_modules" -Recurse -Force -ErrorAction Stop
    Write-Host "✓ node_modules 已删除" -ForegroundColor Green
} catch {
    Write-Host "✗ 删除 node_modules 失败，请手动删除后重试" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Read-Host "按 Enter 退出"
    exit 1
}
Write-Host ""

Write-Host "[2/4] 删除 package-lock.json..." -ForegroundColor Yellow
try {
    Remove-Item -Path "package-lock.json" -Force -ErrorAction SilentlyContinue
    Write-Host "✓ package-lock.json 已删除" -ForegroundColor Green
} catch {
    Write-Host "⚠ 警告：删除 package-lock.json 失败" -ForegroundColor Yellow
}
Write-Host ""

Write-Host "[3/4] 清理 npm 缓存..." -ForegroundColor Yellow
npm cache clean --force
Write-Host "✓ npm 缓存已清理" -ForegroundColor Green
Write-Host ""

Write-Host "[4/4] 重新安装依赖..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "✗ 安装依赖失败，请检查网络连接" -ForegroundColor Red
    Read-Host "按 Enter 退出"
    exit 1
}
Write-Host "✓ 依赖安装成功" -ForegroundColor Green
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "修复完成！" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "现在可以运行 'npm run dev' 启动项目" -ForegroundColor Green
Read-Host "按 Enter 退出"
