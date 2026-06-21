package com.kidgame.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.kidgame.dao.entity.DailySession;
import com.kidgame.dao.entity.Question;
import com.kidgame.service.dto.AnswerDTO;
import com.kidgame.service.dto.PracticeStartDTO;

import java.util.List;
import java.util.Map;

/**
 * 每日练习会话业务服务
 */
public interface PracticeService extends IService<DailySession> {

    /**
     * 开始会话（创建 DailySession，按条件抽题）
     * @param userId 用户ID
     * @param dto 开始请求
     * @return 会话
     */
    DailySession start(Long userId, PracticeStartDTO dto);

    /**
     * 获取下一题（从已抽题中按顺序返回）
     * @param sessionId 会话ID
     * @return 下一题（无更多题目返回 null）
     */
    Question nextQuestion(Long sessionId);

    /**
     * 提交单题（调用 questionService.submitAnswer，更新会话统计）
     * @param sessionId 会话ID
     * @param dto 答题请求
     * @return 答题结果
     */
    AnswerDTO.Result submit(Long sessionId, AnswerDTO dto);

    /**
     * 结束会话（status=1，设置 endTime、duration）
     * @param sessionId 会话ID
     * @return 会话
     */
    DailySession finish(Long sessionId);

    /**
     * 放弃会话（status=2）
     * @param sessionId 会话ID
     * @return 会话
     */
    DailySession abandon(Long sessionId);

    /**
     * 会话详情
     * @param sessionId 会话ID
     * @return 会话
     */
    DailySession getById(Long sessionId);

    /**
     * 今日会话列表
     * @param userId 用户ID
     * @return 会话列表
     */
    List<DailySession> listToday(Long userId);

    /**
     * 今日统计（会话数、答题数、正确数、游学币）
     * @param userId 用户ID
     * @return 统计信息
     */
    Map<String, Object> todayStats(Long userId);
}
