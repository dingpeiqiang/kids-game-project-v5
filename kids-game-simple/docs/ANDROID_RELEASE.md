# Android 发布（证书与清单）

**日常请先看：[STABLE_ANDROID_API.md](./STABLE_ANDROID_API.md)**（443 API + 内置 dist + CapacitorHttp）。

---

## 一、推荐稳定组合（摘要）

| 项 | 值 |
|----|-----|
| API | `https://kidsgame.dingpq.cn/api`（**443**，`.env.production`） |
| 服务器 | `deploy/docker/nginx/kidsgame.dingpq.cn-gateway.conf` 挂到宿主机 Nginx |
| APK | `.\scripts\build-android.ps1 debug`（仅 PowerShell） |
| 不要用 | App 依赖 `:3443`、`cap:sync:android:remote`（除非证书已验收且明确要远程 H5） |

---

## 二、3443 与证书（备用 / Web）

Docker `kids-game-simple` 仍映射 **3443:443**。若只用 3443 访问 API，移动端易出现 **-101** / **Connection reset**。

```bash
echo | openssl s_client -connect kidsgame.dingpq.cn:3443 -servername kidsgame.dingpq.cn 2>&1 | grep "Verify return code"
```

须为 **`Verify return code: 0 (ok)`**；证书 fullchain 见 `deploy/docker/nginx/ssl/`。

---

## 三、打 APK

```powershell
cd kids-game-simple
.\scripts\build-android.ps1 debug
```

卸载旧包 → 安装 `android\app\build\outputs\apk\debug\KidsGame-v1.0-debug.apk`。

---

## 四、核对清单

- [ ] 宿主机 **443** 已反代 `/api` → backend，手机 Chrome 访问 `https://kidsgame.dingpq.cn/api/game/list` 为 200  
- [ ] 安全组放行 **443**（及 backend **8080** 本机可达）  
- [ ] `.env.production` 为 **无端口** 的 `https://kidsgame.dingpq.cn/api`  
- [ ] 已用新脚本 build + 重装 APK  

---

## 五、相关文件

| 文件 | 作用 |
|------|------|
| `docs/STABLE_ANDROID_API.md` | **主文档** |
| `scripts/build-android.ps1` | 打 APK |
| `capacitor.config.ts` | `CapacitorHttp` |
| `deploy/docker/nginx/kidsgame.dingpq.cn-gateway.conf` | 443 网关 |