package com.kidgame.service.impl;

import com.alibaba.fastjson2.JSON;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.kidgame.common.constant.ErrorCode;
import com.kidgame.common.exception.BusinessException;
import com.kidgame.common.model.PageResult;
import com.kidgame.dao.entity.AssignmentCompletion;
import com.kidgame.dao.entity.PracticeAssignment;
import com.kidgame.dao.mapper.AssignmentCompletionMapper;
import com.kidgame.dao.mapper.PracticeAssignmentMapper;
import com.kidgame.service.AssignmentService;
import com.kidgame.service.dto.AssignmentSaveDTO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;

/**
 * 教师练习任务业务服务实现
 */
@Slf4j
@Service
public class AssignmentServiceImpl extends ServiceImpl<PracticeAssignmentMapper, PracticeAssignment> implements AssignmentService {

    /** 完成状态：0-未开始，1-进行中，2-已完成 */
    private static final int FINISH_STATUS_NOT_STARTED = 0;
    private static final int FINISH_STATUS_IN_PROGRESS = 1;
    private static final int FINISH_STATUS_FINISHED = 2;

    @Autowired
    private PracticeAssignmentMapper practiceAssignmentMapper;

    @Autowired
    private AssignmentCompletionMapper assignmentCompletionMapper;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public PracticeAssignment create(Long teacherId, AssignmentSaveDTO dto) {
        if (teacherId == null) {
            throw new BusinessException(ErrorCode.FORBIDDEN_OBJ, "未登录");
        }
        if (dto.getClassId() == null) {
            throw new BusinessException(ErrorCode.PARAM_ERROR_OBJ, "班级ID不能为空");
        }
        if (!StringUtils.hasText(dto.getTitle())) {
            throw new BusinessException(ErrorCode.PARAM_ERROR_OBJ, "任务标题不能为空");
        }
        long now = System.currentTimeMillis();
        PracticeAssignment entity = new PracticeAssignment();
        entity.setTeacherId(teacherId);
        entity.setClassId(dto.getClassId());
        entity.setTitle(dto.getTitle());
        entity.setDescription(dto.getDescription());
        entity.setSubjectId(dto.getSubjectId());
        entity.setKnowledgePointIds(dto.getKnowledgePointIds() != null
                ? JSON.toJSONString(dto.getKnowledgePointIds()) : null);
        entity.setDifficultyRange(dto.getDifficultyRange());
        entity.setQuestionCount(dto.getQuestionCount());
        entity.setQuestionType(dto.getQuestionType());
        entity.setDueTime(dto.getDueTime());
        entity.setPointsReward(dto.getPointsReward());
        entity.setStatus(dto.getStatus() != null ? dto.getStatus() : 1);
        entity.setCreateTime(now);
        entity.setUpdateTime(now);
        practiceAssignmentMapper.insert(entity);
        log.info("Assignment created. assignmentId={}, teacherId={}, classId={}",
                entity.getAssignmentId(), teacherId, dto.getClassId());
        return entity;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public PracticeAssignment update(Long assignmentId, AssignmentSaveDTO dto) {
        PracticeAssignment entity = getById(assignmentId);
        if (StringUtils.hasText(dto.getTitle())) {
            entity.setTitle(dto.getTitle());
        }
        if (dto.getDescription() != null) {
            entity.setDescription(dto.getDescription());
        }
        if (dto.getSubjectId() != null) {
            entity.setSubjectId(dto.getSubjectId());
        }
        if (dto.getKnowledgePointIds() != null) {
            entity.setKnowledgePointIds(JSON.toJSONString(dto.getKnowledgePointIds()));
        }
        if (dto.getDifficultyRange() != null) {
            entity.setDifficultyRange(dto.getDifficultyRange());
        }
        if (dto.getQuestionCount() != null) {
            entity.setQuestionCount(dto.getQuestionCount());
        }
        if (dto.getQuestionType() != null) {
            entity.setQuestionType(dto.getQuestionType());
        }
        if (dto.getDueTime() != null) {
            entity.setDueTime(dto.getDueTime());
        }
        if (dto.getPointsReward() != null) {
            entity.setPointsReward(dto.getPointsReward());
        }
        if (dto.getStatus() != null) {
            entity.setStatus(dto.getStatus());
        }
        entity.setUpdateTime(System.currentTimeMillis());
        practiceAssignmentMapper.updateById(entity);
        return entity;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void delete(Long assignmentId) {
        PracticeAssignment entity = getById(assignmentId);
        long now = System.currentTimeMillis();
        entity.setStatus(3);
        entity.setUpdateTime(now);
        practiceAssignmentMapper.updateById(entity);
        log.info("Assignment deleted. assignmentId={}", assignmentId);
    }

    @Override
    public PracticeAssignment getById(Long assignmentId) {
        PracticeAssignment entity = practiceAssignmentMapper.selectById(assignmentId);
        if (entity == null) {
            throw new BusinessException(ErrorCode.RESOURCE_NOT_FOUND_OBJ, "任务不存在");
        }
        return entity;
    }

    @Override
    public PageResult<PracticeAssignment> pageByTeacher(Long teacherId, Integer status, long page, long size) {
        LambdaQueryWrapper<PracticeAssignment> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(PracticeAssignment::getTeacherId, teacherId)
                .ne(PracticeAssignment::getStatus, 3);
        if (status != null) {
            wrapper.eq(PracticeAssignment::getStatus, status);
        }
        wrapper.orderByDesc(PracticeAssignment::getCreateTime);
        Page<PracticeAssignment> pageReq = new Page<>(page, size);
        Page<PracticeAssignment> result = practiceAssignmentMapper.selectPage(pageReq, wrapper);
        return PageResult.of(result.getCurrent(), result.getSize(), result.getTotal(), result.getRecords());
    }

    @Override
    public List<PracticeAssignment> listByClass(Long classId) {
        LambdaQueryWrapper<PracticeAssignment> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(PracticeAssignment::getClassId, classId)
                .ne(PracticeAssignment::getStatus, 3)
                .orderByDesc(PracticeAssignment::getCreateTime);
        return practiceAssignmentMapper.selectList(wrapper);
    }

    @Override
    public List<AssignmentCompletion> listCompletions(Long assignmentId) {
        LambdaQueryWrapper<AssignmentCompletion> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(AssignmentCompletion::getAssignmentId, assignmentId)
                .orderByDesc(AssignmentCompletion::getUpdateTime);
        return assignmentCompletionMapper.selectList(wrapper);
    }

    @Override
    public AssignmentCompletion getCompletion(Long assignmentId, Long studentId) {
        LambdaQueryWrapper<AssignmentCompletion> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(AssignmentCompletion::getAssignmentId, assignmentId)
                .eq(AssignmentCompletion::getStudentId, studentId);
        return assignmentCompletionMapper.selectOne(wrapper);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public AssignmentCompletion startAssignment(Long assignmentId, Long studentId) {
        PracticeAssignment assignment = getById(assignmentId);
        // 仅已发布任务可开始
        if (assignment.getStatus() == null || assignment.getStatus() != 1) {
            throw new BusinessException(ErrorCode.BUSINESS_ERROR_OBJ, "任务未发布，无法开始");
        }
        // 已存在记录则直接返回
        AssignmentCompletion exist = getCompletion(assignmentId, studentId);
        if (exist != null) {
            return exist;
        }
        long now = System.currentTimeMillis();
        AssignmentCompletion completion = new AssignmentCompletion();
        completion.setAssignmentId(assignmentId);
        completion.setStudentId(studentId);
        completion.setTotalCount(assignment.getQuestionCount());
        completion.setAnsweredCount(0);
        completion.setCorrectCount(0);
        completion.setPointsEarned(0);
        completion.setDuration(0);
        completion.setFinishStatus(FINISH_STATUS_IN_PROGRESS);
        completion.setCreateTime(now);
        completion.setUpdateTime(now);
        assignmentCompletionMapper.insert(completion);
        log.info("Assignment started. assignmentId={}, studentId={}", assignmentId, studentId);
        return completion;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void updateCompletion(Long assignmentId, Long studentId, int answered, int correct, int points, int duration) {
        AssignmentCompletion completion = getCompletion(assignmentId, studentId);
        if (completion == null) {
            throw new BusinessException(ErrorCode.RESOURCE_NOT_FOUND_OBJ, "未开始该任务，请先调用 start");
        }
        if (completion.getFinishStatus() != null && completion.getFinishStatus() == FINISH_STATUS_FINISHED) {
            throw new BusinessException(ErrorCode.BUSINESS_ERROR_OBJ, "任务已完成，无法更新");
        }
        completion.setAnsweredCount(answered);
        completion.setCorrectCount(correct);
        completion.setPointsEarned(points);
        completion.setDuration(duration);
        completion.setUpdateTime(System.currentTimeMillis());
        assignmentCompletionMapper.updateById(completion);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void finishAssignment(Long assignmentId, Long studentId) {
        AssignmentCompletion completion = getCompletion(assignmentId, studentId);
        if (completion == null) {
            throw new BusinessException(ErrorCode.RESOURCE_NOT_FOUND_OBJ, "未开始该任务，请先调用 start");
        }
        if (completion.getFinishStatus() != null && completion.getFinishStatus() == FINISH_STATUS_FINISHED) {
            return;
        }
        long now = System.currentTimeMillis();
        completion.setFinishStatus(FINISH_STATUS_FINISHED);
        completion.setFinishTime(now);
        completion.setUpdateTime(now);
        assignmentCompletionMapper.updateById(completion);
        log.info("Assignment finished. assignmentId={}, studentId={}", assignmentId, studentId);
    }
}
