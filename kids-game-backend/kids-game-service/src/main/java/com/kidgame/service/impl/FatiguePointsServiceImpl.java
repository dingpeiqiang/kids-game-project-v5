package com.kidgame.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.kidgame.common.constant.ErrorCode;
import com.kidgame.common.constant.GameConstants;
import com.kidgame.common.exception.BusinessException;
import com.kidgame.dao.entity.BaseUser;
import com.kidgame.dao.entity.FatiguePointsLog;
import com.kidgame.dao.entity.UserRelation;
import com.kidgame.dao.mapper.BaseUserMapper;
import com.kidgame.dao.mapper.FatiguePointsLogMapper;
import com.kidgame.dao.mapper.UserRelationMapper;
import com.kidgame.service.FatiguePointsService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Calendar;
import java.util.Date;

/**
 * 统一游学币服务实现
 * 支持所有用户类型（儿童、家长、管理员）
 *
 * @author kids-game-platform
 * @since 1.0.0
 */
@Slf4j
@Service
public class FatiguePointsServiceImpl implements FatiguePointsService {

    @Autowired
    private BaseUserMapper baseUserMapper;

    @Autowired
    private FatiguePointsLogMapper fatiguePointsLogMapper;

    @Autowired
    private UserRelationMapper userRelationMapper;

    @Value("${kidgame.game.fatigue-points.initial:10}")
    private Integer initialFatiguePoints;

    @Value("${kidgame.game.fatigue-points.daily-limit:10}")
    private Integer dailyAnswerLimit;

    @Value("${kidgame.game.fatigue-points.points-per-answer:1}")
    private Integer pointsPerAnswer;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Integer updateFatiguePoints(Long userId, Integer userType, Integer changeType,
                                       Integer changePoints, Long relatedId, String relatedType, String remark) {
        // 1. 查询用户当前游学币
        BaseUser user = baseUserMapper.selectById(userId);
        if (user == null) {
            throw new BusinessException(ErrorCode.USER_NOT_FOUND, "用户不存在");
        }

        assertAllowedCoinChange(changeType, changePoints, relatedType);

        // 2. 检查游学币是否需要每日重置
        checkAndResetDailyFatigue(user);

        // 3. 计算新的游学币
        Integer currentPoints = user.getFatiguePoints() != null ? user.getFatiguePoints() : initialFatiguePoints;
        Integer newPoints = currentPoints + changePoints;

        // 4. 验证游学币范围
        if (newPoints < 0) {
            throw new BusinessException(ErrorCode.PARAM_ERROR, "游学币不足");
        }
        if (newPoints > 100) {
            newPoints = 100; // 最大值限制
        }

        // 5. 更新用户游学币
        LambdaUpdateWrapper<BaseUser> updateWrapper = new LambdaUpdateWrapper<>();
        updateWrapper.eq(BaseUser::getUserId, userId);
        updateWrapper.set(BaseUser::getFatiguePoints, newPoints);
        updateWrapper.set(BaseUser::getFatigueUpdateTime, System.currentTimeMillis());
        baseUserMapper.update(null, updateWrapper);

        // 6. 记录游学币变化日志
        FatiguePointsLog fatigueLog = new FatiguePointsLog();
        fatigueLog.setUserId(userId);
        fatigueLog.setChangeType(changeType);
        fatigueLog.setChangePoints(changePoints);
        fatigueLog.setCurrentPoints(newPoints);
        fatigueLog.setRelatedId(relatedId);
        fatigueLog.setRelatedType(relatedType);
        fatigueLog.setRemark(remark);
        fatigueLog.setCreateTime(System.currentTimeMillis());
        fatiguePointsLogMapper.insert(fatigueLog);

        log.info("更新用户游学币成功. UserId: {}, UserType: {}, ChangeType: {}, ChangePoints: {}, CurrentPoints: {}",
                userId, userType, changeType, changePoints, newPoints);

        return newPoints;
    }

    @Override
    public Integer getFatiguePoints(Long userId, Integer userType) {
        BaseUser user = baseUserMapper.selectById(userId);
        if (user == null) {
            log.warn("用户不存在，返回默认游学币. UserId: {}", userId);
            return initialFatiguePoints;
        }

        // 检查并重置每日游学币
        checkAndResetDailyFatigue(user);

        Integer points = user.getFatiguePoints();
        return points != null ? points : initialFatiguePoints;
    }

