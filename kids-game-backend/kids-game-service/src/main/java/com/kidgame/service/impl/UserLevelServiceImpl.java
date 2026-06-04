package com.kidgame.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.kidgame.dao.entity.UserLevel;
import com.kidgame.dao.mapper.UserLevelMapper;
import com.kidgame.service.UserLevelService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 用户等级服务实现
 */
@Service
public class UserLevelServiceImpl implements UserLevelService {

    private static final Logger log = LoggerFactory.getLogger(UserLevelServiceImpl.class);

    @Autowired
    private UserLevelMapper userLevelMapper;

    @Override
    public UserLevel getUserLevelByUserId(Long userId) {
        LambdaQueryWrapper<UserLevel> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(UserLevel::getUserId, userId);
        return userLevelMapper.selectOne(wrapper);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public UserLevel updateLevel(Long userId, int expGained) {
        // 获取当前等级
        UserLevel level = getUserLevelByUserId(userId);
        if (level == null) {
            log.warn("用户等级不存在：userId={}", userId);
            throw new RuntimeException("用户等级不存在");
        }

        // 增加经验值
        level.setCurrentExp(level.getCurrentExp() + expGained);
        level.setTotalExp(level.getTotalExp() + expGained);

        // 重新计算等级
        int newLevel = calculateLevel(level.getTotalExp());
        
        // 检查是否升级
        boolean leveledUp = newLevel > level.getCurrentLevel();
        if (leveledUp) {
            log.info("用户升级！userId={}, oldLevel={}, newLevel={}", 
                userId, level.getCurrentLevel(), newLevel);
        }

        level.setCurrentLevel(newLevel);
        level.setNextLevelExp(getNextLevelExp(newLevel));
        level.setUpdateTime(System.currentTimeMillis());

        if (leveledUp) {
            level.setLastLevelUpTime(System.currentTimeMillis());
        }

        userLevelMapper.updateById(level);
        return level;
    }

    @Override
    public int calculateLevel(int totalExp) {
        if (totalExp <= 0) {
            return 1;
        }

        int level = 1;
        int requiredExp = 100;  // 第 1 级到第 2 级需要 100 经验
        int accumulatedExp = 0;

        while (accumulatedExp + requiredExp <= totalExp) {
            level++;
            accumulatedExp += requiredExp;
            requiredExp = (int) Math.floor(requiredExp * 1.5);
        }

        return level;
    }

    @Override
    public int getNextLevelExp(int currentLevel) {
        if (currentLevel <= 1) {
            return 100;
        }
        return (int) (100 * Math.pow(1.5, currentLevel - 1));
    }

    @Override
    public String getLevelTitle(int level) {
        if (level <= 5) {
            return "新手";
        } else if (level <= 10) {
            return "学徒";
        } else if (level <= 15) {
            return "高手";
        } else if (level <= 20) {
            return "专家";
        } else if (level <= 30) {
            return "大师";
        } else {
            return "宗师";
        }
    }
}
