# Docker 容器化部署指南 - 音频格式转换功能

## 🤔 核心问题解答

### Q1: 需要安装 FFmpeg 吗？
**A: 是的，必须安装！**

原因：
- `AudioConverterService.java` 中调用了系统命令 `ffmpeg`
- Java 代码通过 `ProcessBuilder` 执行外部命令
- 不是使用 Java 库，而是调用操作系统工具

### Q2: 容器环境需要安装吗？
**A: 需要！在 Docker 容器中也要安装 FFmpeg**

---

## 🐳 Docker 部署方案对比

### 方案 A：使用系统 FFmpeg（推荐⭐）

#### 优点
- ✅ 镜像体积小（~50MB）
- ✅ 性能好
- ✅ 维护简单
- ✅ 与本地开发一致

#### 缺点
- ⚠️ 需要在 Dockerfile 中安装 FFmpeg

#### Dockerfile 示例

```dockerfile
# ========================================
# 阶段 1: 构建阶段
# ========================================
FROM maven:3.9-eclipse-temurin-17 AS builder

WORKDIR /build

# 复制 pom.xml
COPY kids-game-backend/pom.xml .
COPY kids-game-backend/kids-game-common/pom.xml kids-game-common/
COPY kids-game-backend/kids-game-dao/pom.xml kids-game-dao/
COPY kids-game-backend/kids-game-service/pom.xml kids-game-service/
COPY kids-game-backend/kids-game-web/pom.xml kids-game-web/

# 下载依赖
RUN mvn dependency:go-offline -B

# 复制源代码并构建
COPY kids-game-backend/src kids-game-backend/src
WORKDIR /build/kids-game-backend
RUN mvn clean package -DskipTests -B

# ========================================
# 阶段 2: 运行阶段
# ========================================
FROM openjdk:17-slim

# 设置 locale
ENV LANG=C.UTF-8 LC_ALL=C.UTF-8

# ⭐ 安装 FFmpeg（必需！）
RUN apt-get update && \
    apt-get install -y --no-install-recommends ffmpeg && \
    rm -rf /var/lib/apt/lists/*

# 验证 FFmpeg 安装
RUN ffmpeg -version

# 创建非 root 用户
RUN groupadd -r kidgame && useradd -r -g kidgame kidgame

# 创建工作目录
WORKDIR /app
RUN mkdir -p /app/uploads/temp /app/uploads/audio && \
    chown -R kidgame:kidgame /app

# 复制 jar 包
COPY --from=builder /build/kids-game-backend/target/kids-game-web.jar /app/app.jar

# 复制配置文件（可选）
# COPY kids-game-backend/application.yml /app/

# 切换用户
USER kidgame

# 暴露端口
EXPOSE 8080

# JVM 参数
ENV JAVA_OPTS="-Xms512m -Xmx1024m -XX:+UseG1GC"

# 启动应用
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar /app/app.jar"]
```

---

### 方案 B：使用 JavaCV 内置 FFmpeg（不推荐）

#### 优点
- ✅ 无需在系统中安装 FFmpeg
- ✅ Dockerfile 更简单

#### 缺点
- ❌ 依赖体积巨大（~200-300MB）
- ❌ 内存占用高
- ❌ 启动速度慢
- ❌ 兼容性问题多

#### 修改代码启用 JavaCV 方案

如果你坚持不想安装系统 FFmpeg，可以修改代码使用 JavaCV API：

```java
private void convertUsingJavaCV(String inputPath, String outputPath) throws Exception {
    try (FFmpegFrameGrabber grabber = new FFmpegFrameGrabber(inputPath)) {
        grabber.start();

        try (FFmpegFrameRecorder recorder = new FFmpegFrameRecorder(outputPath, grabber.getAudioChannels())) {
            recorder.setAudioCodec(avutil.AV_CODEC_ID_MP3);
            recorder.setFormat("mp3");
            recorder.setSampleRate(grabber.getSampleRate());
            recorder.setAudioBitrate(128000);
            recorder.start();

            Frame frame;
            while ((frame = grabber.grabSamples()) != null) {
                recorder.recordSamples(frame.samples);
            }

            recorder.stop();
        }
        
        grabber.stop();
    }
}
```

