package com.kidgame.service;

import com.kidgame.common.model.PageResult;
import com.kidgame.dao.entity.QuestionCollection;

/**
 * 题目收藏业务服务
 */
public interface CollectionService {

    /**
     * 分页查询收藏
     * @param userId 用户ID
     * @param page 页码
     * @param size 每页条数
     * @return 分页结果
     */
    PageResult<QuestionCollection> page(Long userId, long page, long size);

    /**
     * 收藏/取消收藏（已收藏则取消，未收藏则添加）
     * @param userId 用户ID
     * @param questionId 题目ID
     * @param note 收藏笔记
     * @return true-已收藏，false-已取消
     */
    boolean toggle(Long userId, Long questionId, String note);

    /**
     * 检查是否已收藏
     * @param userId 用户ID
     * @param questionId 题目ID
     * @return 是否已收藏
     */
    boolean isCollected(Long userId, Long questionId);

    /**
     * 取消收藏
     * @param userId 用户ID
     * @param questionId 题目ID
     */
    void remove(Long userId, Long questionId);
}
