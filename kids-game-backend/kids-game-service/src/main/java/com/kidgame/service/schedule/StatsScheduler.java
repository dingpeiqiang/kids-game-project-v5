package com.kidgame.service.schedule;

import com.kidgame.service.StatsService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

/**
 * 统计数据定时任务
 */
@Slf4j
@Component
public class StatsScheduler {

    @Autowired
    private StatsService statsService;

    /**
     * 每天凌晨 00:05 汇总昨日的统计数据
     */
    @Scheduled(cron = "0 5 0 * * ?")
    public void summarizeYesterday() {
        log.info("开始汇总昨日统计数据, 时间: {}", LocalDateTime.now());

        try {
            statsService.summarizeYesterdayStats();
            log.info("昨日统计数据汇总完成");
        } catch (Exception e) {
            log.error("汇总昨日统计数据失败", e);
        }
    }

    /**
     * 每小时刷新今日统计数据
     */
    @Scheduled(cron = "0 0 * * * ?")
    public void refreshTodayStats() {
        log.debug("刷新今日统计数据, 时间: {}", LocalDateTime.now());

        try {
            // 获取今日统计数据会自动初始化或更新数据
            statsService.getTodayStats();
        } catch (Exception e) {
            log.error("刷新今日统计数据失败", e);
        }
    }
}
