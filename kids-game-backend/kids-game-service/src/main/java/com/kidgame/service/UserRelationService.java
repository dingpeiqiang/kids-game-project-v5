package com.kidgame.service;

import com.kidgame.dao.entity.UserRelation;

import java.util.List;

/**
 * 用户关系服务接口
 *
 * @author kids-game-platform
 * @since 1.0.0
 */
public interface UserRelationService {

    /**
     * 创建用户关系
     *
     * @param relation 关系信息
     * @return 关系ID
     */
    Long createRelation(UserRelation relation);

    /**
     * 删除用户关系
     *
     * @param relationId 关系ID
     */
    void deleteRelation(Long relationId);

    /**
     * 更新用户关系
     *
     * @param relation 关系信息
     * @return 更新后的关系
     */
    UserRelation updateRelation(UserRelation relation);

    /**
     * 查询儿童的所有监护人
     *
     * @param kidId 儿童ID
     * @return 监护人列表
     */
    List<UserRelation> getGuardiansByKidId(Long kidId);

    /**
     * 查询家长的所有儿童
     *
     * @param parentId 家长ID
     * @return 儿童列表
     */
    List<UserRelation> getKidsByParentId(Long parentId);

    /**
     * 查询监护人的所有儿童
     *
     * @param guardianUserId 监护人ID
     * @return 儿童关系列表
     */
    List<UserRelation> getGuardianKids(Long guardianUserId);

    /**
     * 查询儿童的所有监护人
     *
     * @param kidUserId 儿童ID
     * @return 监护人关系列表
     */
    List<UserRelation> getKidGuardians(Long kidUserId);

    /**
     * 绑定监护人与儿童关系
     *
     * @param guardianUserId 监护人ID
     * @param kidUserId 儿童ID
     * @param relationType 关系类型
     * @param isPrimary 是否主监护人
     * @param permissionLevel 权限级别
     * @return 创建的关系
     */
    UserRelation bindRelation(Long guardianUserId, Long kidUserId, String relationType,
                               Boolean isPrimary, String permissionLevel);

    /**
     * 解绑关系
     *
     * @param guardianUserId 监护人ID
     * @param kidUserId 儿童ID
     */
    void unbindRelation(Long guardianUserId, Long kidUserId);

    /**
     * 设置主监护人
     *
     * @param guardianUserId 监护人ID
     * @param kidUserId 儿童ID
     */
    void setPrimaryGuardian(Long guardianUserId, Long kidUserId);

    /**
     * 更新权限级别
     *
     * @param guardianUserId 监护人ID
     * @param kidUserId 儿童ID
     * @param permissionLevel 权限级别
     */
    void updatePermissionLevel(Long guardianUserId, Long kidUserId, String permissionLevel);

    /**
     * 检查用户关系是否存在
     *
     * @param userA 用户A
     * @param userB 用户B
     * @return 是否存在
     */
    boolean checkRelationExists(Long userA, Long userB);

    /**
     * 检查用户关系是否存在（带关系类型）
     *
     * @param userA 用户A
     * @param userB 用户B
     * @param relationType 关系类型
     * @return 是否存在
     */
    boolean checkRelationExists(Long userA, Long userB, Integer relationType);
}
