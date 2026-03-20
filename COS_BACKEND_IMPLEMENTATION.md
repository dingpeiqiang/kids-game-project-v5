# 腾讯云 COS 临时密钥接口实现指南

## 概述

为了支持前端直接上传文件到腾讯云 COS，需要后端提供一个接口来生成临时密钥。

## 为什么需要临时密钥

1. **安全考虑**：不能在前端暴露永久的 SecretId 和 SecretKey
2. **权限控制**：可以限制上传的路径、时间、桶等
3. **临时访问**：密钥有过期时间，过期后无法使用

## 实现步骤

### 1. 添加依赖

Maven 项目（pom.xml）:

```xml
<dependency>
    <groupId>com.qcloud</groupId>
    <artifactId>cos_sts_java</artifactId>
    <version>3.1.0.68</version>
</dependency>
```

Gradle 项目（build.gradle）:

```groovy
implementation 'com.qcloud:cos_sts_java:3.1.0.68'
```

### 2. 创建 Controller

```java
package com.kidgame.controller;

import com.tencent.cloud.CosStsClient;
import org.springframework.web.bind.annotation.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;

import java.util.HashMap;
import java.util.Map;
import java.util.TreeMap;

/**
 * 腾讯云 COS 临时密钥接口
 */
@RestController
@RequestMapping("/api/cos")
@CrossOrigin(origins = "*")
public class CosController {

    @Value("${tencent.cos.secret-id:}")
    private String secretId;

    @Value("${tencent.cos.secret-key:}")
    private String secretKey;

    @Value("${tencent.cos.app-id:}")
    private String appId;

    @Value("${tencent.cos.bucket:}")
    private String bucket;

    @Value("${tencent.cos.region:}")
    private String region;

    /**
     * 获取 COS 临时密钥
     */
    @PostMapping("/credentials")
    public Map<String, Object> getCredentials(@RequestBody Map<String, String> request) {
        String requestBucket = request.getOrDefault("bucket", bucket);
        String requestRegion = request.getOrDefault("region", region);

        TreeMap<String, Object> config = new TreeMap<>();
        config.put("SecretId", secretId);
        config.put("SecretKey", secretKey);
        config.put("durationSeconds", 7200); // 2小时
        config.put("bucket", requestBucket);
        config.put("region", requestRegion);
        config.put("allowPrefix", "*"); // 允许所有路径，或指定前缀如 "themes/*"
        config.put("allowActions", new String[]{
            "name/cos:PutObject",
            "name/cos:GetObject",
            "name/cos:DeleteObject"
        });

        try {
            Map<String, Object> result = CosStsClient.getCredential(config);

            Map<String, Object> response = new HashMap<>();
            response.put("code", 0);
            response.put("message", "success");
            response.put("credentials", result.get("credentials"));
            response.put("expiredTime", result.get("expiredTime"));
            response.put("startTime", result.get("startTime"));
            response.put("expiration", result.get("expiration"));
            response.put("requestId", result.get("requestId"));

            return response;
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("code", -1);
            error.put("message", "获取临时密钥失败: " + e.getMessage());
            return error;
        }
    }
}
```

### 3. 配置文件

application.yml:

```yaml
tencent:
  cos:
    secret-id: ${COS_SECRET_ID}      # 从环境变量读取
    secret-key: ${COS_SECRET_KEY}    # 从环境变量读取
    app-id: ${COS_APP_ID}            # 腾讯云 AppID
    bucket: ${COS_BUCKET}           # 存储桶名称
    region: ${COS_REGION}            # 地域，如 ap-guangzhou
```

或使用 application.properties:

```properties
tencent.cos.secret-id=AKIDXXXXXXXXXXXXXXXXXXXXXXX
tencent.cos.secret-key=XXXXXXXXXXXXXXXXXXXXXXXXXXXX
tencent.cos.app-id=1234567890
tencent.cos.bucket=kids-game-resources
tencent.cos.region=ap-guangzhou
```

### 4. 安全建议

#### 限制上传路径

```java
// 只允许上传到特定路径
config.put("allowPrefix", "themes/images/*,themes/audio/*");

// 或使用精确路径
config.put("allowPrefix", "themes/" + userId + "/*");
```

#### 限制操作权限

