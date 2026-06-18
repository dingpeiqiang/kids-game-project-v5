# Android 成熟发布方案（SSL `net_error -101`）

按顺序做即可，无需在 App 里绕过证书校验。

---

## 一、你现在的问题是什么？

| 现象 | 含义 |
|------|------|
| logcat `handshake failed; net_error -101` | 手机 **不信任** `https://kidsgame.dingpq.cn:3443` 的 TLS 证书链 |
| 曾用 `build-android.ps1` 打出来的包 | 默认走了 **远程整页加载 3443**，证书有问题时 **一启动就失败** |
| Crashpad 目录报错 | 可忽略 |

本仓库生产环境约定：**HTTPS 在宿主机 `3443`**（Docker `3443:443`），API 为  
`https://kidsgame.dingpq.cn:3443/api`（见 `.env.production`）。

---

## 二、推荐做法（两步）

### 步骤 1：在服务器上把 3443 证书修到「手机 Chrome 无警告」

在 **能 SSH 到服务器** 的机器上执行：

```bash
echo | openssl s_client -connect kidsgame.dingpq.cn:3443 -servername kidsgame.dingpq.cn 2>&1 | grep "Verify return code"
```

必须是：**`Verify return code: 0 (ok)`**。  
若是 `unable to get local issuer certificate` 等，说明 Nginx 用的不是 **fullchain**。

**处理：**

1. 证书文件：`deploy/docker/nginx/ssl/kidsgame.dingpq.cn_ca.crt`  
   - 文件里应有 **至少 2 段** `-----BEGIN CERTIFICATE-----`（站点证 + 中间证）。  
   - 只有一张证时，到签发商下载 **fullchain**，替换后重新部署容器。

2. 在服务器更新并 reload：

```bash
cd deploy/docker
docker compose build kids-game-simple
docker compose up -d kids-game-simple
docker exec kids-game-simple nginx -t && docker exec kids-game-simple nginx -s reload
```

3. **手机 Chrome** 打开（必须无红色「不安全」）：

```text
https://kidsgame.dingpq.cn:3443/api/game/list
```

详细说明见 [deploy/docker/nginx/README-kids-game-simple.md](../../deploy/docker/nginx/README-kids-game-simple.md)、[android-api-ssl.md](./android-api-ssl.md)。

---

### 步骤 2：用「内置前端」重新打 APK（不要用 remote）

在 **`kids-game-simple`** 目录（Windows）：

```powershell
.\scripts\build-android.bat debug
```

或：

```powershell
.\scripts\build-android.ps1 debug
```

说明：

- 已改为 **`pnpm exec cap sync android`**（把 `dist` 打进 APK），**不再**默认 `cap:sync:android:remote`。  
- 界面从 APK 本地加载；登录/列表只请求 **`VITE_API_BASE`**（3443 的 `/api`）。  
- 卸载旧 APK → 安装  
  `android\app\build\outputs\apk\debug\KidsGame-v1.0-debug.apk`。

等价命令：

```bash
pnpm run build
pnpm exec cap sync android
cd android && gradlew.bat assembleDebug
```

**验收：** logcat 不再连续刷 `-101`；App 能登录或拉接口。

---

## 三、可选：远程 WebView（仅证书已验收后）

整页从 3443 加载（与 API 同源），适合频繁改 H5、不想每次重装 APK：

```powershell
$env:CAPACITOR_REMOTE_SERVER_URL="https://kidsgame.dingpq.cn:3443"
pnpm run build
pnpm run cap:sync:android:remote
cd android; .\gradlew.bat assembleDebug
```

**证书未 `Verify return code: 0` 前不要用此模式。**

---

## 四、不要做的事

- 不要在客户端关闭 HTTPS 校验、不要为自签证单独 `trust-anchors`（上架与安全不允许）。  
- 不要用 `network_security_config` 代替 **合法 fullchain**。  
- 不要指望只改游戏代码消除 `-101`。

---

## 五、仍失败时核对清单

- [ ] 云安全组 / 防火墙已放行 **TCP 3443**  
- [ ] 域名解析到当前服务器  
- [ ] 证书 SAN 包含 **`kidsgame.dingpq.cn`**  
- [ ] 证书未过期  
- [ ] 手机系统日期正确  
- [ ] 已卸载旧 APK 并安装 **步骤 2** 新包  

---

## 六、相关文件

| 文件 | 作用 |
|------|------|
| `scripts/build-android.ps1` / `build-android.bat` | 打 APK（默认内置 dist） |
| `scripts/cap-sync-android-remote.mjs` | 仅远程模式 |
| `.env.production` | `VITE_API_BASE` |
| `capacitor.config.ts` | 无 `CAPACITOR_REMOTE_SERVER_URL` 时不设 `server.url` |