    @Override
    public boolean hasEnoughFatiguePoints(Long userId, Integer userType, Integer requiredPoints) {
        Integer currentPoints = getFatiguePoints(userId, userType);
        return currentPoints >= requiredPoints;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public boolean consumeFatiguePoints(Long userId, Integer userType, Integer points, Long relatedId) {
        if (!hasEnoughFatiguePoints(userId, userType, points)) {
            Integer currentPoints = getFatiguePoints(userId, userType);
            log.warn("游学币不足，无法消耗. UserId: {}, Required: {}, Current: {}",
                    userId, points, currentPoints);
            throw new BusinessException(ErrorCode.PARAM_ERROR, "游学币不足，无法消耗");
        }

        try {
            updateFatiguePoints(userId, userType, 1, -points, relatedId, "GAME_SESSION", "游戏消耗游学币");
            return true;
        } catch (Exception e) {
            log.error("消耗游学币失败. UserId: {}, Points: {}", userId, points, e);
            throw new BusinessException(ErrorCode.SYSTEM_ERROR, "消耗游学币失败");
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Integer addFatiguePoints(Long userId, Integer userType, Integer points, Long relatedId) {
        // 检查今日答题积分是否已达到上限
        BaseUser user = baseUserMapper.selectById(userId);
        if (user == null) {
            throw new BusinessException(ErrorCode.USER_NOT_FOUND, "用户不存在");
        }

        checkAndResetDailyFatigue(user);

        Integer todayAnswerPoints = user.getDailyAnswerPoints() != null ? user.getDailyAnswerPoints() : 0;
        if (todayAnswerPoints >= dailyAnswerLimit) {
            log.info("今日答题积分已达上限，无法继续获得游学币. UserId: {}, TodayPoints: {}, Limit: {}",
                    userId, todayAnswerPoints, dailyAnswerLimit);
            return user.getFatiguePoints();
        }

        // 计算实际可获得的点数
        Integer actualPoints = Math.min(points, dailyAnswerLimit - todayAnswerPoints);

        // 更新游学币
        Integer newPoints = updateFatiguePoints(userId, userType, 2, actualPoints, relatedId, "QUESTION", "答题获得游学币");

        // 更新今日答题积分
        LambdaUpdateWrapper<BaseUser> updateWrapper = new LambdaUpdateWrapper<>();
        updateWrapper.eq(BaseUser::getUserId, userId);
        updateWrapper.set(BaseUser::getDailyAnswerPoints, todayAnswerPoints + actualPoints);
        baseUserMapper.update(null, updateWrapper);

        return newPoints;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Integer resetDailyFatiguePoints(Long userId, Integer userType) {
        // 1. 查询用户当前游学币
        BaseUser user = baseUserMapper.selectById(userId);
        if (user == null) {
            throw new BusinessException(ErrorCode.USER_NOT_FOUND, "用户不存在");
        }

        // 2. 检查是否需要每日重置（跨天检测）
        checkAndResetDailyFatigue(user);

        // 3. 获取当前游学币（如果为 null 则使用初始值）
        Integer currentPoints = user.getFatiguePoints() != null ? user.getFatiguePoints() : initialFatiguePoints;

        // 4. 只有当游学币低于初始值时，才重置到初始值
        // 如果游学币 >= 初始值，说明用户通过购买、答题、任务等方式获得了额外游学币，不予重置
        if (currentPoints < initialFatiguePoints) {
            log.info("每日重置游学币：UserId: {}, UserType: {}, CurrentPoints: {}, InitialPoints: {}",
                    userId, userType, currentPoints, initialFatiguePoints);

            // 计算需要补充的游学币
            Integer resetPoints = initialFatiguePoints - currentPoints;

            // 5. 更新用户游学币
            LambdaUpdateWrapper<BaseUser> updateWrapper = new LambdaUpdateWrapper<>();
            updateWrapper.eq(BaseUser::getUserId, userId);
            updateWrapper.set(BaseUser::getFatiguePoints, initialFatiguePoints);
            updateWrapper.set(BaseUser::getFatigueUpdateTime, System.currentTimeMillis());
            baseUserMapper.update(null, updateWrapper);

            // 6. 记录游学币变化日志
            FatiguePointsLog fatigueLog = new FatiguePointsLog();
            fatigueLog.setUserId(userId);
            fatigueLog.setChangeType(3); // 3-每日重置
            fatigueLog.setChangePoints(resetPoints);
            fatigueLog.setCurrentPoints(initialFatiguePoints);
            fatigueLog.setRelatedId(null);
            fatigueLog.setRelatedType("DAILY_RESET");
            fatigueLog.setRemark("每日自动重置游学币（补充至初始值）");
            fatigueLog.setCreateTime(System.currentTimeMillis());
            fatiguePointsLogMapper.insert(fatigueLog);

            log.info("每日重置游学币成功：UserId: {}, 补充点数：{}, 当前点数：{}",
                    userId, resetPoints, initialFatiguePoints);

            return initialFatiguePoints;
        } else {
            // 游学币足够，不需要重置
            log.info("游学币充足，无需重置：UserId: {}, UserType: {}, CurrentPoints: {}, InitialPoints: {}",
                    userId, userType, currentPoints, initialFatiguePoints);
            return currentPoints;
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void initializeFatiguePoints(Long userId, Integer userType, Integer initialPoints) {
        BaseUser user = baseUserMapper.selectById(userId);
        if (user == null) {
            throw new BusinessException(ErrorCode.USER_NOT_FOUND, "用户不存在");
        }
        assertAllowedCoinChange(GameConstants.FatigueChangeType.INIT, initialPoints, "INIT");

        LambdaUpdateWrapper<BaseUser> updateWrapper = new LambdaUpdateWrapper<>();
        updateWrapper.eq(BaseUser::getUserId, userId);
        updateWrapper.set(BaseUser::getFatiguePoints, initialPoints);
        updateWrapper.set(BaseUser::getDailyAnswerPoints, 0);
        updateWrapper.set(BaseUser::getFatigueUpdateTime, System.currentTimeMillis());
        baseUserMapper.update(null, updateWrapper);

        FatiguePointsLog initLog = new FatiguePointsLog();
        initLog.setUserId(userId);
        initLog.setChangeType(GameConstants.FatigueChangeType.INIT);
        initLog.setChangePoints(initialPoints);
        initLog.setCurrentPoints(initialPoints);
        initLog.setRelatedType("INIT");
        initLog.setRemark("用户初始化游学币（系统赠与）");
        initLog.setCreateTime(System.currentTimeMillis());
        fatiguePointsLogMapper.insert(initLog);

        log.info("初始化用户游学币成功. UserId: {}, UserType: {}, InitialPoints: {}", userId, userType, initialPoints);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Integer grantStudyCoinsFromParent(Long parentId, Long kidId, Integer points, String remark) {
        if (parentId == null || kidId == null || points == null || points <= 0) {
            throw new BusinessException(ErrorCode.PARAM_ERROR_OBJ, "奖励参数无效");
        }
        if (points > 50) {
            throw new BusinessException(ErrorCode.PARAM_ERROR_OBJ, "单次家长奖励不能超过 50 游学币");
        }
        if (!isParentBoundToKid(parentId, kidId)) {
            throw new BusinessException(ErrorCode.FORBIDDEN_OBJ, "未绑定该儿童，无法奖励游学币");
        }
        String note = remark != null && !remark.isBlank() ? remark.trim() : "家长奖励游学币";
        return updateFatiguePoints(kidId, 0, GameConstants.FatigueChangeType.PARENT_REWARD, points,
                parentId, "PARENT_REWARD", note);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Integer grantStudyCoinsBySystem(Long userId, Integer userType, Integer points, int changeType,
                                           String relatedType, String remark, Long relatedId) {
        if (userId == null || points == null || points <= 0) {
            throw new BusinessException(ErrorCode.PARAM_ERROR_OBJ, "系统赠与参数无效");
        }
        if (changeType != GameConstants.FatigueChangeType.INIT
                && changeType != GameConstants.FatigueChangeType.DAILY_RESET
                && changeType != GameConstants.FatigueChangeType.SYSTEM_GRANT) {
            throw new BusinessException(ErrorCode.PARAM_ERROR_OBJ, "非法的系统赠与类型");
        }
        return updateFatiguePoints(userId, userType, changeType, points, relatedId, relatedType, remark);
    }

    private boolean isParentBoundToKid(Long parentId, Long kidId) {
        LambdaQueryWrapper<UserRelation> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(UserRelation::getUserA, parentId);
        wrapper.eq(UserRelation::getUserB, kidId);
        wrapper.eq(UserRelation::getRelationType, UserRelation.RelationType.PARENT_KID);
        return userRelationMapper.selectCount(wrapper) > 0;
    }

    /**
     * 游学币增加仅允许：答题、家长奖励、系统赠与；游戏相关仅允许扣减
     */
    private void assertAllowedCoinChange(Integer changeType, Integer changePoints, String relatedType) {
        if (changePoints == null || changePoints == 0) {
            throw new BusinessException(ErrorCode.PARAM_ERROR_OBJ, "游学币变动数值无效");
        }
        int type = changeType != null ? changeType : -1;
        if (changePoints > 0) {
            if (type != GameConstants.FatigueChangeType.ANSWER_GET
                    && type != GameConstants.FatigueChangeType.DAILY_RESET
                    && type != GameConstants.FatigueChangeType.INIT
                    && type != GameConstants.FatigueChangeType.PARENT_REWARD
                    && type != GameConstants.FatigueChangeType.SYSTEM_GRANT) {
                throw new BusinessException(ErrorCode.PARAM_ERROR_OBJ, "游学币仅可通过答题、家长奖励或系统赠与获得");
            }
            if (type == GameConstants.FatigueChangeType.GAME_CONSUME
                    || "GAME_SESSION".equals(relatedType) || "GAME_REWARD".equals(relatedType)) {
                throw new BusinessException(ErrorCode.PARAM_ERROR_OBJ, "游戏不能获得游学币");
            }
            return;
        }
        if (type != GameConstants.FatigueChangeType.GAME_CONSUME) {
            throw new BusinessException(ErrorCode.PARAM_ERROR_OBJ, "扣减游学币仅允许游戏消耗等合法场景");
        }
    }

    /**
     * 检查并重置每日游学币
     * @param user 用户对象
     */
    private void checkAndResetDailyFatigue(BaseUser user) {
        if (user.getFatigueUpdateTime() == null) {
            // 如果没有更新时间，初始化
            user.setFatigueUpdateTime(System.currentTimeMillis());
            user.setFatiguePoints(initialFatiguePoints);
            user.setDailyAnswerPoints(0);
            return;
        }

        // 检查是否是新的一天
        Calendar cal = Calendar.getInstance();
        cal.setTimeInMillis(System.currentTimeMillis());
        int todayDay = cal.get(Calendar.DAY_OF_YEAR);
        int todayYear = cal.get(Calendar.YEAR);

        cal.setTimeInMillis(user.getFatigueUpdateTime());
        int updateDay = cal.get(Calendar.DAY_OF_YEAR);
        int updateYear = cal.get(Calendar.YEAR);

        // 如果不是同一天，重置游学币
        if (todayDay != updateDay || todayYear != updateYear) {
            log.info("检测到新的一天，重置用户游学币. UserId: {}, LastUpdateTime: {}",
                    user.getUserId(), user.getFatigueUpdateTime());

            LambdaUpdateWrapper<BaseUser> updateWrapper = new LambdaUpdateWrapper<>();
            updateWrapper.eq(BaseUser::getUserId, user.getUserId());
            updateWrapper.set(BaseUser::getFatiguePoints, initialFatiguePoints);
            updateWrapper.set(BaseUser::getDailyAnswerPoints, 0);
            updateWrapper.set(BaseUser::getFatigueUpdateTime, System.currentTimeMillis());
            baseUserMapper.update(null, updateWrapper);

            // 更新当前对象
            user.setFatiguePoints(initialFatiguePoints);
            user.setDailyAnswerPoints(0);
            user.setFatigueUpdateTime(System.currentTimeMillis());

            // 记录重置日志
            FatiguePointsLog resetLog = new FatiguePointsLog();
            resetLog.setUserId(user.getUserId());
            resetLog.setChangeType(3); // 3-每日重置
            resetLog.setChangePoints(initialFatiguePoints);
            resetLog.setCurrentPoints(initialFatiguePoints);
            resetLog.setRelatedId(null);
            resetLog.setRelatedType("DAILY_RESET");
            resetLog.setRemark("每日自动重置游学币");
            resetLog.setCreateTime(System.currentTimeMillis());
            fatiguePointsLogMapper.insert(resetLog);
        }
    }
}
