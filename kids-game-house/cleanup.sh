#!/bin/bash
# 植物大战僵尸 - 进程清理脚本
# 使用方法：./cleanup.sh

echo "🔍 检查 kids-game-house 相关进程..."
echo ""

# 查找进程
HOUSE_PIDS=$(ps -ef | grep "kids-game-house" | grep -v grep | awk '{print $2}')

if [ -n "$HOUSE_PIDS" ]; then
  echo "⚠️  发现以下进程："
  echo ""
  ps -ef | grep "kids-game-house" | grep -v grep
  echo ""
  
  # 确认是否删除
  read -p "是否要杀死这些进程？(y/n): " confirm
  if [ "$confirm" = "y" ] || [ "$confirm" = "Y" ]; then
    echo "$HOUSE_PIDS" | xargs kill -9 2>/dev/null
    echo ""
    echo "✅ 已杀死进程：$HOUSE_PIDS"
  else
    echo "❌ 已取消操作"
  fi
else
  echo "✅ 未发现 kids-game-house 相关进程"
fi

echo ""
echo "完成！"
