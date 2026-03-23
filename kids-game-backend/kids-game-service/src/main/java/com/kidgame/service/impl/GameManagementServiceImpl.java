package com.kidgame.service.impl;

import com.kidgame.common.enums.GameStatusEnum;
import com.kidgame.dao.entity.Game;
import com.kidgame.dao.mapper.GameManagementMapper;
import com.kidgame.service.GameManagementService;
import com.kidgame.service.dto.admin.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.*;

/**
 * 游戏管理服务实现类（增强版）
 *
 * @author kids-game-platform
 * @since 2.0.0
 */
@Slf4j
@Service
public class GameManagementServiceImpl implements GameManagementService {

    @Autowired
    private GameManagementMapper gameManagementMapper;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public GameManagementCreateDTO createGame(GameManagementCreateDTO dto, Long operatorId) {
        log.info("开始创建游戏。GameCode: {}, OperatorId: {}", dto.getGameCode(), operatorId);

        // 1. 验证游戏编码是否已存在
        Game existingGame = gameManagementMapper.selectByGameCode(dto.getGameCode());
        if (existingGame != null) {
            throw new RuntimeException("游戏编码已存在：" + dto.getGameCode());
        }

        // 2. 构建游戏实体（只复制存在的字段）
        Game game = new Game();
        if (dto.getGameCode() != null) game.setGameCode(dto.getGameCode());
        if (dto.getGameName() != null) game.setGameName(dto.getGameName());
        if (dto.getCategory() != null) game.setCategory(dto.getCategory());
        if (dto.getGrade() != null) game.setGrade(dto.getGrade());
        if (dto.getIconUrl() != null) game.setIconUrl(dto.getIconUrl());
        if (dto.getModulePath() != null) game.setModulePath(dto.getModulePath());
        if (dto.getSortOrder() != null) game.setSortOrder(dto.getSortOrder());
        if (dto.getIsFeatured() != null) game.setIsFeatured(dto.getIsFeatured());
        if (dto.getConsumePointsPerMinute() != null) game.setConsumePointsPerMinute(dto.getConsumePointsPerMinute());
        if (dto.getMinFatigueToStart() != null) game.setMinFatigueToStart(dto.getMinFatigueToStart());
        
        game.setStatus(GameStatusEnum.DRAFT.getCode()); // 默认为草稿状态
        game.setCreatorId(operatorId);
        game.setCreateTime(System.currentTimeMillis());
        game.setUpdateTime(System.currentTimeMillis());
        game.setDeleted(0);

        // 3. 插入数据库
        gameManagementMapper.insert(game);
        log.info("游戏创建成功。GameId: {}, GameCode: {}", game.getGameId(), game.getGameCode());

        // 4. 返回结果（简化版，后续完善）
        return dto;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void updateGame(Long gameId, GameManagementUpdateDTO dto, Long operatorId) {
        log.info("开始更新游戏。GameId: {}, OperatorId: {}", gameId, operatorId);

        // 1. 查询游戏是否存在
        Game game = gameManagementMapper.selectById(gameId);
        if (game == null) {
            throw new RuntimeException("游戏不存在：" + gameId);
        }

        // 2. 更新游戏信息（手动设置字段）
        if (dto.getGameName() != null) {
            game.setGameName(dto.getGameName());
        }
        if (dto.getCategory() != null) {
            game.setCategory(dto.getCategory());
        }
        if (dto.getGrade() != null) {
            game.setGrade(dto.getGrade());
        }
        if (dto.getIconUrl() != null) {
            game.setIconUrl(dto.getIconUrl());
        }
        if (dto.getModulePath() != null) {
            game.setModulePath(dto.getModulePath());
        }
        if (dto.getSortOrder() != null) {
            game.setSortOrder(dto.getSortOrder());
        }
        if (dto.getIsFeatured() != null) {
            game.setIsFeatured(dto.getIsFeatured());
        }
        if (dto.getConsumePointsPerMinute() != null) {
            game.setConsumePointsPerMinute(dto.getConsumePointsPerMinute());
        }
        if (dto.getMinFatigueToStart() != null) {
            game.setMinFatigueToStart(dto.getMinFatigueToStart());
        }
        
        game.setUpdateTime(System.currentTimeMillis());
        gameManagementMapper.updateById(game);

        log.info("游戏更新成功。GameId: {}", gameId);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deleteGame(Long gameId, Long operatorId) {
        log.info("开始删除游戏。GameId: {}, OperatorId: {}", gameId, operatorId);

        // 1. 查询游戏是否存在
        Game game = gameManagementMapper.selectById(gameId);
        if (game == null) {
            throw new RuntimeException("游戏不存在：" + gameId);
        }

        // 2. 逻辑删除
        game.setDeleted(1);
        game.setUpdateTime(System.currentTimeMillis());
        gameManagementMapper.updateById(game);

        log.info("游戏删除成功。GameId: {}", gameId);
    }

    @Override
    public Page<GameManagementQueryDTO> listGames(GameManagementQueryDTO query) {
        log.info("查询游戏列表。Query: {}", query);

        // TODO: 构建查询条件
        // TODO: 执行分页查询
        // TODO: 转换为 DTO 列表

        // 临时返回空列表
        return new PageImpl<>(new ArrayList<>(), query.getPage() != null ? org.springframework.data.domain.PageRequest.of(query.getPage() - 1, query.getSize()) : org.springframework.data.domain.PageRequest.of(0, 10), 0);
    }

    @Override
    public GameManagementQueryDTO getGameDetail(Long gameId) {
        log.info("查询游戏详情。GameId: {}", gameId);

        Game game = gameManagementMapper.selectById(gameId);
        if (game == null) {
            throw new RuntimeException("游戏不存在：" + gameId);
        }

        // TODO: 转换为 DTO 并返回
        return new GameManagementQueryDTO();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void publishGame(Long gameId, String version, Long operatorId) {
        log.info("上架游戏。GameId: {}, Version: {}, OperatorId: {}", gameId, version, operatorId);

        Game game = gameManagementMapper.selectById(gameId);
        if (game == null) {
            throw new RuntimeException("游戏不存在：" + gameId);
        }

        // 验证状态流转
        GameStatusEnum currentStatus = GameStatusEnum.valueOfCode(game.getStatus());
        GameStatusEnum targetStatus = GameStatusEnum.ON_SALE;
        
        if (currentStatus != null && !currentStatus.canTransitionTo(targetStatus)) {
            throw new RuntimeException("当前状态不允许上架操作。当前状态：" + currentStatus.getDescription());
        }

        // 更新游戏状态为已上架
        game.setStatus(targetStatus.getCode());
        game.setPublishTime(System.currentTimeMillis());
        game.setUpdateTime(System.currentTimeMillis());
        gameManagementMapper.updateById(game);

        // 记录版本历史
        // TODO: 插入版本历史记录

        log.info("游戏上架成功。GameId: {}", gameId);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void unpublishGame(Long gameId, String reason, Long operatorId) {
        log.info("下架游戏。GameId: {}, Reason: {}, OperatorId: {}", gameId, reason, operatorId);

        Game game = gameManagementMapper.selectById(gameId);
        if (game == null) {
            throw new RuntimeException("游戏不存在：" + gameId);
        }

        // 验证状态流转
        GameStatusEnum currentStatus = GameStatusEnum.valueOfCode(game.getStatus());
        GameStatusEnum targetStatus = GameStatusEnum.OFFLINE;
        
        if (currentStatus != null && !currentStatus.canTransitionTo(targetStatus)) {
            throw new RuntimeException("当前状态不允许下架操作。当前状态：" + currentStatus.getDescription());
        }

        // 更新游戏状态为已下架
        game.setStatus(targetStatus.getCode());
        game.setUpdateTime(System.currentTimeMillis());
        gameManagementMapper.updateById(game);

        log.info("游戏下架成功。GameId: {}", gameId);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void submitReview(Long gameId, Long operatorId) {
        log.info("提交游戏审核。GameId: {}, OperatorId: {}", gameId, operatorId);

        Game game = gameManagementMapper.selectById(gameId);
        if (game == null) {
            throw new RuntimeException("游戏不存在：" + gameId);
        }

        // 验证状态流转
        GameStatusEnum currentStatus = GameStatusEnum.valueOfCode(game.getStatus());
        GameStatusEnum targetStatus = GameStatusEnum.PENDING_REVIEW;
        
        if (currentStatus != null && !currentStatus.canTransitionTo(targetStatus)) {
            throw new RuntimeException("当前状态不允许提交审核。当前状态：" + currentStatus.getDescription());
        }

        // 更新状态为待审核
        game.setStatus(targetStatus.getCode());
        game.setUpdateTime(System.currentTimeMillis());
        gameManagementMapper.updateById(game);

        log.info("游戏审核提交成功。GameId: {}", gameId);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void reviewGame(Long gameId, GameReviewDTO dto, Long operatorId) {
        log.info("审核游戏。GameId: {}, DTO: {}, OperatorId: {}", gameId, dto, operatorId);

        Game game = gameManagementMapper.selectById(gameId);
        if (game == null) {
            throw new RuntimeException("游戏不存在：" + gameId);
        }

        // 验证当前状态是否为待审核
        GameStatusEnum currentStatus = GameStatusEnum.valueOfCode(game.getStatus());
        if (currentStatus != GameStatusEnum.PENDING_REVIEW) {
            throw new RuntimeException("只有待审核状态的游戏才能进行审核。当前状态：" + currentStatus.getDescription());
        }

        // 根据审核结果更新状态
        GameStatusEnum targetStatus;
        if (dto.getReviewStatus() == 1) {
            // 审核通过，流转到已上架
            targetStatus = GameStatusEnum.ON_SALE;
        } else {
            // 审核驳回，流转到审核驳回
            targetStatus = GameStatusEnum.REJECTED;
        }

        // 验证状态流转
        if (!currentStatus.canTransitionTo(targetStatus)) {
            throw new RuntimeException("状态流转失败。从 " + currentStatus.getDescription() + " 无法流转到 " + targetStatus.getDescription());
        }

        game.setStatus(targetStatus.getCode());
        game.setUpdateTime(System.currentTimeMillis());
        gameManagementMapper.updateById(game);

        // 记录审核历史（通过 review_record 表）
        // TODO: 插入审核记录到 t_game_review_record

        log.info("游戏审核完成。GameId: {}, Status: {}", gameId, game.getStatus());
    }

    @Override
    public Page<GameManagementQueryDTO> listPendingReviewGames(Pageable pageable) {
        log.info("查询待审核游戏列表");

        // TODO: 查询待审核游戏列表
        // TODO: 转换为 DTO 列表

        return new PageImpl<>(new ArrayList<>(), pageable, 0);
    }

    @Override
    public Object uploadResource(Long gameId, String type, String key, org.springframework.web.multipart.MultipartFile file) {
        log.info("上传游戏资源。GameId: {}, Type: {}, Key: {}", gameId, type, key);
        
        // TODO: 实现资源上传逻辑（使用 t_game_config 表）
        
        return new HashMap<>();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public GameVersionCreateDTO publishVersion(Long gameId, GameVersionCreateDTO dto, Long operatorId) {
        log.info("发布新版本。GameId: {}, Version: {}, OperatorId: {}", gameId, dto.getVersion(), operatorId);

        // TODO: 实现版本发布逻辑

        return dto;
    }

    @Override
    public List<GameVersionCreateDTO> listVersions(Long gameId) {
        log.info("查询版本历史。GameId: {}", gameId);

        // TODO: 查询版本历史
        return new ArrayList<>();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void rollbackVersion(Long gameId, Long versionId, Long operatorId) {
        log.info("回滚版本。GameId: {}, VersionId: {}, OperatorId: {}", gameId, versionId, operatorId);

        // TODO: 实现版本回滚逻辑
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void addTags(Long gameId, List<Long> tagIds) {
        log.info("添加标签。GameId: {}, TagIds: {}", gameId, tagIds);

        // TODO: 实现标签添加逻辑
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void removeTag(Long gameId, Long tagId) {
        log.info("移除标签。GameId: {}, TagId: {}", gameId, tagId);

        // TODO: 实现标签移除逻辑
    }

    @Override
    public List<Object> listGameTags(Long gameId) {
        log.info("查询游戏标签。GameId: {}", gameId);

        // TODO: 查询游戏标签
        return new ArrayList<>();
    }

    @Override
    public List<Object> listResources(Long gameId) {
        log.info("查询游戏资源。GameId: {}", gameId);

        // TODO: 查询游戏资源
        return new ArrayList<>();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deleteResource(Long gameId, String resourceKey) {
        log.info("删除资源。GameId: {}, ResourceKey: {}", gameId, resourceKey);

        // TODO: 实现资源删除逻辑
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void batchPublish(List<Long> gameIds) {
        log.info("批量上架游戏。Count: {}", gameIds.size());

        for (Long gameId : gameIds) {
            try {
                publishGame(gameId, "1.0.0", 0L);
            } catch (Exception e) {
                log.error("批量上架失败。GameId: {}, Error: {}", gameId, e.getMessage());
            }
        }

        log.info("批量上架完成");
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void batchUnpublish(List<Long> gameIds, String reason) {
        log.info("批量下架游戏。Count: {}, Reason: {}", gameIds.size(), reason);

        for (Long gameId : gameIds) {
            try {
                unpublishGame(gameId, reason, 0L);
            } catch (Exception e) {
                log.error("批量下架失败。GameId: {}, Error: {}", gameId, e.getMessage());
            }
        }

        log.info("批量下架完成");
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void batchDelete(List<Long> gameIds) {
        log.info("批量删除游戏。Count: {}", gameIds.size());

        for (Long gameId : gameIds) {
            try {
                deleteGame(gameId, 0L);
            } catch (Exception e) {
                log.error("批量删除失败。GameId: {}, Error: {}", gameId, e.getMessage());
            }
        }

        log.info("批量删除完成");
    }

    @Override
    public GameStatisticsDTO getGameStatistics(Long gameId, LocalDate startDate, LocalDate endDate) {
        log.info("查询游戏统计。GameId: {}, StartDate: {}, EndDate: {}", gameId, startDate, endDate);

        // TODO: 查询统计数据
        return new GameStatisticsDTO();
    }

    @Override
    public Object getGameTrends(Long gameId, Integer days) {
        log.info("查询游戏趋势。GameId: {}, Days: {}", gameId, days);

        // TODO: 查询趋势数据
        return new HashMap<>();
    }

    @Override
    public byte[] exportGameData(Long gameId, Object dto) {
        log.info("导出游戏数据。GameId: {}", gameId);

        // TODO: 实现数据导出逻辑
        return new byte[0];
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void calculateDailyStatistics() {
        log.info("计算每日统计数据");

        // TODO: 实现每日统计计算逻辑
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void calculateRetentionRate() {
        log.info("计算留存率");

        // TODO: 实现留存率计算逻辑
    }
}
