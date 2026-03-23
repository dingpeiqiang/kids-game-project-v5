package com.kidgame.common.enums;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * 游戏状态枚举
 * 
 * @author kids-game-platform
 * @since 2.0.0
 */
@Getter
@AllArgsConstructor
public enum GameStatusEnum {
    
    /**
     * 草稿状态
     */
    DRAFT(0, "草稿", "draft"),
    
    /**
     * 待审核状态
     */
    PENDING_REVIEW(1, "待审核", "pending_review"),
    
    /**
     * 已上架状态
     */
    ON_SALE(2, "已上架", "on_sale"),
    
    /**
     * 已下架状态
     */
    OFFLINE(3, "已下架", "offline"),
    
    /**
     * 审核驳回状态
     */
    REJECTED(4, "审核驳回", "rejected");
    
    /**
     * 状态码
     */
    private final Integer code;
    
    /**
     * 状态描述
     */
    private final String description;
    
    /**
     * 状态英文标识
     */
    private final String label;
    
    /**
     * 根据状态码获取枚举
     *
     * @param code 状态码
     * @return 游戏状态枚举
     */
    public static GameStatusEnum valueOfCode(Integer code) {
        if (code == null) {
            return null;
        }
        for (GameStatusEnum status : values()) {
            if (status.getCode().equals(code)) {
                return status;
            }
        }
        throw new IllegalArgumentException("Invalid game status code: " + code);
    }
    
    /**
     * 根据状态标识获取枚举
     *
     * @param label 状态标识
     * @return 游戏状态枚举
     */
    public static GameStatusEnum valueOfLabel(String label) {
        if (label == null) {
            return null;
        }
        for (GameStatusEnum status : values()) {
            if (status.getLabel().equalsIgnoreCase(label)) {
                return status;
            }
        }
        throw new IllegalArgumentException("Invalid game status label: " + label);
    }
    
    /**
     * 判断是否可以进行状态流转
     *
     * @param targetStatus 目标状态
     * @return true-允许流转，false-禁止流转
     */
    public boolean canTransitionTo(GameStatusEnum targetStatus) {
        if (targetStatus == null) {
            return false;
        }
        
        // 草稿可以流转到待审核
        if (this == DRAFT && targetStatus == PENDING_REVIEW) {
            return true;
        }
        
        // 待审核可以流转到已上架（审核通过）或审核驳回
        if (this == PENDING_REVIEW) {
            return targetStatus == ON_SALE || targetStatus == REJECTED;
        }
        
        // 审核驳回可以重新流转到待审核
        if (this == REJECTED && targetStatus == PENDING_REVIEW) {
            return true;
        }
        
        // 已上架可以流转到已下架
        if (this == ON_SALE && targetStatus == OFFLINE) {
            return true;
        }
        
        // 已下架可以流转到已上架
        if (this == OFFLINE && targetStatus == ON_SALE) {
            return true;
        }
        
        return false;
    }
    
    /**
     * 判断是否为终态
     *
     * @return true-终态，false-非终态
     */
    public boolean isFinalState() {
        return this == ON_SALE || this == OFFLINE;
    }
    
    /**
     * 判断是否为中间状态
     *
     * @return true-中间状态，false-非中间状态
     */
    public boolean isIntermediateState() {
        return this == PENDING_REVIEW || this == REJECTED;
    }
}
