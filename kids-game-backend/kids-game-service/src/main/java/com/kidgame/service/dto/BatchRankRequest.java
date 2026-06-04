package com.kidgame.service.dto;

import lombok.Data;
import java.util.List;

/**
 * 批量排名查询请求DTO
 */
@Data
public class BatchRankRequest {
    private Long userId;
    private List<Long> gameIds;
}
