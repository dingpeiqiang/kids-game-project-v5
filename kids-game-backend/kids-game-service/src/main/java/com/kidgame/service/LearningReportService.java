package com.kidgame.service;

import java.util.List;
import java.util.Map;

/**
 * 个人学习报告业务服务
 */
public interface LearningReportService {

    /**
     * 总览（总答题数、正确率、连续天数、游学币总数、错题数）
     * @param userId 用户ID
     * @return 总览信息
     */
    Map<String, Object> overview(Long userId);

    /**
     * 近 N 天答题趋势（每天答题数、正确数、正确率）
     * @param userId 用户ID
     * @param days 天数
     * @return 趋势信息
     */
    Map<String, Object> trend(Long userId, int days);

    /**
     * 知识点掌握度（按知识点分组统计正确率）
     * @param userId 用户ID
     * @return 知识点掌握度
     */
    Map<String, Object> knowledgeMastery(Long userId);

    /**
     * 学科分布（按学科统计答题数、正确率）
     * @param userId 用户ID
     * @return 学科分布
     */
    Map<String, Object> subjectDistribution(Long userId);

    /**
     * 难度分析（按难度统计答题数、正确率）
     * @param userId 用户ID
     * @return 难度分析
     */
    Map<String, Object> difficultyAnalysis(Long userId);

    /**
     * 最近答题记录
     * @param userId 用户ID
     * @param limit 数量
     * @return 答题记录列表
     */
    List<Map<String, Object>> recentRecords(Long userId, int limit);
}
