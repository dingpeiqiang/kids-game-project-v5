package com.kidgame.dao.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 草稿版本历史实体类
 */
@Data
@TableName("draft_version")
public class DraftVersion {

    /**
     * 版本ID
     */
    @TableId(value = "version_id", type = IdType.AUTO)
    private Long versionId;

    /**
     * 草稿ID
     */
    private Long draftId;

    /**
     * 版本号
     */
    private Integer version;

    /**
     * 快照内容JSON
     */
    private String contentJson;

    /**
     * 快照元数据JSON
     */
    private String metadataJson;

    /**
     * 变更说明
     */
    private String changeLog;

    /**
     * 创建时间
     */
    private LocalDateTime createdAt;

    /**
     * 创建人ID
     */
    private Long createdBy;
}
