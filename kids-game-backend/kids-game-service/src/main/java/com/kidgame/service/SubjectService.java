package com.kidgame.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.kidgame.dao.entity.Subject;
import com.kidgame.service.dto.SubjectSaveDTO;

import java.util.List;

/**
 * 学科业务服务
 */
public interface SubjectService extends IService<Subject> {

    /**
     * 查所有启用的学科（status=1），按 sortOrder 排序
     * @return 学科列表
     */
    List<Subject> listAll();

    /**
     * 查所有学科（含禁用，管理端用）
     * @return 学科列表
     */
    List<Subject> listAllIncludeDisabled();

    /**
     * 详情
     * @param id 学科ID
     * @return 学科
     */
    Subject getById(Long id);

    /**
     * 创建学科
     * @param dto 保存请求
     * @return 学科
     */
    Subject create(SubjectSaveDTO dto);

    /**
     * 更新学科
     * @param dto 保存请求
     * @return 学科
     */
    Subject update(SubjectSaveDTO dto);

    /**
     * 删除学科（逻辑删除）
     * @param id 学科ID
     */
    void delete(Long id);

    /**
     * 校验保存请求
     * @param dto 保存请求
     */
    void validateSubjectSave(SubjectSaveDTO dto);
}
