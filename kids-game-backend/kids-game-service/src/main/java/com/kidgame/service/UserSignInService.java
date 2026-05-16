package com.kidgame.service;

import com.kidgame.dao.entity.UserSignIn;

import java.util.List;
import java.util.Map;

/**
 * 用户签到服务接口
 */
public interface UserSignInService {

    /**
     * 用户签到
     * @param userId 用户ID
     * @return 签到结果，包含奖励信息
     */
    Map<String, Object> signIn(Long userId);

    /**
     * 获取用户签到信息
     * @param userId 用户ID
     * @return 签到信息，包括连续签到天数等
     */
    Map<String, Object> getSignInInfo(Long userId);

    /**
     * 获取用户最近的签到记录
     * @param userId 用户ID
     * @param limit 限制数量
     * @return 签到记录列表
     */
    List<UserSignIn> getRecentSignIns(Long userId, int limit);

    /**
     * 检查用户今天是否已签到
     * @param userId 用户ID
     * @return 是否已签到
     */
    boolean hasSignedInToday(Long userId);
}