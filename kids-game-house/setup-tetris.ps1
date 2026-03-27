# 俄罗斯方块游戏开发 - 快速启动脚本
# PowerShell 版本

$ErrorActionPreference = "Stop"
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "俄罗斯方块游戏开发 - 快速启动" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$tetrisDir = Join-Path $projectRoot "tetris"
$snakeDir = Join-Path $projectRoot "games\snake"

# 步骤 1: 生成资源
Write-Host "[步骤 1/4] 生成游戏资源..." -ForegroundColor Yellow
if (Test-Path (Join-Path $tetrisDir "generate-resources.mjs")) {
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
    try {
        Write-Host "正在安装依赖..." -ForegroundColor Gray
        & npm install
        
        Write-Host "正在生成资源..." -ForegroundColor Gray
        & node generate-resources.mjs
        
        Write-Host "✅ 资源生成完成" -ForegroundColor Green
    } catch {
        Write-Host "❌ 资源生成失败！" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "❌ 找不到资源生成脚本！" -ForegroundColor Red
    exit 1
}

Write-Host ""

# 步骤 2: 复制贪吃蛇代码
Write-Host "[步骤 2/4] 复制贪吃蛇代码..." -ForegroundColor Yellow
if (Test-Path $snakeDir) {
    $destSnakeDir = Join-Path $tetrisDir "snake"
    
    if (Test-Path $destSnakeDir) {
        Write-Host "发现旧版本，正在清理..." -ForegroundColor Gray
        Remove-Item $destSnakeDir -Recurse -Force
    }
    
    try {
        Write-Host "正在复制代码..." -ForegroundColor Gray
        Copy-Item -Path $snakeDir -Destination $destSnakeDir -Recurse -Force
        
        # 清理 node_modules
        $nodeModulesPath = Join-Path $destSnakeDir "node_modules"
        if (Test-Path $nodeModulesPath) {
            Write-Host "正在清理 node_modules..." -ForegroundColor Gray
            Remove-Item $nodeModulesPath -Recurse -Force
        }
        
        Write-Host "✅ 代码复制完成" -ForegroundColor Green
    } catch {
        Write-Host "❌ 代码复制失败！" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "⚠️  警告：找不到贪吃蛇游戏目录 ($snakeDir)" -ForegroundColor Yellow
    Write-Host "请确保 games/snake 目录存在" -ForegroundColor Yellow
}

Write-Host ""

# 步骤 3: 修改 package.json
Write-Host "[步骤 3/4] 修改配置文件..." -ForegroundColor Yellow
$packageJsonPath = Join-Path $tetrisDir "snake\package.json"
if (Test-Path $packageJsonPath) {
    try {
        $packageJson = Get-Content $packageJsonPath -Raw | ConvertFrom-Json
        $packageJson.name = "tetris"
        $packageJson.description = "俄罗斯方块游戏"
        
        # 保存修改
        $packageJson | ConvertTo-Json -Depth 100 | Out-File $packageJsonPath -Encoding UTF8
        Write-Host "✅ package.json 已更新" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  修改 package.json 失败，请手动修改" -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠️  找不到 package.json" -ForegroundColor Yellow
}

Write-Host ""

# 步骤 4: 验证结果
Write-Host "[步骤 4/4] 验证结果..." -ForegroundColor Yellow
$validationPassed = $true

# 检查资源文件
$publicDir = Join-Path $tetrisDir "public\themes\default"
if (Test-Path $publicDir) {
    $imageDir = Join-Path $publicDir "images"
    $audioDir = Join-Path $publicDir "audio"
    
    if (Test-Path $imageDir) {
        $imageCount = (Get-ChildItem -Path $imageDir -Recurse -File).Count
        Write-Host "✅ 图片资源：$imageCount 张" -ForegroundColor Green
    } else {
        Write-Host "❌ 图片资源目录不存在" -ForegroundColor Red
        $validationPassed = $false
    }
    
    if (Test-Path $audioDir) {
        $audioCount = (Get-ChildItem -Path $audioDir -Recurse -File).Count
        Write-Host "✅ 音频资源：$audioCount 首" -ForegroundColor Green
    } else {
        Write-Host "❌ 音频资源目录不存在" -ForegroundColor Red
        $validationPassed = $false
    }
} else {
    Write-Host "❌ 公共资源目录不存在" -ForegroundColor Red
    $validationPassed = $false
}

# 检查代码目录
if (Test-Path (Join-Path $tetrisDir "snake")) {
    Write-Host "✅ 游戏代码目录已创建" -ForegroundColor Green
} else {
    Write-Host "❌ 游戏代码目录不存在" -ForegroundColor Red
    $validationPassed = $false
}

# 检查 GTRS 配置
$gtrsPath = Join-Path $tetrisDir "snake\src\config\GTRS.json"
if (Test-Path $gtrsPath) {
    Write-Host "✅ GTRS 配置文件已生成" -ForegroundColor Green
} else {
    Write-Host "❌ GTRS 配置文件不存在" -ForegroundColor Red
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
    Write-Host "游戏逻辑实现指南：" -ForegroundColor Cyan
    Write-Host "请查看 tetris/README.md 文档中的「第三阶段」部分" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host "⚠️  初始化过程中出现错误，请检查上方错误信息" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "故障排查建议:" -ForegroundColor Cyan
    Write-Host "1. 确保 Node.js 已正确安装" -ForegroundColor White
    Write-Host "2. 确保 games/snake 目录存在" -ForegroundColor White
    Write-Host "3. 查看详细错误日志" -ForegroundColor White
}

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "按任意键继续..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
