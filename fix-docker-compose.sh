#!/bin/bash

# ========================================
# Docker Compose 修复脚本
# ========================================

echo "========================================="
echo "修复 Docker Compose 安装"
echo "========================================="

# 1. 删除损坏的文件
echo "1. 删除损坏的 docker-compose..."
sudo rm -f /usr/local/bin/docker-compose

# 2. 下载最新版本
echo "2. 下载最新版本的 Docker Compose..."
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# 3. 赋予执行权限
echo "3. 赋予执行权限..."
sudo chmod +x /usr/local/bin/docker-compose

# 4. 验证安装
echo "4. 验证安装..."
docker-compose --version

echo ""
echo "========================================="
echo "Docker Compose 修复完成！"
echo "========================================="
echo ""
echo "现在可以运行："
echo "  docker-compose -f docker-compose.lowmem.yml up -d"
