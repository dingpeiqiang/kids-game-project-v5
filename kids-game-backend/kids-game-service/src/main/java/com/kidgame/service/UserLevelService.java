package com.kidgame.service;

import com.kidgame.dao.entity.UserLevel;

/**
 * 用户等级服务接口
 */
public interface UserLevelService {

    /**
     * 根据用户 ID 获取等级信息
     * @param userId 用户 ID
     * @return 用户等级信息
     */
    UserLevel getUserLevelByUserId(Long userId);

    /**
     * 更新用户等级（增加经验值）
     * @param userId 用户 ID
     * @param expGained 获得的经验值
     * @return 更新后的等级信息
     */
    UserLevel updateLevel(Long userId, int expGained);

    /**
     * 计算用户等级（根据总经验值）
     * @param totalExp 总经验值
     * @return 等级
     */
    int calculateLevel(int totalExp);

    /**
     * 获取下一级所需经验
     * @param currentLevel 当前等级
     * @return 下一级所需经验
     */
    int getNextLevelExp(int currentLevel);

    /**
     * 获取等级称号
     * @param level 等级
     * @return 等级称号
     */
    String getLevelTitle(int level);
}
