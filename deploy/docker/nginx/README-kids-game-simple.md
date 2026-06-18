# kids-game-simple Nginx / 3443 说明

## 端口关系

| 位置 | 说明 |
|------|------|
| `deploy/docker/docker-compose.yml` | `kids-game-simple` 映射 **`3443:443`**（宿主机 3443 → 容器 443） |
| **App 推荐** | `VITE_API_BASE=https://kidsgame.dingpq.cn/api`（**443**，见 `kidsgame.dingpq.cn-gateway.conf`） |
| `kids-game-simple/.env.production`（旧） | `:3443/api` — 仅 Web/备用，App 不推荐 |
| `capacitor` remote | 仅证书验收后；默认用内置 dist |

配置文件：**`kids-game-simple.conf`**（由 `Dockerfile.kids-game-simple` 挂为 `default.conf`）。

## SSL 证书

- 路径：`ssl/kidsgame.dingpq.cn_ca.crt` + `kidsgame.dingpq.cn.key`
- `*_ca.crt` 内应包含 **多张 `BEGIN CERTIFICATE`**（站点 + 中间证书），否则部分 Android WebView 会 `handshake failed -101`。
- 在服务器验证：

```bash
openssl s_client -connect kidsgame.dingpq.cn:3443 -servername kidsgame.dingpq.cn </dev/null 2>/dev/null | openssl x509 -noout -subject -dates
echo | openssl s_client -connect kidsgame.dingpq.cn:3443 -servername kidsgame.dingpq.cn 2>&1 | grep "Verify return code"
```

期望：`Verify return code: 0 (ok)`。

## 更新部署

```bash
cd deploy/docker
# 先在本机构建 kids-game-simple/dist
docker compose build kids-game-simple
docker compose up -d kids-game-simple
docker exec kids-game-simple nginx -t && docker exec kids-game-simple nginx -s reload
```

## 与 App SSL 问题的关系

- 手机 **Chrome** 能打开 `https://kidsgame.dingpq.cn:3443` 只说明当前网络下浏览器信任该链。
- **Capacitor WebView** 更严格；需保证 **3443 上就是本 compose 这份证书**，且链完整。
- 若仍失败：在真机测、核对云安全组放行 **3443**、证书未过期（TrustAsia DV，见 crt 内 `notAfter`）。

## 浏览器「网页加载失败」但 access 里偶发 200

现象：多次刷新才成功；Nginx access 里失败的几次**可能没有对应行**（连接在 TLS/HTTP2 层就断了），成功的请求是 `200` 且约 22KB。

常见原因与处理：

| 可能原因 | 说明 |
|----------|------|
| **后端未就绪** | `kids-game-simple` 已 `depends_on: backend (healthy)`；重启顺序：`backend` 健康后再起 simple |
| **反代瞬时 502/超时** | `kids-game-simple.conf` 已加 `upstream` keepalive、`proxy_next_upstream` |
| **HTTP/2 + 移动网络** | 若仅手机/弱网失败，可临时在 `server` 里注释 `http2 on;` 后 reload 对比 |
| **浏览器把 JSON 当「网页」** | 直接打开 `/api/game/list` 是纯 JSON，Chrome 有时显示「无法加载」实为渲染/扩展问题；用 **F12 → Network** 看状态码是否为 200 |

服务器上排查：

```bash
# 失败时刻看 error 日志（需挂载或 docker logs）
docker logs kids-game-simple 2>&1 | tail -50

# 从 simple 容器内打后端（应稳定 200）
docker exec kids-game-simple wget -qO- -T 5 http://backend:8080/actuator/health

# 外网连续压测（应全部 200）
for i in $(seq 1 20); do curl -sS -o /dev/null -w "%{http_code}\n" "https://kidsgame.dingpq.cn:3443/api/game/list"; done
```

若 `curl` 20 次全 200 而浏览器仍偶发失败，优先查 **本机 DNS/代理/浏览器扩展**，或换 **无痕窗口** 再试。