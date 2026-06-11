package com.kidgame.service;

/**
 * 统一游学币服务接口
 * 支持所有用户类型（儿童、家长、管理员）
 *
 * @author kids-game-platform
 * @since 1.0.0
 */
public interface FatiguePointsService {

    /**
     * 更新用户游学币
     * @param userId 用户ID
     * @param userType 用户类型（0-KID, 1-PARENT, 2-ADMIN）
     * @param changeType 变化类型（见 GameConstants.FatigueChangeType；正数入账仅 2/3/4/5/6）
     * @param changePoints 变化点数（正数表示增加，负数表示减少）
     * @param relatedId 关联ID（如游戏会话ID、题目ID等）
     * @param relatedType 关联类型（GAME_SESSION, QUESTION, INIT等）
     * @param remark 备注
     * @return 更新后的游学币
     */
    Integer updateFatiguePoints(Long userId, Integer userType, Integer changeType,
                                Integer changePoints, Long relatedId, String relatedType, String remark);

    /**
     * 获取用户当前游学币
     * @param userId 用户ID
     * @param userType 用户类型
     * @return 游学币
     */
    Integer getFatiguePoints(Long userId, Integer userType);

    /**
     * 检查用户是否有足够的游学币
     * @param userId 用户ID
     * @param userType 用户类型
     * @param requiredPoints 需要的点数
     * @return true-足够，false-不足
     */
    boolean hasEnoughFatiguePoints(Long userId, Integer userType, Integer requiredPoints);

    /**
     * 消耗游学币（用于游戏启动）
     * @param userId 用户ID
     * @param userType 用户类型
     * @param points 消耗的点数
     * @param relatedId 关联的游戏会话ID
     * @return 是否消耗成功
     */
    boolean consumeFatiguePoints(Long userId, Integer userType, Integer points, Long relatedId);

    /**
     * 增加游学币（用于答题奖励）
     * @param userId 用户ID
     * @param userType 用户类型
     * @param points 增加的点数
     * @param relatedId 关联的题目ID
     * @return 增加后的游学币
     */
    Integer addFatiguePoints(Long userId, Integer userType, Integer points, Long relatedId);

    /**
     * 家长奖励游学币（仅绑定家长可操作）
     */
    Integer grantStudyCoinsFromParent(Long parentId, Long kidId, Integer points, String remark);

    /**
     * 系统赠与游学币（注册初始化、每日补充、管理员等）
     */
    Integer grantStudyCoinsBySystem(Long userId, Integer userType, Integer points, int changeType,
                                    String relatedType, String remark, Long relatedId);

    /**
     * 重置用户每日游学币
     * @param userId 用户ID
     * @param userType 用户类型
     * @return 重置后的游学币
     */
    Integer resetDailyFatiguePoints(Long userId, Integer userType);

    /**
     * 初始化用户游学币（用户注册时调用）
     * @param userId 用户ID
     * @param userType 用户类型
     * @param initialPoints 初始游学币
     */
    void initializeFatiguePoints(Long userId, Integer userType, Integer initialPoints);
}