**⚠️ 注意**：需要在 `pom.xml` 中添加完整依赖：

```xml
<!-- JavaCV 完整版（包含所有平台 binaries） -->
<dependency>
    <groupId>org.bytedeco</groupId>
    <artifactId>javacv-platform</artifactId>
    <version>1.5.9</version>
    <!-- 这会增加 ~200MB 的依赖体积！ -->
</dependency>
```

**结论**：❌ **强烈不推荐**，还是用方案 A 吧！

---

## 📦 完整的 Docker 配置示例

### 项目结构

```
kids-game-project-v5/
├── docker/
│   ├── Dockerfile              # 主 Dockerfile
│   ├── docker-compose.yml      # Docker Compose 配置
│   └── docker-compose.dev.yml  # 开发环境配置
├── kids-game-backend/
│   └── ...
└── kids-game-frontend/
    └── ...
```

### docker/Dockerfile

```dockerfile
# 多阶段构建 - 优化镜像大小
FROM maven:3.9-eclipse-temurin-17 AS builder

WORKDIR /build
COPY kids-game-backend/pom.xml .
COPY kids-game-backend/*/pom.xml ./

# 预下载依赖
RUN mvn dependency:go-offline -B

# 构建应用
COPY kids-game-backend/src ./src
RUN mvn clean package -DskipTests -B

# ========================================
# 生产镜像
# ========================================
FROM openjdk:17-slim

LABEL maintainer="your-team@example.com"
LABEL description="儿童游戏平台后端 - 支持音频格式转换"

# ⭐ 安装 FFmpeg（生产环境必需）
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    ffmpeg \
    ca-certificates \
    curl \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# 验证 FFmpeg
RUN ffmpeg -version && echo "✅ FFmpeg installed"

# 创建应用用户
RUN groupadd -r kidgame && useradd -r -g kidgame kidgame

# 创建目录结构
WORKDIR /app
RUN mkdir -p /app/uploads/{temp,audio,images} && \
    chown -R kidgame:kidgame /app

# 复制应用
COPY --from=builder /build/target/kids-game-web.jar /app/app.jar
COPY --from=builder /build/target/classes/application.yml /app/application.yml

# 设置环境变量
ENV SPRING_PROFILES_ACTIVE=prod \
    UPLOAD_PATH=/app/uploads \
    JAVA_OPTS="-Xms512m -Xmx1024m -XX:+UseG1GC -XX:MaxGCPauseMillis=200"

# 暴露端口
EXPOSE 8080

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8080/actuator/health || exit 1

# 切换用户（安全最佳实践）
USER kidgame

# 启动应用
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar /app/app.jar"]
```

### docker/docker-compose.yml

```yaml
version: '3.8'

services:
  backend:
    build:
      context: ..
      dockerfile: docker/Dockerfile
    container_name: kids-game-backend
    ports:
      - "8080:8080"
    environment:
      - SPRING_PROFILES_ACTIVE=prod
      - JAVA_OPTS=-Xms512m -Xmx1024m
    volumes:
      - uploads_data:/app/uploads
    networks:
      - kids-game-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/actuator/health"]
      interval: 30s
      timeout: 3s
      retries: 3
      start_period: 60s

  frontend:
    build:
      context: ../kids-game-frontend
      dockerfile: Dockerfile
    container_name: kids-game-frontend
    ports:
      - "80:80"
    depends_on:
      - backend
    networks:
      - kids-game-network
    restart: unless-stopped

volumes:
  uploads_data:
    driver: local

networks:
  kids-game-network:
    driver: bridge
```

### docker/docker-compose.dev.yml（开发环境）

```yaml
version: '3.8'

services:
  backend-dev:
    build:
      context: ..
      dockerfile: docker/Dockerfile.dev
    container_name: kids-game-backend-dev
    ports:
      - "8080:8080"
    volumes:
      - ../kids-game-backend:/app/src
      - uploads_dev:/app/uploads
    environment:
      - SPRING_PROFILES_ACTIVE=dev
      - JAVA_OPTS=-Xdebug -agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=5005
    networks:
      - kids-game-network

volumes:
  uploads_dev:
    driver: local

networks:
  kids-game-network:
    driver: bridge
```

