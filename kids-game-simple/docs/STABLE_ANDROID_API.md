# Android 稳定工作法（推荐）

一套固定组合，避免非标准端口 `:3443` 带来的 WebView `-101`、CapacitorHttp `Connection reset`。

## 架构

| 层 | 做法 |
|----|------|
| **App 壳** | APK **内置 `dist`**（`pnpm exec cap sync android`） |
| **HTTP** | `CapacitorHttp`（`capacitor.config.ts`） |
| **API** | **`https://kidsgame.dingpq.cn/api`**（**443**，`.env.production`） |
| **服务器** | **只改一份** `deploy/docker/nginx/kids-game-simple.conf`（容器内 Nginx，已含 `/api` → `backend:8080`） |
| **端口** | compose：`443:443` + `3443:443`（同一容器 443，双入口）；App **只用 443** |

**不要**再维护单独的「宿主机 gateway」配置：原先 `kidsgame.dingpq.cn-gateway.conf` 与 `kids-game-simple.conf` 职责重复（都是 `/api` + 证书），已删除 gateway，避免两套真相。

## 服务器

1. 安全组放行 **443**（及备用 **3443** 若需要）。
2. 若宿主机 **80/443 已被别的 Nginx 占用**，需先停掉或改映射，否则 `443:443` 会 bind 失败。
3. 更新并重启：

```bash
cd deploy/docker
docker compose build kids-game-simple
docker compose up -d kids-game-simple
docker exec kids-game-simple nginx -t && docker exec kids-game-simple nginx -s reload
```

4. 验收：

```bash
curl -sS -o /dev/null -w "%{http_code}\n" "https://kidsgame.dingpq.cn/api/game/list"
```

## 本机打 APK

```powershell
cd kids-game-simple
.\scripts\build-android.ps1 debug
```

卸载旧包后安装新 APK。

## 相关文件

- `deploy/docker/nginx/kids-game-simple.conf` — **唯一** Nginx 站点配置
- `deploy/docker/Dockerfile.kids-game-simple` — 拷贝上述 conf
- `docs/ANDROID_RELEASE.md` — 证书 checklist