```java
// 只允许上传和读取，不允许删除
config.put("allowActions", new String[]{
    "name/cos:PutObject",
    "name/cos:GetObject"
});
```

#### IP 白名单（可选）

```java
// 添加 IP 限制条件
config.put("ipRange", "10.0.0.0/8"); // 只允许内网 IP
```

### 5. 错误处理

```java
@ExceptionHandler(Exception.class)
public Map<String, Object> handleException(Exception e) {
    Map<String, Object> error = new HashMap<>();
    error.put("code", -1);
    error.put("message", e.getMessage());
    error.put("timestamp", System.currentTimeMillis());
    return error;
}
```

### 6. 前端配置

更新 .env 文件：

```bash
# 开发环境
VITE_COS_BUCKET=kids-game-resources-dev
VITE_COS_REGION=ap-guangzhou
VITE_UPLOAD_METHOD=cos

# 生产环境
VITE_COS_BUCKET=kids-game-resources-prod
VITE_COS_REGION=ap-guangzhou
```

### 7. 测试接口

使用 curl 测试：

```bash
curl -X POST http://localhost:8080/api/cos/credentials \
  -H "Content-Type: application/json" \
  -d '{"bucket": "kids-game-resources", "region": "ap-guangzhou"}'
```

响应示例：

```json
{
  "code": 0,
  "message": "success",
  "credentials": {
    "tmpSecretId": "XXXXXXXXXXXXXXX",
    "tmpSecretKey": "XXXXXXXXXXXXXXX",
    "sessionToken": "XXXXXXXXXXXXXXX"
  },
  "expiredTime": 1710921600,
  "startTime": 1710914400,
  "expiration": "2026-03-20T12:00:00Z",
  "requestId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}
```

## 完整示例

### 完整 Controller 代码

```java
package com.kidgame.controller;

import com.tencent.cloud.CosStsClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import java.util.*;

/**
 * 腾讯云 COS 临时密钥接口
 *
 * @author Kids Game Team
 */
@RestController
@RequestMapping("/api/cos")
@CrossOrigin(origins = "*")
public class CosController {

    @Value("${tencent.cos.secret-id:}")
    private String secretId;

    @Value("${tencent.cos.secret-key:}")
    private String secretKey;

    @Value("${tencent.cos.bucket:}")
    private String bucket;

    @Value("${tencent.cos.region:ap-guangzhou}")
    private String region;

    /**
     * 获取 COS 临时密钥
     *
     * @param request 请求体，包含 bucket 和 region
     * @return 临时密钥信息
     */
    @PostMapping("/credentials")
    public Map<String, Object> getCredentials(@RequestBody Map<String, String> request) {
        String requestBucket = request.getOrDefault("bucket", bucket);
        String requestRegion = request.getOrDefault("region", region);

        // 验证必填参数
        if (secretId == null || secretId.isEmpty()) {
            return createErrorResponse("SecretId 未配置");
        }
        if (secretKey == null || secretKey.isEmpty()) {
            return createErrorResponse("SecretKey 未配置");
        }
        if (requestBucket == null || requestBucket.isEmpty()) {
            return createErrorResponse("Bucket 未指定");
        }

        // 配置参数
        TreeMap<String, Object> config = new TreeMap<>();
        config.put("SecretId", secretId);
        config.put("SecretKey", secretKey);
        config.put("durationSeconds", 7200); // 2小时有效期
        config.put("bucket", requestBucket);
        config.put("region", requestRegion);

        // 限制上传路径（只允许 themes 目录）
        config.put("allowPrefix", "themes/*");

        // 允许的操作
        config.put("allowActions", new String[]{
            // 上传
            "name/cos:PutObject",
            // 下载
            "name/cos:GetObject",
            // 删除
            "name/cos:DeleteObject",
            // 分片上传初始化
            "name/cos:InitiateMultipartUpload",
            // 分片上传
            "name/cos:UploadPart",
            // 分片上传完成
            "name/cos:CompleteMultipartUpload"
        });

        try {
            // 调用 COS STS 获取临时密钥
            Map<String, Object> result = CosStsClient.getCredential(config);

            // 构建成功响应
            Map<String, Object> response = new HashMap<>();
            response.put("code", 0);
            response.put("message", "success");
            response.put("credentials", result.get("credentials"));
            response.put("expiredTime", result.get("expiredTime"));
            response.put("startTime", result.get("startTime"));
            response.put("expiration", result.get("expiration"));
            response.put("requestId", result.get("requestId"));

            System.out.println("COS 临时密钥生成成功，Bucket: " + requestBucket + ", Region: " + requestRegion);

            return response;
        } catch (Exception e) {
            System.err.println("COS 临时密钥生成失败: " + e.getMessage());
            e.printStackTrace();
            return createErrorResponse("获取临时密钥失败: " + e.getMessage());
        }
    }

    /**
     * 创建错误响应
     */
    private Map<String, Object> createErrorResponse(String message) {
        Map<String, Object> response = new HashMap<>();
        response.put("code", -1);
        response.put("message", message);
        response.put("timestamp", System.currentTimeMillis());
        return response;
    }

    /**
     * CORS 配置
     */
    @Bean
    public CorsFilter corsFilter() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowCredentials(true);
        config.addAllowedOriginPattern("*");
        config.addAllowedHeader("*");
        config.addAllowedMethod("*");

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);

        return new CorsFilter(source);
    }
}
```

