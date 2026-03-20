package com.kidgame.dao.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

/**
 * 游戏模式配置实体
 */
@Data
@TableName("t_game_mode_config")
public class GameModeConfig {
    
    @TableId(type = IdType.AUTO)
   private Long id;
    
    /** 游戏 ID */
   private Long gameId;
    
    /** 模式类型 (single_player/local_battle/team/online_battle) */
   private String modeType;
    
    /** 模式名称 */
   private String modeName;
    
    /** 是否启用 */
   private Boolean enabled;
    
    /** 模式配置 (JSON 格式) */
   private String configJson;
    
    /** 排序权重 */
   private Integer sortOrder;
    
    /** 创建时间 */
   private Long createTime;
    
    /** 更新时间 */
   private Long updateTime;
    
    /** 逻辑删除 */
   private Integer deleted;
}
