#!/bin/sh

# 游戏服务启动脚本
# 此脚本会启动所有可用的游戏服务

echo "Starting game services..."

# 遍历所有游戏目录并启动
for game_dir in /app/games/*/; do
  if [ -f "$game_dir/package.json" ]; then
    game_name=$(basename "$game_dir")
    echo "Starting game: $game_name"
    
    cd "$game_dir"
    
    # 检查是否有 start 脚本
    if grep -q "\"start\"" package.json; then
      # 在后台启动游戏服务
      npm start &
      echo "Started $game_name in background"
    else
      echo "No start script found for $game_name, skipping..."
    fi
  fi
done

# 保持容器运行
wait
