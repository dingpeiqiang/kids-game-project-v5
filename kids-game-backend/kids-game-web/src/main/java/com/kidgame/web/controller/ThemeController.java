package com.kidgame.web.controller;

import com.alibaba.fastjson2.JSON;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.kidgame.common.annotation.RequireLogin;
import com.kidgame.common.model.Result;
import com.kidgame.dao.entity.CreatorEarnings;
import com.kidgame.dao.entity.ThemeInfo;
import com.kidgame.dao.entity.ThemePurchase;
import com.kidgame.service.ThemeService;
import com.kidgame.service.dto.ThemeUploadDTO;
import com.kidgame.service.GTRSSchemaService;
import com.kidgame.service.ThemeMigrationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 主题市场控制器
 * 提供 Phaser3 主题的上传、购买、下载等功能
 */
@Slf4j
@Tag(name = "主题市场", description = "Phaser3 主题市场与创作者经济接口")
@RestController
@RequestMapping("/api/theme")
@RequireLogin
public class ThemeController {

    @Autowired
    private ThemeService themeService;

    @Autowired
    private GTRSSchemaService gtrsSchemaService;

    @Autowired
    private ThemeMigrationService themeMigrationService;

    /**
     * 获取主题列表
     * @param applicableScope 适用范围筛选（all-应用主题/specific-游戏主题）
     * @param gameId 游戏ID（仅当applicableScope=specific时有效）
     * @param gameCode 游戏代码（仅当applicableScope=specific时有效）
     * @param status 状态筛选（可选）
     * @param page 页码
     * @param pageSize 每页大小
     * @return 主题列表分页结果
     */
    @Operation(summary = "获取主题列表")
    @GetMapping("/list")
    public Result<Map<String, Object>> listThemes(
            @Parameter(description = "所有者类型：GAME-游戏主题，APPLICATION-应用主题") 
            @RequestParam(required = false) String ownerType,
            @Parameter(description = "所有者 ID（游戏主题时需要）") 
            @RequestParam(required = false) Long ownerId,
            @Parameter(description = "状态筛选：on_sale/offline/pending") 
            @RequestParam(required = false) String status,
            @Parameter(description = "页码") 
            @RequestParam(defaultValue = "1") Integer page,
            @Parameter(description = "每页大小") 
            @RequestParam(defaultValue = "20") Integer pageSize) {

        try {
            Page<ThemeInfo> pageInfo = themeService.listThemes(ownerType, ownerId, status, page, pageSize);
            
            // 为每个主题添加游戏信息（从 theme_game_relation 关联获取）
            List<Map<String, Object>> listWithGameName = new java.util.ArrayList<>();
            for (ThemeInfo theme : pageInfo.getRecords()) {
                Map<String, Object> themeMap = new HashMap<>();
                // 使用 fastjson 将对象转为 Map
                themeMap = JSON.parseObject(JSON.toJSONString(theme), Map.class);
                
                // 查询主题关联的游戏信息
                if ("specific".equals(theme.getApplicableScope())) {
                    // 从 theme_game_relation 获取关联的游戏
                    List<Long> relatedGameIds = themeService.getThemeGames(theme.getThemeId());
                    if (relatedGameIds != null && !relatedGameIds.isEmpty()) {
                        // 获取第一个关联游戏的详细信息
                        for (Long relatedGameId : relatedGameIds) {
                            var game = themeService.getGameById(relatedGameId);
                            if (game != null) {
                                themeMap.put("gameId", game.getGameId());
                                themeMap.put("gameCode", game.getGameCode());
                                themeMap.put("gameName", game.getGameName());
                                break; // 只取第一个
                            }
                        }
                    }
                }
                
                // 如果没有关联游戏，设置默认值
                if (!themeMap.containsKey("gameName")) {
                    themeMap.put("gameName", "游戏主题");
                }
                
                listWithGameName.add(themeMap);
            }
            
            Map<String, Object> result = new HashMap<>();
            result.put("list", listWithGameName);
            result.put("total", pageInfo.getTotal());
            result.put("page", pageInfo.getCurrent());
            result.put("pageSize", pageInfo.getSize());
            
            return Result.success(result);
        } catch (Exception e) {
            log.error("获取主题列表失败", e);
            return Result.error("获取主题列表失败：" + e.getMessage());
        }
    }

