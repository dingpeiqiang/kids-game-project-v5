# 多阶段构建 - 前端
FROM node:18-alpine AS frontend-builder

WORKDIR /app/kids-game-frontend

# 复制前端依赖文件
COPY kids-game-frontend/package*.json ./
RUN npm ci --only=production

# 复制前端源代码并构建
COPY kids-game-frontend/ ./
RUN npm run build

# 多阶段构建 - 后端
FROM maven:3.9-eclipse-temurin-17 AS backend-builder

WORKDIR /app/kids-game-backend

# 复制后端依赖文件
COPY kids-game-backend/pom.xml ./
COPY kids-game-backend/kids-game-common/pom.xml ./kids-game-common/
COPY kids-game-backend/kids-game-dao/pom.xml ./kids-game-dao/
COPY kids-game-backend/kids-game-service/pom.xml ./kids-game-service/
COPY kids-game-backend/kids-game-web/pom.xml ./kids-game-web/

# 下载依赖
RUN mvn dependency:go-offline -B

# 复制源代码并构建
COPY kids-game-backend/ ./
RUN mvn clean package -DskipTests

# 最终镜像
FROM eclipse-temurin:17-jre-alpine

# 安装 Nginx 和 Node.js（用于游戏服务）
RUN apk add --no-cache nginx nodejs npm

# 创建应用目录
RUN mkdir -p /app/frontend /app/backend /app/games /app/nginx

# 复制前端构建产物
COPY --from=frontend-builder /app/kids-game-frontend/dist /app/frontend/dist

# 复制后端 JAR 包
COPY --from=backend-builder /app/kids-game-backend/kids-game-web/target/*.jar /app/backend/app.jar

# 复制游戏服务
COPY kids-game-house/games /app/games

# 复制 Nginx 配置
COPY nginx.prod.conf /app/nginx/nginx.conf

# 暴露端口
EXPOSE 80 443 8080 3001-3020

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:80/ || exit 1

# 启动脚本
COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh

CMD ["/app/start.sh"]
