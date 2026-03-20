# 清理并重新下载腾讯云 SDK 依赖
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "修复腾讯云 SDK 依赖" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/4] 清理本地 Maven 仓库中的腾讯云相关缓存..." -ForegroundColor Yellow
Remove-Item -Path "$env:USERPROFILE\.m2\repository\com\qcloud\cos-sts" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "$env:USERPROFILE\.m2\repository\com\qcloud\cos_sts" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "$env:USERPROFILE\.m2\repository\com\qcloud\cos_api" -Recurse -Force -ErrorAction SilentlyContinue
Write-Host "✅ 清理完成" -ForegroundColor Green
Write-Host ""

Write-Host "[2/4] 清理项目构建..." -ForegroundColor Yellow
mvn clean -q
Write-Host "✅ 清理完成" -ForegroundColor Green
Write-Host ""

Write-Host "[3/4] 下载依赖并编译项目..." -ForegroundColor Yellow
mvn install -DskipTests

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "✅ 编译成功！" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "❌ 编译失败，请检查上面的错误信息" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
}

Write-Host ""
Write-Host "按任意键退出..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
