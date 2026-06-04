package com.kidgame.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.kidgame.dao.entity.AnswerRecord;
import com.kidgame.dao.entity.Question;
import com.kidgame.service.dto.AnswerDTO;

import java.util.List;

/**
 * 题目业务服务
 */
public interface QuestionService extends IService<Question> {

    /**
     * 获取随机题目（按学龄）
     * @param grade 学龄
     * @return 随机题目
     */
    Question getRandomQuestion(String grade);

    /**
     * 提交答案
     * @param dto 答题请求
     * @return 答题结果
     */
    AnswerDTO.Result submitAnswer(AnswerDTO dto);

    /**
     * 获取答题记录
     * @param kidId 儿童ID
     * @param limit 数量限制
     * @return 答题记录列表
     */
    List<AnswerRecord> getAnswerRecords(Long kidId, Integer limit);

    /**
     * 获取今日答题获得疲劳点数
     * @param kidId 儿童ID
     * @return 今日获得的点数
     */
    Integer getTodayAnswerPoints(Long kidId);

    /**
     * 检查是否达到每日答题上限
     * @param kidId 儿童ID
     * @return 是否达到上限
     */
    boolean isDailyAnswerLimitReached(Long kidId);
}
