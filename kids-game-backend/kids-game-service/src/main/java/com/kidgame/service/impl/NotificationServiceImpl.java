package com.kidgame.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.kidgame.common.constant.ErrorCode;
import com.kidgame.common.exception.BusinessException;
import com.kidgame.dao.entity.Notification;
import com.kidgame.dao.entity.UserRelation;
import com.kidgame.dao.mapper.NotificationMapper;
import com.kidgame.dao.mapper.UserRelationMapper;
import com.kidgame.service.NotificationService;
import com.kidgame.service.UserRelationService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * 通知业务服务实现
 */
@Slf4j
@Service
public class NotificationServiceImpl extends ServiceImpl<NotificationMapper, Notification>
        implements NotificationService {

    @Autowired
    private UserRelationMapper userRelationMapper;

    @Autowired
    private UserRelationService userRelationService;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Notification createBindRequest(
            Long userId,
            Integer userType,
            Long senderId,
            Integer senderType,
            String title,
            String content,
            Long relatedId,
            String extraData
    ) {
        // 创建通知
        Notification notification = new Notification();
        notification.setUserId(userId);
        notification.setUserType(userType);
        notification.setType(Notification.Type.BIND_REQUEST.getCode());
        notification.setTitle(title);
        notification.setContent(content);
        notification.setStatus(Notification.Status.PENDING.getCode());
        notification.setIsRead(0);
        notification.setRelatedId(relatedId);
        notification.setSenderId(senderId);
        notification.setSenderType(senderType);
        notification.setExtraData(extraData);

        long currentTime = System.currentTimeMillis();
        notification.setCreateTime(currentTime);
        notification.setUpdateTime(currentTime);
        // 设置7天过期时间
        notification.setExpireTime(currentTime + 7 * 24 * 60 * 60 * 1000L);

        save(notification);
        log.info("创建绑定请求通知. NotificationId: {}, UserId: {}, Type: {}",
                notification.getNotificationId(), userId, title);
        return notification;
    }

    @Override
    public List<Notification> getUserNotifications(Long userId, Integer userType) {
        LambdaQueryWrapper<Notification> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Notification::getUserId, userId);
        wrapper.eq(Notification::getUserType, userType);
        wrapper.orderByDesc(Notification::getCreateTime);
        return list(wrapper);
    }

    @Override
    public int getUnreadCount(Long userId, Integer userType) {
        return baseMapper.countUnreadByUserId(userId, userType);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void markAsRead(Long notificationId) {
        Notification notification = getById(notificationId);
        if (notification == null) {
            throw new BusinessException("通知不存在");
        }
        notification.setIsRead(1);
        notification.setUpdateTime(System.currentTimeMillis());
        updateById(notification);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void markAllAsRead(Long userId, Integer userType) {
        LambdaQueryWrapper<Notification> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Notification::getUserId, userId);
        wrapper.eq(Notification::getUserType, userType);
        wrapper.eq(Notification::getIsRead, 0);

        Notification update = new Notification();
        update.setIsRead(1);
        update.setUpdateTime(System.currentTimeMillis());
        update(update, wrapper);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public boolean handleBindRequest(Long notificationId, boolean accept) {
        Notification notification = getById(notificationId);
        if (notification == null) {
            throw new BusinessException("通知不存在");
        }

        // 检查通知状态
        if (notification.getStatus() != Notification.Status.PENDING.getCode()) {
            throw new BusinessException("该通知已处理");
        }

        // 检查是否过期
        if (System.currentTimeMillis() > notification.getExpireTime()) {
            notification.setStatus(Notification.Status.EXPIRED.getCode());
            updateById(notification);
            throw new BusinessException("该请求已过期");
        }

        Long relatedId = notification.getRelatedId();
        UserRelation relation = userRelationMapper.selectById(relatedId);
        if (relation == null) {
            throw new BusinessException("关联的关系记录不存在");
        }

        if (accept) {
            // 接受绑定请求
            relation.setStatus(1); // 已建立
            relation.setUpdateTime(System.currentTimeMillis());
            userRelationMapper.updateById(relation);

            // 更新通知状态
            notification.setStatus(Notification.Status.ACCEPTED.getCode());
            notification.setUpdateTime(System.currentTimeMillis());
            updateById(notification);

            log.info("接受绑定请求. NotificationId: {}, RelationId: {}", notificationId, relatedId);
        } else {
            // 拒绝绑定请求
            relation.setStatus(2); // 已取消
            relation.setUpdateTime(System.currentTimeMillis());
            userRelationMapper.updateById(relation);

            // 更新通知状态
            notification.setStatus(Notification.Status.REJECTED.getCode());
            notification.setUpdateTime(System.currentTimeMillis());
            updateById(notification);

            log.info("拒绝绑定请求. NotificationId: {}, RelationId: {}", notificationId, relatedId);
        }

        return true;
    }
}
