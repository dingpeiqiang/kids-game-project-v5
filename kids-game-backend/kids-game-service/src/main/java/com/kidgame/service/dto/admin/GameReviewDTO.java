package com.kidgame.service.dto.admin;

import lombok.Data;

import java.io.Serializable;
import java.util.List;

/**
 * 游戏审核 DTO
 *
 * @author kids-game-platform
 * @since 2.0.0
 */
@Data
public class GameReviewDTO implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 审核状态：1-通过，2-驳回
     */
    private Integer reviewStatus;

    /**
     * 审核意见
     */
    private String reviewComment;

    /**
     * 驳回原因
     */
    private String rejectReason;
}
