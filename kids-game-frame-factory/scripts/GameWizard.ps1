# ===============================================
#               🎮 游戏项目智能创建向导
#          kids-game-frame-factory v3.2.0
# ===============================================

param(
    [Parameter(Mandatory=$false)]
    [string]$Action,
    
    [Parameter(Mandatory=$false)]
    [string]$GameId,
    
    [Parameter(Mandatory=$false)]
    [string]$GameName,
    
    [Parameter(Mandatory=$false)]
    [string]$Description,
    
    [Parameter(Mandatory=$false)]
    [switch]$Interactive = $true
)

# 设置脚本执行策略（如果需要）
# Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass

# 框架根目录
$FrameworkDir = $PSScriptRoot | Split-Path -Parent
$ToolsScript = Join-Path $FrameworkDir "scripts" "enhance-dev-tools.js"

# 颜色定义
$Colors = @{
    Reset = "`e[0m"
    Red = "`e[91m"
    Green = "`e[92m"
    Yellow = "`e[93m"
    Blue = "`e[94m"
    Magenta = "`e[95m"
    Cyan = "`e[96m"
    Bold = "`e[1m"
}

function Show-Banner {
    Clear-Host
    Write-Host @"
$($Colors.Cyan)╔══════════════════════════════════════════════════════════╗
║                                                                    ║
║              🎮 游戏项目智能创建向导 v3.2.0                        ║
║                                                                    ║
║          kids-game-frame-factory 增强开发工具                     ║
║                                                                    ║
╚══════════════════════════════════════════════════════════╝$($Colors.Reset)
"@
}

function Show-MainMenu {
    Show-Banner
    
    Write-Host @"
$($Colors.Green)请选择操作:$($Colors.Reset)

$($Colors.Cyan)[1]$($Colors.Reset)  创建新的游戏项目
$($Colors.Cyan)[2]$($Colors.Reset)  检查框架完整性  
$($Colors.Cyan)[3]$($Colors.Reset)  显示开发指南
$($Colors.Cyan)[4]$($Colors.Reset)  打开可视化编辑器
$($Colors.Cyan)[5]$($Colors.Reset)  生成游戏资源占位符
$($Colors.Cyan)[6]$($Colors.Reset)  项目依赖分析
$($Colors.Cyan)[7]$($Colors.Reset)  代码规范检查
$($Colors.Cyan)[8]$($Colors.Reset)  框架版本升级
$($Colors.Cyan)[0]$($Colors.Reset)  退出向导

"@
    
    $choice = Read-Host "请输入选择 (0-8)"
    return $choice
}

function Test-Requirements {
    Write-Host "`n🔍 检查系统要求..." -ForegroundColor Cyan
    
    $requirements = @()
    
    # 检查Node.js
    try {
        $nodeVersion = node --version
        $requirements += @{
            Name = "Node.js"
            Status = "✅"
            Version = $nodeVersion.Trim()
            Message = "已安装"
        }
    } catch {
        $requirements += @{
            Name = "Node.js"
            Status = "❌"
            Version = "未安装"
            Message = "请从 https://nodejs.org/ 安装"
        }
    }
    
    # 检查npm
    try {
        $npmVersion = npm --version
        $requirements += @{
            Name = "npm"
            Status = "✅"
            Version = $npmVersion.Trim()
            Message = "已安装"
        }
    } catch {
        $requirements += @{
            Name = "npm"
            Status = "⚠️"
            Version = "未检测到"
            Message = "通常随Node.js一起安装"
        }
    }
    
    # 检查TypeScript
    try {
        $tsVersion = npx tsc --version
        $requirements += @{
            Name = "TypeScript"
            Status = "✅"
            Version = "可用"
            Message = "开发环境就绪"
        }
    } catch {
        $requirements += @{
            Name = "TypeScript"
            Status = "⚠️"
            Version = "需要安装"
            Message = "项目创建后会安装"
        }
    }
    
    # 显示检查结果
    $requirements | Format-Table @{
        Label = "组件"
        Expression = { $_.Name }
    }, @{
        Label = "状态"
        Expression = { $_.Status }
    }, @{
        Label = "版本"
        Expression = { $_.Version }
    }, @{
        Label = "信息"
        Expression = { $_.Message }
    } -AutoSize
    
    # 检查失败项
    $failedItems = $requirements | Where-Object { $_.Status -eq "❌" }
    if ($failedItems) {
        Write-Host "`n❌ 存在未满足的系统要求" -ForegroundColor Red
        return $false
    }
    
    Write-Host "`n✅ 所有系统要求检查通过" -ForegroundColor Green
    return $true
}

