# Android 稳定工作法（推荐）

一套固定组合，避免 `:3443`、WebView SSL `-101`、CapacitorHttp `Connection reset`。

## 架构

| 层 | 做法 |
|----|------|
| **App 壳** | APK **内置 `dist`**（`pnpm exec cap sync android`，**不要**默认 `cap:sync:android:remote`） |
| **HTTP 客户端** | `CapacitorHttp` 已开（`capacitor.config.ts` → `plugins.CapacitorHttp.enabled: true`） |
| **API 地址** | **`https://kidsgame.dingpq.cn/api`**（**443**，见 `.env.production`） |
| **服务器** | 宿主机 Nginx **443** 反代 `/api` → `127.0.0.1:8080`（见 `deploy/docker/nginx/kidsgame.dingpq.cn-gateway.conf`） |
| **3443** | 仅 Docker 内 H5/备用；**App 生产包不依赖** |

## 服务器（一次性）

1. 证书放到 `/etc/nginx/ssl/`（fullchain + key，与 3443 相同文件即可）。
2. 启用网关配置：

```bash
cp deploy/docker/nginx/kidsgame.dingpq.cn-gateway.conf /etc/nginx/conf.d/kidsgame.conf
nginx -t && systemctl reload nginx
```

3. 安全组放行 **TCP 443**；backend 容器 **8080** 映射到本机（compose 已有 `8080:8080`）。
4. 验收：

```bash
curl -sS -o /dev/null -w "%{http_code}\n" "https://kidsgame.dingpq.cn/api/game/list"
# 期望 200
```

手机 Chrome 打开同一 URL，无证书警告。

## 本机打 APK（仅 PowerShell）

```powershell
cd kids-game-simple
.\scripts\build-android.ps1 debug
```

脚本会：`pnpm run build`（注入 `.env.production`）→ `cap sync android` → `assembleDebug`。

安装前 **卸载旧包**。APK：`android\app\build\outputs\apk\debug\KidsGame-v1.0-debug.apk`。

## 验收

- logcat **无**连续 `net_error -101` / 登录时 **无** `Connection reset`（偶发可重试一次）。
- 能登录、`CapacitorHttp fetch ... https://kidsgame.dingpq.cn/api/...` 返回业务 JSON。

## 仍要用 3443 时（不推荐 App）

仅 Web 或 remote WebView，且证书 `Verify return code: 0` 后：

```powershell
$env:VITE_API_BASE="https://kidsgame.dingpq.cn:3443/api"
pnpm run build
$env:CAPACITOR_REMOTE_SERVER_URL="https://kidsgame.dingpq.cn:3443"
pnpm run cap:sync:android:remote
```

## 相关文件

- `deploy/docker/nginx/kidsgame.dingpq.cn-gateway.conf` — 443 网关
- `docs/ANDROID_RELEASE.md` — 证书与 checklist
- `docs/android-api-ssl.md` — 错误码对照