    /**
     * 获取主题详情
     * @param id 主题 ID
     * @return 主题详情（包含游戏关联信息）
     */
    @Operation(summary = "获取主题详情")
    @GetMapping("/detail")
    public Result<Map<String, Object>> getThemeDetail(
            @Parameter(description = "主题 ID") 
            @RequestParam Long id) {
            
        log.info("获取主题详情。ThemeId: {}", id);
            
        try {
            ThemeInfo theme = themeService.getThemeDetail(id);
                
            // 将 ThemeInfo 转为 Map
            Map<String, Object> themeMap = JSON.parseObject(JSON.toJSONString(theme), Map.class);
                
            // ⭐ 为主题添加游戏关联信息（与 list 接口保持一致）
            if ("specific".equals(theme.getApplicableScope())) {
                // 从 theme_game_relation 获取关联的游戏
                List<Long> relatedGameIds = themeService.getThemeGames(theme.getThemeId());
                if (relatedGameIds != null && !relatedGameIds.isEmpty()) {
                    // 获取第一个关联游戏的详细信息
                    for (Long relatedGameId : relatedGameIds) {
                        var game = themeService.getGameById(relatedGameId);
                        if (game != null) {
                            themeMap.put("gameId", game.getGameId());
                            themeMap.put("gameCode", game.getGameCode());
                            themeMap.put("gameName", game.getGameName());
                            break; // 只取第一个
                        }
                    }
                }
            }
                
            // 如果没有关联游戏，设置默认值
            if (!themeMap.containsKey("gameName")) {
                themeMap.put("gameName", "游戏主题");
            }
                
            return Result.success(themeMap);
        } catch (Exception e) {
            log.error("获取主题详情失败", e);
            return Result.error("获取主题详情失败：" + e.getMessage());
        }
    }

    /**
     * 上传主题
     * @param themeData 主题数据
     * @param request HTTP 请求
     * @return 上传后的主题信息
     */
    @Operation(summary = "上传主题")
    @PostMapping("/upload")
    public Result<ThemeInfo> uploadTheme(
            @RequestBody ThemeUploadDTO themeData,
            HttpServletRequest request) {
        
        try {
            String userIdStr = (String) request.getAttribute("userId");
            Long authorId = Long.valueOf(userIdStr);
            
            log.info("上传主题. AuthorId: {}, ThemeName: {}", authorId, themeData.getThemeName());
            
            ThemeInfo theme = themeService.uploadTheme(authorId, themeData);
            return Result.success(theme);
        } catch (Exception e) {
            log.error("上传主题失败", e);
            return Result.error("上传主题失败：" + e.getMessage());
        }
    }

    /**
     * 购买主题
     * @param themeId 主题 ID
     * @param request HTTP 请求
     * @return 购买记录
     */
    @Operation(summary = "购买主题")
    @PostMapping("/buy")
    public Result<ThemePurchase> purchaseTheme(
            @Parameter(description = "主题 ID") 
            @RequestParam Long themeId,
            HttpServletRequest request) {
        
        try {
            String userIdStr = (String) request.getAttribute("userId");
            Long buyerId = Long.valueOf(userIdStr);
            
            log.info("购买主题. ThemeId: {}, BuyerId: {}", themeId, buyerId);
            
            ThemePurchase purchase = themeService.purchaseTheme(themeId, buyerId);
            return Result.success(purchase);
        } catch (Exception e) {
            log.error("购买主题失败", e);
            return Result.error("购买主题失败：" + e.getMessage());
        }
    }

    /**
     * 下载主题（需要已购买）
     * @param id 主题 ID
     * @param request HTTP 请求
     * @return 主题配置 JSON
     */
    @Operation(summary = "下载主题")
    @GetMapping("/download")
    public Result<Map<String, Object>> downloadTheme(
            @Parameter(description = "主题 ID") 
            @RequestParam Long id,
            HttpServletRequest request) {
        
        try {
            String userIdStr = (String) request.getAttribute("userId");
            
            // 检查用户是否登录
            if (userIdStr == null || userIdStr.isEmpty()) {
                log.warn("未登录用户尝试下载主题：themeId={}", id);
                return Result.error("请先登录后再下载主题");
            }
            
            Long userId = Long.valueOf(userIdStr);
            log.info("下载主题. ThemeId: {}, UserId: {}", id, userId);
            
            String configJson = themeService.downloadTheme(id, userId);
            
            // 检查 configJson 是否为 null 或空
            if (configJson == null || configJson.trim().isEmpty()) {
                log.warn("主题配置为空或未购买：themeId={}, userId={}", id, userId);
                return Result.error("主题配置不可用，请先购买或联系管理员");
            }
            
            Map<String, Object> result = new HashMap<>();
            result.put("configJson", configJson);
            
            return Result.success(result);
        } catch (Exception e) {
            log.error("下载主题失败", e);
            return Result.error("下载主题失败：" + e.getMessage());
        }
    }

