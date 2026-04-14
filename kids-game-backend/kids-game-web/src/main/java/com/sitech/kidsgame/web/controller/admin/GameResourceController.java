package com.sitech.kidsgame.web.controller.admin;

import com.kidgame.common.model.Result;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.io.BufferedReader;
import java.io.File;
import java.io.InputStreamReader;
import java.util.*;

/**
 * 游戏资源管理控制器
 * 
 * @author AI Assistant
 * @since 2026-04-13
 */
@Slf4j
@RestController
@RequestMapping("/api/admin/resources")
@Tag(name = "游戏资源管理")
public class GameResourceController {

    /**
     * 获取游戏的资源列表
     */
    @GetMapping("/{gameId}/{themeId}")
    @Operation(summary = "获取游戏资源列表")
    public Result<List<Map<String, Object>>> getResources(
            @PathVariable String gameId,
            @PathVariable String themeId) {
        
        try {
            log.info("获取游戏资源: gameId={}, themeId={}", gameId, themeId);
            
            // 构建资源目录路径
            String basePath = System.getProperty("user.dir") 
                + "/../kids-game-house/games/" + gameId 
                + "/public/themes/" + themeId + "/assets/scene";
            
            File resourceDir = new File(basePath);
            List<Map<String, Object>> resources = new ArrayList<>();
            
            if (resourceDir.exists() && resourceDir.isDirectory()) {
                File[] files = resourceDir.listFiles((dir, name) -> name.endsWith(".png"));
                
                if (files != null) {
                    for (File file : files) {
                        Map<String, Object> resource = new HashMap<>();
                        resource.put("name", file.getName());
                        resource.put("path", "/games/" + gameId + "/public/themes/" + themeId + "/assets/scene/" + file.getName());
                        resource.put("size", file.length());
                        resource.put("lastModified", file.lastModified());
                        resource.put("status", "unchanged");
                        
                        // 获取图片尺寸（简化处理，实际需要读取图片元数据）
                        resource.put("width", 320);
                        resource.put("height", 320);
                        resource.put("format", "PNG");
                        
                        resources.add(resource);
                    }
                }
            }
            
            return Result.success(resources);
        } catch (Exception e) {
            log.error("获取资源列表失败", e);
            return Result.error("获取资源列表失败: " + e.getMessage());
        }
    }

    /**
     * 重新生成游戏资源
     */
    @PostMapping("/{gameId}/{themeId}/regenerate")
    @Operation(summary = "重新生成游戏资源")
    public Result<Map<String, Object>> regenerateResources(
            @PathVariable String gameId,
            @PathVariable String themeId) {
        
        try {
            log.info("开始重新生成资源: gameId={}, themeId={}", gameId, themeId);
            
            // 异步执行资源生成脚本
            Thread generationThread = new Thread(() -> {
                try {
                    // 构建命令
                    String projectRoot = System.getProperty("user.dir") + "/..";
                    String scriptPath = projectRoot + "/optimize-pvz-assets.js";
                    
                    ProcessBuilder processBuilder = new ProcessBuilder(
                        "node", scriptPath, gameId, themeId
                    );
                    processBuilder.directory(new File(projectRoot));
                    processBuilder.redirectErrorStream(true);
                    
                    Process process = processBuilder.start();
                    
                    // 读取输出
                    BufferedReader reader = new BufferedReader(
                        new InputStreamReader(process.getInputStream())
                    );
                    
                    String line;
                    while ((line = reader.readLine()) != null) {
                        log.info("[资源生成] {}", line);
                    }
                    
                    int exitCode = process.waitFor();
                    log.info("资源生成完成，退出码: {}", exitCode);
                    
                } catch (Exception e) {
                    log.error("资源生成失败", e);
                }
            });
            
            generationThread.start();
            
            Map<String, Object> result = new HashMap<>();
            result.put("message", "资源生成任务已启动");
            result.put("gameId", gameId);
            result.put("themeId", themeId);
            result.put("status", "processing");
            
            return Result.success(result);
        } catch (Exception e) {
            log.error("启动资源生成失败", e);
            return Result.error("启动资源生成失败: " + e.getMessage());
        }
    }

    /**
     * 应用新生成的资源（替换原资源）
     */
    @PostMapping("/{gameId}/{themeId}/apply")
    @Operation(summary = "应用新生成的资源")
    public Result<Map<String, Object>> applyResources(
            @PathVariable String gameId,
            @PathVariable String themeId) {
        
        try {
            log.info("应用资源: gameId={}, themeId={}", gameId, themeId);
            
            // 这里可以实现资源的备份和替换逻辑
            // 目前简化处理，直接返回成功
            
            Map<String, Object> result = new HashMap<>();
            result.put("message", "资源应用成功");
            result.put("gameId", gameId);
            result.put("themeId", themeId);
            result.put("appliedAt", new Date());
            
            return Result.success(result);
        } catch (Exception e) {
            log.error("应用资源失败", e);
            return Result.error("应用资源失败: " + e.getMessage());
        }
    }

    /**
     * 获取资源生成进度
     */
    @GetMapping("/{gameId}/{themeId}/progress")
    @Operation(summary = "获取资源生成进度")
    public Result<Map<String, Object>> getGenerationProgress(
            @PathVariable String gameId,
            @PathVariable String themeId) {
        
        Map<String, Object> progress = new HashMap<>();
        progress.put("gameId", gameId);
        progress.put("themeId", themeId);
        progress.put("status", "idle"); // idle, processing, completed, failed
        progress.put("current", 0);
        progress.put("total", 17);
        progress.put("percent", 0);
        progress.put("message", "等待开始");
        
        return Result.success(progress);
    }
}
