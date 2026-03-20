# COS 临时密钥实现文档

## 概述

本文档说明项目中实现的腾讯云 COS 临时密钥功能，用于支持前端直传 COS。

## 架构

```
┌─────────────┐     1. 获取临时密钥      ┌─────────────┐
│             │  ──────────────────────► │             │
│   前端      │                         │   后端      │
│             │ ◄────────────────────── │             │
│             │    返回临时密钥          │             │
└─────────────┘                         └─────────────┘
       │                                        │
       │ 2. 直传 COS                           │
       ▼                                        ▼
┌─────────────┐                         ┌─────────────┐
│             │                         │             │
│  腾讯云 COS │                         │ STS 服务    │
│             │                         │             │
└─────────────┘                         └─────────────┘
```

## 实现文件

### 后端

| 文件 | 说明 |
|------|------|
| `CosCredentialService.java` | 临时密钥服务接口 |
| `CosCredentialServiceImpl.java` | 临时密钥服务实现 |
| `CosController.java` | 提供 `/api/cos/credentials` 接口 |

### 前端

| 文件 | 说明 |
|------|------|
| `cos-upload.service.ts` | COS 上传服务（已有） |
| `unified-upload.service.ts` | 统一上传服务（已有） |

## API 接口

### 获取临时密钥

**请求**
```
POST /api/cos/credentials
Content-Type: application/json

{
  "filename": "test.jpg",
  "category": "themes/images",
  "bucket": "bucket-1250000000",
  "region": "ap-guangzhou"
}
```

**响应**
```json
{
  "code": 200,
  "data": {
    "credentials": {
      "tmpSecretId": "xxx",
      "tmpSecretKey": "xxx",
      "sessionToken": "xxx"
    },
    "startTime": 1234567890,
    "expiredTime": 1234569690,
    "bucket": "bucket-1250000000",
    "region": "ap-guangzhou",
    "objectKey": "themes/images/20260319/20260319_123456.jpg",
    "fileType": "image",
    "url": "https://bucket-1250000000.cos.ap-guangzhou.myqcloud.com/themes/images/20260319/20260319_123456.jpg"
  }
}
```

## 配置项

在 `application.yml` 中配置：

```yaml
tencent:
  cos:
    secret-id: your-secret-id
    secret-key: your-secret-key
    bucket: bucket-1250000000
    region: ap-guangzhou
    base-url: https://cdn.yourdomain.com  # 可选，使用 CDN 域名
```

## 安全特性

1. **临时密钥**：每次请求生成临时密钥，30分钟有效期
2. **权限限制**：基于 Policy 限制上传路径和文件类型
3. **密钥分离**：永久密钥仅在后端使用，不暴露给前端

## 文件类型限制

- **图片**：jpg, jpeg, png, gif, webp, svg
- **音频**：mp3, wav, ogg

## 测试

访问测试页面：
- `test-cos-credential.html` - 基础测试
- `test-cos-upload-sdk.html` - 使用官方 SDK 测试

## 前端使用示例

```typescript
import { cosUploadService } from '@/services/cos-upload.service'

// 上传图片
const result = await cosUploadService.uploadImage(file, 'themes/images')
console.log('文件 URL:', result.url)

// 上传音频
const audioResult = await cosUploadService.uploadAudio(audioFile, 'themes/audio')
console.log('音频 URL:', audioResult.url)
```
