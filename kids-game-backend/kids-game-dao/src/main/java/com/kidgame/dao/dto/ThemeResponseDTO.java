package com.kidgame.dao.dto;

import com.kidgame.dao.entity.ThemeInfo;
import lombok.Data;

/**
 * 主题响应 DTO（包含游戏信息）
 */
@Data
public class ThemeResponseDTO {
    
    /**
     * 主题 ID
     */
    private Long themeId;
    
    /**
     * 作者 ID
     */
    private Long authorId;
    
    /**
     * 主题名称
     */
    private String themeName;
    
    /**
     * 适用范围：all-全游戏/specific-指定游戏
     */
    private String applicableScope;
    
    /**
     * 作者名称
     */
    private String authorName;
    
    /**
     * 价格（游戏币）
     */
    private Integer price;
    
    /**
     * 状态：on_sale/offline/pending
     */
    private String status;
    
    /**
     * 下载次数
     */
    private Integer downloadCount;
    
    /**
     * 总收益
     */
    private Integer totalRevenue;
    
    /**
     * 缩略图 URL
     */
    private String thumbnailUrl;
    
    /**
     * 描述
     */
    private String description;
    
    /**
     * 主题配置（包含资源/样式）
     */
    private String configJson;
    
    /**
     * 游戏名称（仅用于游戏主题）
     */
    private String gameName;
    
    /**
     * 是否为默认主题
     */
    private Boolean isDefault;
    
    /**
     * 从 ThemeInfo 构建 DTO
     */
    public static ThemeResponseDTO from(ThemeInfo theme) {
        ThemeResponseDTO dto = new ThemeResponseDTO();
        dto.setThemeId(theme.getThemeId());
        dto.setAuthorId(theme.getAuthorId());
        dto.setThemeName(theme.getThemeName());
        dto.setApplicableScope(theme.getApplicableScope());
        dto.setAuthorName(theme.getAuthorName());
        dto.setPrice(theme.getPrice());
        dto.setStatus(theme.getStatus());
        dto.setDownloadCount(theme.getDownloadCount());
        dto.setTotalRevenue(theme.getTotalRevenue());
        dto.setThumbnailUrl(theme.getThumbnailUrl());
        dto.setDescription(theme.getDescription());
        dto.setConfigJson(theme.getConfigJson());
        dto.setIsDefault(theme.getIsDefault() != null && theme.getIsDefault());
        return dto;
    }
}
