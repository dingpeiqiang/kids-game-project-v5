package com.kidgame.common.util;

import com.kidgame.common.enums.GameStatusEnum;

/**
 * 游戏状态辅助工具类
 * 
 * @author kids-game-platform
 * @since 2.0.0
 */
public class GameStatusUtil {

    /**
     * 判断游戏是否已上架（可玩）
     * 
     * @param status 游戏状态码
     * @return true-已上架，false-未上架
     */
    public static boolean isOnSale(Integer status) {
        return status != null && GameStatusEnum.ON_SALE.getCode().equals(status);
    }

    /**
     * 判断游戏是否为草稿状态
     * 
     * @param status 游戏状态码
     * @return true-草稿，false-非草稿
     */
    public static boolean isDraft(Integer status) {
        return status != null && GameStatusEnum.DRAFT.getCode().equals(status);
    }

    /**
     * 判断游戏是否待审核
     * 
     * @param status 游戏状态码
     * @return true-待审核，false-非待审核
     */
    public static boolean isPendingReview(Integer status) {
        return status != null && GameStatusEnum.PENDING_REVIEW.getCode().equals(status);
    }

    /**
     * 判断游戏是否已下架
     * 
     * @param status 游戏状态码
     * @return true-已下架，false-非已下架
     */
    public static boolean isOffline(Integer status) {
        return status != null && GameStatusEnum.OFFLINE.getCode().equals(status);
    }

    /**
     * 判断游戏是否被驳回
     * 
     * @param status 游戏状态码
     * @return true-已驳回，false-非已驳回
     */
    public static boolean isRejected(Integer status) {
        return status != null && GameStatusEnum.REJECTED.getCode().equals(status);
    }

    /**
     * 判断游戏是否可启动（仅上架状态可玩）
     * 
     * @param status 游戏状态码
     * @return true-可启动，false-不可启动
     */
    public static boolean canPlay(Integer status) {
        return isOnSale(status);
    }

    /**
     * 判断游戏是否可以提交审核
     * 草稿或被驳回状态可以提交审核
     * 
     * @param status 游戏状态码
     * @return true-可提交审核，false-不可提交审核
     */
    public static boolean canSubmitReview(Integer status) {
        if (status == null) {
            return false;
        }
        return GameStatusEnum.DRAFT.getCode().equals(status) 
            || GameStatusEnum.REJECTED.getCode().equals(status);
    }

    /**
     * 判断游戏是否可以上架
     * 下架或草稿状态可以上架
     * 
     * @param status 游戏状态码
     * @return true-可上架，false-不可上架
     */
    public static boolean canPublish(Integer status) {
        if (status == null) {
            return false;
        }
        return GameStatusEnum.OFFLINE.getCode().equals(status)
            || GameStatusEnum.DRAFT.getCode().equals(status);
    }

    /**
     * 获取游戏状态的中文描述
     * 
     * @param status 游戏状态码
     * @return 状态描述，如果状态未知则返回"未知状态"
     */
    public static String getStatusDescription(Integer status) {
        GameStatusEnum statusEnum = GameStatusEnum.valueOfCode(status);
        return statusEnum != null ? statusEnum.getDescription() : "未知状态";
    }

    /**
     * 验证游戏状态是否允许进行某操作
     * 
     * @param currentStatus 当前状态
     * @param targetStatus 目标状态
     * @return true-允许转换，false-不允许转换
     */
    public static boolean canTransition(Integer currentStatus, Integer targetStatus) {
        if (currentStatus == null || targetStatus == null) {
            return false;
        }
        
        GameStatusEnum current = GameStatusEnum.valueOfCode(currentStatus);
        GameStatusEnum target = GameStatusEnum.valueOfCode(targetStatus);
        
        if (current == null || target == null) {
            return false;
        }
        
        return current.canTransitionTo(target);
    }
}
