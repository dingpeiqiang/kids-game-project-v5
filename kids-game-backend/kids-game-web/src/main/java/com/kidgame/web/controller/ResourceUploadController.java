package com.kidgame.web.controller;

import com.kidgame.common.model.Result;
import com.kidgame.service.ResourceUploadService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;

/**
 * 资源上传控制器
 */
@Slf4j
@RestController
@RequestMapping("/api/resource")
public class ResourceUploadController {
    
    @Autowired
    private ResourceUploadService resourceUploadService;
    
    /**
     * 上传图片资源
     */
    @PostMapping("/upload/image")
    public Result<Map<String, Object>> uploadImage(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "category", defaultValue = "themes/images") String category) {
        
        try {
            // 验证文件
            if (file.isEmpty()) {
                return Result.error("请选择要上传的文件");
            }
            
            // 调用服务上传
            String url = resourceUploadService.uploadImage(file, category);
            
            // 返回结果
            Map<String, Object> response = new HashMap<>();
            response.put("url", url);
            response.put("filename", file.getOriginalFilename());
            response.put("size", file.getSize());
            response.put("contentType", file.getContentType());
            
            log.info("图片上传成功：file={}, size={}, url={}", 
                    file.getOriginalFilename(), file.getSize(), url);
            
            return Result.success(response);
            
        } catch (Exception e) {
            log.error("图片上传失败", e);
            return Result.error("图片上传失败：" + e.getMessage());
        }
    }
    
    /**
     * 上传音频资源
     */
    @PostMapping("/upload/audio")
    public Result<Map<String, Object>> uploadAudio(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "category", defaultValue = "themes/audio") String category) {
        
        try {
            // 验证文件
            if (file.isEmpty()) {
                return Result.error("请选择要上传的文件");
            }
            
            // 调用服务上传
            String url = resourceUploadService.uploadAudio(file, category);
            
            // 返回结果
            Map<String, Object> response = new HashMap<>();
            response.put("url", url);
            response.put("filename", file.getOriginalFilename());
            response.put("size", file.getSize());
            response.put("contentType", file.getContentType());
            
            log.info("音频上传成功：file={}, size={}, url={}", 
                    file.getOriginalFilename(), file.getSize(), url);
            
            return Result.success(response);
            
        } catch (Exception e) {
            log.error("音频上传失败", e);
            return Result.error("音频上传失败：" + e.getMessage());
        }
    }
    
    /**
     * 删除资源
     */
    @DeleteMapping("/delete")
    public Result<Void> deleteResource(@RequestParam("url") String url) {
        try {
            resourceUploadService.deleteResource(url);
            log.info("资源删除成功：url={}", url);
            return Result.success(null);
        } catch (Exception e) {
            log.error("资源删除失败", e);
            return Result.error("资源删除失败：" + e.getMessage());
        }
    }
}
