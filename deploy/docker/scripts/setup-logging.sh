#!/bin/sh

# ========================================
# 启动日志收集服务（systemd 方式）
# ========================================

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DOCKER_DIR="$(dirname "$SCRIPT_DIR")"
LOGS_DIR="$DOCKER_DIR/logs"

echo "========================================="
echo "配置容器日志持久化"
echo "========================================="
echo ""

# 1. 创建日志目录
mkdir -p $LOGS_DIR
echo "✓ 日志目录已创建: $LOGS_DIR"

# 2. 创建 systemd 服务文件
SYSTEMD_DIR="/etc/systemd/system"
SERVICE_FILE="$SYSTEMD_DIR/kids-game-logger.service"

cat > $SERVICE_FILE << 'EOF'
[Unit]
Description=Kids Game Container Log Collector
After=docker.service
Requires=docker.service

[Service]
Type=simple
WorkingDirectory=/root/workspace/kids-game-project-v5/docker
ExecStartPre=/bin/mkdir -p /root/workspace/kids-game-project-v5/docker/logs
ExecStart=/bin/sh -c '\
    docker compose --file docker-compose.lowmem.yml logs -f --no-log-prefix backend > logs/backend.log 2>&1 & \
    BACKEND_PID=$!; \
    docker compose --file docker-compose.lowmem.yml logs -f --no-log-prefix frontend > logs/frontend.log 2>&1 & \
    FRONTEND_PID=$!; \
    docker compose --file docker-compose.lowmem.yml logs -f --no-log-prefix mysql > logs/mysql.log 2>&1 & \
    MYSQL_PID=$!; \
    docker compose --file docker-compose.lowmem.yml logs -f --no-log-prefix redis > logs/redis.log 2>&1 & \
    REDIS_PID=$!; \
    echo "$BACKEND_PID $FRONTEND_PID $MYSQL_PID $REDIS_PID" > logs/.pids; \
    wait'
ExecStop=/bin/sh -c 'if [ -f logs/.pids ]; then kill $(cat logs/.pids) 2>/dev/null || true; fi'
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

echo "✓ Systemd 服务文件已创建: $SERVICE_FILE"

# 3. 重新加载 systemd
systemctl daemon-reload
echo "✓ Systemd 配置已重载"

# 4. 启用并启动服务
systemctl enable kids-game-logger
systemctl start kids-game-logger
echo "✓ 日志收集服务已启动"

# 5. 检查服务状态
sleep 2
if systemctl is-active --quiet kids-game-logger; then
    echo "✓ 服务运行正常"
else
    echo "✗ 服务启动失败，查看状态："
    systemctl status kids-game-logger
    exit 1
fi

echo ""
echo "========================================="
echo "日志持久化配置完成"
echo "========================================="
echo ""
echo "日志文件位置:"
echo "  后端: $LOGS_DIR/backend.log"
echo "  前端: $LOGS_DIR/frontend.log"
echo "  MySQL: $LOGS_DIR/mysql.log"
echo "  Redis: $LOGS_DIR/redis.log"
echo ""
echo "管理命令:"
echo "  查看状态: systemctl status kids-game-logger"
echo "  重启服务: systemctl restart kids-game-logger"
echo "  停止服务: systemctl stop kids-game-logger"
echo "  查看日志: journalctl -u kids-game-logger -f"
echo ""
