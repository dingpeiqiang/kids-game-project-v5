package com.kidgame.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.kidgame.common.constant.ErrorCode;
import com.kidgame.common.exception.BusinessException;
import com.kidgame.dao.entity.ClassMember;
import com.kidgame.dao.entity.Kid;
import com.kidgame.dao.entity.SchoolClass;
import com.kidgame.dao.mapper.ClassMemberMapper;
import com.kidgame.dao.mapper.KidMapper;
import com.kidgame.dao.mapper.SchoolClassMapper;
import com.kidgame.service.ClassService;
import com.kidgame.service.dto.ClassSaveDTO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 班级管理业务服务实现
 */
@Slf4j
@Service
public class ClassServiceImpl extends ServiceImpl<SchoolClassMapper, SchoolClass> implements ClassService {

    /** 邀请码字符集（去除易混淆字符） */
    private static final String INVITE_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    /** 邀请码长度 */
    private static final int INVITE_CODE_LENGTH = 6;
    /** 角色常量 */
    private static final String ROLE_TEACHER = "TEACHER";
    private static final String ROLE_STUDENT = "STUDENT";

    private final SecureRandom random = new SecureRandom();

    @Autowired
    private SchoolClassMapper schoolClassMapper;

    @Autowired
    private ClassMemberMapper classMemberMapper;

