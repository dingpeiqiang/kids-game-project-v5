<#
========================================
统一入口脚本 - PowerShell
========================================
#>

$SCRIPT_DIR = Split-Path $MyInvocation.MyCommand.Path -Parent

# 检测操作系统
if ($env:OS -eq "Windows_NT") {
    # Windows 系统
    Write-Host "检测到 Windows 系统，启动 PowerShell 脚本..."
    & "$SCRIPT_DIR/windows/main.ps1" @args
} else {
    # Linux/macOS 系统
    Write-Host "检测到 Linux/Unix 系统，启动 Bash 脚本..."
    bash "$SCRIPT_DIR/linux/main.sh" "$@"
}