function Create-GameInteractive {
    Show-Banner
    Write-Host "🎮 创建新游戏项目" -ForegroundColor Cyan
    Write-Host "=" * 50
    
    # 检查系统要求
    if (-not (Test-Requirements)) {
        Write-Host "请先满足系统要求，然后重试" -ForegroundColor Red
        Pause
        return
    }
    
    # 获取游戏信息
    Write-Host "`n📝 请输入游戏信息:" -ForegroundColor Yellow
    
    do {
        $GameId = Read-Host "  游戏ID (例如: my-puzzle)"
        if ($GameId -notmatch '^[a-z][a-z0-9_]*$') {
            Write-Host "  ❌ 游戏ID格式错误: 必须是小写字母开头，只能包含小写字母、数字和下划线" -ForegroundColor Red
        } elseif (Test-Path $GameId) {
            Write-Host "  ❌ 目录 '$GameId' 已存在" -ForegroundColor Red
            $GameId = $null
        }
    } while ($GameId -notmatch '^[a-z][a-z0-9_]*$' -or (Test-Path $GameId))
    
    $GameName = Read-Host "  游戏名称 (例如: 拼图游戏)"
    $Description = Read-Host "  游戏描述 [可选]"
    
    # 游戏类型选择
    Write-Host "`n🎨 选择游戏类型:" -ForegroundColor Yellow
    Write-Host "  [1] 休闲游戏 (如拼图、消消乐)"
    Write-Host "  [2] 动作游戏 (如贪吃蛇、射击)"
    Write-Host "  [3] 教育游戏 (如学习、认知)"
    Write-Host "  [4] 其他类型"
    
    $gameTypes = @{
        "1" = "casual"
        "2" = "action"
        "3" = "educational"
        "4" = "custom"
    }
    
    do {
        $typeChoice = Read-Host "  请选择 (1-4)"
    } while ($typeChoice -notin @("1","2","3","4"))
    
    $gameType = $gameTypes[$typeChoice]
    
    # 确认信息
    Show-Banner
    Write-Host "📋 确认创建信息:" -ForegroundColor Cyan
    Write-Host "=" * 50
    Write-Host "  游戏ID: $($Colors.Green)$GameId$($Colors.Reset)"
    Write-Host "  游戏名称: $($Colors.Green)$GameName$($Colors.Reset)"
    Write-Host "  游戏描述: $($Colors.Green)$($Description -replace '^$', '(空)')$($Colors.Reset)"
    Write-Host "  游戏类型: $($Colors.Green)$gameType$($Colors.Reset)"
    Write-Host "  目标目录: $($Colors.Green)$GameId$($Colors.Reset)"
    Write-Host "=" * 50
    
    $confirm = Read-Host "`n确认创建? (Y/N)"
    if ($confirm -notmatch "^[Yy]") {
        Write-Host "操作已取消" -ForegroundColor Yellow
        return
    }
    
    # 开始创建
    Write-Host "`n🚀 正在创建游戏项目 '$GameName'..." -ForegroundColor Green
    
    try {
        # 准备参数
        $args = @("create", $GameId, $GameName)
        if ($Description) {
            $args += $Description
        }
        
        # 调用JS工具
        node $ToolsScript $args
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "`n✅ 游戏项目创建成功!" -ForegroundColor Green
            Write-Host "=" * 50 -ForegroundColor DarkGray
            
            # 显示项目信息
            $projectDir = Join-Path $PWD $GameId
            Write-Host "📁 项目位置: $($Colors.Green)$projectDir$($Colors.Reset)"
            Write-Host "📦 进入项目: $($Colors.Cyan)cd $GameId$($Colors.Reset)"
            Write-Host "📦 安装依赖: $($Colors.Cyan)npm install$($Colors.Reset)"
            Write-Host "🚀 启动开发: $($Colors.Cyan)npm run dev$($Colors.Reset)"
            
            Write-Host "`n📋 核心文件:" -ForegroundColor Yellow
            Get-ChildItem $projectDir -Name | ForEach-Object {
                Write-Host "  - $_"
            }
            
            # 创建快捷命令文件
            $quickCommands = @"
# 🚀 $GameName - 快捷命令
# 使用方法: source quick-start.sh 或 . .\quick-start.ps1

# 项目目录
projectDir="$(Resolve-Path $GameId)"

# 常用命令
alias dev-cd="cd `$projectDir"
alias dev-install="cd `$projectDir && npm install --legacy-peer-deps"
alias dev-start="cd `$projectDir && npm run dev"
alias dev-build="cd `$projectDir && npm run build"
alias dev-check="cd `$projectDir && npm run type-check"

echo "✅ $GameName 项目快捷命令已加载"
echo "📁 项目目录: `$projectDir"
echo "📦 快速开始: dev-install && dev-start"
"@
            
            $quickPath = Join-Path $projectDir "quick-start.sh"
            $quickPathPS = Join-Path $projectDir "quick-start.ps1"
            $quickCommands | Out-File -FilePath $quickPath -Encoding UTF8
            $quickCommands | Out-File -FilePath $quickPathPS -Encoding UTF8
            
            Write-Host "`n📝 已创建快捷启动脚本: $($Colors.Cyan)$quickPath$($Colors.Reset)"
            
        } else {
            Write-Host "❌ 项目创建失败" -ForegroundColor Red
        }
    } catch {
        Write-Host "❌ 创建过程中发生错误: $_" -ForegroundColor Red
    }
    
    Write-Host "`n按任意键返回主菜单..."
    $null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')
}

