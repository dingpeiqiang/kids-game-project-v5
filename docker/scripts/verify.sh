#!/bin/sh

# ========================================
# 快速验证脚本
# ========================================

echo "========================================="
echo "Kids Game 服务验证"
echo "========================================="
echo ""

# 1. 检查容器状态
echo "[1/5] 检查容器状态..."
docker compose --file ~/workspace/kids-game-project-v5/docker/docker-compose.lowmem.yml ps
echo ""

# 2. 测试前端首页
echo "[2/5] 测试前端首页..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/)
if [ "$HTTP_CODE" = "200" ]; then
    echo "✓ 前端首页正常 (HTTP $HTTP_CODE)"
else
    echo "✗ 前端首页异常 (HTTP $HTTP_CODE)"
fi
echo ""

# 3. 测试健康检查
echo "[3/5] 测试健康检查..."
HEALTH=$(curl -s http://localhost/health)
if [ "$HEALTH" = "healthy" ]; then
    echo "✓ 健康检查通过: $HEALTH"
else
    echo "✗ 健康检查失败: $HEALTH"
fi
echo ""

# 4. 测试后端 API
echo "[4/5] 测试后端 API..."
API_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/api/games)
if [ "$API_CODE" = "200" ]; then
    echo "✓ 后端 API 正常 (HTTP $API_CODE)"
elif [ "$API_CODE" = "502" ]; then
    echo "⚠ 后端 API 未启动 (HTTP $API_CODE - Bad Gateway)"
else
    echo "✗ 后端 API 异常 (HTTP $API_CODE)"
fi
echo ""

# 5. 查看最近的错误日志
echo "[5/5] 检查最近错误日志..."
echo "前端错误:"
tail -n 5 ~/workspace/kids-game-project-v5/docker/logs/frontend.log | grep -i error || echo "  无错误"
echo ""
echo "后端错误:"
tail -n 5 ~/workspace/kids-game-project-v5/docker/logs/backend.log | grep -i error || echo "  无错误"
echo ""

echo "========================================="
echo "验证完成"
echo "========================================="
