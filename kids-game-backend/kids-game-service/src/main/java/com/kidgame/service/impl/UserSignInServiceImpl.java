package com.kidgame.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.kidgame.dao.entity.UserSignIn;
import com.kidgame.dao.mapper.UserSignInMapper;
import com.kidgame.service.UserSignInService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 用户签到服务实现类
 */
@Service
public class UserSignInServiceImpl implements UserSignInService {

    private static final Logger log = LoggerFactory.getLogger(UserSignInServiceImpl.class);

    @Autowired
    private UserSignInMapper userSignInMapper;

    /**
     * 用户签到
     * @param userId 用户ID
     * @return 签到结果，包含奖励信息
     */
    @Override
    @Transactional
    public Map<String, Object> signIn(Long userId) {
        Map<String, Object> result = new HashMap<>();
        
        // 获取今天的日期
        String today = LocalDate.now().format(DateTimeFormatter.ISO_LOCAL_DATE);
        
        // 检查今天是否已经签到
        UserSignIn existingSignIn = userSignInMapper.getByUserIdAndDate(userId, today);
        if (existingSignIn != null) {
            result.put("success", false);
            result.put("message", "今日已签到");
            result.put("alreadySignedIn", true);
            return result;
        }
        
        // 计算连续签到天数
        int consecutiveDays = calculateConsecutiveDays(userId);
        
        // 计算奖励
        int baseCoins = 50;
        int bonus = Math.min(consecutiveDays - 1, 6) * 10; // 最多奖励7天
        int coinsReward = baseCoins + bonus;
        int expReward = consecutiveDays >= 3 ? 20 : 0; // 连续3天及以上额外给经验
        
        // 创建签到记录
        UserSignIn signIn = new UserSignIn();
        signIn.setUserId(userId);
        signIn.setSignInDate(today);
        signIn.setConsecutiveDays(consecutiveDays);
        signIn.setCoinsReward(coinsReward);
        signIn.setExpReward(expReward);
        signIn.setCreateTime(System.currentTimeMillis());
        signIn.setUpdateTime(System.currentTimeMillis());
        
        userSignInMapper.insert(signIn);
        
        // 返回结果
        result.put("success", true);
        result.put("message", "签到成功！获得 " + coinsReward + " 金币" + (expReward > 0 ? " 和 " + expReward + " 经验值" : ""));
        result.put("coinsReward", coinsReward);
        result.put("expReward", expReward);
        result.put("consecutiveDays", consecutiveDays);
        
        log.info("用户 {} 签到成功，连续签到 {} 天，获得 {} 金币，{} 经验值", 
                userId, consecutiveDays, coinsReward, expReward);
        
        return result;
    }

    /**
     * 获取用户签到信息
     * @param userId 用户ID
     * @return 签到信息，包括连续签到天数等
     */
    @Override
    public Map<String, Object> getSignInInfo(Long userId) {
        Map<String, Object> result = new HashMap<>();
        
        // 计算连续签到天数
        int consecutiveDays = calculateConsecutiveDays(userId);
        
        // 检查今天是否已签到
        boolean hasSignedInToday = hasSignedInToday(userId);
        
        result.put("consecutiveDays", consecutiveDays);
        result.put("hasSignedInToday", hasSignedInToday);
        
        // 获取最近7天的签到记录
        List<UserSignIn> recentSignIns = getRecentSignIns(userId, 7);
        result.put("recentSignIns", recentSignIns);
        
        return result;
    }

    /**
     * 获取用户最近的签到记录
     * @param userId 用户ID
     * @param limit 限制数量
     * @return 签到记录列表
     */
    @Override
    public List<UserSignIn> getRecentSignIns(Long userId, int limit) {
        return userSignInMapper.getRecentSignIns(userId, limit);
    }

    /**
     * 检查用户今天是否已签到
     * @param userId 用户ID
     * @return 是否已签到
     */
    @Override
    public boolean hasSignedInToday(Long userId) {
        String today = LocalDate.now().format(DateTimeFormatter.ISO_LOCAL_DATE);
        UserSignIn signIn = userSignInMapper.getByUserIdAndDate(userId, today);
        return signIn != null;
    }

    /**
     * 计算连续签到天数
     * @param userId 用户ID
     * @return 连续签到天数
     */
    private int calculateConsecutiveDays(Long userId) {
        // 获取昨天的日期
        String yesterday = LocalDate.now().minusDays(1).format(DateTimeFormatter.ISO_LOCAL_DATE);
        
        // 查询昨天的签到记录
        UserSignIn yesterdaySignIn = userSignInMapper.getByUserIdAndDate(userId, yesterday);
        
        if (yesterdaySignIn != null) {
            // 如果昨天签到了，连续天数+1
            return yesterdaySignIn.getConsecutiveDays() + 1;
        } else {
            // 如果昨天没签到，重新开始计数
            return 1;
        }
    }
}