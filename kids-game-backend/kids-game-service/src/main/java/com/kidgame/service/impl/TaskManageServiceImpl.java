package com.kidgame.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.kidgame.dao.entity.BaseUser;
import com.kidgame.dao.entity.TaskDefinition;
import com.kidgame.dao.mapper.BaseUserMapper;
import com.kidgame.dao.mapper.TaskDefinitionMapper;
import com.kidgame.service.TaskManageService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TaskManageServiceImpl implements TaskManageService {

    private final BaseUserMapper baseUserMapper;
    private final TaskDefinitionMapper taskDefinitionMapper;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public TaskDefinition saveTask(Long operatorId, TaskDefinition body) {
        BaseUser op = baseUserMapper.selectById(operatorId);
        if (op == null) {
            throw new RuntimeException("用户不存在");
        }
        int type = op.getUserType() != null ? op.getUserType() : 0;
        if (type == 2) {
            body.setOwnerType("ADMIN");
            body.setOwnerId(operatorId);
        } else if (type == 1) {
            body.setOwnerType("PARENT");
            body.setOwnerId(operatorId);
        } else {
            throw new RuntimeException("无权限管理任务");
        }
        long now = System.currentTimeMillis();
        if (body.getTaskId() == null) {
            body.setCreateTime(now);
            body.setEnabled(body.getEnabled() != null ? body.getEnabled() : 1);
            body.setUpdateTime(now);
            taskDefinitionMapper.insert(body);
        } else {
            body.setUpdateTime(now);
            taskDefinitionMapper.updateById(body);
        }
        return body;
    }

    @Override
    public List<TaskDefinition> listManageable(Long operatorId, Long kidId) {
        BaseUser op = baseUserMapper.selectById(operatorId);
        if (op == null) return List.of();
        int type = op.getUserType() != null ? op.getUserType() : 0;
        LambdaQueryWrapper<TaskDefinition> w = new LambdaQueryWrapper<>();
        if (type == 2) {
            w.and(q -> q.eq(TaskDefinition::getOwnerType, "ADMIN")
                    .or().eq(TaskDefinition::getOwnerType, "SYSTEM"));
        } else if (type == 1) {
            w.eq(TaskDefinition::getOwnerType, "PARENT").eq(TaskDefinition::getOwnerId, operatorId);
            if (kidId != null) {
                w.and(q -> q.isNull(TaskDefinition::getKidId).or().eq(TaskDefinition::getKidId, kidId));
            }
        } else {
            return List.of();
        }
        w.orderByAsc(TaskDefinition::getSortOrder);
        return taskDefinitionMapper.selectList(w);
    }
}