package com.kidgame.service.impl;

import com.kidgame.common.exception.BusinessException;
import com.kidgame.service.CosCredentialService;
import com.qcloud.cos.exception.CosClientException;
import com.tencent.cloud.CosStsClient;
import com.tencent.cloud.Response;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.text.SimpleDateFormat;
import java.util.*;

/**
 * 腾讯云 COS 临时密钥服务实现
 * 
 * 基于 cos-sts_api SDK 生成前端直传所需的临时密钥
 * 
 * @author kids-game-team
 * @date 2026-03-19
 */
@Slf4j
@Service
public class CosCredentialServiceImpl implements CosCredentialService {

    @Value("${tencent.cos.secret-id:}")
    private String secretId;

    @Value("${tencent.cos.secret-key:}")
    private String secretKey;

    @Value("${tencent.cos.bucket:}")
    private String bucket;

    @Value("${tencent.cos.region:ap-guangzhou}")
    private String region;

    @Value("${tencent.cos.base-url:}")
    private String baseUrl;

    // 临时密钥有效期（秒）
    private static final int DEFAULT_DURATION_SECONDS = 1800; // 30分钟

    // 允许上传的文件后缀白名单
    private static final List<String> IMAGE_EXTENSIONS = Arrays.asList("jpg", "jpeg", "png", "gif", "webp", "svg");
    private static final List<String> AUDIO_EXTENSIONS = Arrays.asList("mp3", "wav", "ogg");

    @Override
    public Map<String, Object> getUploadCredential(String filename, String category) {
        return generateCredential(filename, category);
    }

    @Override
    public Map<String, Object> getUploadCredential(String filename) {
        return generateCredential(filename, null);
    }

    /**
     * 生成临时密钥
     */
    private Map<String, Object> generateCredential(String filename, String category) {
        // 1. 验证配置
        if (secretId == null || secretId.isEmpty() || secretKey == null || secretKey.isEmpty()) {
            log.error("COS 配置不完整：secretId 或 secretKey 为空");
            throw new BusinessException("COS 服务未配置，请联系管理员");
        }

        if (bucket == null || bucket.isEmpty()) {
            log.error("COS 配置不完整：bucket 为空");
            throw new BusinessException("COS 桶名称未配置，请联系管理员");
        }

        // 2. 提取文件扩展名
        String extension = extractExtension(filename);
        if (extension == null || extension.isEmpty()) {
            throw new BusinessException("无法识别文件类型");
        }

        // 3. 验证文件类型
        String fileType = validateFileType(extension);

        // 4. 生成 COS 对象键（objectKey）
        String objectKey = generateCosKey(extension, category);

        // 5. 构建 Policy
        String policy = buildPolicy(objectKey, extension);

        // 6. 获取临时密钥
        TreeMap<String, Object> config = new TreeMap<>();
        config.put("secretId", secretId);
        config.put("secretKey", secretKey);
        config.put("durationSeconds", DEFAULT_DURATION_SECONDS);
        config.put("bucket", bucket);
        config.put("region", region);
        config.put("key", objectKey);
        config.put("policy", policy);

        try {
            Response response = CosStsClient.getCredential(config);

            // 7. 构建返回结果
            Map<String, Object> result = new TreeMap<>();
            
            // 临时密钥信息
            Map<String, Object> credentials = new TreeMap<>();
            credentials.put("tmpSecretId", response.credentials.tmpSecretId);
            credentials.put("tmpSecretKey", response.credentials.tmpSecretKey);
            credentials.put("sessionToken", response.credentials.sessionToken);
            
            result.put("credentials", credentials);
            result.put("startTime", response.startTime);
            result.put("expiredTime", response.expiredTime);
            result.put("expiration", response.expiration);
            result.put("requestId", response.requestId);
            
            // COS 配置信息
            result.put("bucket", bucket);
            result.put("region", region);
            result.put("objectKey", objectKey);
            result.put("fileType", fileType);
            
            // 完整的访问 URL（用于前端展示）
            result.put("url", buildFullUrl(objectKey));

            log.info("临时密钥生成成功：objectKey={}, fileType={}, expiredTime={}", 
                    objectKey, fileType, response.expiredTime);

            return result;

        } catch (CosClientException e) {
            log.error("获取临时密钥失败", e);
            throw new BusinessException("获取临时密钥失败：" + e.getMessage());
        } catch (Exception e) {
            log.error("生成临时密钥异常", e);
            throw new BusinessException("生成临时密钥异常：" + e.getMessage());
        }
    }

    /**
     * 提取文件扩展名
     */
    private String extractExtension(String filename) {
        if (filename == null || filename.isEmpty()) {
            return null;
        }

        int lastDotIndex = filename.lastIndexOf('.');
        if (lastDotIndex == -1 || lastDotIndex == filename.length() - 1) {
            return null;
        }

        return filename.substring(lastDotIndex + 1).toLowerCase();
    }

