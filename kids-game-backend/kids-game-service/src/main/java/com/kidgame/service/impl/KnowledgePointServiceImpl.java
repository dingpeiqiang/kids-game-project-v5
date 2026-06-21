package com.kidgame.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.kidgame.common.constant.ErrorCode;
import com.kidgame.common.exception.BusinessException;
import com.kidgame.dao.entity.KnowledgePoint;
import com.kidgame.dao.mapper.KnowledgePointMapper;
import com.kidgame.service.KnowledgePointService;
import com.kidgame.service.dto.KnowledgePointSaveDTO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 知识点业务服务实现
 */
@Slf4j
@Service
public class KnowledgePointServiceImpl extends ServiceImpl<KnowledgePointMapper, KnowledgePoint> implements KnowledgePointService {

    @Autowired
    private KnowledgePointMapper knowledgePointMapper;

    @Override
    public List<KnowledgePoint> listBySubject(Long subjectId) {
        LambdaQueryWrapper<KnowledgePoint> wrapper = new LambdaQueryWrapper<>();
        if (subjectId != null) {
            wrapper.eq(KnowledgePoint::getSubjectId, subjectId);
        }
        wrapper.orderByAsc(KnowledgePoint::getSortOrder)
                .orderByAsc(KnowledgePoint::getKnowledgePointId);
        return knowledgePointMapper.selectList(wrapper);
    }

    @Override
    public List<KnowledgePoint> listTree(Long subjectId) {
        List<KnowledgePoint> all = listBySubject(subjectId);
        if (all.isEmpty()) {
            return all;
        }
        // 按 parentId 分组
        Map<Long, List<KnowledgePoint>> childrenMap = new HashMap<>();
        List<KnowledgePoint> roots = new ArrayList<>();
        for (KnowledgePoint kp : all) {
            if (kp.getParentId() == null) {
                roots.add(kp);
            } else {
                childrenMap.computeIfAbsent(kp.getParentId(), k -> new ArrayList<>()).add(kp);
            }
        }
        // 按 sortOrder 排序
        Comparator<KnowledgePoint> bySort = Comparator.comparing(KnowledgePoint::getSortOrder,
                Comparator.nullsLast(Comparator.naturalOrder()));
        roots.sort(bySort);
        childrenMap.values().forEach(list -> list.sort(bySort));
        // 深度优先遍历，输出扁平列表（父在前，子紧随）
        List<KnowledgePoint> result = new ArrayList<>();
        for (KnowledgePoint root : roots) {
            appendWithChildren(root, childrenMap, result);
        }
        return result;
    }

    @Override
    public KnowledgePoint getById(Long id) {
        KnowledgePoint kp = knowledgePointMapper.selectById(id);
        if (kp == null) {
            throw new BusinessException(ErrorCode.RESOURCE_NOT_FOUND_OBJ, "知识点不存在");
        }
        return kp;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public KnowledgePoint create(KnowledgePointSaveDTO dto) {
        validateSave(dto, false);
        long now = System.currentTimeMillis();
        KnowledgePoint kp = new KnowledgePoint();
        mapDtoToEntity(dto, kp);
        kp.setCreateTime(now);
        kp.setUpdateTime(now);
        if (kp.getStatus() == null) {
            kp.setStatus(1);
        }
        if (kp.getSortOrder() == null) {
            kp.setSortOrder(0);
        }
        knowledgePointMapper.insert(kp);
        return kp;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public KnowledgePoint update(KnowledgePointSaveDTO dto) {
        if (dto.getKnowledgePointId() == null) {
            throw new BusinessException(ErrorCode.PARAM_ERROR_OBJ);
        }
        KnowledgePoint existing = knowledgePointMapper.selectById(dto.getKnowledgePointId());
        if (existing == null) {
            throw new BusinessException(ErrorCode.RESOURCE_NOT_FOUND_OBJ, "知识点不存在");
        }
        validateSave(dto, true);
        mapDtoToEntity(dto, existing);
        existing.setUpdateTime(System.currentTimeMillis());
        knowledgePointMapper.updateById(existing);
        return existing;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void delete(Long id) {
        if (knowledgePointMapper.deleteById(id) <= 0) {
            throw new BusinessException(ErrorCode.RESOURCE_NOT_FOUND_OBJ, "知识点不存在");
        }
    }

    // ==================== 内部方法 ====================

    private void appendWithChildren(KnowledgePoint parent, Map<Long, List<KnowledgePoint>> childrenMap, List<KnowledgePoint> result) {
        result.add(parent);
        List<KnowledgePoint> children = childrenMap.get(parent.getKnowledgePointId());
        if (children != null) {
            for (KnowledgePoint child : children) {
                appendWithChildren(child, childrenMap, result);
            }
        }
    }

    private void validateSave(KnowledgePointSaveDTO dto, boolean isUpdate) {
        if (dto.getSubjectId() == null) {
            throw new BusinessException(ErrorCode.PARAM_ERROR_OBJ, "学科ID不能为空");
        }
        if (!StringUtils.hasText(dto.getName())) {
            throw new BusinessException(ErrorCode.PARAM_ERROR_OBJ, "知识点名称不能为空");
        }
    }

    private void mapDtoToEntity(KnowledgePointSaveDTO dto, KnowledgePoint target) {
        target.setSubjectId(dto.getSubjectId());
        target.setParentId(dto.getParentId());
        target.setCode(dto.getCode());
        target.setName(dto.getName());
        target.setChapter(dto.getChapter());
        target.setDescription(dto.getDescription());
        target.setSortOrder(dto.getSortOrder());
        target.setStatus(dto.getStatus());
    }
}