    @Autowired
    private KidMapper kidMapper;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public SchoolClass create(Long teacherId, ClassSaveDTO dto) {
        if (teacherId == null) {
            throw new BusinessException(ErrorCode.FORBIDDEN_OBJ, "未登录");
        }
        if (!StringUtils.hasText(dto.getClassName())) {
            throw new BusinessException(ErrorCode.PARAM_ERROR_OBJ, "班级名称不能为空");
        }
        long now = System.currentTimeMillis();
        SchoolClass entity = new SchoolClass();
        entity.setClassName(dto.getClassName());
        entity.setGrade(dto.getGrade());
        entity.setSchoolYear(dto.getSchoolYear());
        entity.setCreatorId(teacherId);
        entity.setInviteCode(generateInviteCode());
        entity.setDescription(dto.getDescription());
        entity.setStatus(1);
        entity.setCreateTime(now);
        entity.setUpdateTime(now);
        schoolClassMapper.insert(entity);

        // 创建者自动作为教师加入班级
        joinInternal(entity.getClassId(), teacherId, ROLE_TEACHER);

        log.info("Class created. classId={}, teacherId={}, inviteCode={}",
                entity.getClassId(), teacherId, entity.getInviteCode());
        return entity;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public SchoolClass update(Long classId, ClassSaveDTO dto) {
        SchoolClass entity = getById(classId);
        if (StringUtils.hasText(dto.getClassName())) {
            entity.setClassName(dto.getClassName());
        }
        if (dto.getGrade() != null) {
            entity.setGrade(dto.getGrade());
        }
        if (dto.getSchoolYear() != null) {
            entity.setSchoolYear(dto.getSchoolYear());
        }
        if (dto.getDescription() != null) {
            entity.setDescription(dto.getDescription());
        }
        entity.setUpdateTime(System.currentTimeMillis());
        schoolClassMapper.updateById(entity);
        return entity;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void delete(Long classId) {
        SchoolClass entity = getById(classId);
        long now = System.currentTimeMillis();
        entity.setStatus(0);
        entity.setUpdateTime(now);
        schoolClassMapper.updateById(entity);
        // 解散班级时，将所有成员置为已退出
        LambdaQueryWrapper<ClassMember> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(ClassMember::getClassId, classId)
                .eq(ClassMember::getStatus, 1);
        List<ClassMember> members = classMemberMapper.selectList(wrapper);
        for (ClassMember m : members) {
            m.setStatus(0);
            m.setUpdateTime(now);
            classMemberMapper.updateById(m);
        }
        log.info("Class dismissed. classId={}", classId);
    }

    @Override
    public SchoolClass getById(Long classId) {
        SchoolClass entity = schoolClassMapper.selectById(classId);
        if (entity == null) {
            throw new BusinessException(ErrorCode.RESOURCE_NOT_FOUND_OBJ, "班级不存在");
        }
        return entity;
    }

    @Override
    public List<SchoolClass> listByTeacher(Long teacherId) {
        LambdaQueryWrapper<ClassMember> memberWrapper = new LambdaQueryWrapper<>();
        memberWrapper.eq(ClassMember::getUserId, teacherId)
                .eq(ClassMember::getRole, ROLE_TEACHER)
                .eq(ClassMember::getStatus, 1);
        List<ClassMember> members = classMemberMapper.selectList(memberWrapper);
        if (members.isEmpty()) {
            return new ArrayList<>();
        }
        List<Long> classIds = members.stream()
                .map(ClassMember::getClassId)
                .collect(Collectors.toList());
        LambdaQueryWrapper<SchoolClass> wrapper = new LambdaQueryWrapper<>();
        wrapper.in(SchoolClass::getClassId, classIds)
                .eq(SchoolClass::getStatus, 1)
                .orderByDesc(SchoolClass::getCreateTime);
        return schoolClassMapper.selectList(wrapper);
    }

    @Override
    public List<SchoolClass> listByStudent(Long studentId) {
        LambdaQueryWrapper<ClassMember> memberWrapper = new LambdaQueryWrapper<>();
        memberWrapper.eq(ClassMember::getUserId, studentId)
                .eq(ClassMember::getRole, ROLE_STUDENT)
                .eq(ClassMember::getStatus, 1);
        List<ClassMember> members = classMemberMapper.selectList(memberWrapper);
        if (members.isEmpty()) {
            return new ArrayList<>();
        }
        List<Long> classIds = members.stream()
                .map(ClassMember::getClassId)
                .collect(Collectors.toList());
        LambdaQueryWrapper<SchoolClass> wrapper = new LambdaQueryWrapper<>();
        wrapper.in(SchoolClass::getClassId, classIds)
                .eq(SchoolClass::getStatus, 1)
                .orderByDesc(SchoolClass::getCreateTime);
        return schoolClassMapper.selectList(wrapper);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public boolean joinByCode(Long userId, String inviteCode, String role) {
        if (!StringUtils.hasText(inviteCode)) {
            throw new BusinessException(ErrorCode.PARAM_ERROR_OBJ, "邀请码不能为空");
        }
        LambdaQueryWrapper<SchoolClass> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(SchoolClass::getInviteCode, inviteCode)
                .eq(SchoolClass::getStatus, 1);
        SchoolClass schoolClass = schoolClassMapper.selectOne(wrapper);
        if (schoolClass == null) {
            throw new BusinessException(ErrorCode.RESOURCE_NOT_FOUND_OBJ, "邀请码无效或班级已解散");
        }
        return joinInternal(schoolClass.getClassId(), userId, role);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public boolean join(Long classId, Long userId, String role) {
        getById(classId);
        return joinInternal(classId, userId, role);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public boolean leave(Long classId, Long userId) {
        LambdaQueryWrapper<ClassMember> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(ClassMember::getClassId, classId)
                .eq(ClassMember::getUserId, userId)
                .eq(ClassMember::getStatus, 1);
        ClassMember member = classMemberMapper.selectOne(wrapper);
        if (member == null) {
            throw new BusinessException(ErrorCode.RESOURCE_NOT_FOUND_OBJ, "未加入该班级");
        }
        member.setStatus(0);
        member.setUpdateTime(System.currentTimeMillis());
        classMemberMapper.updateById(member);
        log.info("Member left class. classId={}, userId={}", classId, userId);
        return true;
    }

    @Override
    public List<ClassMember> listMembers(Long classId) {
        LambdaQueryWrapper<ClassMember> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(ClassMember::getClassId, classId)
                .eq(ClassMember::getStatus, 1)
                .orderByAsc(ClassMember::getRole)
                .orderByAsc(ClassMember::getJoinTime);
        return classMemberMapper.selectList(wrapper);
    }

    @Override
    public List<Kid> listStudents(Long classId) {
        LambdaQueryWrapper<ClassMember> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(ClassMember::getClassId, classId)
                .eq(ClassMember::getRole, ROLE_STUDENT)
                .eq(ClassMember::getStatus, 1);
        List<ClassMember> members = classMemberMapper.selectList(wrapper);
        if (members.isEmpty()) {
            return new ArrayList<>();
        }
        List<Long> userIds = members.stream()
                .map(ClassMember::getUserId)
                .collect(Collectors.toList());
        LambdaQueryWrapper<Kid> kidWrapper = new LambdaQueryWrapper<>();
        kidWrapper.in(Kid::getKidId, userIds);
        return kidMapper.selectList(kidWrapper);
    }

    // ==================== 内部方法 ====================

    /** 生成6位随机邀请码（确保唯一） */
    private String generateInviteCode() {
        for (int retry = 0; retry < 10; retry++) {
            StringBuilder sb = new StringBuilder(INVITE_CODE_LENGTH);
            for (int i = 0; i < INVITE_CODE_LENGTH; i++) {
                sb.append(INVITE_CODE_CHARS.charAt(random.nextInt(INVITE_CODE_CHARS.length())));
            }
            String code = sb.toString();
            LambdaQueryWrapper<SchoolClass> wrapper = new LambdaQueryWrapper<>();
            wrapper.eq(SchoolClass::getInviteCode, code);
            if (schoolClassMapper.selectCount(wrapper) == 0) {
                return code;
            }
        }
        throw new BusinessException(ErrorCode.BUSINESS_ERROR_OBJ, "邀请码生成失败，请重试");
    }

    /** 加入班级内部实现 */
    private boolean joinInternal(Long classId, Long userId, String role) {
        if (!ROLE_TEACHER.equals(role) && !ROLE_STUDENT.equals(role)) {
            throw new BusinessException(ErrorCode.PARAM_ERROR_OBJ, "角色无效，仅支持 TEACHER/STUDENT");
        }
        // 已加入则直接返回
        LambdaQueryWrapper<ClassMember> existWrapper = new LambdaQueryWrapper<>();
        existWrapper.eq(ClassMember::getClassId, classId)
                .eq(ClassMember::getUserId, userId)
                .eq(ClassMember::getStatus, 1);
        ClassMember exist = classMemberMapper.selectOne(existWrapper);
        if (exist != null) {
            return true;
        }
        long now = System.currentTimeMillis();
        ClassMember member = new ClassMember();
        member.setClassId(classId);
        member.setUserId(userId);
        member.setRole(role);
        member.setJoinTime(now);
        member.setStatus(1);
        member.setCreateTime(now);
        member.setUpdateTime(now);
        classMemberMapper.insert(member);
        log.info("Member joined class. classId={}, userId={}, role={}", classId, userId, role);
        return true;
    }
}
