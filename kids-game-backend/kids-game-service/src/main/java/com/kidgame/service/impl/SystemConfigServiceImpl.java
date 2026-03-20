package com.kidgame.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.kidgame.dao.entity.SystemConfig;
import com.kidgame.dao.mapper.SystemConfigMapper;
import com.kidgame.service.SystemConfigService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 系统配置服务实现
 */
@Slf4j
@Service
public class SystemConfigServiceImpl implements SystemConfigService {

    @Autowired
    private SystemConfigMapper systemConfigMapper;

    @Override
    public String getConfigValue(String configKey) {
        return getConfigValue(configKey, null);
    }

    @Override
    public String getConfigValue(String configKey, String defaultValue) {
        SystemConfig config = systemConfigMapper.selectByKey(configKey);
        if (config == null) {
            log.warn("配置不存在: {}, 返回默认值: {}", configKey, defaultValue);
            return defaultValue;
        }
        return config.getConfigValue();
    }

    @Override
    public Integer getConfigInt(String configKey) {
        return getConfigInt(configKey, null);
    }

    @Override
    public Integer getConfigInt(String configKey, Integer defaultValue) {
        String value = getConfigValue(configKey);
        if (value == null) {
            return defaultValue;
        }
        try {
            return Integer.parseInt(value);
        } catch (NumberFormatException e) {
            log.error("配置值不是有效的整数: {}, 值: {}", configKey, value);
            return defaultValue;
        }
    }

    @Override
    public Boolean getConfigBoolean(String configKey) {
        return getConfigBoolean(configKey, false);
    }

    @Override
    public Boolean getConfigBoolean(String configKey, Boolean defaultValue) {
        String value = getConfigValue(configKey);
        if (value == null) {
            return defaultValue;
        }
        return Boolean.parseBoolean(value);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void updateConfig(String configKey, String configValue) {
        SystemConfig config = systemConfigMapper.selectByKey(configKey);

        if (config == null) {
            throw new RuntimeException("配置不存在: " + configKey);
        }

        config.setConfigValue(configValue);
        config.setUpdateTime(System.currentTimeMillis());
        systemConfigMapper.updateById(config);

        log.info("配置已更新: {} = {}", configKey, configValue);
    }

    @Override
    public List<SystemConfig> getConfigGroup(String configGroup) {
        return systemConfigMapper.selectByGroup(configGroup);
    }

    @Override
    public List<SystemConfig> getAllConfigs() {
        return systemConfigMapper.selectList(null);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void initDefaultConfigs() {
        log.info("初始化默认配置");

        long now = System.currentTimeMillis();

        // 疲劳点配置
        createConfigIfNotExists("fatigue.initial_points", "10", "初始疲劳点数", "fatigue", now);
        createConfigIfNotExists("fatigue.points_per_minute", "1", "每分钟消耗疲劳点", "fatigue", now);
        createConfigIfNotExists("fatigue.daily_reset_time", "00:00", "每日重置时间", "fatigue", now);
        createConfigIfNotExists("fatigue.max_daily_points", "20", "每日最大疲劳点", "fatigue", now);

        // 答题配置
        createConfigIfNotExists("answer.points_per_correct", "1", "答对每题获得疲劳点", "answer", now);
        createConfigIfNotExists("answer.daily_max_points", "10", "每日答题获得疲劳点上限", "answer", now);
        createConfigIfNotExists("answer.question_count_per_request", "1", "每次请求题目数量", "answer", now);

        // 游戏配置
        createConfigIfNotExists("game.min_fatigue_points", "1", "开始游戏所需最小疲劳点", "game", now);
        createConfigIfNotExists("game.max_single_duration", "60", "单次游戏最大时长(分钟)", "game", now);
        createConfigIfNotExists("game.heartbeat_interval", "60", "心跳间隔(秒)", "game", now);

        // 系统配置
        createConfigIfNotExists("system.jwt_expiration_hours", "24", "JWT过期时间(小时)", "system", now);
        createConfigIfNotExists("system.api_rate_limit_per_minute", "100", "API每分钟限流次数", "system", now);

        log.info("默认配置初始化完成");
    }

    private void createConfigIfNotExists(String key, String value, String description, String group, long now) {
        SystemConfig existing = systemConfigMapper.selectByKey(key);
        if (existing == null) {
            SystemConfig config = new SystemConfig();
            config.setConfigKey(key);
            config.setConfigValue(value);
            config.setDescription(description);
            config.setConfigGroup(group);
            config.setCreateTime(now);
            config.setUpdateTime(now);
            systemConfigMapper.insert(config);
            log.debug("创建默认配置: {} = {}", key, value);
        }
    }

    @Override
    public Map<String, Object> getFatigueConfig() {
        Map<String, Object> config = new HashMap<>();
        List<SystemConfig> configs = getConfigGroup("fatigue");
        for (SystemConfig c : configs) {
            config.put(c.getConfigKey(), c.getConfigValue());
        }
        return config;
    }

    @Override
    public Map<String, Object> getGameConfig() {
        Map<String, Object> config = new HashMap<>();
        List<SystemConfig> configs = getConfigGroup("game");
        for (SystemConfig c : configs) {
            config.put(c.getConfigKey(), c.getConfigValue());
        }
        return config;
    }

    @Override
    public Map<String, Object> getAnswerConfig() {
        Map<String, Object> config = new HashMap<>();
        List<SystemConfig> configs = getConfigGroup("answer");
        for (SystemConfig c : configs) {
            config.put(c.getConfigKey(), c.getConfigValue());
        }
        return config;
    }
}
