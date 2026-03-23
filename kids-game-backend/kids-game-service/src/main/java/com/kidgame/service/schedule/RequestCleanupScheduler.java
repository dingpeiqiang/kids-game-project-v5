package com.kidgame.service.schedule;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.kidgame.dao.entity.UserRequest;
import com.kidgame.dao.mapper.UserRequestMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * 申请记录清理定时任务
 * 替代原存储过程 sp_cleanup_expired_requests
 */
@Slf4j
@Component
public class RequestCleanupScheduler {

    @Autowired
    private UserRequestMapper userRequestMapper;

    /**
     * 每天凌晨 2 点清理过期申请
     * 清理策略：保留最近 7 天的过期申请
     */
    @Scheduled(cron = "0 0 2 * * ?")
    @Transactional(rollbackFor = Exception.class)
    public void cleanupExpiredRequests() {
        log.info("开始清理过期申请记录，时间：{}", LocalDateTime.now());

        try {
            // 计算过期时间（7 天前）
            LocalDateTime expireTime = LocalDateTime.now().minusDays(7);
            Long expireTimestamp = expireTime.atZone(java.time.ZoneId.systemDefault())
                    .toInstant().toEpochMilli();

            // 查询待删除的记录数
            LambdaQueryWrapper<UserRequest> countWrapper = new LambdaQueryWrapper<>();
            countWrapper.eq(UserRequest::getStatus, 0) // 待审批状态
                    .isNotNull(UserRequest::getExpireTime)
                    .lt(UserRequest::getExpireTime, System.currentTimeMillis())
                    .lt(UserRequest::getCreateTime, expireTimestamp);

            int countToDelete = userRequestMapper.selectCount(countWrapper).intValue();

            if (countToDelete > 0) {
                // 执行删除
                LambdaQueryWrapper<UserRequest> deleteWrapper = new LambdaQueryWrapper<>();
                deleteWrapper.eq(UserRequest::getStatus, 0)
                        .isNotNull(UserRequest::getExpireTime)
                        .lt(UserRequest::getExpireTime, System.currentTimeMillis())
                        .lt(UserRequest::getCreateTime, expireTimestamp);

                userRequestMapper.delete(deleteWrapper);

                log.info("清理过期申请完成，共删除 {} 条记录", countToDelete);
            } else {
                log.info("没有需要清理的过期申请");
            }

        } catch (Exception e) {
            log.error("清理过期申请失败", e);
            // 不抛出异常，避免影响其他定时任务
        }
    }

    /**
     * 手动触发清理（用于测试或紧急清理）
     * @param daysToKeep 保留天数（默认 7 天）
     * @return 删除的记录数
     */
    @Transactional(rollbackFor = Exception.class)
    public Integer manualCleanup(Integer daysToKeep) {
        if (daysToKeep == null || daysToKeep <= 0) {
            daysToKeep = 7;
        }

        log.info("手动清理过期申请，保留天数：{}", daysToKeep);

        LocalDateTime expireTime = LocalDateTime.now().minusDays(daysToKeep);
        Long expireTimestamp = expireTime.atZone(java.time.ZoneId.systemDefault())
                .toInstant().toEpochMilli();

        LambdaQueryWrapper<UserRequest> deleteWrapper = new LambdaQueryWrapper<>();
        deleteWrapper.eq(UserRequest::getStatus, 0)
                .isNotNull(UserRequest::getExpireTime)
                .lt(UserRequest::getExpireTime, System.currentTimeMillis())
                .lt(UserRequest::getCreateTime, expireTimestamp);

        int deletedCount = userRequestMapper.delete(deleteWrapper);

        log.info("手动清理完成，删除 {} 条记录", deletedCount);
        return deletedCount;
    }
}
