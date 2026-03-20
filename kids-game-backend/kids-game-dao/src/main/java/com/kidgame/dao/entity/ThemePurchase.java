package com.kidgame.dao.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 主题购买记录实体
 */
@Data
@TableName("theme_purchase")
public class ThemePurchase implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 购买记录 ID
     */
    @TableId(value = "purchase_id", type = IdType.AUTO)
    private Long purchaseId;

    /**
     * 主题 ID
     */
    @TableField("theme_id")
    private Long themeId;

    /**
     * 购买者 ID
     */
    @TableField("buyer_id")
    private Long buyerId;

    /**
     * 支付价格
     */
    @TableField("price_paid")
    private Integer pricePaid;

    /**
     * 购买时间
     */
    @TableField("purchase_time")
    private LocalDateTime purchaseTime;

    /**
     * 是否已退款：0-否，1-是
     */
    @TableField("is_refunded")
    private Integer isRefunded;
}
