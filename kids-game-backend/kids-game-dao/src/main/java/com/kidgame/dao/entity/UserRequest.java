package com.kidgame.dao.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.io.Serializable;

/**
 * 用户申请记录实体
 * 记录儿童的申请和家长/管理员的审批
 * 
 * @author kids-game-platform
 * @since 1.0.0
 */
@Data
@TableName("t_user_request")
public class UserRequest implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 申请 ID
     */
    @TableId(value = "request_id", type = IdType.AUTO)
    private Long requestId;

    /**
     * 申请人用户 ID
     */
    private Long requesterId;

    /**
     * 申请人类型：0-儿童，1-家长
     */
    private Integer requesterType;

    /**
     * 审批人用户 ID（家长或管理员）
     */
    private Long approverId;

    /**
     * 审批人类型：0-儿童，1-家长，2-管理员
     */
    private Integer approverType;

    /**
     * 申请类型：EXTEND_TIME-延长时长，UNLOCK_GAME-解锁游戏，PURCHASE_THEME-购买主题
     */
    private String requestType;

    /**
     * 申请参数（JSON 格式）
     */
    private String requestParams;

    /**
     * 状态：0-待审批，1-已通过，2-已拒绝，3-已取消
     */
    private Integer status;

    /**
     * 申请理由
     */
    private String reason;

    /**
     * 审批意见
     */
    private String approvalOpinion;

    /**
     * 审批时间（毫秒时间戳）
     */
    private Long approvalTime;

    /**
     * 过期时间（毫秒时间戳）
     */
    private Long expireTime;

    /**
     * 创建时间（毫秒时间戳）
     */
    private Long createTime;

    /**
     * 更新时间（毫秒时间戳）
     */
    private Long updateTime;
}