### 集成到现有项目

如果项目已经有其他 Controller，可以将 COS 相关代码添加到现有文件中，或创建一个新的 `CosController.java` 文件。

#### 1. 创建新文件

在 `kids-game-backend/kids-game-web/src/main/java/com/kidgame/controller/` 目录下创建 `CosController.java`。

#### 2. 添加配置

在 `application.yml` 中添加：

```yaml
tencent:
  cos:
    secret-id: ${COS_SECRET_ID:your-secret-id}
    secret-key: ${COS_SECRET_KEY:your-secret-key}
    bucket: ${COS_BUCKET:your-bucket}
    region: ${COS_REGION:ap-guangzhou}
```

#### 3. 环境变量

在服务器上设置环境变量：

```bash
export COS_SECRET_ID=your-secret-id
export COS_SECRET_KEY=your-secret-key
export COS_BUCKET=your-bucket
export COS_REGION=ap-guangzhou
```

或在 Docker 环境中：

```yaml
environment:
  - COS_SECRET_ID=your-secret-id
  - COS_SECRET_KEY=your-secret-key
  - COS_BUCKET=your-bucket
  - COS_REGION=ap-guangzhou
```

## 部署检查清单

- [ ] 后端接口已部署并可访问
- [ ] 接口地址已更新到前端 .env 文件
- [ ] SecretId 和 SecretKey 已配置
- [ ] 存储桶已创建并配置好 CORS
- [ ] 存储桶有公读权限或正确配置签名访问
- [ ] 测试上传功能正常

## 常见问题

### Q1: 获取临时密钥失败

**A**: 检查以下配置：
1. SecretId 和 SecretKey 是否正确
2. 是否有调用 COS STS 的权限
3. 存储桶名称和地域是否正确

### Q2: 前端上传失败

**A**: 检查：
1. 后端接口是否可访问
2. CORS 配置是否正确
3. 存储桶 CORS 是否允许前端域名

### Q3: 权限不足

**A**: 检查：
1. 临时密钥是否过期
2. allowActions 配置是否包含所需操作
3. allowPrefix 配置是否包含上传路径

### Q4: 上传后无法访问

**A**: 检查：
1. 存储桶权限配置（public-read 或签名）
2. 文件路径是否正确
3. 文件是否上传成功

## 下一步

1. **配置存储桶 CORS**
   - 登录腾讯云 COS 控制台
   - 选择存储桶
   - 进入「基础配置」→「跨域访问 CORS」
   - 添加允许的来源（前端域名）

2. **测试完整流程**
   - 启动后端服务
   - 启动前端服务
   - 上传图片和音频
   - 验证文件可访问

3. **配置生产环境**
   - 使用不同的存储桶（dev/prod）
   - 配置更严格的权限
   - 启用日志记录

## 相关文档

- [腾讯云 COS 文档](https://cloud.tencent.com/document/product/436)
- [COS STS Java SDK](https://github.com/tencentyun/qcloud-cos-sts-sdk-java)
- [临时密钥使用指南](https://cloud.tencent.com/document/product/436/14048)

---

**最后更新**: 2026-03-19
**版本**: 1.0
**状态**: 待后端实现
