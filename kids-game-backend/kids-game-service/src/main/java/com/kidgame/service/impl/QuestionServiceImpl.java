package com.kidgame.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.kidgame.common.constant.ErrorCode;
import com.kidgame.common.exception.BusinessException;
import com.kidgame.dao.entity.AnswerRecord;
import com.kidgame.dao.entity.FatiguePointsLog;
import com.kidgame.dao.entity.ParentLimit;
import com.kidgame.dao.entity.Question;
import com.kidgame.dao.mapper.AnswerRecordMapper;
import com.kidgame.dao.mapper.FatiguePointsLogMapper;
import com.kidgame.dao.mapper.QuestionMapper;
import com.kidgame.service.QuestionService;
import com.kidgame.service.KidService;
import com.kidgame.service.dto.AnswerDTO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Random;

/**
 * 题目业务服务实现
 */
@Slf4j
@Service
public class QuestionServiceImpl extends ServiceImpl<QuestionMapper, Question> implements QuestionService {

    @Autowired
    private QuestionMapper questionMapper;

    @Autowired
    private AnswerRecordMapper answerRecordMapper;

    @Autowired
    private FatiguePointsLogMapper fatiguePointsLogMapper;

    @Autowired
    private KidService kidService;

    @Override
    public Question getRandomQuestion(String grade) {
        LambdaQueryWrapper<Question> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Question::getGrade, grade)
                .eq(Question::getStatus, 1);
        List<Question> questions = list(wrapper);

        if (questions.isEmpty()) {
            throw new BusinessException(ErrorCode.QUESTION_NOT_FOUND_OBJ);
        }

        // 随机选择一题
        Random random = new Random();
        return questions.get(random.nextInt(questions.size()));
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public AnswerDTO.Result submitAnswer(AnswerDTO dto) {
        Question question = getById(dto.getQuestionId());
        if (question == null) {
            throw new BusinessException(ErrorCode.QUESTION_NOT_FOUND_OBJ);
        }

        // 判断答案是否正确
        boolean isCorrect = question.getCorrectAnswer().equals(dto.getUserAnswer());
        int getPoints = 0;

        // 检查是否达到每日答题上限
        if (isCorrect) {
            int todayPoints = getTodayAnswerPoints(dto.getKidId());
            ParentLimit parentLimit = getParentLimit(dto.getKidId());
            if (todayPoints < parentLimit.getDailyAnswerLimit()) {
                getPoints = parentLimit.getAnswerGetPoints();
            }
        }

        // 记录答题
        AnswerRecord record = new AnswerRecord();
        record.setKidId(dto.getKidId());
        record.setQuestionId(dto.getQuestionId());
        record.setUserAnswer(dto.getUserAnswer());
        record.setIsCorrect(isCorrect ? 1 : 0);
        record.setGetPoints(getPoints);
        record.setAnswerTime(dto.getAnswerTime());
        record.setCreateTime(System.currentTimeMillis());
        answerRecordMapper.insert(record);

        // 更新疲劳点
        if (getPoints > 0) {
            kidService.updateFatiguePoints(dto.getKidId(), 2, getPoints, dto.getQuestionId());
        }

        // 构建返回结果
        AnswerDTO.Result result = new AnswerDTO.Result();
        result.setIsCorrect(isCorrect);
        result.setCorrectAnswer(question.getCorrectAnswer());
        result.setAnalysis(question.getAnalysis());
        result.setGetPoints(getPoints);
        result.setCurrentPoints(kidService.getFatiguePoints(dto.getKidId()));

        log.info("Answer submitted. KidId: {}, QuestionId: {}, IsCorrect: {}, GetPoints: {}",
                dto.getKidId(), dto.getQuestionId(), isCorrect, getPoints);

        return result;
    }

    @Override
    public List<AnswerRecord> getAnswerRecords(Long kidId, Integer limit) {
        LambdaQueryWrapper<AnswerRecord> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(AnswerRecord::getKidId, kidId)
                .orderByDesc(AnswerRecord::getCreateTime)
                .last("LIMIT " + (limit != null ? limit : 20));
        return answerRecordMapper.selectList(wrapper);
    }

    @Override
    public Integer getTodayAnswerPoints(Long kidId) {
        LambdaQueryWrapper<AnswerRecord> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(AnswerRecord::getKidId, kidId)
                .eq(AnswerRecord::getIsCorrect, 1);
        List<AnswerRecord> records = answerRecordMapper.selectList(wrapper);

        // TODO: 这里需要按日期过滤，暂时返回全部
        return records.stream().mapToInt(AnswerRecord::getGetPoints).sum();
    }

    @Override
    public boolean isDailyAnswerLimitReached(Long kidId) {
        int todayPoints = getTodayAnswerPoints(kidId);
        ParentLimit parentLimit = getParentLimit(kidId);
        return todayPoints >= parentLimit.getDailyAnswerLimit();
    }

    private ParentLimit getParentLimit(Long kidId) {
        // TODO: 调用 ParentService 获取管控规则
        ParentLimit limit = new ParentLimit();
        limit.setDailyAnswerLimit(10);
        limit.setAnswerGetPoints(1);
        return limit;
    }
}
