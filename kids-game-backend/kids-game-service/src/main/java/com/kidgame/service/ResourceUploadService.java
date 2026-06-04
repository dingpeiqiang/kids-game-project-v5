package com.kidgame.service;

import org.springframework.web.multipart.MultipartFile;

/**
 * 资源上传服务接口
 */
public interface ResourceUploadService {
    
    /**
     * 上传图片资源
     * @param file 图片文件
     * @param category 资源分类 (themes/images, games/snake, etc.)
     * @return CDN URL
     */
    String uploadImage(MultipartFile file, String category);
    
    /**
     * 上传音频资源
     * @param file 音频文件
     * @param category 资源分类 (themes/audio, games/sfx, etc.)
     * @return CDN URL
     */
    String uploadAudio(MultipartFile file, String category);
    
    /**
     * 删除资源
     * @param url 资源 URL
     */
    void deleteResource(String url);
}
