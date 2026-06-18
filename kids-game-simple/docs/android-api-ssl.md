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

## 6. 浏览器也要「狂刷」才打开 — 根因在 HTTPS 入口，不是 App

若 **PC/手机浏览器** 访问 `https://kidsgame.dingpq.cn/` 也要多次刷新，且 **连点快容易成功、隔几秒再点又失败**，说明：

- 不是 Capacitor / Android 独有；
- **即使只有一台机器、一个公网 IP**（无 SLB 多节点），仍可能出现：TLS/HTTP2 首连、容器资源、安全组/防火墙、证书链、Nginx 配置等。

客户端已用 **短间隔连发重试**（登录约 120ms、其它 API 约 160ms）模拟「狂刷」，只能缓解，**必须在服务器上修**。

### 6.1 单实例（一个 IP）优先排查

当前 compose：`443:443` → 容器内 Nginx（`deploy/docker/nginx/kids-game-simple.conf`）。

1. **证书链（最常见）**  
   ```bash
   echo | openssl s_client -connect kidsgame.dingpq.cn:443 -servername kidsgame.dingpq.cn 2>&1 | grep "Verify return code"
   ```  
   非 `0 (ok)` 时，把 **fullchain** 重新打进 `ssl/kidsgame.dingpq.cn_ca.crt` 后 rebuild 镜像。

2. **HTTP/2 首连（建议 A/B）**  
   配置里为 `http2 on;`。临时改为仅 TLS 1.2 + HTTP/1.1：  
   - 复制 `kids-game-simple.conf.http11-abtest` 覆盖 `kids-game-simple.conf`（或手动注释 `http2 on`），  
   - `docker compose build kids-game-simple && docker compose up -d kids-game-simple`  
   若浏览器 **单次刷新即稳定**，再保留 HTTP/1.1 或升级 Nginx/OpenSSL。

3. **本机连发 vs 冷连接（在服务器上跑）**  
   ```bash
   bash deploy/docker/scripts/diagnose-https-burst.sh kidsgame.dingpq.cn
   ```  
   若「连发 20 次成功率明显高于间隔 2s 的 20 次」，偏向 **首包/连接跟踪/资源瞬时不足**，查 `dmesg`、Docker 内存、云安全组。

4. **443 是否被别的进程占用或双监听**  
   `ss -tlnp | grep ':443'` — 应只有 docker-proxy 指向 `kids-game-simple`。多进程抢 443 会导致随机 reset。

5. **失败时刻 Nginx 日志**  
   ```bash
   docker exec kids-game-simple tail -30 /var/log/nginx/error.log
   ```  
   握手阶段失败多为 `SSL_read` / `peer closed`；若 `/api` 才有错则是 backend 问题（与 TLS reset 不同）。

6. **（已排除）多 A 记录 / SLB 抽签**  
   若确认 **只有一个 IP、无 SLB**，不必查多节点；重点放在 §6.1 的 1–5。

### 6.2 客户端策略（当前工程）

| 场景 | 策略 |
|------|------|
| `/auth/login` | 最多 16 次，每次失败后 **120ms** 再试 |
| 其它 `/api/*` | 最多 8 次，失败后 **160ms** 再试 |

仍失败时提示「网络连接被重置」，需按 §6.1 修入口。

## 7. 验收

- 手机 Chrome 访问 API URL 无证书警告。
- `curl` 返回 HTTP 200/401 等正常业务码，而非 SSL 错误。
- 浏览器 **单次刷新** 即可打开首页（不依赖连点）。
- 重装 Debug APK 后登录一次点击即可（不依赖连点）。