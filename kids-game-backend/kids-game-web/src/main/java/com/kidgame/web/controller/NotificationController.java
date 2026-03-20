package com.kidgame.web.controller;

import com.kidgame.common.model.Result;
import com.kidgame.dao.entity.Notification;
import com.kidgame.service.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 通知控制器
 * 处理通知消息相关接口
 */
@Tag(name = "通知管理", description = "通知消息相关接口")
@RestController
@RequestMapping("/api/notification")
public class NotificationController {

    @Autowired
    private NotificationService notificationService;

    @Operation(summary = "获取用户通知列表")
    @GetMapping("/list")
    public Result<List<Notification>> getUserNotifications(
            @Parameter(description = "用户ID") @RequestParam Long userId,
            @Parameter(description = "用户类型：0-儿童, 1-家长") @RequestParam Integer userType) {
        List<Notification> notifications = notificationService.getUserNotifications(userId, userType);
        return Result.success(notifications);
    }

    @Operation(summary = "获取未读通知数量")
    @GetMapping("/unread-count")
    public Result<Integer> getUnreadCount(
            @Parameter(description = "用户ID") @RequestParam Long userId,
            @Parameter(description = "用户类型：0-儿童, 1-家长") @RequestParam Integer userType) {
        int count = notificationService.getUnreadCount(userId, userType);
        return Result.success(count);
    }

    @Operation(summary = "标记通知为已读")
    @PutMapping("/read")
    public Result<Void> markAsRead(
            @Parameter(description = "通知ID") @RequestParam Long notificationId) {
        notificationService.markAsRead(notificationId);
        return Result.success();
    }

    @Operation(summary = "标记所有通知为已读")
    @PutMapping("/read-all")
    public Result<Void> markAllAsRead(
            @Parameter(description = "用户ID") @RequestParam Long userId,
            @Parameter(description = "用户类型：0-儿童, 1-家长") @RequestParam Integer userType) {
        notificationService.markAllAsRead(userId, userType);
        return Result.success();
    }

    @Operation(summary = "处理绑定请求（接受或拒绝）")
    @PostMapping("/handle-bind-request")
    public Result<Void> handleBindRequest(
            @Parameter(description = "通知ID") @RequestParam Long notificationId,
            @Parameter(description = "是否接受") @RequestParam Boolean accept) {
        notificationService.handleBindRequest(notificationId, accept);
        return Result.success();
    }
}
