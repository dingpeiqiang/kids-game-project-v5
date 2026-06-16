<#
========================================
公共工具函数
========================================
#>

# 颜色定义
$RED = "Red"
$GREEN = "Green"
$YELLOW = "Yellow"
$BLUE = "Blue"
$CYAN = "Cyan"

# 日志函数
function Write-LogInfo {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor $GREEN
    Add-Content -Path $env:DEPLOY_LOG -Value "[INFO] $Message"
}

function Write-LogWarn {
    param([string]$Message)
    Write-Host "[WARN] $Message" -ForegroundColor $YELLOW
    Add-Content -Path $env:DEPLOY_LOG -Value "[WARN] $Message"
}

function Write-LogError {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor $RED
    Add-Content -Path $env:DEPLOY_LOG -Value "[ERROR] $Message"
}

function Write-LogBlue {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor $BLUE
    Add-Content -Path $env:DEPLOY_LOG -Value "[INFO] $Message"
}

function Write-LogCyan {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor $CYAN
    Add-Content -Path $env:DEPLOY_LOG -Value "[INFO] $Message"
}

# 错误退出函数
function Exit-Error {
    param([string]$Message)
    Write-LogError $Message
    exit 1
}

# 获取脚本目录
function Get-ScriptDir {
    Split-Path $MyInvocation.ScriptName -Parent
}

# 获取项目根目录
function Get-ProjectRoot {
    $scriptDir = Get-ScriptDir
    Split-Path (Split-Path (Split-Path $scriptDir -Parent) -Parent) -Parent
}

# 检查命令是否存在
function Test-CommandExists {
    param([string]$Command)
    $null -ne (Get-Command $Command -ErrorAction SilentlyContinue)
}

# 获取时间戳
function Get-Timestamp {
    Get-Date -Format "yyyyMMdd_HHmmss"
}