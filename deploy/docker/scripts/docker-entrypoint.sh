#!/bin/sh
# =============================================================
# Docker Entrypoint - 运行时环境变量注入
# 在 Nginx 启动前，将容器环境变量写入 /usr/share/nginx/html/env.js
# 前端通过 window.__ENV__ 读取，实现"构建一次，处处部署"
# =============================================================

set -e

ENV_JS=/usr/share/nginx/html/env.js

echo "[entrypoint] 生成运行时环境配置: $ENV_JS"

cat > "$ENV_JS" <<EOF
// 由 Docker 容器启动脚本自动生成，请勿手动修改
// 生成时间: $(date -u +"%Y-%m-%dT%H:%M:%SZ")
window.__ENV__ = {
  VITE_API_BASE_URL: "${VITE_API_BASE_URL:-}",
  VITE_WS_BASE_URL: "${VITE_WS_BASE_URL:-}",
  VITE_RESOURCE_BASE_URL: "${VITE_RESOURCE_BASE_URL:-}",
  VITE_GAME_CDN_URL: "${VITE_GAME_CDN_URL:-}"
};
EOF

echo "[entrypoint] env.js 内容:"
cat "$ENV_JS"
echo ""
echo "[entrypoint] 启动 Nginx..."

# 启动 Nginx（替换当前进程，保持 PID=1）
exec nginx -g "daemon off;"
