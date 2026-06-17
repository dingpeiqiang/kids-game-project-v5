#!/bin/bash
# ========================================
# 统一入口脚本 - Linux/macOS
# ========================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "启动部署脚本..."
bash "$SCRIPT_DIR/docker/scripts/linux/main.sh" "$@"