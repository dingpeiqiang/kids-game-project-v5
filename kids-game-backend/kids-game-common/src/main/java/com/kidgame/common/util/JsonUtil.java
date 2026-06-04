package com.kidgame.common.util;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;

import java.util.Collections;
import java.util.List;

/**
 * JSON 工具类
 * 封装 Jackson JSON 序列化和反序列化操作
 *
 * @author KidsGame
 * @since 1.0.0
 */
@Slf4j
public class JsonUtil {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    private JsonUtil() {
        throw new UnsupportedOperationException("工具类不允许实例化");
    }

    /**
     * 对象转 JSON 字符串
     *
     * @param obj 对象
     * @return JSON 字符串
     */
    public static String toJson(Object obj) {
        if (obj == null) {
            return null;
        }
        try {
            return OBJECT_MAPPER.writeValueAsString(obj);
        } catch (JsonProcessingException e) {
            log.error("JSON 序列化失败: {}", obj, e);
            throw new RuntimeException("JSON 序列化失败", e);
        }
    }

    /**
     * JSON 字符串转对象
     *
     * @param json JSON 字符串
     * @param clazz 目标类型
     * @param <T>   泛型类型
     * @return 对象
     */
    public static <T> T fromJson(String json, Class<T> clazz) {
        if (json == null || json.trim().isEmpty()) {
            return null;
        }
        try {
            return OBJECT_MAPPER.readValue(json, clazz);
        } catch (JsonProcessingException e) {
            log.error("JSON 反序列化失败: {}", json, e);
            throw new RuntimeException("JSON 反序列化失败", e);
        }
    }

    /**
     * JSON 字符串转对象（支持泛型）
     *
     * @param json          JSON 字符串
     * @param typeReference 类型引用
     * @param <T>           泛型类型
     * @return 对象
     */
    public static <T> T fromJson(String json, TypeReference<T> typeReference) {
        if (json == null || json.trim().isEmpty()) {
            return null;
        }
        try {
            return OBJECT_MAPPER.readValue(json, typeReference);
        } catch (JsonProcessingException e) {
            log.error("JSON 反序列化失败: {}", json, e);
            throw new RuntimeException("JSON 反序列化失败", e);
        }
    }

    /**
     * JSON 字符串转 List
     *
     * @param json JSON 字符串
     * @param type 元素类型
     * @param <T>  泛型类型
     * @return List 对象，解析失败返回空列表
     */
    public static <T> List<T> fromJsonList(String json, Class<T> type) {
        if (json == null || json.trim().isEmpty()) {
            return Collections.emptyList();
        }
        try {
            return OBJECT_MAPPER.readValue(json,
                    OBJECT_MAPPER.getTypeFactory().constructCollectionType(List.class, type));
        } catch (JsonProcessingException e) {
            log.error("JSON 反序列化为 List 失败: {}", json, e);
            return Collections.emptyList();
        }
    }

    /**
     * JSON 字符串转 List（使用 TypeReference）
     *
     * @param json          JSON 字符串
     * @param typeReference 类型引用
     * @param <T>           泛型类型
     * @return List 对象，解析失败返回空列表
     */
    public static <T> List<T> fromJsonListSafe(String json, TypeReference<List<T>> typeReference) {
        if (json == null || json.trim().isEmpty()) {
            return Collections.emptyList();
        }
        try {
            return OBJECT_MAPPER.readValue(json, typeReference);
        } catch (JsonProcessingException e) {
            log.error("JSON 反序列化为 List 失败: {}", json, e);
            return Collections.emptyList();
        }
    }

    /**
     * 安全地将对象转为 JSON 字符串（异常时返回 null）
     *
     * @param obj 对象
     * @return JSON 字符串，失败返回 null
     */
    public static String toJsonSafe(Object obj) {
        try {
            return OBJECT_MAPPER.writeValueAsString(obj);
        } catch (JsonProcessingException e) {
            log.error("JSON 序列化失败: {}", obj, e);
            return null;
        }
    }
}
