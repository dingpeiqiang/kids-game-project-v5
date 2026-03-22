# =====================================================
# 导出数据库 DDL 脚本 (PowerShell 版本)
# =====================================================

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "正在导出数据库 DDL..." -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# 设置数据库配置（从环境变量读取）
$dbHost = if ($env:DB_HOST) { $env:DB_HOST } else { "106.54.7.205" }
$dbPort = if ($env:DB_PORT) { $env:DB_PORT } else { "3306" }
$dbUser = if ($env:DB_USER) { $env:DB_USER } else { "kidsgame" }
$dbPassword = if ($env:DB_PASSWORD) { $env:DB_PASSWORD } else { "" }
$dbName = if ($env:DB_NAME) { $env:DB_NAME } else { "kidgame" }

# 检查密码是否设置
if (-not $dbPassword) {
    Write-Host "错误: 请设置环境变量 DB_PASSWORD" -ForegroundColor Red
    Write-Host "示例: $env:DB_PASSWORD='your_password'; .\export-ddl.ps1" -ForegroundColor Yellow
    exit 1
}

# 生成输出文件名
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$outputFile = "database_ddl_export_$timestamp.sql"

Write-Host "数据库：$dbName" -ForegroundColor Yellow
Write-Host "主机：$dbHost`:$dbPort" -ForegroundColor Yellow
Write-Host "输出文件：$outputFile" -ForegroundColor Yellow
Write-Host ""

# MySQL 命令
$mysqlCmd = @"
SET FOREIGN_KEY_CHECKS = 0;
"@

try {
    # 获取所有表名
    Write-Host "正在连接数据库并获取表列表..." -ForegroundColor Green
    $tablesQuery = "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = '$dbName' ORDER BY TABLE_NAME"
    
    # 使用 mysql 命令行工具导出
    $env:MYSQL_PWD = $dbPassword
    
    # 导出文件头
    $header = @"
-- =====================================================
-- 数据库 DDL 导出
-- 数据库：$dbName
-- 导出时间：$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
-- =====================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

"@
    
    Set-Content -Path $outputFile -Value $header -Encoding UTF8
    
    # 导出每个表的 DDL
    Write-Host "正在导出表结构..." -ForegroundColor Green
    
    $mysqldumpPath = "mysqldump"
    
    # 检查是否有 mysqldump
    if (Get-Command $mysqldumpPath -ErrorAction SilentlyContinue) {
        Write-Host "使用 mysqldump 导出..." -ForegroundColor Yellow
        
        & $mysqldumpPath -h $dbHost -P $dbPort -u $dbUser -p"$dbPassword" --no-data --skip-add-drop-table --complete-insert --compact $dbName | Out-File -FilePath $outputFile -Append -Encoding UTF8
        
        Write-Host "`n======================================" -ForegroundColor Cyan
        Write-Host "DDL 导出完成！" -ForegroundColor Green
        Write-Host "输出文件：$outputFile" -ForegroundColor Cyan
        Write-Host "======================================" -ForegroundColor Cyan
    } else {
        Write-Host "未找到 mysqldump，使用 Python 脚本导出..." -ForegroundColor Yellow
        Write-Host ""
        
        # 调用 Python 脚本
        & python export_database_ddl.py
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "`n======================================" -ForegroundColor Cyan
            Write-Host "DDL 导出成功完成！" -ForegroundColor Green
            Write-Host "======================================" -ForegroundColor Cyan
        } else {
            Write-Host "`n======================================" -ForegroundColor Red
            Write-Host "DDL 导出失败，错误代码：$LASTEXITCODE" -ForegroundColor Red
            Write-Host "======================================" -ForegroundColor Red
        }
    }
    
} catch {
    Write-Host "`n======================================" -ForegroundColor Red
    Write-Host "导出失败：$_" -ForegroundColor Red
    Write-Host "======================================" -ForegroundColor Red
} finally {
    Remove-Item Env:\MYSQL_PWD -ErrorAction SilentlyContinue
}

Write-Host ""
Read-Host "按回车键退出"
