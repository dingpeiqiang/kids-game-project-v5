package com.kidgame.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.kidgame.dao.entity.AnswerRecord;
import com.kidgame.dao.entity.Question;
import com.kidgame.common.model.PageResult;
import com.kidgame.service.dto.AnswerDTO;
import com.kidgame.service.dto.QuestionSaveDTO;

import java.util.List;

/**
 * 题目业务服务
 */
public interface QuestionService extends IService<Question> {

    /**
     * 获取随机题目（按学龄）
     * @deprecated 使用 {@link #getRandomQuestion(QuestionQuery)} 支持更多筛选
     */
    @Deprecated
    Question getRandomQuestion(String grade);

    /**
     * 获取随机题目（可排除已做题目，避免连续重复）
     * @deprecated 使用 {@link #getRandomQuestion(QuestionQuery)} 支持更多筛选
     */
    @Deprecated
    Question getRandomQuestion(String grade, List<Long> excludeQuestionIds);

    /**
     * 按条件随机抽题（支持学科、知识点、难度、题型筛选）
     */
 Question getRandomQuestion(QuestionQuery query);

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
     * 获取今日答题获得游学币
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

    /**
     * 管理端分页查询题目（基础筛选）
     */
    PageResult<Question> pageQuestions(String grade, String type, Integer status, long page, long size);

    /**
     * 管理端分页查询题目（多条件筛选）
     */
    PageResult<Question> pageQuestions(QuestionPageQuery query);

    /**
     * 管理端题目详情
     */
    Question getQuestionDetail(Long questionId);

    /**
     * 创建题目
     */
    Question createQuestion(QuestionSaveDTO dto);

    /**
     * 更新题目
     */
    Question updateQuestion(QuestionSaveDTO dto);

    /**
     * 删除题目（逻辑删除）
     */
    void deleteQuestion(Long questionId);

    /**
     * 批量更新状态
     */
    int batchUpdateStatus(List<Long> questionIds, Integer status);

    /**
     * 批量导入题目
     * @param questions 题目列表
     * @return 实际插入数量
     */
    int batchImport(List<QuestionSaveDTO> questions);

    /**
     * 抽题查询条件
     */
    class QuestionQuery {
        public String grade;
        public Long subjectId;
        public List<Long> knowledgePointIds;
        public String difficultyRange; // ALL/EASY/MEDIUM/HARD
        public String questionType;
        public List<Long> excludeQuestionIds;

        public QuestionQuery grade(String g) { this.grade = g; return this; }
        public QuestionQuery subjectId(Long s) { this.subjectId = s; return this; }
        public QuestionQuery knowledgePointIds(List<Long> k) { this.knowledgePointIds = k; return this; }
        public QuestionQuery difficultyRange(String d) { this.difficultyRange = d; return this; }
        public QuestionQuery questionType(String t) { this.questionType = t; return this; }
        public QuestionQuery excludeQuestionIds(List<Long> e) { this.excludeQuestionIds = e; return this; }
    }

    /**
     * 分页查询条件
     */
    class QuestionPageQuery {
        public String grade;
        public Long subjectId;
        public String type;
        public Integer difficulty;
        public Integer status;
        public String keyword; // 题干关键词搜索
        public Long knowledgePointId;
        public long page = 1;
        public long size = 10;
    }
}
