package com.kidgame.service;

/**
 * 图案解锁服务接口
 */
public interface PatternLockService {

    /**
     * 保存图案解锁
     *
     * @param userId   用户ID
     * @param userType 用户类型（PARENT/KID）
     * @param pattern  图案（如 "0124"）
     */
    void savePatternLock(Long userId, String userType, String pattern);

    /**
     * 验证图案解锁
     *
     * @param userId   用户ID
     * @param userType 用户类型（PARENT/KID）
     * @param pattern  输入的图案
     * @return 是否验证通过
     */
    boolean validatePattern(Long userId, String userType, String pattern);

    /**
     * 检查用户是否设置了图案解锁
     *
     * @param userId   用户ID
     * @param userType 用户类型（PARENT/KID）
     * @return 是否存在
     */
    boolean hasPatternLock(Long userId, String userType);

    /**
     * 删除图案解锁
     *
     * @param userId   用户ID
     * @param userType 用户类型（PARENT/KID）
     */
    void deletePatternLock(Long userId, String userType);

    /**
     * 更新图案解锁
     *
     * @param userId   用户ID
     * @param userType 用户类型（PARENT/KID）
     * @param pattern  新图案
     */
    void updatePatternLock(Long userId, String userType, String pattern);
}
