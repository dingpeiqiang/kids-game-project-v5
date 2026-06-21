package com.kidgame.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.kidgame.common.model.PageResult;
import com.kidgame.dao.entity.AssignmentCompletion;
import com.kidgame.dao.entity.PracticeAssignment;
import com.kidgame.service.dto.AssignmentSaveDTO;

import java.util.List;

/**
 * 教师练习任务业务服务
 */
public interface AssignmentService extends IService<PracticeAssignment> {

    /**
     * 创建任务
     * @param teacherId 教师用户ID
     * @param dto 任务信息
     * @return 任务
     */
    PracticeAssignment create(Long teacherId, AssignmentSaveDTO dto);

    /**
     * 更新任务
     * @param assignmentId 任务ID
     * @param dto 任务信息
     * @return 任务
     */
    PracticeAssignment update(Long assignmentId, AssignmentSaveDTO dto);

    /**
     * 删除任务
     * @param assignmentId 任务ID
     */
    void delete(Long assignmentId);

    /**
     * 任务详情
     * @param assignmentId 任务ID
     * @return 任务
     */
    PracticeAssignment getById(Long assignmentId);

    /**
     * 教师的任务分页列表
     * @param teacherId 教师用户ID
     * @param status 状态筛选（NULL为全部）
     * @param page 页码
     * @param size 每页条数
     * @return 分页结果
     */
    PageResult<PracticeAssignment> pageByTeacher(Long teacherId, Integer status, long page, long size);

    /**
     * 班级的任务列表（学生查看）
     * @param classId 班级ID
     * @return 任务列表
     */
    List<PracticeAssignment> listByClass(Long classId);

    /**
     * 任务完成情况列表
     * @param assignmentId 任务ID
     * @return 完成情况列表
     */
    List<AssignmentCompletion> listCompletions(Long assignmentId);

    /**
     * 单个学生完成情况
     * @param assignmentId 任务ID
     * @param studentId 学生ID
     * @return 完成情况（不存在返回 null）
     */
    AssignmentCompletion getCompletion(Long assignmentId, Long studentId);

    /**
     * 学生开始任务（创建 Completion 记录，finishStatus=1）
     * @param assignmentId 任务ID
     * @param studentId 学生ID
     * @return 完成情况
     */
    AssignmentCompletion startAssignment(Long assignmentId, Long studentId);

    /**
     * 更新完成情况
     * @param assignmentId 任务ID
     * @param studentId 学生ID
     * @param answered 已答题数
     * @param correct 答对题数
     * @param points 获得游学币
     * @param duration 用时（秒）
     */
    void updateCompletion(Long assignmentId, Long studentId, int answered, int correct, int points, int duration);

    /**
     * 完成任务（finishStatus=2, finishTime=now）
     * @param assignmentId 任务ID
     * @param studentId 学生ID
     */
    void finishAssignment(Long assignmentId, Long studentId);
}
