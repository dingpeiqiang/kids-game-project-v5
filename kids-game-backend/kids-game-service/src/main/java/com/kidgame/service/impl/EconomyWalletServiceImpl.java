package com.kidgame.service.impl;

import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.kidgame.dao.entity.BaseUser;
import com.kidgame.dao.entity.UserLevel;
import com.kidgame.dao.entity.TitleDefinition;
import com.kidgame.dao.entity.UserTitle;
import com.kidgame.dao.mapper.BaseUserMapper;
import com.kidgame.dao.mapper.TitleDefinitionMapper;
import com.kidgame.dao.mapper.UserLevelMapper;
import com.kidgame.dao.mapper.UserTitleMapper;
import com.kidgame.service.EconomyWalletService;
import com.kidgame.service.UserLevelService;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class EconomyWalletServiceImpl implements EconomyWalletService {

    private final BaseUserMapper baseUserMapper;
    private final UserLevelMapper userLevelMapper;
    private final UserLevelService userLevelService;
    private final TitleDefinitionMapper titleDefinitionMapper;
    private final UserTitleMapper userTitleMapper;

    @Override
    public Map<String, Integer> getWallet(Long userId) {
        BaseUser user = baseUserMapper.selectById(userId);
        Map<String, Integer> w = new HashMap<>();
        if (user == null) {
            w.put("coins", 0);
            w.put("studyCoins", 0);
            w.put("exp", 0);
            w.put("level", 1);
            return w;
        }
        int exp = user.getExp() != null ? user.getExp() : 0;
        w.put("coins", user.getCoins() != null ? user.getCoins() : 0);
        w.put("studyCoins", user.getFatiguePoints() != null ? user.getFatiguePoints() : 0);
        w.put("exp", exp);
        w.put("level", getLevelByExp(exp));
        return w;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void addCoins(Long userId, int amount, String remark) {
        if (amount <= 0) return;
        BaseUser user = baseUserMapper.selectById(userId);
        if (user == null) return;
        int cur = user.getCoins() != null ? user.getCoins() : 0;
        user.setCoins(cur + amount);
        user.setUpdateTime(System.currentTimeMillis());
        baseUserMapper.updateById(user);
        log.info("金币+{} userId={} remark={}", amount, userId, remark);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void addExp(Long userId, int amount) {
        if (amount <= 0) return;
        BaseUser user = baseUserMapper.selectById(userId);
        if (user == null) return;
        int cur = user.getExp() != null ? user.getExp() : 0;
        int total = cur + amount;
        user.setExp(total);
        user.setUpdateTime(System.currentTimeMillis());
        baseUserMapper.updateById(user);
        syncUserLevelRow(userId, total);
        checkTitles(userId, total);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public boolean spendCoins(Long userId, int amount, String remark) {
        if (amount <= 0) return true;
        BaseUser user = baseUserMapper.selectById(userId);
        if (user == null) return false;
        int cur = user.getCoins() != null ? user.getCoins() : 0;
        if (cur < amount) return false;
        user.setCoins(cur - amount);
        user.setUpdateTime(System.currentTimeMillis());
        baseUserMapper.updateById(user);
        log.info("金币-{} userId={} remark={}", amount, userId, remark);
        return true;
    }

    @Override
    public int getLevelByExp(int totalExp) {
        return userLevelService.calculateLevel(Math.max(0, totalExp));
    }

    private void syncUserLevelRow(Long userId, int totalExp) {
        UserLevel level = userLevelMapper.selectOne(
                new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<UserLevel>()
                        .eq(UserLevel::getUserId, userId));
        int lv = getLevelByExp(totalExp);
        long now = System.currentTimeMillis();
        if (level == null) {
            level = new UserLevel();
            level.setUserId(userId);
            level.setCurrentLevel(lv);
            level.setTotalExp(totalExp);
            level.setCurrentExp(totalExp);
            level.setNextLevelExp(userLevelService.getNextLevelExp(lv));
            level.setLevelTitle(userLevelService.getLevelTitle(lv));
            level.setCreateTime(now);
            level.setUpdateTime(now);
            userLevelMapper.insert(level);
        } else {
            level.setCurrentLevel(lv);
            level.setTotalExp(totalExp);
            level.setNextLevelExp(userLevelService.getNextLevelExp(lv));
            level.setLevelTitle(userLevelService.getLevelTitle(lv));
            level.setUpdateTime(now);
            userLevelMapper.updateById(level);
        }
    }

    private void checkTitles(Long userId, int totalExp) {
        int level = getLevelByExp(totalExp);
        List<TitleDefinition> defs = titleDefinitionMapper.selectList(
                new LambdaQueryWrapper<TitleDefinition>().eq(TitleDefinition::getEnabled, 1));
        long now = System.currentTimeMillis();
        for (TitleDefinition def : defs) {
            boolean ok = false;
            if ("LEVEL".equalsIgnoreCase(def.getRequirementType())) {
                ok = level >= def.getRequirementValue();
            } else if ("EXP".equalsIgnoreCase(def.getRequirementType())) {
                ok = totalExp >= def.getRequirementValue();
            }
            if (!ok) continue;
            Long cnt = userTitleMapper.selectCount(
                    new LambdaQueryWrapper<UserTitle>()
                            .eq(UserTitle::getUserId, userId)
                            .eq(UserTitle::getTitleId, def.getTitleId()));
            if (cnt != null && cnt > 0) continue;
            UserTitle ut = new UserTitle();
            ut.setUserId(userId);
            ut.setTitleId(def.getTitleId());
            ut.setObtainedTime(now);
            userTitleMapper.insert(ut);
        }
    }
}