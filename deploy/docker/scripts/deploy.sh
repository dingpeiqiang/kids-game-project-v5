#!/bin/bash
# ========================================
# 统一入口脚本 - 自动检测操作系统
# ========================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 检测操作系统
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" || "$OSTYPE" == "win32" ]]; then
    # Windows 系统
    echo "检测到 Windows 系统，启动 PowerShell 脚本..."
    powershell.exe -ExecutionPolicy Bypass -File "$SCRIPT_DIR/windows/main.ps1" "$@"
else
    # Linux/macOS 系统
    echo "检测到 Linux/Unix 系统，启动 Bash 脚本..."
    bash "$SCRIPT_DIR/linux/main.sh" "$@"
fi