    /**
     * 获取我的主题列表
     * @param request HTTP 请求
     * @return 主题列表
     */
    @Operation(summary = "获取我的主题")
    @GetMapping("/my-cloud-themes")
    public Result<List<ThemeInfo>> getMyThemes(HttpServletRequest request) {
        
        try {
            String userIdStr = (String) request.getAttribute("userId");
            Long authorId = Long.valueOf(userIdStr);
            
            log.info("获取我的主题. AuthorId: {}", authorId);
            
            List<ThemeInfo> themes = themeService.getMyThemes(authorId);
            return Result.success(themes);
        } catch (Exception e) {
            log.error("获取我的主题失败", e);
            return Result.error("获取我的主题失败：" + e.getMessage());
        }
    }

    /**
     * 切换主题上架状态
     * @param themeId 主题 ID
     * @param onSale 是否上架
     * @param request HTTP 请求
     * @return 更新后的主题信息
     */
    @Operation(summary = "切换上架状态")
    @PostMapping("/toggle-sale")
    public Result<ThemeInfo> toggleSaleStatus(
            @Parameter(description = "主题 ID") 
            @RequestParam Long themeId,
            @Parameter(description = "是否上架") 
            @RequestParam Boolean onSale,
            HttpServletRequest request) {
        
        try {
            log.info("切换主题上架状态. ThemeId: {}, OnSale: {}", themeId, onSale);
            
            ThemeInfo theme = themeService.toggleSaleStatus(themeId, onSale);
            return Result.success(theme);
        } catch (Exception e) {
            log.error("切换主题上架状态失败", e);
            return Result.error("切换主题上架状态失败：" + e.getMessage());
        }
    }

    /**
     * 获取创作者收益
     * @param request HTTP 请求
     * @return 收益信息
     */
    @Operation(summary = "获取创作者收益")
    @GetMapping("/earnings")
    public Result<Map<String, Object>> getEarnings(HttpServletRequest request) {
        
        try {
            String userIdStr = (String) request.getAttribute("userId");
            Long creatorId = Long.valueOf(userIdStr);
            
            log.info("获取创作者收益. CreatorId: {}", creatorId);
            
            List<CreatorEarnings> earningsList = themeService.getEarnings(creatorId);
            Integer totalEarnings = themeService.getTotalEarnings(creatorId);
            Integer withdrawableEarnings = themeService.getWithdrawableEarnings(creatorId);
            
            Map<String, Object> result = new HashMap<>();
            result.put("list", earningsList);
            result.put("totalEarnings", totalEarnings);
            result.put("withdrawableEarnings", withdrawableEarnings);
            
            return Result.success(result);
        } catch (Exception e) {
            log.error("获取创作者收益失败", e);
            return Result.error("获取创作者收益失败：" + e.getMessage());
        }
    }

    /**
     * 提现收益
     * @param amount 提现金额
     * @param request HTTP 请求
     * @return 操作结果
     */
    @Operation(summary = "提现收益")
    @PostMapping("/withdraw")
    public Result<Map<String, Object>> withdrawEarnings(
            @Parameter(description = "提现金额") 
            @RequestParam Integer amount,
            HttpServletRequest request) {
        
        try {
            String userIdStr = (String) request.getAttribute("userId");
            Long creatorId = Long.valueOf(userIdStr);
            
            log.info("提现收益. CreatorId: {}, Amount: {}", creatorId, amount);
            
            boolean success = themeService.withdrawEarnings(creatorId, amount);
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", success);
            
            return Result.success(success ? "提现成功" : "提现失败", result);
        } catch (Exception e) {
            log.error("提现收益失败", e);
            return Result.error("提现收益失败：" + e.getMessage());
        }
    }

    /**
     * 检查是否已购买主题
     * @param themeId 主题 ID
     * @param request HTTP 请求
     * @return 是否已购买
     */
    @Operation(summary = "检查购买状态")
    @GetMapping("/check-purchase")
    public Result<Map<String, Boolean>> checkPurchase(
            @Parameter(description = "主题 ID") 
            @RequestParam Long themeId,
            HttpServletRequest request) {
        
        try {
            String userIdStr = (String) request.getAttribute("userId");
            Long userId = Long.valueOf(userIdStr);
            
            boolean purchased = themeService.hasPurchased(themeId, userId);
            
            Map<String, Boolean> result = new HashMap<>();
            result.put("purchased", purchased);
            
            return Result.success(result);
        } catch (Exception e) {
            log.error("检查购买状态失败", e);
            return Result.error("检查购买状态失败：" + e.getMessage());
        }
    }

