#!/bin/bash

# 前端部署脚本 - 解决浏览器缓存问题
# 使用方法: ./deploy-frontend.sh [服务器IP]

set -e

SERVER_IP=${1:-"8.136.156.190"}
REMOTE_PATH="/root/workspace/kids-game-project-v5/docker"
LOCAL_DIST="./dist"

echo "🚀 开始部署前端..."
echo "📡 服务器: $SERVER_IP"
echo ""

# 1. 构建新版本
echo "📦 步骤 1/4: 构建前端..."
npm run build
echo "✅ 构建完成"
echo ""

# 2. 显示版本信息
if [ -f "dist/version.json" ]; then
    echo "📋 版本信息:"
    cat dist/version.json
    echo ""
fi

# 3. 上传到服务器
echo "📤 步骤 2/4: 上传文件到服务器..."
scp -r dist/* root@$SERVER_IP:$REMOTE_PATH/nginx/html/
echo "✅ 上传完成"
echo ""

# 4. 重启 Nginx（清除 Nginx 缓存）
echo "🔄 步骤 3/4: 重启 Nginx..."
ssh root@$SERVER_IP "cd $REMOTE_PATH && docker compose restart frontend"
echo "✅ Nginx 已重启"
echo ""

# 5. 验证部署
echo "🔍 步骤 4/4: 验证部署..."
sleep 2
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://$SERVER_IP:3000/)
if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ 部署成功！HTTP $HTTP_CODE"
else
    echo "❌ 部署失败！HTTP $HTTP_CODE"
    exit 1
fi
echo ""

echo "🎉 部署完成！"
echo ""
echo "💡 提示："
echo "   - 文件名哈希已启用，带哈希的文件会长期缓存"
echo "   - index.html 不缓存，确保用户获取最新版本"
echo "   - 版本检测每5分钟自动检查一次"
echo "   - 如需强制刷新，用户可以按 Ctrl+F5"
echo ""
