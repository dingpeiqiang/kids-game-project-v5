# FFmpeg 安装 - 一句话总结

## 🎯 核心要点

**问题**：需要安装 FFmpeg 吗？  
**答案**：**必须安装！** 无论在本地、服务器还是 Docker 容器。

---

## 💻 各环境安装方法

### Windows（开发环境）
```powershell
.\install-ffmpeg.ps1
```

### Linux（服务器）
```bash
sudo apt-get update
sudo apt-get install -y ffmpeg
```

### macOS（开发环境）
```bash
brew install ffmpeg
```

### Docker 容器（生产环境）
```dockerfile
FROM openjdk:17-slim

# ⭐ 必需的安装步骤
RUN apt-get update && \
    apt-get install -y ffmpeg && \
    rm -rf /var/lib/apt/lists/*

COPY target/kids-game-web.jar app.jar
ENTRYPOINT ["java", "-jar", "/app.jar"]
```

### Kubernetes
```yaml
# 在 Deployment 的 initContainer 中安装
initContainers:
- name: install-ffmpeg
  image: alpine
  command: ["sh", "-c", "apk add --no-cache ffmpeg"]
```

---

## ✅ 验证安装

```bash
# 所有环境通用
ffmpeg -version
```

**预期输出**：
```
ffmpeg version 6.0 Copyright (c) 2000-2023 the FFmpeg developers
built with gcc ...
```

---

## ❓ 为什么必须安装？

因为代码中调用了系统命令：

```java
ProcessBuilder processBuilder = new ProcessBuilder(
    "ffmpeg",  // ← 这是操作系统命令，不是 Java 库
    "-i", inputPath,
    "-codec:a", "libmp3lame",
    ...
);
```

---

## 🐳 Docker 完整示例

```dockerfile
FROM maven:3.9-eclipse-temurin-17 AS builder
WORKDIR /build
COPY . .
RUN mvn clean package -DskipTests

FROM openjdk:17-slim

# ⭐ 关键：安装 FFmpeg
RUN apt-get update && apt-get install -y ffmpeg

WORKDIR /app
COPY --from=builder /build/target/*.jar app.jar
ENTRYPOINT ["java", "-jar", "app.jar"]
```

---

## 📚 详细文档

查看 [`DOCKER_DEPLOYMENT_AUDIO.md`](DOCKER_DEPLOYMENT_AUDIO.md) 获取完整指南。

---

**最后更新**：2026-03-22
