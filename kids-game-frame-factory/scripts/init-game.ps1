# =============================================================================
# 新游戏初始化脚本（Windows PowerShell）
# 用法: .\init-game.ps1 -GameId <game-id> [-GameName <game-name>]
# 示例: .\init-game.ps1 -GameId my-puzzle -GameName 拼图游戏
# =============================================================================

param(
    [Parameter(Mandatory=$true)]
    [string]$GameId,

    [Parameter(Mandatory=$false)]
    [string]$GameName = $GameId
)

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Resolve-Path "$ScriptDir\..\.."
$TemplateDir = Join-Path $ScriptDir "..\templates\game-template"
$GamesDir = Join-Path $ProjectRoot "kids-game-house\games"
$TargetDir = Join-Path $GamesDir $GameId

# ─── 参数检查 ─────────────────────────────────────────────────────────────────
if (Test-Path $TargetDir) {
    Write-Error "❌ 错误: 目录已存在: $TargetDir"
    exit 1
}

# ─── 创建游戏目录 ─────────────────────────────────────────────────────────────
Write-Host "🚀 创建游戏: $GameId ($GameName)" -ForegroundColor Green
Write-Host ""

Copy-Item -Path "$TemplateDir" -Destination $TargetDir -Recurse
Write-Host "✅ 复制模板完成" -ForegroundColor Green

# ─── 替换占位符 ───────────────────────────────────────────────────────────────
$filesToProcess = Get-ChildItem -Path $TargetDir -Recurse -Include "*.json","*.sql","*.html","*.ts","*.vue" |
    Where-Object { $_.FullName -notlike "*\node_modules\*" }

$utf8NoBom = [System.Text.UTF8Encoding]::new($false)

foreach ($file in $filesToProcess) {
    $content = [System.IO.File]::ReadAllText($file.FullName, $utf8NoBom)
    $newContent = $content `
        -replace '__GAME_ID__', $GameId `
        -replace '__GAME_TYPE__', $GameId `
        -replace '__GAME_NAME__', $GameName `
        -replace '__GAME_CODE__', $GameId `
        -replace '游戏模板', $GameName
    if ($newContent -ne $content) {
        [System.IO.File]::WriteAllText($file.FullName, $newContent, $utf8NoBom)
    }
}

# 单独处理 package.json name 字段
$packageJson = Join-Path $TargetDir "package.json"
$content = [System.IO.File]::ReadAllText($packageJson, $utf8NoBom)
$content = $content -replace '"name": "game-template"', "`"name`": `"@kids-game/$GameId`""
[System.IO.File]::WriteAllText($packageJson, $content, $utf8NoBom)

Write-Host "✅ 占位符替换完成" -ForegroundColor Green

# ─── 安装依赖 ─────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "📦 安装依赖..."
Set-Location $TargetDir
npm install --silent
Write-Host "✅ 依赖安装完成" -ForegroundColor Green

# ─── 完成提示 ─────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "🎉 游戏初始化完成！" -ForegroundColor Green
Write-Host ""
Write-Host "游戏目录: $TargetDir"
Write-Host ""
Write-Host "下一步:" -ForegroundColor Cyan
Write-Host "  1. cd kids-game-house\games\$GameId"
Write-Host "  2. 编辑 src\config\difficulty.json（难度参数：gridCols/gridRows/speed 等）"
Write-Host "  3. 编辑 src\config\GTRS.json（资源路径配置）"
Write-Host "  4. 重写 src\scenes\MyGameScene.ts（游戏核心逻辑，唯一必须实现的文件）"
Write-Host "  5. npm run dev（启动开发服务器验证）"
Write-Host "  6. 执行 register-game.sql 注册到数据库"
Write-Host "     ⚠️  SQL 使用真实表名 t_game，字段: game_code/game_name/game_url/category/grade"
Write-Host "     ⚠️  请先替换 __GAME_URL__ / __GAME_ICON_URL__ / __CREATOR_ID__ 再执行"
Write-Host ""
Write-Host "参考: 贪吃蛇实现 → kids-game-house\games\snake\src\scenes\" -ForegroundColor Yellow
Write-Host "文档: AI 开发指南 → src\AI_INSTRUCTIONS.md" -ForegroundColor Yellow
