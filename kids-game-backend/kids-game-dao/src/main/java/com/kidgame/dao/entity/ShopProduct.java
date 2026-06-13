package com.kidgame.dao.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.io.Serializable;

@Data
@TableName("t_shop_product")
public class ShopProduct implements Serializable {
    @TableId(type = IdType.AUTO)
    private Long productId;
    private String productCode;
    private String productName;
    private String productType;
    private Integer priceCoins;
    private Integer grantStudyCoins;
    private Integer enabled;
    private Integer sortOrder;
    private Long updateTime;
}