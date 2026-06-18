# kids-game-simple Nginx / 3443 说明

## 端口关系

| 位置 | 说明 |
|------|------|
| `deploy/docker/docker-compose.yml` | `kids-game-simple` 映射 **`3443:443`**（宿主机 3443 → 容器 443） |
| `kids-game-simple/.env.production` | `VITE_API_BASE=https://kidsgame.dingpq.cn:3443/api` |
| `capacitor` remote | `CAPACITOR_REMOTE_SERVER_URL=https://kidsgame.dingpq.cn:3443` |

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