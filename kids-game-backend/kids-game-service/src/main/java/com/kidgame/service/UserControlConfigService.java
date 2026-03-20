package com.kidgame.service;

import com.kidgame.dao.entity.UserControlConfig;

/**
 * 用户管控配置服务接口
 *
 * @author kids-game-platform
 * @since 1.0.0
 */
public interface UserControlConfigService {

    /**
     * 创建管控配置
     *
     * @param config 配置信息
     * @return 配置ID
     */
    Long createConfig(UserControlConfig config);

    /**
     * 更新管控配置
     *
     * @param config 配置信息
     */
    void updateConfig(UserControlConfig config);

    /**
     * 删除管控配置
     *
     * @param configId 配置ID
     */
    void deleteConfig(Long configId);

    /**
     * 获取用户的管控配置
     *
     * @param userId 用户ID
     * @return 管控配置
     */
    UserControlConfig getConfigByUserId(Long userId);

    /**
     * 获取用户和监护人的管控配置
     *
     * @param userId 用户ID
     * @param guardianId 监护人ID
     * @return 管控配置
     */
    UserControlConfig getConfig(Long userId, Long guardianId);

    /**
     * 保存或创建管控配置
     *
     * @param config 配置信息
     * @return 保存后的配置
     */
    UserControlConfig saveConfig(UserControlConfig config);

    /**
     * 更新每日时间限制
     *
     * @param userId 用户ID
     * @param dailyTimeLimitMinutes 每日时间限制（分钟）
     */
    void updateTimeLimit(Long userId, Integer dailyTimeLimitMinutes);

    /**
     * 更新疲劳点设置
     *
     * @param userId 用户ID
     * @param fatiguePointMinutes 疲劳点阈值（分钟）
     * @param restDurationMinutes 强制休息时长（分钟）
     */
    void updateFatiguePoint(Long userId, Integer fatiguePointMinutes, Integer restDurationMinutes);

    /**
     * 更新时间范围限制
     *
     * @param userId 用户ID
     * @param allowedStartTime 允许开始时间（HH:mm:ss）
     * @param allowedEndTime 允许结束时间（HH:mm:ss）
     */
    void updateTimeRange(Long userId, String allowedStartTime, String allowedEndTime);

    /**
     * 更新疲劳控制模式
     *
     * @param userId 用户ID
     * @param fatigueControlMode 疲劳控制模式
     */
    void updateFatigueMode(Long userId, String fatigueControlMode);

    /**
     * 检查是否在允许时间范围内
     *
     * @param userId 用户ID
     * @return 是否在允许范围内
     */
    boolean checkTimeRange(Long userId);

    /**
     * 检查是否超过每日时间限制
     *
     * @param userId 用户ID
     * @return 是否超过限制
     */
    boolean checkDailyLimit(Long userId);

    /**
     * 检查是否触发疲劳点
     *
     * @param userId 用户ID
     * @param playedMinutes 已玩游戏时长（分钟）
     * @return 是否触发疲劳点
     */
    boolean checkFatigue(Long userId, Integer playedMinutes);

    /**
     * 删除用户管控配置
     *
     * @param userId 用户ID
     */
    void deleteByUserId(Long userId);
}
