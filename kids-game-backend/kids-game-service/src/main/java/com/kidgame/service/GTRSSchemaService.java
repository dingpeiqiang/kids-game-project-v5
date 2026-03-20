package com.kidgame.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.networknt.schema.JsonSchema;
import com.networknt.schema.JsonSchemaFactory;
import com.networknt.schema.SpecVersion;
import com.networknt.schema.ValidationMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.io.InputStream;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * GTRS Schema校验服务
 * 用于全流程JSON格式校验，确保主题配置符合GTRS v1.0.0规范
 */
@Service
public class GTRSSchemaService {

    private static final Logger logger = LoggerFactory.getLogger(GTRSSchemaService.class);

    private static final String SCHEMA_FILE = "gtrs-schema.json";
    private static final String GTRS_SPEC_NAME = "GTRS";
    private static final String CURRENT_VERSION = "1.0.0";

    private JsonSchema schema;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @PostConstruct
    public void init() {
        try {
            JsonSchemaFactory factory = JsonSchemaFactory.getInstance(SpecVersion.VersionFlag.V7);
            InputStream schemaStream = new ClassPathResource(SCHEMA_FILE).getInputStream();
            JsonNode schemaNode = objectMapper.readTree(schemaStream);
            this.schema = factory.getSchema(schemaNode);
            logger.info("GTRS Schema校验器初始化成功");
        } catch (Exception e) {
            logger.error("GTRS Schema初始化失败", e);
            throw new RuntimeException("GTRS Schema初始化失败", e);
        }
    }

    /**
     * 校验主题JSON是否符合GTRS规范
     *
     * @param themeJson 主题JSON字符串
     * @return 校验结果
     */
    public ValidationResult validateTheme(String themeJson) {
        try {
            JsonNode jsonNode = objectMapper.readTree(themeJson);
            return validateTheme(jsonNode);
        } catch (Exception e) {
            logger.error("JSON解析失败", e);
            return ValidationResult.error("JSON格式错误: " + e.getMessage());
        }
    }

    /**
     * 校验主题JSON是否符合GTRS规范
     *
     * @param jsonNode 主题JSON节点
     * @return 校验结果
     */
    public ValidationResult validateTheme(JsonNode jsonNode) {
        try {
            // 1. 检查基础结构
            if (!jsonNode.has("specMeta") || !jsonNode.has("themeInfo") ||
                !jsonNode.has("globalStyle") || !jsonNode.has("resources")) {
                return ValidationResult.error("缺少必需的顶级字段：specMeta、themeInfo、globalStyle、resources");
            }

            // 2. 检查规范名称
            String specName = jsonNode.path("specMeta").path("specName").asText();
            if (!GTRS_SPEC_NAME.equals(specName)) {
                return ValidationResult.error("规范名称必须为: " + GTRS_SPEC_NAME);
            }

            // 3. 检查版本兼容性
            String specVersion = jsonNode.path("specMeta").path("specVersion").asText();
            if (!isVersionCompatible(specVersion, CURRENT_VERSION)) {
                return ValidationResult.error("规范版本 " + specVersion + " 不兼容，当前支持版本: " + CURRENT_VERSION);
            }

            // 4. Schema校验
            Set<ValidationMessage> errors = schema.validate(jsonNode);

            if (errors.isEmpty()) {
                logger.info("主题JSON校验通过");
                return ValidationResult.success();
            } else {
                String errorMessages = errors.stream()
                        .map(ValidationMessage::getMessage)
                        .collect(Collectors.joining("; "));
                logger.warn("主题JSON校验失败: {}", errorMessages);
                return ValidationResult.error("Schema校验失败: " + errorMessages);
            }
        } catch (Exception e) {
            logger.error("校验过程异常", e);
            return ValidationResult.error("校验异常: " + e.getMessage());
        }
    }

    /**
     * 检查版本兼容性
     *
     * @param themeVersion   主题版本
     * @param currentVersion 当前支持版本
     * @return 是否兼容
     */
    private boolean isVersionCompatible(String themeVersion, String currentVersion) {
        try {
            int themeMajor = Integer.parseInt(themeVersion.split("\\.")[0]);
            int currentMajor = Integer.parseInt(currentVersion.split("\\.")[0]);
            return themeMajor <= currentMajor;
        } catch (Exception e) {
            logger.error("版本号解析失败", e);
            return false;
        }
    }

    /**
     * 快速校验（仅检查关键字段，用于前端实时预览）
     *
     * @param themeJson 主题JSON字符串
     * @return 是否通过
     */
    public boolean quickValidate(String themeJson) {
        try {
            JsonNode jsonNode = objectMapper.readTree(themeJson);
            return jsonNode.has("specMeta") &&
                   jsonNode.has("themeInfo") &&
                   jsonNode.has("globalStyle") &&
                   jsonNode.has("resources");
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * 校验结果类
     */
    public static class ValidationResult {
        private final boolean valid;
        private final String message;

        private ValidationResult(boolean valid, String message) {
            this.valid = valid;
            this.message = message;
        }

        public static ValidationResult success() {
            return new ValidationResult(true, "校验通过");
        }

        public static ValidationResult error(String message) {
            return new ValidationResult(false, message);
        }

        public boolean isValid() {
            return valid;
        }

        public String getMessage() {
            return message;
        }
    }
}
