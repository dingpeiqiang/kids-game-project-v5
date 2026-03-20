# COS 上传功能快速开始

## 🚀 5 分钟快速配置

### 第一步：获取腾讯云密钥（2 分钟）

1. 登录 [腾讯云控制台](https://console.cloud.tencent.com/)
2. 进入 [访问密钥管理](https://console.cloud.tencent.com/cam/capi)
3. 新建或查看已有密钥，记录：
   - **SecretId**
   - **SecretKey**
   - **AppID**（右上角查看）

4. 创建 COS 存储桶：
   - 进入 [COS 控制台](https://console.cloud.tencent.com/cos5)
   - 创建存储桶，名称如：`kids-game-resources-1234567890`
   - 地域选择最近的（如 `ap-guangzhou`）
   - 权限设置为「公有读私有写」
   - 配置 CORS（跨域访问）：
     ```
     来源：*
     操作：GET, PUT, DELETE, HEAD
     Allow-Headers: *
     Expose-Headers: ETag
     缓存时间：0
     ```

### 第二步：配置环境变量（1 分钟）

#### Windows 用户：

1. 编辑 `setup-cos-env.bat`，填入你的密钥：
```bat
set COS_SECRET_ID=你的 SecretId
set COS_SECRET_KEY=你的 SecretKey
set COS_APP_ID=你的 AppID
set COS_REGION=ap-guangzhou
```

2. 双击运行 `setup-cos-env.bat`

3. **重要**：关闭并重新打开 PowerShell/CMD

#### Linux/Mac 用户：

1. 编辑 `setup-cos-env.sh`，填入你的密钥：
```bash
export COS_SECRET_ID="你的 SecretId"
export COS_SECRET_KEY="你的 SecretKey"
export COS_APP_ID="你的 AppID"
export COS_REGION="ap-guangzhou"
```

2. 运行：`source setup-cos-env.sh`

### 第三步：配置后端（1 分钟）

1. 复制配置文件：
```bash
cd kids-game-backend
copy application.yml.example application.yml
```

2. 验证配置（可选）：
编辑 `application.yml`，确认以下配置：
```yaml
tencent:
  cos:
    secret-id: ${COS_SECRET_ID:your-secret-id}
    secret-key: ${COS_SECRET_KEY:your-secret-key}
    bucket: kids-game-resources-${COS_APP_ID:your-app-id}
    region: ${COS_REGION:ap-guangzhou}
```

### 第四步：下载依赖并启动后端（1 分钟）

```bash
cd kids-game-backend
mvn clean install
mvn spring-boot:run
```

**验证后端状态**：
- 浏览器访问：http://localhost:8080/api/cos/health
- 看到以下响应表示成功：
```json
{
  "code": 0,
  "data": {
    "status": "UP",
    "configured": true,
    "bucket": "kids-game-resources-1234567890",
    "region": "ap-guangzhou"
  }
}
```

### 第五步：配置并启动前端（1 分钟）

1. 编辑 `kids-game-frontend/.env`：
```bash
# 腾讯 COS 配置
VITE_COS_BUCKET=kids-game-resources-你的 APPID
VITE_COS_REGION=ap-guangzhou

# 使用 COS 上传
VITE_UPLOAD_METHOD=cos
```

2. 启动前端：
```bash
cd kids-game-frontend
npm run dev
```

### 第六步：测试上传（30 秒）

**方法 1：使用 Web 测试工具**
1. 浏览器打开：`kids-game-backend/test-cos-upload.html`
2. 配置 API 地址：http://localhost:8080
3. 点击「🔍 测试连接」
4. 选择文件上传

**方法 2：使用主题编辑器**
1. 打开 GTRS 主题编辑器
2. 选择任意图片项
3. 点击上传按钮
4. 选择文件上传

## ✅ 成功标志

如果看到以下日志，表示一切正常：

```
✅ 上传成功！耗时：320ms
URL: https://kids-game-resources-1234567890.cos.ap-guangzhou.myqcloud.com/themes/images/xxx.png
```

## ❌ 常见问题

### 问题 1：环境变量不生效

**症状**：提示"COS 配置未完成"

**解决**：
1. 确保运行了配置脚本
2. 关闭并重新打开终端
3. 验证环境变量：
   ```powershell
   echo $env:COS_SECRET_ID
   echo $env:COS_SECRET_KEY
   ```

### 问题 2：CORS 错误

**症状**：浏览器控制台显示 CORS 错误

**解决**：
1. 检查 COS 存储桶的 CORS 配置
2. 确保允许所有来源（或你的前端域名）
3. 保存后等待 1-2 分钟生效

### 问题 3：Maven 依赖下载失败

**症状**：`com.tencent cannot be resolved`

**解决**：
```bash
# 清理并重新下载
mvn clean
mvn dependency:purge-local-repository
mvn install
```

### 问题 4：上传失败 403

**症状**：返回 403 Forbidden

**解决**：
1. 检查存储桶权限是否为「公有读私有写」
2. 检查临时密钥权限配置
3. 确认上传路径在 themes/* 范围内

## 📊 费用说明

- **存储费**：¥0.118/GB/月
- **下载费**：¥0.50/GB
- **上传免费**

**预估月费用**：约 ¥3.69（10GB 存储 + 5GB 下载）

## 🔧 切换回本地上传

如果想切换回本地服务器上传：

编辑 `.env`：
```bash
VITE_UPLOAD_METHOD=local
```

重启前端即可，无需修改代码。

## 📚 更多文档

- 详细指南：`COS_UPLOADED_COMPLETE_GUIDE.md`
- 实施报告：`UNIFIED_UPLOAD_API_COMPLETE_REPORT.md`
- 快速配置：`COS_QUICK_START.md`

## 🎉 完成！

现在你可以：
- ✅ 上传图片到 COS
- ✅ 上传音频到 COS
- ✅ 自动获得 CDN 加速
- ✅ 减少服务器压力 90%+
- ✅ 月度成本仅约 ¥3.69

祝你使用愉快！🚀
