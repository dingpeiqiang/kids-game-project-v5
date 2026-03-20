package com.kidgame.web.controller;

import com.kidgame.common.model.Result;
import com.kidgame.service.CosCredentialService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * 腾讯云 COS 配置控制器
 * 
 * 从 application.yml 读取 COS 配置信息，提供临时密钥服务
 * 
 * @author kids-game-team
 * @date 2026-03-19
 */
@Slf4j
@RestController
@RequestMapping("/api/cos")
public class CosController {

    @Autowired
    private CosCredentialService cosCredentialService;

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

    /**
     * 获取 COS 配置信息
     * 
     * @return COS 配置信息（不包含密钥）
     */
    @GetMapping("/config")
    public Result<Map<String, Object>> getConfig() {
        // 检查配置
        if (secretId == null || secretId.isEmpty() || 
            secretKey == null || secretKey.isEmpty()) {
            log.error("COS 配置未完成：secretId 或 secretKey 为空");
            return Result.error("COS 配置未完成，请联系管理员");
        }

        Map<String, Object> config = new HashMap<>();
        config.put("bucket", bucket);
        config.put("region", region);
        config.put("baseUrl", baseUrl);
        config.put("configured", true);

        log.info("返回 COS 配置：bucket={}, region={}", bucket, region);
        return Result.success(config);
    }

    /**
     * 健康检查接口
     * 
     * @return 健康状态
     */
    @GetMapping("/health")
    public Result<Map<String, Object>> health() {
        Map<String, Object> status = new HashMap<>();
        status.put("status", "UP");
        status.put("configured", secretId != null && !secretId.isEmpty());
        status.put("bucket", bucket != null && !bucket.isEmpty() ? bucket : "未配置");
        status.put("region", region != null && !region.isEmpty() ? region : "未配置");
        
        return Result.success(status);
    }

    /**
     * 获取上传临时密钥（兼容前端 cos-upload.service.ts）
     * 
     * 前端使用临时密钥可以直接上传文件到 COS，无需通过后端中转
     * 
     * @param requestBody 请求体，包含 filename, category, bucket, region
     * @return 临时密钥信息
     */
    @PostMapping("/credentials")
    public Result<Map<String, Object>> getCredentials(@RequestBody Map<String, String> requestBody) {
        
        try {
            String filename = requestBody.get("filename");
            String category = requestBody.get("category");
            
            // 验证参数
            if (filename == null || filename.isEmpty()) {
                return Result.error("文件名不能为空");
            }

            // 获取临时密钥
            Map<String, Object> credential;
            if (category != null && !category.isEmpty()) {
                credential = cosCredentialService.getUploadCredential(filename, category);
            } else {
                credential = cosCredentialService.getUploadCredential(filename);
            }

            log.info("临时密钥获取成功：filename={}, category={}", filename, category);
            
            return Result.success(credential);

        } catch (Exception e) {
            log.error("获取临时密钥失败", e);
            return Result.error("获取临时密钥失败：" + e.getMessage());
        }
    }
}
