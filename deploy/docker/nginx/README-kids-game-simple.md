# kids-game-simple Nginx

## 端口（compose 只映射一个 HTTPS）

| 文件 | `kids-game-simple` 端口 |
|------|-------------------------|
| `docker-compose.yml` | `3000:80`、`443:443` |
| 低内存模式（`.env` 设置） | `3001:80`、`443:443` |

App：`VITE_API_BASE=https://kidsgame.dingpq.cn/api`（标准 **443**，无端口）。

配置：**`kids-game-simple.conf`**（`Dockerfile.kids-game-simple` → 容器 `default.conf`）。

## SSL 证书

- `ssl/kidsgame.dingpq.cn_ca.crt` + `kidsgame.dingpq.cn.key`
- crt 须 **fullchain**（多张 `BEGIN CERTIFICATE`）

```bash
echo | openssl s_client -connect kidsgame.dingpq.cn:443 -servername kidsgame.dingpq.cn 2>&1 | grep "Verify return code"
```

期望：`Verify return code: 0 (ok)`。

## 更新部署

```bash
cd deploy/docker
docker compose build kids-game-simple
docker compose up -d kids-game-simple
docker exec kids-game-simple nginx -t && docker exec kids-game-simple nginx -s reload
```

## 注意

- 宿主机 **443** 不能被其他 Nginx/服务占用，否则 `443:443` 绑定失败。
- 安全组放行 **TCP 443**。