    /**
     * 删除主题（管理员）
     * @param params 请求参数（包含 themeId）
     * @param request HTTP 请求
     * @return 删除结果
     */
    @Operation(summary = "删除主题")
    @PostMapping("/delete")
    public Result<Map<String, Boolean>> deleteTheme(
            @Parameter(description = "主题 ID")
            @RequestBody Map<String, Long> params,
            HttpServletRequest request) {

        try {
            Long themeId = params.get("themeId");
            log.info("删除主题. ThemeId: {}", themeId);

            // TODO: 实现删除逻辑
            boolean success = true;

            Map<String, Boolean> result = new HashMap<>();
            result.put("success", success);

            return Result.success(result);
        } catch (Exception e) {
            log.error("删除主题失败", e);
            return Result.error("删除主题失败：" + e.getMessage());
        }
    }

    /**
     * GTRS Schema校验接口
     * @param themeJson 主题JSON字符串
     * @return 校验结果
     */
    @Operation(summary = "GTRS Schema校验")
    @PostMapping("/validate-gtrs")
    public Result<Map<String, Object>> validateGTRSTheme(
            @Parameter(description = "主题JSON")
            @RequestBody Map<String, String> params) {

        try {
            String themeJson = params.get("themeJson");
            log.info("GTRS Schema校验请求");

            GTRSSchemaService.ValidationResult result = gtrsSchemaService.validateTheme(themeJson);

            Map<String, Object> response = new HashMap<>();
            response.put("valid", result.isValid());
            response.put("message", result.getMessage());

            return Result.success(response);
        } catch (Exception e) {
            log.error("GTRS Schema校验失败", e);
            return Result.error("GTRS Schema校验失败：" + e.getMessage());
        }
    }

    /**
     * 检测主题格式（GTRS或旧版）
     * @param themeJson 主题JSON字符串
     * @return 格式检测结果
     */
    @Operation(summary = "检测主题格式")
    @PostMapping("/detect-format")
    public Result<Map<String, Object>> detectThemeFormat(
            @Parameter(description = "主题JSON")
            @RequestBody Map<String, String> params) {

        try {
            String themeJson = params.get("themeJson");
            log.info("检测主题格式");

            boolean isGTRS = themeMigrationService.isGTRSFormat(themeJson);

            Map<String, Object> response = new HashMap<>();
            response.put("isGTRS", isGTRS);
            response.put("format", isGTRS ? "GTRS v1.0.0" : "旧版格式");

            return Result.success(response);
        } catch (Exception e) {
            log.error("检测主题格式失败", e);
            return Result.error("检测主题格式失败：" + e.getMessage());
        }
    }

    /**
     * 迁移旧版主题到GTRS规范
     * @param params 包含 oldThemeJson, themeId, gameId, themeName
     * @return GTRS规范JSON
     */
    @Operation(summary = "迁移旧版主题")
    @PostMapping("/migrate-to-gtrs")
    public Result<Map<String, Object>> migrateToGTRS(
            @Parameter(description = "迁移参数")
            @RequestBody Map<String, String> params) {

        try {
            String oldThemeJson = params.get("oldThemeJson");
            String themeId = params.get("themeId");
            String gameId = params.get("gameId");
            String themeName = params.get("themeName");

            log.info("迁移旧版主题到GTRS. ThemeId: {}, GameId: {}", themeId, gameId);

            String gtrsJson = themeMigrationService.migrateToGTRS(oldThemeJson, themeId, gameId, themeName);

            // 自动校验迁移后的JSON
            GTRSSchemaService.ValidationResult validationResult = gtrsSchemaService.validateTheme(gtrsJson);

            Map<String, Object> response = new HashMap<>();
            response.put("gtrsJson", gtrsJson);
            response.put("valid", validationResult.isValid());
            response.put("message", validationResult.getMessage());

            return Result.success(response);
        } catch (Exception e) {
            log.error("迁移旧版主题失败", e);
            return Result.error("迁移旧版主题失败：" + e.getMessage());
        }
    }

    /**
     * 快速校验接口（用于前端实时预览）
     * @param themeJson 主题JSON字符串
     * @return 是否通过
     */
    @Operation(summary = "快速校验")
    @PostMapping("/quick-validate")
    public Result<Map<String, Object>> quickValidate(
            @Parameter(description = "主题JSON")
            @RequestBody Map<String, String> params) {

        try {
            String themeJson = params.get("themeJson");

            boolean valid = gtrsSchemaService.quickValidate(themeJson);

            Map<String, Object> response = new HashMap<>();
            response.put("valid", valid);

            return Result.success(response);
        } catch (Exception e) {
            log.error("快速校验失败", e);
            return Result.error("快速校验失败：" + e.getMessage());
        }
    }
}
