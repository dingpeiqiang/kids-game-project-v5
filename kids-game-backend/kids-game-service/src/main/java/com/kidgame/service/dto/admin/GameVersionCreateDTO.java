package com.kidgame.service.dto.admin;

import lombok.Data;

import java.io.Serializable;
import java.util.List;

/**
 * 游戏版本创建 DTO
 *
 * @author kids-game-platform
 * @since 2.0.0
 */
@Data
public class GameVersionCreateDTO implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 版本号
     */
    private String version;

    /**
     * 版本说明
     */
    private String versionDescription;

    /**
     * 变更日志
     */
    private String changeLog;

    /**
     * 资源 URL
     */
    private String resourceUrl;
}
