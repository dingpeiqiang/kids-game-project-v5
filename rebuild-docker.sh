#!/bin/bash

# ========================================
# Docker 构建故障排除脚本
# ========================================

echo "========================================="
echo "Docker 构建故障排除"
echo "========================================="

# 1. 停止所有容器
echo "1. 停止所有容器..."
docker-compose -f docker-compose.lowmem.yml down

# 2. 清理构建缓存
echo "2. 清理 Docker 构建缓存..."
docker system prune -f
docker builder prune -f

# 3. 清理 node_modules
echo "3. 清理本地 node_modules..."
rm -rf kids-game-frontend/node_modules
rm -rf kids-game-frontend/package-lock.json

# 4. 重新生成 lock 文件
echo "4. 重新生成 package-lock.json..."
cd kids-game-frontend
npm install --package-lock-only
cd ..

# 5. 重新构建
echo "5. 重新构建镜像..."
docker-compose -f docker-compose.lowmem.yml build --no-cache

# 6. 启动服务
echo "6. 启动服务..."
docker-compose -f docker-compose.lowmem.yml up -d

# 7. 查看状态
echo ""
echo "========================================="
echo "服务状态："
echo "========================================="
docker-compose -f docker-compose.lowmem.yml ps

echo ""
echo "========================================="
echo "查看日志（按 Ctrl+C 退出）："
echo "========================================="
docker-compose -f docker-compose.lowmem.yml logs -f
