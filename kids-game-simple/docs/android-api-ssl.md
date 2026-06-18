# Android 登录「Failed to fetch」— 不绕过证书的正解

logcat 出现 `handshake failed; net_error -101` 时，是 **TLS 握手失败**，不是 App 里改 `network_security_config` 能单独解决的（那只能管明文 HTTP，不能伪造合法 HTTPS）。

客户端应继续使用标准 `fetch` + 系统信任的 CA；**必须在服务端把 HTTPS 配到 Android WebView 能校验通过**。

## 1. 先确认问题（在能访问服务器的机器上）

```bash
# 证书链与握手
openssl s_client -connect kidsgame.dingpq.cn:3443 -servername kidsgame.dingpq.cn -showcerts </dev/null

# 与 App 相同路径
curl -vI "https://kidsgame.dingpq.cn:3443/api/game/list"
```

在 **手机浏览器** 打开：`https://kidsgame.dingpq.cn:3443/api/game/list`  
若浏览器也报证书不安全，App 一定失败。

## 2. 常见原因与处理

| 现象 | 处理 |
|------|------|
| 证书只签了 `dingpq.cn`，访问的是 `kidsgame.dingpq.cn` | 重签证书，SAN 包含 `kidsgame.dingpq.cn`（或 `*.dingpq.cn`） |
| 只配置了 `fullchain.pem` 缺中间证 | Nginx 使用 **fullchain**（站点证 + 中间证），不要只配 `cert.pem` |
| 3443 上是自签 / 内网 CA | 换 **公网信任的 CA**（Let’s Encrypt、云厂商免费证书等） |
| 证书过期 | 续期并 reload Nginx |
| 仅 443 正常、3443 配错 | 统一在 3443 使用与 443 相同的一套 `ssl_certificate` / `ssl_certificate_key` |

### Nginx 示例（3443，正规证书）

```nginx
server {
    listen 3443 ssl http2;
    server_name kidsgame.dingpq.cn;

    ssl_certificate     /path/to/fullchain.pem;
    ssl_certificate_key /path/to/privkey.pem;

    # 建议 TLS 1.2+
    ssl_protocols TLSv1.2 TLSv1.3;

    location /api/ {
        proxy_pass http://127.0.0.1:8080/api/;  # 按实际后端改
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-Proto https;
    }
}
```

改完后：`nginx -t && nginx -s reload`。

## 3. 推荐：API 走标准 443（更省事）

很多环境下 **443 证书已正确**，3443 才是问题来源。可：

1. 在 Nginx 443 上反代 `/api` 到后端（与现网 `https://kidsgame.dingpq.cn` 一致）。
2. 修改 `kids-game-simple/.env.production`：

```env
VITE_API_BASE=https://kidsgame.dingpq.cn/api
```

3. 重新构建并同步原生工程：

```bash
pnpm run build
pnpm exec cap sync android
```

## 4. 客户端侧（当前工程）

- `AndroidManifest` 已引用 `network_security_config`（允许配置域名下的策略，**不替代合法证书**）。
- `apiClient` 使用 `VITE_API_BASE`，打包时由 `.env.production` 注入。
- **不要**在客户端关闭证书校验或信任自签（上架与安全都不允许）。

## 5. CapacitorHttp 仍失败：`Connection reset`（握手阶段）

已开启 `CapacitorHttp` 后，log 里常见：

```text
java.net.SocketException: Connection reset
  at ... ConscryptEngineSocket.doHandshake ...
```

说明 **TLS 还没建连成功就被对端 RST**，不是业务 401/500，也不同于 WebView 的 `net_error -101`。

| 对比 | 含义 |
|------|------|
| `-101` | WebView Chromium 不信任证书链 |
| `Connection reset` | 握手时 TCP 被断开：防火墙/运营商、云 WAF、Nginx/负载、证书与 SNI 不一致、模拟器网络等 |

**建议在「与手机同一网络」排查：**

1. 手机 Chrome 打开 `https://kidsgame.dingpq.cn:3443/api/auth/login`（会 405/415 也正常，关键是 **无证书警告、不白屏**）。
2. 服务器上看失败时刻 Nginx **error** 日志：`docker logs kids-game-simple 2>&1 | tail -100`
3. 云安全组 / 机房防火墙：放行 **入站 TCP 3443**（不仅是你本机 curl 的那条线路）。
4. 模拟器：换 **真机 + 4G** 试一次（排除模拟器到公网 3443 的路径问题）。
5. 若 **443** 已有正规证书：把 API 改到 `https://kidsgame.dingpq.cn/api`（见上文 §3），很多环境下比非标准端口更稳。

`deploy/docker/nginx/kids-game-simple.conf` 已加 `ssl_session_tickets off`，部署后 `nginx -s reload`。

## 6. 验收

- 手机 Chrome 访问 API URL 无证书警告。
- `curl` 返回 HTTP 200/401 等正常业务码，而非 SSL 错误。
- 重装 Debug APK 后登录不再出现 `Failed to fetch` / `Connection reset`。