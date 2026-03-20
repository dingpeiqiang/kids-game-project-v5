package com.kidgame.web.controller;

import com.kidgame.common.config.SftpConfig;
import com.kidgame.service.impl.ResourceUploadSftpServiceImpl;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

/**
 * SFTP 控制器
 *
 * 提供 SFTP 配置查询和文件下载功能
 *
 * @author kids-game-team
 * @date 2026-03-19
 */
@Slf4j
@RestController
@RequestMapping("/api/sftp")
public class SftpController {

    @Autowired(required = false)
    private SftpConfig sftpConfig;

    @Autowired(required = false)
    private ResourceUploadSftpServiceImpl sftpService;

    /**
     * 获取 SFTP 配置信息
     */
    @GetMapping("/config")
    public Map<String, Object> getConfig() {
        Map<String, Object> config = new HashMap<>();

        if (sftpConfig == null) {
            config.put("enabled", false);
            config.put("message", "SFTP 功能未安装");
            return config;
        }

        config.put("enabled", sftpConfig.isEnabled());
        config.put("host", sftpConfig.getHost());
        config.put("port", sftpConfig.getPort());
        config.put("username", sftpConfig.getUsername());
        config.put("baseDirectory", sftpConfig.getBaseDirectory());
        config.put("baseUrl", sftpConfig.getBaseUrl());
        config.put("authType", sftpConfig.isKeyAuth() ? "key" : "password");

        return config;
    }

    /**
     * SFTP 健康检查
     */
    @GetMapping("/health")
    public Map<String, Object> health() {
        Map<String, Object> status = new HashMap<>();

        if (sftpConfig == null || !sftpConfig.isEnabled()) {
            status.put("status", "DISABLED");
            status.put("enabled", false);
            return status;
        }

        status.put("status", "UP");
        status.put("enabled", true);
        status.put("host", sftpConfig.getHost());
        status.put("port", sftpConfig.getPort());

        return status;
    }

    /**
     * 下载文件
     *
     * @param path 文件路径（相对于 baseDirectory）
     * @param filename 下载时显示的文件名（可选）
     */
    @GetMapping("/download")
    public ResponseEntity<InputStreamResource> downloadFile(
            @RequestParam("path") String path,
            @RequestParam(value = "filename", required = false) String filename) {

        if (sftpService == null) {
            return ResponseEntity.badRequest().build();
        }

        try {
            // 获取文件输入流
            InputStream inputStream = sftpService.downloadFile(path);

            // 提取文件扩展名
            String extension = "";
            if (StringUtils.hasText(path)) {
                int lastDot = path.lastIndexOf('.');
                if (lastDot > 0) {
                    extension = path.substring(lastDot + 1).toLowerCase();
                }
            }

            // 确定媒体类型
            MediaType mediaType = getMediaType(extension);

            // 设置下载文件名
            String downloadFilename = filename;
            if (!StringUtils.hasText(downloadFilename)) {
                downloadFilename = path.substring(path.lastIndexOf('/') + 1);
            }

            // URL 编码文件名
            String encodedFilename = URLEncoder.encode(downloadFilename, StandardCharsets.UTF_8);

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            "inline; filename=\"" + encodedFilename + "\"; filename*=UTF-8''" + encodedFilename)
                    .contentType(mediaType)
                    .body(new InputStreamResource(inputStream));

        } catch (Exception e) {
            log.error("文件下载失败：path={}", path, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * 根据文件扩展名获取媒体类型
     */
    private MediaType getMediaType(String extension) {
        return switch (extension.toLowerCase()) {
            case "jpg", "jpeg" -> MediaType.IMAGE_JPEG;
            case "png" -> MediaType.IMAGE_PNG;
            case "gif" -> MediaType.IMAGE_GIF;
            case "webp" -> MediaType.parseMediaType("image/webp");
            case "svg" -> MediaType.parseMediaType("image/svg+xml");
            case "mp3" -> MediaType.parseMediaType("audio/mpeg");
            case "wav" -> MediaType.parseMediaType("audio/wav");
            case "ogg" -> MediaType.parseMediaType("audio/ogg");
            default -> MediaType.APPLICATION_OCTET_STREAM;
        };
    }
}