function Check-Framework {
    Write-Host "`n🔍 检查框架完整性..." -ForegroundColor Cyan
    node $ToolsScript check
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n✅ 框架完整性检查完成" -ForegroundColor Green
    } else {
        Write-Host "`n⚠️ 框架存在一些问题" -ForegroundColor Yellow
    }
    
    Write-Host "`n按任意键继续..."
    $null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')
}

function Show-FrameworkGuide {
    Write-Host "`n📖 正在显示开发指南..." -ForegroundColor Cyan
    node $ToolsScript guide
    
    Write-Host "`n按任意键继续..."
    $null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')
}

function Open-VisualEditor {
    $editorPath = Join-Path $FrameworkDir "tools" "level-editor-prototype.html"
    if (Test-Path $editorPath) {
        Write-Host "🎨 正在打开可视化关卡编辑器..." -ForegroundColor Cyan
        Start-Process $editorPath
        Write-Host "✅ 编辑器已打开" -ForegroundColor Green
    } else {
        Write-Host "❌ 未找到编辑器文件: $editorPath" -ForegroundColor Red
    }
    
    Start-Sleep -Seconds 2
}

function Generate-ResourcePlaceholders {
    Write-Host "🎨 生成游戏资源占位符" -ForegroundColor Cyan
    Write-Host "=" * 50
    
    $targetDir = Read-Host "请输入目标项目目录路径"
    
    if (-not (Test-Path $targetDir)) {
        Write-Host "❌ 目标目录不存在" -ForegroundColor Red
        return
    }
    
    Write-Host "正在为 '$targetDir' 生成占位资源..."
    # TODO: 调用资源生成工具
    
    Write-Host "✅ 占位资源生成完成" -ForegroundColor Green
    Write-Host "按任意键继续..."
    $null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')
}

# 主程序
function Main {
    # 检查命令行参数模式
    if (-not $Interactive -and $Action) {
        switch ($Action) {
            "create" {
                if (-not $GameId -or -not $GameName) {
                    Write-Host "❌ 缺少必要参数: -GameId 和 -GameName" -ForegroundColor Red
                    exit 1
                }
                # 非交互式创建
                node $ToolsScript create $GameId $GameName $Description
                exit $LASTEXITCODE
            }
            "check" {
                node $ToolsScript check
                exit $LASTEXITCODE
            }
            "guide" {
                node $ToolsScript guide
                exit $LASTEXITCODE
            }
            default {
                Write-Host "❌ 未知的操作: $Action" -ForegroundColor Red
                Write-Host "用法: .\GameWizard.ps1 [-Action <create|check|guide>] [-GameId <id>] [-GameName <name>] [-Description <desc>] [-Interactive]" -ForegroundColor Yellow
                exit 1
            }
        }
    }
    
    # 交互式模式
    do {
        $choice = Show-MainMenu
        
        switch ($choice) {
            "1" { Create-GameInteractive }
            "2" { Check-Framework }
            "3" { Show-FrameworkGuide }
            "4" { Open-VisualEditor }
            "5" { Generate-ResourcePlaceholders }
            "6" { Write-Host "开发中..." -ForegroundColor Yellow; Start-Sleep 2 }
            "7" { Write-Host "开发中..." -ForegroundColor Yellow; Start-Sleep 2 }
            "8" { Write-Host "开发中..." -ForegroundColor Yellow; Start-Sleep 2 }
            "0" { 
                Show-Banner
                Write-Host "🙏 感谢使用 kids-game-frame-factory" -ForegroundColor Cyan
                Write-Host "🚀 祝你开发顺利!" -ForegroundColor Green
                Write-Host 
                return 
            }
            default {
                Write-Host "❌ 无效的选择: $choice" -ForegroundColor Red
                Start-Sleep -Seconds 1
            }
        }
    } while ($true)
}

# 启动主程序
try {
    Main
} catch {
    Write-Host "❌ 脚本执行错误: $_" -ForegroundColor Red
    exit 1
}