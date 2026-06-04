package com.kidgame.service.impl;

import com.kidgame.common.exception.BusinessException;
import com.kidgame.service.AudioConverterService;
import com.kidgame.service.ResourceUploadService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

/**
 * 资源上传服务实现 (本地存储版本)
 * 
 * 默认的资源上传实现，将文件保存到服务器本地
 */
@Slf4j
@Service
public class ResourceUploadServiceImpl implements ResourceUploadService {
    
    @Value("${resource.upload.path:./uploads}")
    private String uploadPath;
    
    @Value("${resource.cdn.domain:}")
    private String cdnDomain;
    
    // 注入音频转换服务
    private final AudioConverterService audioConverterService;
    
    public ResourceUploadServiceImpl(AudioConverterService audioConverterService) {
        this.audioConverterService = audioConverterService;
    }
    
    // 允许的图片类型
    private static final List<String> IMAGE_TYPES = Arrays.asList(
        "image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"
    );
    
    // 允许的音频类型（包含 WebM）
    private static final List<String> AUDIO_TYPES = Arrays.asList(
        "audio/mp3", "audio/mpeg", "audio/wav", "audio/ogg", "audio/x-wav",
        "audio/webm", "audio/x-matroska"  // 添加 WebM 支持
    );
    
    // 最大文件大小 (MB)
    private static final long MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
    private static final long MAX_AUDIO_SIZE = 10 * 1024 * 1024; // 10MB
    
    @Override
    public String uploadImage(MultipartFile file, String category) {
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
            
            // 3. 生成文件名
            String originalFilename = file.getOriginalFilename();
            String extension = originalFilename != null && originalFilename.contains(".") 
                ? originalFilename.substring(originalFilename.lastIndexOf(".")) 
                : ".png";
            String filename = UUID.randomUUID().toString().replace("-", "") + extension;
            
            // 4. 创建目录
            LocalDate now = LocalDate.now();
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy/MM/dd");
            String datePath = now.format(formatter);
            String dirPath = Paths.get(uploadPath, category, datePath).toString();
            
            File dir = new File(dirPath);
            if (!dir.exists()) {
                dir.mkdirs();
            }
            
            // 5. 保存文件
            Path filePath = Paths.get(dirPath, filename);
            Files.copy(file.getInputStream(), filePath);
            
            // 6. 返回 URL
            String url = buildResourceUrl(category, datePath, filename);
            
            log.info("图片上传成功：originalName={}, size={}, url={}", 
                    originalFilename, file.getSize(), url);
            
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
        try {
            // 1. 验证文件类型
            String contentType = file.getContentType();
            log.info("🎵 收到音频上传请求：originalName={}, size={}, type={}", 
                    file.getOriginalFilename(), file.getSize(), contentType);
            
            if (contentType == null || !AUDIO_TYPES.contains(contentType)) {
                throw new BusinessException("不支持的音频类型，仅支持：MP3, WAV, OGG, WebM");
            }
            
            // 2. 验证文件大小
            if (file.getSize() > MAX_AUDIO_SIZE) {
                throw new BusinessException("音频大小不能超过 10MB");
            }
            
            // 3. 🎯 如果是 WebM/WAV 格式，自动转换为 MP3
            String originalExtension = getFileExtension(file.getOriginalFilename());
            boolean needConvert = "webm".equalsIgnoreCase(originalExtension) ||
                                 "wav".equalsIgnoreCase(originalExtension) ||
                                 "m4a".equalsIgnoreCase(originalExtension);
            
            if (needConvert) {
                log.info("🔄 检测到 {} 格式，开始转换为 MP3...", originalExtension);
                
                try {
                    // 调用转换服务
                    String mp3RelativePath = audioConverterService.convertToMp3(file);
                    
                    // 构建完整 URL
                    String url = buildResourceUrlFromPath(category, mp3RelativePath);
                    
                    log.info("✅ 音频转换并上传成功：originalName={} -> MP3, url={}", 
                            file.getOriginalFilename(), url);
                    
                    return url;
                } catch (Exception e) {
                    log.error("❌ 音频转换失败，使用原始格式上传", e);
                    // 转换失败，降级到原始格式上传
                }
            }
            
            // 4. 生成文件名（使用原始格式）
            String extension = originalExtension != null && !originalExtension.isEmpty() 
                ? "." + originalExtension 
                : ".mp3";
            String filename = UUID.randomUUID().toString().replace("-", "") + extension;
            
            // 5. 创建目录
            LocalDate now = LocalDate.now();
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy/MM/dd");
            String datePath = now.format(formatter);
            String dirPath = Paths.get(uploadPath, category, datePath).toString();
            
            File dir = new File(dirPath);
            if (!dir.exists()) {
                dir.mkdirs();
            }
            
            // 6. 保存文件
            Path filePath = Paths.get(dirPath, filename);
            Files.copy(file.getInputStream(), filePath);
            
            // 7. 返回 URL
            String url = buildResourceUrl(category, datePath, filename);
            
            log.info("✅ 音频上传成功（原始格式）：originalName={}, size={}, url={}", 
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
        try {
            // 将 URL 转换为本地路径
            String relativePath = urlToPath(url);
            Path filePath = Paths.get(uploadPath, relativePath);
            
            if (Files.exists(filePath)) {
                Files.delete(filePath);
                log.info("资源删除成功：url={}", url);
            } else {
                log.warn("资源文件不存在：url={}", url);
            }
        } catch (Exception e) {
            log.error("资源删除失败：url={}", url, e);
        }
    }
    
    /**
     * 构建资源 URL
     */
    private String buildResourceUrl(String category, String datePath, String filename) {
        String relativePath = Paths.get(category, datePath, filename).toString().replace("\\", "/");
        
        // 如果配置了 CDN 域名，使用 CDN
        if (cdnDomain != null && !cdnDomain.isEmpty()) {
            return cdnDomain.endsWith("/") 
                ? cdnDomain + relativePath 
                : cdnDomain + "/" + relativePath;
        }
        
        // 否则使用相对路径
        return "/resources/" + relativePath;
    }
    
    /**
     * 将 URL 转换为本地路径
     */
    private String urlToPath(String url) {
        // 移除域名部分
        String path = url;
        if (cdnDomain != null && !cdnDomain.isEmpty() && url.startsWith(cdnDomain)) {
            path = url.substring(cdnDomain.length());
        } else if (url.startsWith("/resources/")) {
            path = url.substring("/resources/".length());
        }
        
        return path.replace("/", File.separator);
    }
    
    /**
     * 构建资源 URL（从路径）
     */
    private String buildResourceUrlFromPath(String category, String relativePath) {
        String fullPath = Paths.get(category, relativePath).toString().replace("\\", "/");
        
        if (cdnDomain != null && !cdnDomain.isEmpty()) {
            return cdnDomain.endsWith("/") ? cdnDomain + fullPath : cdnDomain + "/" + fullPath;
        }
        
        return "/resources/" + fullPath;
    }
    
    /**
     * 获取文件扩展名
     */
    private String getFileExtension(String filename) {
        if (filename == null || !filename.contains(".")) {
            return "mp3";
        }
        String ext = filename.substring(filename.lastIndexOf(".") + 1).toLowerCase();
        if (ext.contains(";")) {
            ext = ext.split(";")[0];
        }
        return ext;
    }
}
