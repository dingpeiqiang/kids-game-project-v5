package com.kidgame.service;

import java.util.List;
import java.util.Map;

/**
 * 家长报表业务服务
 */
public interface ParentReportService {

    /**
     * 孩子总览（总答题、正确率、连续天数、游学币、错题数）
     * @param kidId 儿童ID
     * @return 总览信息
     */
    Map<String, Object> kidOverview(Long kidId);

    /**
     * 孩子近 N 天趋势
     * @param kidId 儿童ID
     * @param days 天数
     * @return 趋势信息
     */
    Map<String, Object> kidTrend(Long kidId, int days);

    /**
     * 孩子薄弱知识点（错误率最高的知识点）
     * @param kidId 儿童ID
     * @return 薄弱知识点
     */
    Map<String, Object> kidWeakPoints(Long kidId);

    /**
     * 孩子错题本概览（总数、待复习、已掌握、按学科）
     * @param kidId 儿童ID
     * @return 错题本概览
     */
    Map<String, Object> kidWrongBookOverview(Long kidId);

    /**
     * 孩子最近答题
     * @param kidId 儿童ID
     * @param limit 数量
     * @return 答题记录列表
     */
    List<Map<String, Object>> kidRecentRecords(Long kidId, int limit);
}
