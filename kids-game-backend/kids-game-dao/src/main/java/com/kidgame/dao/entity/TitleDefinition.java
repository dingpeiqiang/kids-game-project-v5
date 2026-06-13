package com.kidgame.dao.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.io.Serializable;

@Data
@TableName("t_title_definition")
public class TitleDefinition implements Serializable {
    @TableId(type = IdType.AUTO)
    private Long titleId;
    private String titleCode;
    private String titleName;
    private String requirementType;
    private Integer requirementValue;
    private Integer sortOrder;
    private Integer enabled;
}