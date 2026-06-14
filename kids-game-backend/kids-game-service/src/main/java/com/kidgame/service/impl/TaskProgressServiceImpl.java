package com.kidgame.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.kidgame.dao.entity.TaskDefinition;
import com.kidgame.dao.entity.UserTaskProgress;
import com.kidgame.dao.mapper.TaskDefinitionMapper;
import com.kidgame.dao.mapper.UserTaskProgressMapper;
import com.kidgame.service.EconomyWalletService;
import com.kidgame.service.TaskProgressService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.annotation.PostConstruct;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class TaskProgressServiceImpl implements TaskProgressService {

    private final TaskDefinitionMapper taskDefinitionMapper;
    private final UserTaskProgressMapper userTaskProgressMapper;
    private final EconomyWalletService economyWalletService;

    @PostConstruct
    public void seedDefaultTasks() {
        long count = taskDefinitionMapper.selectCount(new LambdaQueryWrapper<TaskDefinition>()
                .eq(TaskDefinition::getEnabled, 1)
                .eq(TaskDefinition::getOwnerType, "SYSTEM"));
        if (count > 0) return;

        long now = System.currentTimeMillis();
        List<TaskDefinition> defaults = new ArrayList<>();

        TaskDefinition signIn = new TaskDefinition();
        signIn.setTaskCode("daily_sign_in");
        signIn.setTaskName("每日签到");
        signIn.setTaskDesc("完成今日签到");
        signIn.setTaskType("DAILY");
        signIn.setTargetValue(1);
        signIn.setMetric("SIGN_IN");
        signIn.setCoinsReward(20);
        signIn.setExpReward(5);
        signIn.setOwnerType("SYSTEM");
        signIn.setEnabled(1);
        signIn.setSortOrder(1);
        signIn.setCreateTime(now);
        signIn.setUpdateTime(now);
        defaults.add(signIn);

        TaskDefinition play3 = new TaskDefinition();
        play3.setTaskCode("daily_play_3");
        play3.setTaskName("每日玩3局");
        play3.setTaskDesc("今日完成3局游戏");
        play3.setTaskType("DAILY");
        play3.setTargetValue(3);
        play3.setMetric("PLAY_GAME");
        play3.setCoinsReward(40);
        play3.setExpReward(10);
        play3.setOwnerType("SYSTEM");
        play3.setEnabled(1);
        play3.setSortOrder(2);
        play3.setCreateTime(now);
        play3.setUpdateTime(now);
        defaults.add(play3);

        for (TaskDefinition t : defaults) {
            taskDefinitionMapper.insert(t);
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void onMetric(Long userId, String metric, int delta) {
        if (delta <= 0) return;
        String period = dailyPeriod();
        List<TaskDefinition> tasks = taskDefinitionMapper.selectList(
                new LambdaQueryWrapper<TaskDefinition>()
                        .eq(TaskDefinition::getEnabled, 1)
                        .eq(TaskDefinition::getMetric, metric)
                        .and(w -> w.isNull(TaskDefinition::getKidId).or().eq(TaskDefinition::getKidId, userId)));
        for (TaskDefinition task : tasks) {
            UserTaskProgress p = getOrCreate(userId, task.getTaskId(), period);
            if (p.getStatus() != null && p.getStatus() >= 2) continue;
            int next = Math.min(task.getTargetValue(), p.getProgress() + delta);
            p.setProgress(next);
            if (next >= task.getTargetValue()) {
                p.setStatus(1);
            }
            p.setUpdateTime(System.currentTimeMillis());
            userTaskProgressMapper.updateById(p);
        }
    }

    @Override
    public List<Map<String, Object>> listTasksForUser(Long userId) {
        String period = dailyPeriod();
        List<TaskDefinition> tasks = taskDefinitionMapper.selectList(
                new LambdaQueryWrapper<TaskDefinition>()
                        .eq(TaskDefinition::getEnabled, 1)
                        .and(w -> w.eq(TaskDefinition::getOwnerType, "SYSTEM")
                                .or().isNull(TaskDefinition::getKidId)
                                .or().eq(TaskDefinition::getKidId, userId))
                        .orderByAsc(TaskDefinition::getSortOrder));
        List<Map<String, Object>> out = new ArrayList<>();
        for (TaskDefinition t : tasks) {
            UserTaskProgress p = getOrCreate(userId, t.getTaskId(), period);
            Map<String, Object> row = new HashMap<>();
            row.put("taskId", t.getTaskId());
            row.put("taskCode", t.getTaskCode());
            row.put("taskName", t.getTaskName());
            row.put("taskDesc", t.getTaskDesc());
            row.put("targetValue", t.getTargetValue());
            row.put("progress", p.getProgress());
            row.put("coinsReward", t.getCoinsReward());
            row.put("expReward", t.getExpReward());
            row.put("status", p.getStatus());
            row.put("ownerType", t.getOwnerType());
            out.add(row);
        }
        return out;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Map<String, Object> claimTask(Long userId, Long taskId) {
        Map<String, Object> res = new HashMap<>();
        TaskDefinition task = taskDefinitionMapper.selectById(taskId);
        if (task == null) {
            res.put("success", false);
            res.put("message", "任务不存在");
            return res;
        }
        if (task.getEnabled() == null || task.getEnabled() != 1) {
            res.put("success", false);
            res.put("message", "任务已禁用");
            return res;
        }
        UserTaskProgress p = getOrCreate(userId, taskId, dailyPeriod());
        if (p.getStatus() == null || p.getStatus() < 1) {
            res.put("success", false);
            res.put("message", "任务未完成");
            return res;
        }
        if (p.getStatus() >= 2) {
            res.put("success", false);
            res.put("message", "已领取");
            return res;
        }
        if (task.getCoinsReward() != null && task.getCoinsReward() > 0) {
            economyWalletService.addCoins(userId, task.getCoinsReward(), "任务奖励:" + task.getTaskCode());
        }
        if (task.getExpReward() != null && task.getExpReward() > 0) {
            economyWalletService.addExp(userId, task.getExpReward());
        }
        p.setStatus(2);
        p.setClaimedTime(System.currentTimeMillis());
        p.setUpdateTime(System.currentTimeMillis());
        userTaskProgressMapper.updateById(p);
        res.put("success", true);
        res.put("coinsReward", task.getCoinsReward());
        res.put("expReward", task.getExpReward());
        res.put("wallet", economyWalletService.getWallet(userId));
        return res;
    }

    private UserTaskProgress getOrCreate(Long userId, Long taskId, String period) {
        UserTaskProgress p = userTaskProgressMapper.selectOne(
                new LambdaQueryWrapper<UserTaskProgress>()
                        .eq(UserTaskProgress::getUserId, userId)
                        .eq(UserTaskProgress::getTaskId, taskId)
                        .eq(UserTaskProgress::getPeriodKey, period));
        if (p != null) return p;
        p = new UserTaskProgress();
        p.setUserId(userId);
        p.setTaskId(taskId);
        p.setProgress(0);
        p.setStatus(0);
        p.setPeriodKey(period);
        p.setUpdateTime(System.currentTimeMillis());
        userTaskProgressMapper.insert(p);
        return p;
    }

    private static String dailyPeriod() {
        return LocalDate.now().format(DateTimeFormatter.ISO_LOCAL_DATE);
    }
}