package com.kidgame.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.kidgame.dao.entity.KnowledgePoint;
import com.kidgame.service.dto.KnowledgePointSaveDTO;

import java.util.List;

/**
 * 知识点业务服务
 */
public interface KnowledgePointService extends IService<KnowledgePoint> {

    /**
     * 按学科查全部知识点
     * @param subjectId 学科ID
     * @return 知识点列表
     */
    List<KnowledgePoint> listBySubject(Long subjectId);

    /**
     * 构建树形结构（按 parentId 组装，父节点在前）
     * @param subjectId 学科ID
     * @return 知识点列表（按层级排序）
     */
    List<KnowledgePoint> listTree(Long subjectId);

    /**
     * 详情
     * @param id 知识点ID
     * @return 知识点
     */
    KnowledgePoint getById(Long id);

    /**
     * 创建知识点
     * @param dto 保存请求
     * @return 知识点
     */
    KnowledgePoint create(KnowledgePointSaveDTO dto);

    /**
     * 更新知识点
     * @param dto 保存请求
     * @return 知识点
     */
    KnowledgePoint update(KnowledgePointSaveDTO dto);

    /**
     * 删除知识点（逻辑删除）
     * @param id 知识点ID
     */
    void delete(Long id);
}
