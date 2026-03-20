package com.kidgame.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.kidgame.common.constant.ErrorCode;
import com.kidgame.common.exception.BusinessException;
import com.kidgame.dao.entity.UserRelation;
import com.kidgame.dao.mapper.UserRelationMapper;
import com.kidgame.service.UserRelationService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * 用户关系服务实现
 *
 * @author kids-game-platform
 * @since 1.0.0
 */
@Slf4j
@Service
public class UserRelationServiceImpl extends ServiceImpl<UserRelationMapper, UserRelation>
        implements UserRelationService {

    @Override
    public Long createRelation(UserRelation relation) {
        long currentTime = System.currentTimeMillis();
        relation.setCreateTime(currentTime);
        relation.setUpdateTime(currentTime);

        getBaseMapper().insert(relation);
        log.info("创建用户关系. RelationId: {}, RelationType: {}, UserA: {}, UserB: {}",
                relation.getRelationId(), relation.getRelationType(), relation.getUserA(), relation.getUserB());

        return relation.getRelationId();
    }

    @Override
    public void deleteRelation(Long relationId) {
        getBaseMapper().deleteById(relationId);
        log.info("删除用户关系. RelationId: {}", relationId);
    }

    @Override
    public UserRelation updateRelation(UserRelation relation) {
        relation.setUpdateTime(System.currentTimeMillis());
        getBaseMapper().updateById(relation);
        log.info("更新用户关系. RelationId: {}", relation.getRelationId());
        return relation;
    }

    @Override
    public List<UserRelation> getGuardiansByKidId(Long kidId) {
        return getBaseMapper().selectGuardiansByKidId(kidId);
    }

    @Override
    public List<UserRelation> getKidsByParentId(Long parentId) {
        return getBaseMapper().selectKidsByParentId(parentId);
    }

    @Override
    public List<UserRelation> getGuardianKids(Long guardianUserId) {
        return getBaseMapper().selectKidsByParentId(guardianUserId);
    }

    @Override
    public List<UserRelation> getKidGuardians(Long kidUserId) {
        return getBaseMapper().selectGuardiansByKidId(kidUserId);
    }

    @Override
    public UserRelation bindRelation(Long guardianUserId, Long kidUserId, String relationType,
                                       Boolean isPrimary, String permissionLevel) {
        LambdaQueryWrapper<UserRelation> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(UserRelation::getUserA, guardianUserId)
                .eq(UserRelation::getUserB, kidUserId)
                .eq(UserRelation::getStatus, 1);
        UserRelation existing = getBaseMapper().selectOne(wrapper);
        if (existing != null) {
            throw new BusinessException(ErrorCode.RELATION_ALREADY_EXISTS_OBJ);
        }

        UserRelation relation = new UserRelation();
        relation.setUserA(guardianUserId);
        relation.setUserB(kidUserId);
        relation.setRelationType(UserRelation.RelationType.PARENT_KID);
        relation.setRoleType(convertRelationTypeToRoleType(relationType));
        relation.setIsPrimary(isPrimary != null && isPrimary);
        relation.setPermissionLevel(convertPermissionLevel(permissionLevel));
        relation.setStatus(1);

        return createRelationAndReturn(relation);
    }

    @Override
    public void unbindRelation(Long guardianUserId, Long kidUserId) {
        LambdaQueryWrapper<UserRelation> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(UserRelation::getUserA, guardianUserId)
                .eq(UserRelation::getUserB, kidUserId)
                .eq(UserRelation::getStatus, 1);
        UserRelation relation = getBaseMapper().selectOne(wrapper);
        if (relation == null) {
            throw new BusinessException(ErrorCode.RELATION_NOT_FOUND_OBJ);
        }
        deleteRelation(relation.getRelationId());
    }

    @Override
    public void setPrimaryGuardian(Long guardianUserId, Long kidUserId) {
        LambdaQueryWrapper<UserRelation> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(UserRelation::getUserB, kidUserId)
                .eq(UserRelation::getStatus, 1);
        List<UserRelation> relations = getBaseMapper().selectList(wrapper);

        for (UserRelation rel : relations) {
            rel.setIsPrimary(rel.getUserA().equals(guardianUserId));
            rel.setUpdateTime(System.currentTimeMillis());
            getBaseMapper().updateById(rel);
        }
    }

    @Override
    public void updatePermissionLevel(Long guardianUserId, Long kidUserId, String permissionLevel) {
        LambdaQueryWrapper<UserRelation> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(UserRelation::getUserA, guardianUserId)
                .eq(UserRelation::getUserB, kidUserId)
                .eq(UserRelation::getStatus, 1);
        UserRelation relation = getBaseMapper().selectOne(wrapper);
        if (relation == null) {
            throw new BusinessException(ErrorCode.RELATION_NOT_FOUND_OBJ);
        }

        relation.setPermissionLevel(convertPermissionLevel(permissionLevel));
        relation.setUpdateTime(System.currentTimeMillis());
        getBaseMapper().updateById(relation);
    }

    @Override
    public boolean checkRelationExists(Long userA, Long userB) {
        return checkRelationExists(userA, userB, null);
    }

    @Override
    public boolean checkRelationExists(Long userA, Long userB, Integer relationType) {
        LambdaQueryWrapper<UserRelation> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(UserRelation::getUserA, userA)
                .eq(UserRelation::getUserB, userB)
                .eq(UserRelation::getStatus, 1);
        if (relationType != null) {
            wrapper.eq(UserRelation::getRelationType, relationType);
        }
        return getBaseMapper().selectCount(wrapper) > 0;
    }

    private UserRelation createRelationAndReturn(UserRelation relation) {
        long currentTime = System.currentTimeMillis();
        relation.setCreateTime(currentTime);
        relation.setUpdateTime(currentTime);

        getBaseMapper().insert(relation);
        log.info("创建用户关系. RelationId: {}, RelationType: {}, UserA: {}, UserB: {}",
                relation.getRelationId(), relation.getRelationType(), relation.getUserA(), relation.getUserB());

        return relation;
    }

    private UserRelation.RoleType convertRelationTypeToRoleType(String relationType) {
        if (relationType == null) {
            return UserRelation.RoleType.GUARDIAN;
        }
        switch (relationType.toUpperCase()) {
            case "FATHER": return UserRelation.RoleType.FATHER;
            case "MOTHER": return UserRelation.RoleType.MOTHER;
            case "GUARDIAN": return UserRelation.RoleType.GUARDIAN;
            case "TUTOR": return UserRelation.RoleType.TUTOR;
            default: return UserRelation.RoleType.GUARDIAN;
        }
    }

    private Integer convertPermissionLevel(String permissionLevel) {
        if (permissionLevel == null) {
            return 3;
        }
        switch (permissionLevel.toUpperCase()) {
            case "VIEW_ONLY": return 1;
            case "PARTIAL": return 2;
            case "FULL": return 3;
            default: return 3;
        }
    }
}
