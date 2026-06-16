#!/bin/bash

# ========================================
# 儿童游戏平台 - Docker 部署脚本
# ========================================
# 
# 部署配置已统一到 deploy/docker/ 目录
# 使用方法：cd deploy/docker && docker-compose up -d
# ========================================

# 获取脚本所在目录
SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)

echo "========================================"
echo "  儿童游戏平台 - Docker 部署工具"
echo "========================================"
echo ""
echo "部署配置已统一到 deploy/docker/ 目录"
echo ""
echo "快速部署步骤："
echo "  1. cd deploy/docker"
echo "  2. cp .env.example .env"
echo "  3. 编辑 .env 配置文件"
echo "  4. docker-compose up -d"
echo ""
echo "详细文档：deploy/DEPLOYMENT_GUIDE.md"
echo "========================================"

# 自动切换到 docker 目录并执行
DOCKER_DIR="$SCRIPT_DIR/docker"
if [ -d "$DOCKER_DIR" ]; then
    cd "$DOCKER_DIR"
    
    # 检查是否有 .env 文件
    if [ ! -f ".env" ]; then
        echo ""
        echo "[INFO] 复制环境变量配置文件..."
        cp .env.example .env
        echo "[WARN] 请编辑 deploy/docker/.env 文件配置必要参数（数据库密码、JWT密钥等）"
    fi
    
    echo ""
    read -p "是否继续部署？(y/n): " confirm
    if [[ $confirm =~ ^[Yy]$ ]]; then
        echo ""
        echo "[INFO] 开始构建并启动服务..."
        docker-compose build && docker-compose up -d
        echo ""
        echo "[INFO] 部署完成！"
        docker-compose ps
    else
        echo "[INFO] 已取消部署"
    fi
else
    echo "[ERROR] 找不到 docker 目录"
    exit 1
fi