package com.kidgame.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.kidgame.common.constant.ErrorCode;
import com.kidgame.common.exception.BusinessException;
import com.kidgame.dao.entity.Subject;
import com.kidgame.dao.mapper.SubjectMapper;
import com.kidgame.service.SubjectService;
import com.kidgame.service.dto.SubjectSaveDTO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;

/**
 * 学科业务服务实现
 */
@Slf4j
@Service
public class SubjectServiceImpl extends ServiceImpl<SubjectMapper, Subject> implements SubjectService {

    @Autowired
    private SubjectMapper subjectMapper;

    @Override
    public List<Subject> listAll() {
        LambdaQueryWrapper<Subject> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Subject::getStatus, 1)
                .orderByAsc(Subject::getSortOrder)
                .orderByAsc(Subject::getSubjectId);
        return subjectMapper.selectList(wrapper);
    }

    @Override
    public List<Subject> listAllIncludeDisabled() {
        LambdaQueryWrapper<Subject> wrapper = new LambdaQueryWrapper<>();
        wrapper.orderByAsc(Subject::getSortOrder)
                .orderByAsc(Subject::getSubjectId);
        return subjectMapper.selectList(wrapper);
    }

    @Override
    public Subject getById(Long id) {
        Subject subject = subjectMapper.selectById(id);
        if (subject == null) {
            throw new BusinessException(ErrorCode.RESOURCE_NOT_FOUND_OBJ, "学科不存在");
        }
        return subject;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Subject create(SubjectSaveDTO dto) {
        validateSubjectSave(dto);
        // 校验 subjectCode 唯一（同 code 排除已删除，@TableLogic 自动过滤）
        LambdaQueryWrapper<Subject> codeWrapper = new LambdaQueryWrapper<>();
        codeWrapper.eq(Subject::getSubjectCode, dto.getSubjectCode());
        if (subjectMapper.selectCount(codeWrapper) > 0) {
            throw new BusinessException(ErrorCode.PARAM_ERROR_OBJ, "学科编码已存在");
        }
        long now = System.currentTimeMillis();
        Subject subject = new Subject();
        mapDtoToEntity(dto, subject);
        subject.setCreateTime(now);
        subject.setUpdateTime(now);
        if (subject.getStatus() == null) {
            subject.setStatus(1);
        }
        if (subject.getSortOrder() == null) {
            subject.setSortOrder(0);
        }
        subjectMapper.insert(subject);
        return subject;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Subject update(SubjectSaveDTO dto) {
        if (dto.getSubjectId() == null) {
            throw new BusinessException(ErrorCode.PARAM_ERROR_OBJ, "学科ID不能为空");
        }
        Subject existing = subjectMapper.selectById(dto.getSubjectId());
        if (existing == null) {
            throw new BusinessException(ErrorCode.RESOURCE_NOT_FOUND_OBJ, "学科不存在");
        }
        validateSubjectSave(dto);
        // 校验 subjectCode 唯一（排除自身）
        LambdaQueryWrapper<Subject> codeWrapper = new LambdaQueryWrapper<>();
        codeWrapper.eq(Subject::getSubjectCode, dto.getSubjectCode())
                .ne(Subject::getSubjectId, dto.getSubjectId());
        if (subjectMapper.selectCount(codeWrapper) > 0) {
            throw new BusinessException(ErrorCode.PARAM_ERROR_OBJ, "学科编码已存在");
        }
        mapDtoToEntity(dto, existing);
        existing.setUpdateTime(System.currentTimeMillis());
        subjectMapper.updateById(existing);
        return existing;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void delete(Long id) {
        // 逻辑删除（@TableLogic 自动处理）
        if (subjectMapper.deleteById(id) <= 0) {
            throw new BusinessException(ErrorCode.RESOURCE_NOT_FOUND_OBJ, "学科不存在");
        }
    }

    // ==================== 内部方法 ====================

    @Override
    public void validateSubjectSave(SubjectSaveDTO dto) {
        if (!StringUtils.hasText(dto.getSubjectName())) {
            throw new BusinessException(ErrorCode.PARAM_ERROR_OBJ, "学科名称不能为空");
        }
        if (!StringUtils.hasText(dto.getSubjectCode())) {
            throw new BusinessException(ErrorCode.PARAM_ERROR_OBJ, "学科编码不能为空");
        }
    }

    private void mapDtoToEntity(SubjectSaveDTO dto, Subject target) {
        target.setSubjectCode(dto.getSubjectCode());
        target.setSubjectName(dto.getSubjectName());
        target.setIconUrl(dto.getIconUrl());
        target.setDescription(dto.getDescription());
        target.setSortOrder(dto.getSortOrder());
        target.setStatus(dto.getStatus());
    }
}
