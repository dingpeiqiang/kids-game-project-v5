package com.kidgame.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.kidgame.dao.entity.Notification;

import java.util.List;

/**
 * 通知业务服务接口
 */
public interface NotificationService extends IService<Notification> {

    /**
     * 创建绑定请求通知
     * @param userId 接收者用户ID
     * @param userType 用户类型（0-儿童, 1-家长）
     * @param senderId 发送者ID
     * @param senderType 发送者类型（0-儿童, 1-家长）
     * @param title 标题
     * @param content 内容
     * @param relatedId 关联ID（如关系ID）
     * @param extraData 扩展数据
     * @return 创建的通知
     */
    Notification createBindRequest(
        Long userId,
        Integer userType,
        Long senderId,
        Integer senderType,
        String title,
        String content,
        Long relatedId,
        String extraData
    );

    /**
     * 获取用户通知列表
     * @param userId 用户ID
     * @param userType 用户类型（0-儿童, 1-家长）
     * @return 通知列表
     */
    List<Notification> getUserNotifications(Long userId, Integer userType);

    /**
     * 获取用户未读通知数量
     * @param userId 用户ID
     * @param userType 用户类型（0-儿童, 1-家长）
     * @return 未读数量
     */
    int getUnreadCount(Long userId, Integer userType);

    /**
     * 标记通知为已读
     * @param notificationId 通知ID
     */
    void markAsRead(Long notificationId);

    /**
     * 批量标记通知为已读
     * @param userId 用户ID
     * @param userType 用户类型
     */
    void markAllAsRead(Long userId, Integer userType);

    /**
     * 处理绑定请求（接受或拒绝）
     * @param notificationId 通知ID
     * @param accept 是否接受
     * @return 处理结果
     */
    boolean handleBindRequest(Long notificationId, boolean accept);
}
