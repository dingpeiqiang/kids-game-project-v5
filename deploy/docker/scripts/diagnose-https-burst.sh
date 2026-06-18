#!/usr/bin/env bash
# 对比「连发请求」与「间隔 2s 冷连接」成功率（单 IP 场景下定位首连问题）
set -euo pipefail
HOST="${1:-kidsgame.dingpq.cn}"
URL="https://${HOST}/health"
N="${2:-20}"

ok_burst=0
fail_burst=0
for i in $(seq 1 "$N"); do
  if curl -sf --max-time 8 "$URL" >/dev/null 2>&1; then
    ok_burst=$((ok_burst + 1))
  else
    fail_burst=$((fail_burst + 1))
    echo "[burst] fail #$i"
  fi
  sleep 0.15
done

ok_cold=0
fail_cold=0
for i in $(seq 1 "$N"); do
  if curl -sf --max-time 8 "$URL" >/dev/null 2>&1; then
    ok_cold=$((ok_cold + 1))
  else
    fail_cold=$((fail_cold + 1))
    echo "[cold] fail #$i"
  fi
  sleep 2
done

echo "=== ${HOST} (${N} tries each) ==="
echo "burst (~150ms apart): ok=${ok_burst} fail=${fail_burst}"
echo "cold (2s apart):      ok=${ok_cold} fail=${fail_cold}"
if [[ "$fail_burst" -lt "$fail_cold" ]]; then
  echo "hint: 连发明显优于冷连接 → 查 TLS/HTTP2 首连、容器资源、防火墙 conntrack"
fi