package com.kidgame.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.Iterator;

/**
 * 主题数据迁移服务
 * 用于将旧版本主题数据迁移到GTRS v1.0.0规范
 */
@Service
public class ThemeMigrationService {

    private static final Logger logger = LoggerFactory.getLogger(ThemeMigrationService.class);
    private static final String GTRS_SPEC_NAME = "GTRS";
    private static final String GTRS_VERSION = "1.0.0";

    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * 检测主题JSON是否为GTRS规范
     *
     * @param themeJson 主题JSON字符串
     * @return 是否为GTRS规范
     */
    public boolean isGTRSFormat(String themeJson) {
        try {
            JsonNode root = objectMapper.readTree(themeJson);
            return root.has("specMeta") &&
                   GTRS_SPEC_NAME.equals(root.path("specMeta").path("specName").asText());
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * 将旧版主题迁移到GTRS规范
     *
     * @param oldThemeJson 旧版主题JSON字符串
     * @param themeId      新主题ID
     * @param gameId       游戏ID
     * @param themeName    主题名称
     * @return GTRS规范JSON字符串
     */
    public String migrateToGTRS(String oldThemeJson, String themeId, String gameId, String themeName) {
        try {
            JsonNode oldRoot = objectMapper.readTree(oldThemeJson);

            // 创建GTRS结构
            ObjectNode gtrsRoot = objectMapper.createObjectNode();

            // 1. specMeta
            ObjectNode specMeta = gtrsRoot.putObject("specMeta");
            specMeta.put("specName", GTRS_SPEC_NAME);
            specMeta.put("specVersion", GTRS_VERSION);
            specMeta.put("compatibleVersion", GTRS_VERSION);

            // 2. themeInfo
            ObjectNode themeInfo = gtrsRoot.putObject("themeInfo");
            themeInfo.put("themeId", themeId);
            themeInfo.put("gameId", gameId);
            themeInfo.put("themeName", themeName);
            themeInfo.put("isDefault", false);

            // 提取旧数据中的元信息
            if (oldRoot.has("gameName")) {
                themeInfo.put("description", oldRoot.path("gameName").asText());
            }
            if (oldRoot.has("metadata")) {
                JsonNode metadata = oldRoot.path("metadata");
                if (metadata.has("author")) {
                    themeInfo.put("author", metadata.path("author").asText());
                }
                if (metadata.has("description")) {
                    themeInfo.put("description", metadata.path("description").asText());
                }
            }

            // 3. globalStyle（从旧版colors迁移）
            ObjectNode globalStyle = gtrsRoot.putObject("globalStyle");
            if (oldRoot.has("resources") && oldRoot.path("resources").has("colors")) {
                JsonNode colors = oldRoot.path("resources").path("colors");
                Iterator<String> colorKeys = colors.fieldNames();
                while (colorKeys.hasNext()) {
                    String key = colorKeys.next();
                    String value = colors.path(key).asText();
                    // 映射旧颜色到新规范
                    if (key.contains("primary") || key.contains("main")) {
                        globalStyle.put("primaryColor", value);
                    } else if (key.contains("secondary")) {
                        globalStyle.put("secondaryColor", value);
                    } else if (key.contains("background") || key.contains("bg")) {
                        globalStyle.put("bgColor", value);
                    } else if (key.contains("text") || key.contains("font")) {
                        globalStyle.put("textColor", value);
                    }
                }
            }
            // 设置默认颜色
            if (!globalStyle.has("primaryColor")) {
                globalStyle.put("primaryColor", "#FF6B6B");
            }
            if (!globalStyle.has("bgColor")) {
                globalStyle.put("bgColor", "#1A1A1A");
            }
            if (!globalStyle.has("textColor")) {
                globalStyle.put("textColor", "#FFFFFF");
            }

            // 4. resources
            ObjectNode resources = gtrsRoot.putObject("resources");

            // 4.1 images（从旧版images迁移）
            ObjectNode images = resources.putObject("images");
            images.putObject("login");
            images.putObject("scene");
            images.putObject("ui");
            images.putObject("icon");
            images.putObject("effect");

            if (oldRoot.has("resources") && oldRoot.path("resources").has("images")) {
                JsonNode oldImages = oldRoot.path("resources").path("images");
                Iterator<String> imgKeys = oldImages.fieldNames();

                while (imgKeys.hasNext()) {
                    String key = imgKeys.next();
                    JsonNode oldImg = oldImages.path(key);
                    ObjectNode newImg = objectMapper.createObjectNode();
                    newImg.put("src", oldImg.path("src").asText(""));
                    newImg.put("type", oldImg.path("type").asText("png"));
                    newImg.put("alias", oldImg.has("alias") ? oldImg.path("alias").asText() : migrateToChineseAlias(key));

                    // 智能分类
                    String category = classifyImageResource(key);
                    images.withObject(category).set(key, newImg);
                }
            }

            // 4.2 audio（从旧版audio迁移）
            ObjectNode audio = resources.putObject("audio");
            audio.putObject("bgm");
            audio.putObject("effect");
            audio.putObject("voice");

            if (oldRoot.has("resources") && oldRoot.path("resources").has("audio")) {
                JsonNode oldAudio = oldRoot.path("resources").path("audio");
                Iterator<String> audioKeys = oldAudio.fieldNames();

                while (audioKeys.hasNext()) {
                    String key = audioKeys.next();
                    JsonNode oldAud = oldAudio.path(key);
                    ObjectNode newAud = objectMapper.createObjectNode();
                    newAud.put("src", oldAud.path("src").asText(""));
                    newAud.put("type", oldAud.path("type").asText("mp3"));
                    newAud.put("volume", oldAud.has("volume") ? oldAud.path("volume").asDouble(0.5) : 0.5);
                    newAud.put("alias", oldAud.has("alias") ? oldAud.path("alias").asText() : migrateToChineseAlias(key));

                    // 智能分类
                    String category = classifyAudioResource(key);
                    audio.withObject(category).set(key, newAud);
                }
            }

            // 4.3 video（预留）
            resources.putObject("video");

            logger.info("主题迁移成功: {} -> GTRS v1.0.0", themeName);
            return objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(gtrsRoot);

        } catch (Exception e) {
            logger.error("主题迁移失败", e);
            throw new RuntimeException("主题迁移失败: " + e.getMessage(), e);
        }
    }

    /**
     * 智能分类图片资源
     */
    private String classifyImageResource(String key) {
        String lowerKey = key.toLowerCase();
        if (lowerKey.contains("login") || lowerKey.contains("background")) {
            return "login";
        } else if (lowerKey.contains("scene") || lowerKey.contains("ground") || lowerKey.contains("map")) {
            return "scene";
        } else if (lowerKey.contains("button") || lowerKey.contains("panel") || lowerKey.contains("ui")) {
            return "ui";
        } else if (lowerKey.contains("icon") || lowerKey.contains("logo")) {
            return "icon";
        } else {
            return "effect";
        }
    }

    /**
     * 智能分类音频资源
     */
    private String classifyAudioResource(String key) {
        String lowerKey = key.toLowerCase();
        if (lowerKey.contains("bgm") || lowerKey.contains("music") || lowerKey.contains("background")) {
            return "bgm";
        } else if (lowerKey.contains("voice") || lowerKey.contains("speech") || lowerKey.contains("speak")) {
            return "voice";
        } else {
            return "effect";
        }
    }

    /**
     * 将英文key迁移为中文别名
     */
    private String migrateToChineseAlias(String key) {
        // 这里可以扩展更多映射规则
        if (key.contains("bg")) return "背景图";
        if (key.contains("logo")) return "Logo";
        if (key.contains("button")) return "按钮";
        if (key.contains("bgm") || key.contains("music")) return "背景音乐";
        if (key.contains("click")) return "点击音效";
        return key;
    }
}
