package com.kidgame.service.impl;

import com.kidgame.common.exception.BusinessException;
import com.kidgame.service.ResourceUploadService;
import com.qcloud.cos.COSClient;
import com.qcloud.cos.ClientConfig;
import com.qcloud.cos.auth.BasicCOSCredentials;
import com.qcloud.cos.auth.COSCredentials;
import com.qcloud.cos.http.HttpProtocol;
import com.qcloud.cos.model.ObjectMetadata;
import com.qcloud.cos.model.PutObjectRequest;
import com.qcloud.cos.model.PutObjectResult;
import com.qcloud.cos.region.Region;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import java.io.IOException;
import java.io.InputStream;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

/**
 * 腾讯云 COS 资源上传服务实现
 * 
 * 上传文件到腾讯云 COS，返回完整的 HTTPS URL 地址
 * 
 * @author kids-game-team
 * @date 2026-03-19
 */
@Slf4j
@Service
@Deprecated
@ConditionalOnProperty(name = "cos.enabled", havingValue = "true", matchIfMissing = false)
public class ResourceUploadCosServiceImpl implements ResourceUploadService {

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

    // 允许的图片类型
    private static final List<String> IMAGE_TYPES = Arrays.asList(
        "image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"
    );

    // 允许的音频类型
    private static final List<String> AUDIO_TYPES = Arrays.asList(
        "audio/mp3", "audio/mpeg", "audio/wav", "audio/ogg", "audio/x-wav"
    );

    // 最大文件大小 (MB)
    private static final long MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
    private static final long MAX_AUDIO_SIZE = 10 * 1024 * 1024; // 10MB

    private COSClient cosClient;

    @PostConstruct
    public void init() {
        // 检查配置
        if (secretId == null || secretId.isEmpty() || secretKey == null || secretKey.isEmpty()) {
            log.warn("腾讯云 COS 配置不完整，secretId 或 secretKey 为空，将使用本地存储");
            return;
        }

        // 创建 COS 客户端
        COSCredentials cred = new BasicCOSCredentials(secretId, secretKey);
        ClientConfig clientConfig = new ClientConfig(new Region(region));
        clientConfig.setHttpProtocol(HttpProtocol.https); // 使用 HTTPS

        this.cosClient = new COSClient(cred, clientConfig);
        log.info("腾讯云 COS 客户端初始化成功：bucket={}, region={}", bucket, region);
    }

    @PreDestroy
    public void destroy() {
        if (cosClient != null) {
            cosClient.shutdown();
            log.info("腾讯云 COS 客户端已关闭");
        }
    }

    @Override
    public String uploadImage(MultipartFile file, String category) {
        // 检查 COS 客户端
        if (cosClient == null) {
            throw new BusinessException("COS 服务未配置，请检查 tencent.cos.secret-id 和 tencent.cos.secret-key");
        }

        try {
            // 1. 验证文件类型
            String contentType = file.getContentType();
            if (contentType == null || !IMAGE_TYPES.contains(contentType)) {
                throw new BusinessException("不支持的图片类型，仅支持：JPEG, PNG, GIF, WebP, SVG");
            }

            // 2. 验证文件大小
            if (file.getSize() > MAX_IMAGE_SIZE) {
                throw new BusinessException("图片大小不能超过 5MB");
            }

            // 3. 生成文件名和路径
            String objectKey = generateObjectKey(category, file.getOriginalFilename());

            // 4. 上传到 COS
            String url = uploadToCOS(file.getInputStream(), objectKey, contentType, file.getSize());

            log.info("图片上传成功：originalName={}, size={}, url={}",
                    file.getOriginalFilename(), file.getSize(), url);

            return url;

        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            log.error("图片上传失败", e);
            throw new BusinessException("图片上传失败：" + e.getMessage());
        }
    }

