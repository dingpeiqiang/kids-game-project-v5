package com.kidgame.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.kidgame.dao.entity.Parent;
import com.kidgame.dao.entity.ParentLimit;
import com.kidgame.service.dto.ParentLoginDTO;
import com.kidgame.service.dto.ParentLimitDTO;
import com.kidgame.service.dto.ParentRegisterDTO;

import java.util.List;

/**
 * 家长业务服务
 */
public interface ParentService extends IService<Parent> {

    /**
     * 家长注册
     * @param dto 注册请求
     * @return 家长信息
     */
    Parent register(ParentRegisterDTO dto);

    /**
     * 家长登录
     * @param dto 登录请求
     * @return 家长信息
     */
    Parent login(ParentLoginDTO dto);

    /**
     * 验证家长密码
     * @param parentId 家长ID
     * @param password 密码
     * @return 是否验证成功
     */
    boolean verifyPassword(Long parentId, String password);

    /**
     * 获取儿童管控规则
     * @param kidId 儿童ID
     * @return 管控规则
     */
    ParentLimit getParentLimit(Long kidId);

    /**
     * 更新管控规则
     * @param dto 管控规则
     */
    void updateParentLimit(ParentLimitDTO dto);

    /**
     * 远程暂停游戏
     * @param kidId 儿童ID
     */
    void remotePauseGame(Long kidId);

    /**
     * 远程解锁游戏
     * @param kidId 儿童ID
     */
    void remoteUnlockGame(Long kidId);

    /**
     * 获取家长的所有儿童
     * @param parentId 家长ID
     * @return 儿童列表
     */
    List<com.kidgame.dao.entity.Kid> getParentKids(Long parentId);

    /**
     * 获取儿童游戏记录
     * @param kidId 儿童ID
     * @param limit 数量限制
     * @return 游戏记录列表
     */
    List<com.kidgame.dao.entity.GameRecord> getKidGameRecords(Long kidId, Integer limit);

    /**
     * 获取儿童答题记录
     * @param kidId 儿童ID
     * @param limit 数量限制
     * @return 答题记录列表
     */
    List<com.kidgame.dao.entity.AnswerRecord> getKidAnswerRecords(Long kidId, Integer limit);

    /**
     * 屏蔽游戏
     * @param kidId 儿童ID
     * @param gameId 游戏ID
     */
    void blockGame(Long kidId, Long gameId);

    /**
     * 取消屏蔽游戏
     * @param kidId 儿童ID
     * @param gameId 游戏ID
     */
    void unblockGame(Long kidId, Long gameId);

    /**
     * 批量屏蔽游戏
     * @param kidId 儿童ID
     * @param gameIds 游戏ID列表
     */
    void batchBlockGames(Long kidId, List<Long> gameIds);

    /**
     * 批量取消屏蔽游戏
     * @param kidId 儿童ID
     * @param gameIds 游戏ID列表
     */
    void batchUnblockGames(Long kidId, List<Long> gameIds);

    /**
     * 添加孩子
     * @param dto 添加孩子请求
     * @return 新创建的孩子信息
     */
    com.kidgame.dao.entity.Kid addChild(com.kidgame.service.dto.AddChildDTO dto);

    /**
     * 删除孩子
     * @param kidId 儿童ID
     * @param parentId 家长ID（用于权限验证）
     */
    void deleteChild(Long kidId, Long parentId);

    /**
     * 更新孩子游戏权限
     * @param dto 更新权限请求
     */
    void updateChildPermissions(com.kidgame.service.dto.UpdateChildPermissionsDTO dto);

    /**
     * 绑定已有孩子
     * @param dto 绑定已有孩子请求
     */
    void bindExistingKid(com.kidgame.service.dto.BindExistingKidDTO dto);

    /**
     * 获取孩子的所有家长
     * @param kidId 儿童ID
     * @return 家长列表
     */
    List<com.kidgame.dao.entity.Parent> getParentsForKid(Long kidId);

    /**
     * 获取所有家长列表（用于孩子注册时选择）
     * @return 家长列表
     */
    List<com.kidgame.dao.entity.Parent> getAllParents();

    /**
     * 获取家长选项列表（用于孩子注册时选择，简化信息）
     * @return 家长选项列表
     */
    List<com.kidgame.service.dto.ParentOptionDTO> getParentOptions();

    /**
     * 家长请求绑定孩子（创建待确认关系和通知）
     * @param parentId 家长ID
     * @param kidUsername 孩子用户名
     * @param roleType 角色类型
     * @param isPrimary 是否为主要监护人
     * @return 创建的关系ID
     */
    Long requestBindKid(Long parentId, String kidUsername, Integer roleType, Boolean isPrimary);

    /**
     * 获取家长疲劳点数
     * @param parentId 家长ID
     * @return 疲劳点数
     */
    Integer getFatiguePoints(Long parentId);

    /**
     * 更新家长疲劳点数
     * @param parentId 家长ID
     * @param changeType 变化类型（1-消耗，2-获得，3-重置）
     * @param changePoints 变化点数
     * @param relatedId 关联ID
     */
    void updateFatiguePoints(Long parentId, Integer changeType, Integer changePoints, Long relatedId);
}
