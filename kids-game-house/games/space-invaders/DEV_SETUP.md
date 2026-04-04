# 实时多人太空侵略者游戏 - 开发设置指南

## 启动开发服务器

```bash
npm run dev
```

这将使用 nodemon 启动开发服务器，当代码更改时会自动重启。

## 环境变量配置

1. 复制 `.env-sample` 为 `.env`：
   ```bash
   cp .env-sample .env
   ```

2. 在 `.env` 文件中配置以下变量：
   - `ABLY_API_KEY`: 你的 Ably API 密钥（从 https://ably.com 获取）
   - `PORT`: 服务器端口（默认 8080）

## 获取 Ably API 密钥

1. 访问 [Ably 官网](https://ably.com/)
2. 注册或登录账户
3. 创建一个新的应用
4. 复制 API 密钥到 `.env` 文件中

## 生产环境启动

```bash
npm start
```

## 项目结构

- `server.js`: 主服务器文件
- `server-worker.js`: 游戏逻辑工作线程
- `public/`: 静态资源文件
- `views/`: HTML 页面模板