### docker/Dockerfile.dev（开发环境）

```dockerfile
FROM maven:3.9-eclipse-temurin-17

WORKDIR /app

# ⭐ 开发环境也需要 FFmpeg
RUN apt-get update && \
    apt-get install -y ffmpeg git vim && \
    rm -rf /var/lib/apt/lists/*

# 复制项目
COPY kids-game-backend/pom.xml .
COPY kids-game-backend/src ./src

# 暴露调试端口
EXPOSE 8080 5005

# 开发模式启动
CMD ["mvn", "spring-boot:run", "-Dspring-boot.run.jvmArguments='-Xdebug -agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=5005'"]
```

---

## 🧪 测试和验证

### 1. 构建镜像

```bash
cd docker
docker-compose build
```

### 2. 启动服务

```bash
docker-compose up -d
```

### 3. 验证 FFmpeg

```bash
# 进入容器
docker exec -it kids-game-backend bash

# 验证 FFmpeg
ffmpeg -version

# 应该看到类似输出：
# ffmpeg version 5.1.4-0+deb12u1 Copyright (c) 2000-2023 the FFmpeg developers
# built with gcc 12 (Debian 12.2.0-14)
```

### 4. 测试音频转换

```bash
# 查看日志
docker logs -f kids-game-backend

# 应该能看到音频转换日志：
# 🎵 收到音频上传请求：originalName=recording_xxx.webm
# 🔄 检测到 webm 格式，开始转换为 MP3...
# 🔄 调用 FFmpeg 转换：xxx -> xxx
# ✅ FFmpeg 转换完成
```

---

## 📊 镜像大小对比

| 方案 | 镜像大小 | 启动时间 | 内存占用 | 推荐度 |
|------|---------|---------|---------|--------|
| **系统 FFmpeg** | ~400MB | ~5 秒 | ~500MB | ⭐⭐⭐⭐⭐ |
| JavaCV 内置 | ~600MB | ~10 秒 | ~800MB | ⭐⭐ |

---

## 🎯 生产环境建议

### 1. 使用更小的基础镜像

```dockerfile
# 使用 Alpine 进一步减小体积
FROM eclipse-temurin:17-jre-alpine

# 安装 FFmpeg（Alpine 版本）
RUN apk add --no-cache ffmpeg

# 其余配置类似...
```

### 2. 多阶段构建优化

```dockerfile
# 最终镜像只包含 JRE 和 FFmpeg
FROM eclipse-temurin:17-jre-slim
RUN apt-get update && apt-get install -y ffmpeg --no-install-recommends
COPY --from=builder /app/target/*.jar app.jar
```

### 3. 资源限制

```yaml
# docker-compose.yml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 2G
        reservations:
          cpus: '1.0'
          memory: 1G
```

---

## ⚠️ 常见问题

### Q1: 容器内无法访问 ffmpeg？

**A**: 确保在 Dockerfile 中安装了 FFmpeg：

```dockerfile
RUN apt-get update && apt-get install -y ffmpeg
```

### Q2: 权限问题？

**A**: 确保挂载卷的权限正确：

```yaml
volumes:
  - type: volume
    source: uploads_data
    target: /app/uploads
    volume:
      nocopy: true
```

### Q3: 性能优化？

**A**: 
- 使用 JRE 而不是 JDK
- 使用 Alpine 基础镜像
- 调整 JVM 参数
- 使用 G1 GC

---

## 📝 总结

### ✅ 必须做的

1. **在 Dockerfile 中安装 FFmpeg**
   ```dockerfile
   RUN apt-get install -y ffmpeg
   ```

2. **验证 FFmpeg 安装**
   ```dockerfile
   RUN ffmpeg -version
   ```

3. **挂载数据卷**
   ```yaml
   volumes:
     - uploads_data:/app/uploads
   ```

### ❌ 避免做的

1. ~~不要在运行时手动安装 FFmpeg~~
2. ~~不要使用 JavaCV 内置方案（除非必要）~~
3. ~~不要以 root 用户运行应用~~

---

**最后更新**：2026-03-22  
**适用环境**：Docker / Kubernetes / 本地开发
