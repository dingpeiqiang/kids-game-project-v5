package com.kidgame.service.schedule;

import com.kidgame.dao.entity.Kid;
import com.kidgame.dao.mapper.KidMapper;
import com.kidgame.service.KidService;
import com.kidgame.service.StatsService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 游学币定时任务
 */
@Slf4j
@Component
public class FatiguePointScheduler {

    @Autowired
    private KidMapper kidMapper;

    @Autowired
    private StatsService statsService;

    @Autowired
    private KidService kidService;

    @Value("${kidgame.fatigue.initial-points:10}")
    private Integer initialPoints;

    /**
     * 每日零点重置所有儿童的游学币
     * 执行时间：每天 00:00:01
     * 
     * 重置规则：只有当游学币低于初始值时才会重置到初始值
     * 如果游学币 >= 初始值，说明用户通过购买、答题、任务等方式获得了额外游学币，不予重置
     */
    @Scheduled(cron = "1 0 0 * * ?")
    public void resetDailyFatiguePoints() {
        log.info("开始每日游学币重置任务，时间：{}", LocalDateTime.now());

        try {
            List<Kid> allKids = kidMapper.selectList(null);
            int resetCount = 0;
            int skippedCount = 0;

            for (Kid kid : allKids) {
                try {
                    // 使用 kidService 重置游学币（会从 UserProfile 中读取和更新）
                    Integer pointsBeforeReset = kid.getFatiguePoints() != null ? kid.getFatiguePoints() : initialPoints;
                    Integer pointsAfterReset = kidService.resetDailyFatiguePoints(kid.getKidId());
                    
                    if (pointsAfterReset > pointsBeforeReset) {
                        resetCount++;
                        log.debug("重置儿童游学币：KidId={}, 重置前={}, 重置后={}", 
                                kid.getKidId(), pointsBeforeReset, pointsAfterReset);
                    } else {
                        skippedCount++;
                        log.debug("跳过儿童游学币重置（游学币充足）：KidId={}, 当前点数={}", 
                                kid.getKidId(), pointsAfterReset);
                    }
                } catch (Exception e) {
                    log.error("重置儿童游学币失败：KidId={}", kid.getKidId(), e);
                }
            }

            log.info("每日游学币重置完成，共重置 {} 个儿童，跳过 {} 个儿童（游学币充足）", resetCount, skippedCount);
        } catch (Exception e) {
            log.error("每日游学币重置失败", e);
        }
    }

    /**
     * 每分钟检查在线儿童的游学币
     * 执行时间：每分钟执行一次
     * 
     * ⚠️ 已禁用 - 此定时任务会产生大量无用的数据库查询
     * 游学币检查应在游戏启动时进行（见 GameSessionService.startGame）
     * 如需 WebSocket 推送通知，应改为事件驱动模式，而非轮询模式
     */
    // @Scheduled(fixedRate = 60000)  // 已禁用
    public void checkFatiguePoints() {
        // 方法已禁用，无需执行任何逻辑
        // 游学币检查应在游戏启动时进行（见 GameSessionService.startGame）
        // log.debug("开始检查儿童游学币，时间：{}", LocalDateTime.now());
    }
}
