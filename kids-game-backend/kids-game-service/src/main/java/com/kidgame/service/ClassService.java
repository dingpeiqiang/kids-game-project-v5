package com.kidgame.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.kidgame.dao.entity.ClassMember;
import com.kidgame.dao.entity.Kid;
import com.kidgame.dao.entity.SchoolClass;
import com.kidgame.service.dto.ClassSaveDTO;

import java.util.List;

/**
 * 班级管理业务服务
 */
public interface ClassService extends IService<SchoolClass> {

    /**
     * 创建班级（生成6位随机邀请码）
     * @param teacherId 教师用户ID
     * @param dto 班级信息
     * @return 班级
     */
    SchoolClass create(Long teacherId, ClassSaveDTO dto);

    /**
     * 更新班级
     * @param classId 班级ID
     * @param dto 班级信息
     * @return 班级
     */
    SchoolClass update(Long classId, ClassSaveDTO dto);

    /**
     * 解散班级
     * @param classId 班级ID
     */
    void delete(Long classId);

    /**
     * 班级详情
     * @param classId 班级ID
     * @return 班级
     */
    SchoolClass getById(Long classId);

    /**
     * 教师的班级列表
     * @param teacherId 教师用户ID
     * @return 班级列表
     */
    List<SchoolClass> listByTeacher(Long teacherId);

    /**
     * 学生的班级列表
     * @param studentId 学生用户ID
     * @return 班级列表
     */
    List<SchoolClass> listByStudent(Long studentId);

    /**
     * 通过邀请码加入班级
     * @param userId 用户ID
     * @param inviteCode 邀请码
     * @param role 角色：TEACHER/STUDENT
     * @return 是否加入成功
     */
    boolean joinByCode(Long userId, String inviteCode, String role);

    /**
     * 直接加入班级
     * @param classId 班级ID
     * @param userId 用户ID
     * @param role 角色：TEACHER/STUDENT
     * @return 是否加入成功
     */
    boolean join(Long classId, Long userId, String role);

    /**
     * 退出班级
     * @param classId 班级ID
     * @param userId 用户ID
     * @return 是否退出成功
     */
    boolean leave(Long classId, Long userId);

    /**
     * 班级成员列表
     * @param classId 班级ID
     * @return 成员列表
     */
    List<ClassMember> listMembers(Long classId);

    /**
     * 班级学生列表（关联 Kid 表）
     * @param classId 班级ID
     * @return 学生列表
     */
    List<Kid> listStudents(Long classId);
}
