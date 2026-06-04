package com.kidgame.service;

import com.kidgame.dao.entity.SystemConfig;

import java.util.List;
import java.util.Map;

/**
 * 系统配置服务接口
 */
public interface SystemConfigService {

    /**
     * 获取配置值
     */
    String getConfigValue(String configKey);

    /**
     * 获取配置值(带默认值)
     */
    String getConfigValue(String configKey, String defaultValue);

    /**
     * 获取整数配置值
     */
    Integer getConfigInt(String configKey);

    /**
     * 获取整数配置值(带默认值)
     */
    Integer getConfigInt(String configKey, Integer defaultValue);

    /**
     * 获取布尔配置值
     */
    Boolean getConfigBoolean(String configKey);

    /**
     * 获取布尔配置值(带默认值)
     */
    Boolean getConfigBoolean(String configKey, Boolean defaultValue);

    /**
     * 更新配置值
     */
    void updateConfig(String configKey, String configValue);

    /**
     * 获取配置分组
     */
    List<SystemConfig> getConfigGroup(String configGroup);

    /**
     * 获取所有配置
     */
    List<SystemConfig> getAllConfigs();

    /**
     * 初始化默认配置
     */
    void initDefaultConfigs();

    /**
     * 获取疲劳点相关配置
     */
    Map<String, Object> getFatigueConfig();

    /**
     * 获取游戏相关配置
     */
    Map<String, Object> getGameConfig();

    /**
     * 获取答题相关配置
     */
    Map<String, Object> getAnswerConfig();
}
