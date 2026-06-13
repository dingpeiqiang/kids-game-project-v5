package com.kidgame.service;

import com.kidgame.dao.entity.TaskDefinition;

import java.util.List;

public interface TaskManageService {
    TaskDefinition saveTask(Long operatorId, TaskDefinition body);

    List<TaskDefinition> listManageable(Long operatorId, Long kidId);
}