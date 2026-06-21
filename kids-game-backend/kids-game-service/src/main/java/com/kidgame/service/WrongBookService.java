package com.kidgame.service;

import com.kidgame.common.model.PageResult;
import com.kidgame.dao.entity.WrongQuestion;

import java.util.List;
import java.util.Map;

/**
 * 错题本业务服务
 */
public interface WrongBookService {

    /**
     * 分页查询错题
     * @param userId 用户ID
     * @param subjectId 学科ID（可选）
     * @param masteryLevel 掌握度（可选）
     * @param status 状态（可选）
     * @param page 页码
     * @param size 每页条数
     * @return 分页结果
     */
    PageResult<WrongQuestion> page(Long userId, Long subjectId, Integer masteryLevel, Integer status, long page, long size);

    /**
     * 查询到期复习的错题（nextReviewTime <= now）
     * @param userId 用户ID
     * @return 待复习错题列表
     */
    List<WrongQuestion> listDueReview(Long userId);

    /**
     * 复习错题（答对提升掌握度，答错重置）
     * @param userId 用户ID
     * @param questionId 题目ID
     * @param userAnswer 用户答案
     * @param isCorrect 是否正确
     * @return 更新后的错题
     */
    WrongQuestion review(Long userId, Long questionId, String userAnswer, boolean isCorrect);

    /**
     * 标记已掌握（status=0, masteryLevel=3）
     * @param userId 用户ID
     * @param questionId 题目ID
     */
    void markMastered(Long userId, Long questionId);

    /**
     * 移出错题本
     * @param userId 用户ID
     * @param questionId 题目ID
     */
    void remove(Long userId, Long questionId);

    /**
     * 统计（总数、待复习数、已掌握数、按学科分组）
     * @param userId 用户ID
     * @return 统计信息
     */
    Map<String, Object> stats(Long userId);
}