    @Override
    public String uploadAudio(MultipartFile file, String category) {
        // 检查 COS 客户端
        if (cosClient == null) {
            throw new BusinessException("COS 服务未配置，请检查 tencent.cos.secret-id 和 tencent.cos.secret-key");
        }

        try {
            // 1. 验证文件类型
            String contentType = file.getContentType();
            if (contentType == null || !AUDIO_TYPES.contains(contentType)) {
                throw new BusinessException("不支持的音频类型，仅支持：MP3, WAV, OGG");
            }

            // 2. 验证文件大小
            if (file.getSize() > MAX_AUDIO_SIZE) {
                throw new BusinessException("音频大小不能超过 10MB");
            }

            // 3. 生成文件名和路径
            String objectKey = generateObjectKey(category, file.getOriginalFilename());

            // 4. 上传到 COS
            String url = uploadToCOS(file.getInputStream(), objectKey, contentType, file.getSize());

            log.info("音频上传成功：originalName={}, size={}, url={}",
                    file.getOriginalFilename(), file.getSize(), url);

            return url;

        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            log.error("音频上传失败", e);
            throw new BusinessException("音频上传失败：" + e.getMessage());
        }
    }

    @Override
    public void deleteResource(String url) {
        if (cosClient == null) {
            log.warn("COS 服务未配置，无法删除资源：{}", url);
            return;
        }

        try {
            // 从 URL 提取 objectKey
            String objectKey = extractObjectKeyFromUrl(url);
            if (objectKey != null && !objectKey.isEmpty()) {
                cosClient.deleteObject(bucket, objectKey);
                log.info("资源删除成功：url={}, objectKey={}", url, objectKey);
            }
        } catch (Exception e) {
            log.error("资源删除失败：url={}", url, e);
        }
    }

    /**
     * 生成 COS 对象键
     */
    private String generateObjectKey(String category, String originalFilename) {
        // 获取文件扩展名
        String extension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }

        // 生成日期路径
        LocalDate now = LocalDate.now();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy/MM/dd");
        String datePath = now.format(formatter);

        // 生成唯一文件名
        String filename = UUID.randomUUID().toString().replace("-", "") + extension;

        // 组合完整路径
        return category + "/" + datePath + "/" + filename;
    }

    /**
     * 上传文件到 COS
     */
    private String uploadToCOS(InputStream inputStream, String objectKey, String contentType, long size) throws IOException {
        try {
            // 设置对象元数据
            ObjectMetadata metadata = new ObjectMetadata();
            metadata.setContentType(contentType);
            metadata.setContentLength(size);

            // 创建上传请求
            PutObjectRequest putRequest = new PutObjectRequest(bucket, objectKey, inputStream, metadata);

            // 执行上传
            PutObjectResult result = cosClient.putObject(putRequest);

            // 返回完整 URL
            return buildFullUrl(objectKey);

        } finally {
            if (inputStream != null) {
                inputStream.close();
            }
        }
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
        // 格式：https://{bucket}.cos.{region}.myqcloud.com/{objectKey}
        return String.format("https://%s.cos.%s.myqcloud.com/%s", bucket, region, objectKey);
    }

    /**
     * 从 URL 提取对象键
     */
    private String extractObjectKeyFromUrl(String url) {
        if (url == null || url.isEmpty()) {
            return null;
        }

        // 处理自定义域名
        if (baseUrl != null && !baseUrl.isEmpty() && url.startsWith(baseUrl)) {
            String path = url.substring(baseUrl.length());
            return path.startsWith("/") ? path.substring(1) : path;
        }

        // 处理 COS 默认域名
        String cosDomain = String.format("https://%s.cos.%s.myqcloud.com/", bucket, region);
        if (url.startsWith(cosDomain)) {
            return url.substring(cosDomain.length());
        }

        // 处理 HTTP 协议
        String httpDomain = cosDomain.replace("https://", "http://");
        if (url.startsWith(httpDomain)) {
            return url.substring(httpDomain.length());
        }

        log.warn("无法从 URL 提取对象键：{}", url);
        return null;
    }
}