    /**
     * 验证文件类型
     */
    private String validateFileType(String extension) {
        if (IMAGE_EXTENSIONS.contains(extension)) {
            return "image";
        } else if (AUDIO_EXTENSIONS.contains(extension)) {
            return "audio";
        } else {
            throw new BusinessException("不支持的文件类型：" + extension + "，仅支持图片和音频文件");
        }
    }

    /**
     * 生成 COS 对象键
     */
    private String generateCosKey(String extension, String category) {
        Date date = new Date();
        SimpleDateFormat dateFormat = new SimpleDateFormat("yyyyMMdd");
        String ymd = dateFormat.format(date);

        Random random = new Random();
        int r = random.nextInt(1000000);
        String rStr = String.format("%06d", r);

        // 如果指定了分类，使用分类路径；否则使用默认路径
        String basePath = (category != null && !category.isEmpty()) ? category : "file";
        
        return String.format("%s/%s/%s_%s.%s", basePath, ymd, ymd, rStr, extension);
    }

    /**
     * 构建权限策略（Policy）
     */
    private String buildPolicy(String objectKey, String extension) {
        // 从 bucket 中提取 appId（格式：bucketname-appid）
        String appId = extractAppId(bucket);

        // 资源路径
        String resource = "qcs::cos:" + region + ":uid/" + appId + ':' + bucket + '/' + objectKey;

        // 允许的操作
        List<String> allowActions = Arrays.asList(
            // 简单上传
            "name/cos:PutObject",
            // 分块上传
            "name/cos:InitiateMultipartUpload",
            "name/cos:ListMultipartUploads",
            "name/cos:ListParts",
            "name/cos:UploadPart",
            "name/cos:CompleteMultipartUpload"
        );

        // 条件限制
        Map<String, Object> condition = new HashMap<>();

        // 限制上传文件 content-type
        if (IMAGE_EXTENSIONS.contains(extension)) {
            condition.put("string_like_if_exist", new HashMap<String, String>() {{
                put("cos:content-type", "image/*");
            }});
        } else if (AUDIO_EXTENSIONS.contains(extension)) {
            condition.put("string_like_if_exist", new HashMap<String, String>() {{
                put("cos:content-type", "audio/*");
            }});
        }

        // 构建 Policy
        Map<String, Object> policy = new HashMap<>();
        policy.put("version", "2.0");

        Map<String, Object> statement = new HashMap<>();
        statement.put("action", allowActions);
        statement.put("effect", "allow");
        statement.put("resource", Arrays.asList(resource));
        if (!condition.isEmpty()) {
            statement.put("condition", condition);
        }

        policy.put("statement", Arrays.asList(statement));

        // 转换为 JSON 字符串
        return toJsonString(policy);
    }

    /**
     * 从 bucket 名称提取 appId
     */
    private String extractAppId(String bucket) {
        // bucket 格式：bucketname-appid
        int lastDashIndex = bucket.lastIndexOf('-');
        if (lastDashIndex != -1 && lastDashIndex < bucket.length() - 1) {
            return bucket.substring(lastDashIndex + 1);
        }
        // 如果无法提取，返回默认值（不应该发生）
        log.warn("无法从 bucket 名称提取 appId：{}", bucket);
        return "1250000000"; // 示例值
    }

    /**
     * 构建完整的访问 URL
     */
    private String buildFullUrl(String objectKey) {
        // 如果配置了自定义 CDN 域名，使用 CDN
        if (baseUrl != null && !baseUrl.isEmpty()) {
            return baseUrl.endsWith("/") 
                ? baseUrl + objectKey 
                : baseUrl + "/" + objectKey;
        }

        // 否则使用 COS 默认域名
        return String.format("https://%s.cos.%s.myqcloud.com/%s", bucket, region, objectKey);
    }

    /**
     * 简单的 JSON 序列化（避免引入额外依赖）
     */
    private String toJsonString(Map<String, Object> map) {
        StringBuilder sb = new StringBuilder();
        sb.append("{");
        
        boolean first = true;
        for (Map.Entry<String, Object> entry : map.entrySet()) {
            if (!first) {
                sb.append(",");
            }
            first = false;
            
            sb.append("\"").append(entry.getKey()).append("\":");
            Object value = entry.getValue();
            
            if (value instanceof String) {
                sb.append("\"").append(value).append("\"");
            } else if (value instanceof List) {
                List<?> list = (List<?>) value;
                sb.append("[");
                boolean firstItem = true;
                for (Object item : list) {
                    if (!firstItem) {
                        sb.append(",");
                    }
                    firstItem = false;
                    if (item instanceof String) {
                        sb.append("\"").append(item).append("\"");
                    } else {
                        sb.append(item);
                    }
                }
                sb.append("]");
            } else if (value instanceof Map) {
                sb.append(toJsonString((Map<String, Object>) value));
            } else {
                sb.append(value);
            }
        }
        
        sb.append("}");
        return sb.toString();
    }
}
