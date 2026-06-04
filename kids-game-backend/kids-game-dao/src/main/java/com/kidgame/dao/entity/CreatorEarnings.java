package com.kidgame.dao.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 创作者收益实体
 */
@Data
@TableName("creator_earnings")
public class CreatorEarnings implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 收益记录 ID
     */
    @TableId(value = "earnings_id", type = IdType.AUTO)
    private Long earningsId;

    /**
     * 创作者 ID
     */
    @TableField("creator_id")
    private Long creatorId;

    /**
     * 主题 ID
     */
    @TableField("theme_id")
    private Long themeId;

    /**
     * 金额
     */
    @TableField("amount")
    private Integer amount;

    /**
     * 状态：pending/withdrawn
     */
    @TableField("status")
    private String status;

    /**
     * 创建时间
     */
    @TableField("created_at")
    private LocalDateTime createdAt;

    /**
     * 提现时间
     */
    @TableField("withdrawn_at")
    private LocalDateTime withdrawnAt;
}
