# 资源上传配置说明

## 📦 三种上传方式

项目支持三种资源上传方式，**默认使用本地存储，无需额外配置**。

### 方式 1：本地存储（默认）✅

**特点：**
- ✅ 无需任何配置
- ✅ 部署简单快速
- ✅ 适合小型项目和测试环境

**存储位置：**
```
/opt/apps/kids-game-project-v5/uploads/
├── images/
├── audio/
└── videos/
```

**优点：**
- 部署简单，开箱即用
- 无需第三方服务
- 访问速度快（本地读取）

**缺点：**
- 占用服务器磁盘空间
- 不支持 CDN 加速
- 多服务器部署时需要共享存储

---

### 方式 2：腾讯云 COS（可选）

**特点：**
- 需要配置 COS 密钥
- 适合生产环境
- 支持 CDN 加速

**配置步骤：**

1. **创建 COS Bucket**
   - 登录 [腾讯云控制台](https://console.cloud.tencent.com/cos)
   - 创建 Bucket（存储桶）
   - 记录 Bucket 名称和区域

2. **获取密钥**
   - 进入 [API 密钥管理](https://console.cloud.tencent.com/cam/capi)
   - 创建或查看 SecretId 和 SecretKey

3. **配置环境变量**
   ```bash
   # 编辑 .env.production
   vim .env.production
   
   # 取消注释并填写
   COS_SECRET_ID=你的SecretId
   COS_SECRET_KEY=你的SecretKey
   COS_BUCKET=kids-game-resources-你的APPID
   COS_REGION=ap-guangzhou
   ```

4. **重启服务**
   ```bash
   docker-compose restart backend
   ```

**优点：**
- 无限存储空间
- 支持 CDN 加速
- 高可用性
- 减轻服务器负载

**缺点：**
- 需要配置密钥
- 产生流量费用
- 依赖网络

---

### 方式 3：SFTP（可选）

**特点：**
- 需要配置 SFTP 服务器
- 适合已有文件服务器的场景

**配置步骤：**

在 `application.yml` 中配置：

```yaml
sftp:
  enabled: true
  host: sftp.example.com
  port: 22
  username: your-username
  password: your-password
  # 或使用私钥
  # private-key-path: /path/to/private_key
  base-directory: /upload
  base-url: https://cdn.example.com/resources
```

**优点：**
- 可以使用现有文件服务器
- 灵活控制存储位置

**缺点：**
- 需要维护 SFTP 服务器
- 配置相对复杂

---

## 🎯 推荐方案

### 测试/开发环境
**推荐：本地存储**
- 无需配置
- 快速部署
- 成本低

### 小型生产环境（用户 < 1000）
**推荐：本地存储 + 定期备份**
- 简单可靠
- 成本低
- 注意磁盘空间监控

### 中型生产环境（用户 1000-10000）
**推荐：腾讯云 COS**
- 可扩展性强
- 支持 CDN
- 自动化运维

### 大型生产环境（用户 > 10000）
**推荐：腾讯云 COS + CDN**
- 高性能
- 全球加速
- 高可用性

---

## 🔧 切换上传方式

### 从本地存储切换到 COS

1. **配置环境变量**
   ```bash
   vim .env.production
   
   # 添加 COS 配置
   COS_SECRET_ID=xxx
   COS_SECRET_KEY=xxx
   COS_BUCKET=xxx
   COS_REGION=ap-guangzhou
   ```

2. **重启后端服务**
   ```bash
   docker-compose restart backend
   ```

3. **迁移已有文件（可选）**
   ```bash
   # 将本地 uploads 目录的文件上传到 COS
   # 可以使用腾讯云 COS Browser 工具或命令行工具
   ```

### 从 COS 切换回本地存储

1. **注释或删除 COS 配置**
   ```bash
   vim .env.production
   
   # 注释掉 COS 配置
   # COS_SECRET_ID=xxx
   # COS_SECRET_KEY=xxx
   # COS_BUCKET=xxx
   # COS_REGION=xxx
   ```

2. **重启后端服务**
   ```bash
   docker-compose restart backend
   ```

---

## 📊 成本对比

### 本地存储
- **服务器磁盘**：已包含在 ECS 费用中
- **额外费用**：无
- **预估成本**：¥0/月

### 腾讯云 COS
- **存储费用**：¥0.12/GB/月
- **流量费用**：¥0.50/GB（外网流出）
- **请求费用**：¥0.01/万次
- **预估成本**（100GB 存储，500GB 流量）：
  - 存储：¥12/月
  - 流量：¥250/月
  - **总计**：~¥262/月

### CDN 加速（配合 COS）
- **流量费用**：¥0.24/GB（比 COS 直接访问便宜）
- **预估成本**（500GB 流量）：¥120/月
- **节省**：¥130/月

---

## ⚙️ 技术实现

### 后端服务选择逻辑

项目使用 Spring Boot 的条件注解自动选择上传服务：

```java
// 本地存储（默认）
@Service
@ConditionalOnProperty(name = "tencent.cos.secret-id", havingValue = "", matchIfMissing = true)
public class ResourceUploadServiceImpl implements ResourceUploadService {
    // 本地文件存储实现
}

// 腾讯云 COS
@Service
@ConditionalOnProperty(name = "tencent.cos.secret-id")
public class ResourceUploadCosServiceImpl implements ResourceUploadService {
    // COS 上传实现
}

// SFTP
@Service
@ConditionalOnProperty(name = "sftp.enabled", havingValue = "true")
public class ResourceUploadSftpServiceImpl implements ResourceUploadService {
    // SFTP 上传实现
}
```

**优先级：**
1. 如果配置了 `sftp.enabled=true` → 使用 SFTP
2. 否则，如果配置了 `tencent.cos.secret-id` → 使用 COS
3. 否则 → 使用本地存储（默认）

---

## 🔍 验证上传方式

### 检查当前使用的上传方式

```bash
# 查看后端日志
docker-compose logs backend | grep "ResourceUpload"

# 应该看到类似输出：
# Using ResourceUploadServiceImpl (local storage)
# 或
# Using ResourceUploadCosServiceImpl (Tencent COS)
# 或
# Using ResourceUploadSftpServiceImpl (SFTP)
```

### 测试上传功能

1. **登录管理后台**
   ```
   http://your-server-ip/admin
   用户名: admin
   密码: admin123
   ```

2. **上传测试图片**
   - 进入"游戏管理" → "资源管理"
   - 上传一张图片
   - 查看返回的 URL

3. **验证存储位置**

   **本地存储：**
   ```bash
   ls -la /opt/apps/kids-game-project-v5/uploads/images/
   # 应该能看到刚上传的文件
   ```

   **COS：**
   - 登录腾讯云 COS 控制台
   - 查看对应的 Bucket
   - 应该能看到上传的文件

---

## 📝 注意事项

### 本地存储
1. **磁盘空间监控**
   ```bash
   # 定期检查磁盘使用
   df -h
   
   # 清理旧文件（如果需要）
   find ./uploads -type f -mtime +90 -delete
   ```

2. **备份策略**
   ```bash
   # 定期备份 uploads 目录
   tar -czf uploads-backup-$(date +%Y%m%d).tar.gz ./uploads
   ```

3. **权限设置**
   ```bash
   # 确保 uploads 目录可写
   chmod -R 755 ./uploads
   chown -R www-data:www-data ./uploads  # Ubuntu
   ```

### 腾讯云 COS
1. **CORS 配置**
   - 在 COS 控制台配置 CORS 规则
   - 允许你的域名访问

2. **防盗链**
   - 配置 Referer 白名单
   - 防止资源被滥用

3. **生命周期管理**
   - 设置文件过期规则
   - 自动删除临时文件

---

## 🆘 常见问题

### Q1: 如何知道当前使用的是哪种上传方式？

查看后端启动日志：
```bash
docker-compose logs backend | grep -i "upload"
```

### Q2: 本地存储的文件在哪里？

```bash
/opt/apps/kids-game-project-v5/uploads/
```

### Q3: COS 配置后不生效？

1. 检查环境变量是否正确
2. 重启后端服务：`docker-compose restart backend`
3. 查看日志确认：`docker-compose logs backend`

### Q4: 可以混合使用吗？

不建议。建议统一使用一种上传方式，避免管理混乱。

### Q5: 从本地切换到 COS 后，旧文件怎么办？

需要手动迁移：
1. 下载本地 uploads 目录的所有文件
2. 上传到 COS Bucket
3. 更新数据库中的 URL（如果需要）

---

## 📚 相关文档

- [Docker 部署指南](./ALIYUN_DIRECT_DEPLOY.md)
- [应用配置示例](../kids-game-backend/application.yml.example)
- [腾讯云 COS 文档](https://cloud.tencent.com/document/product/436)

---

**总结：**
- ✅ **默认使用本地存储，无需配置 COS**
- ✅ 只有在需要时才配置腾讯云 COS
- ✅ 可以根据需求随时切换上传方式
