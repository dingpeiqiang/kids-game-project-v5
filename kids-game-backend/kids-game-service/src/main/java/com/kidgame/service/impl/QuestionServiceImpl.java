package com.kidgame.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.kidgame.common.constant.ErrorCode;
import com.kidgame.common.exception.BusinessException;
import com.kidgame.common.model.PageResult;
import com.kidgame.dao.entity.AnswerRecord;
import com.kidgame.dao.entity.ParentLimit;
import com.kidgame.dao.entity.Question;
import com.kidgame.dao.mapper.AnswerRecordMapper;
import com.kidgame.dao.mapper.QuestionMapper;
import com.kidgame.service.KidService;
import com.kidgame.service.ParentService;
import com.kidgame.service.QuestionService;
import com.kidgame.service.dto.AnswerDTO;
import com.kidgame.service.dto.QuestionSaveDTO;
import com.kidgame.service.util.QuestionAnswerEvaluator;
import com.kidgame.service.util.QuestionAnswerEvaluator.QuestionContext;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.ZoneId;
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
    private KidService kidService;

    @Autowired
    private ParentService parentService;

    @Override
    public Question getRandomQuestion(String grade) {
        return getRandomQuestion(grade, null);
    }

    @Override
    public Question getRandomQuestion(String grade, List<Long> excludeQuestionIds) {
        if (!StringUtils.hasText(grade)) {
            throw new BusinessException(ErrorCode.PARAM_ERROR_OBJ);
        }
        LambdaQueryWrapper<Question> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Question::getGrade, grade.trim())
                .eq(Question::getStatus, 1);
        if (excludeQuestionIds != null && !excludeQuestionIds.isEmpty()) {
            wrapper.notIn(Question::getQuestionId, excludeQuestionIds);
        }
        List<Question> questions = list(wrapper);

        if (questions.isEmpty() && excludeQuestionIds != null && !excludeQuestionIds.isEmpty()) {
            LambdaQueryWrapper<Question> fallback = new LambdaQueryWrapper<>();
            fallback.eq(Question::getGrade, grade.trim()).eq(Question::getStatus, 1);
            questions = list(fallback);
        }

        if (questions.isEmpty()) {
            throw new BusinessException(ErrorCode.QUESTION_NOT_FOUND_OBJ);
        }

        Random random = new Random();
        Question picked = questions.get(random.nextInt(questions.size()));
        return sanitizeForExam(picked);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public AnswerDTO.Result submitAnswer(AnswerDTO dto) {
        if (dto.getKidId() == null || dto.getQuestionId() == null) {
            throw new BusinessException(ErrorCode.PARAM_ERROR_OBJ);
        }
        if (!StringUtils.hasText(dto.getUserAnswer())) {
            throw new BusinessException(ErrorCode.PARAM_ERROR_OBJ, "答案不能为空");
        }
        Question question = getById(dto.getQuestionId());
        if (question == null) {
            throw new BusinessException(ErrorCode.QUESTION_NOT_FOUND_OBJ);
        }

        QuestionContext ctx = new QuestionContext(
                question.getType(),
                question.getOptions(),
                question.getCorrectAnswer());
        boolean isCorrect = QuestionAnswerEvaluator.isCorrect(ctx, dto.getUserAnswer());
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

        // 更新游学币
        if (getPoints > 0) {
            kidService.updateFatiguePoints(dto.getKidId(), 2, getPoints, dto.getQuestionId());
        }

        // 构建返回结果
        AnswerDTO.Result result = new AnswerDTO.Result();
        result.setIsCorrect(isCorrect);
        result.setCorrectAnswer(QuestionAnswerEvaluator.normalizeCorrectAnswer(ctx));
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
        long startOfDay = LocalDate.now(ZoneId.systemDefault())
                .atStartOfDay(ZoneId.systemDefault())
                .toInstant()
                .toEpochMilli();
        LambdaQueryWrapper<AnswerRecord> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(AnswerRecord::getKidId, kidId)
                .eq(AnswerRecord::getIsCorrect, 1)
                .ge(AnswerRecord::getCreateTime, startOfDay);
        List<AnswerRecord> records = answerRecordMapper.selectList(wrapper);
        return records.stream().mapToInt(r -> r.getGetPoints() != null ? r.getGetPoints() : 0).sum();
    }

    @Override
    public boolean isDailyAnswerLimitReached(Long kidId) {
        int todayPoints = getTodayAnswerPoints(kidId);
        ParentLimit parentLimit = getParentLimit(kidId);
        Integer cap = parentLimit.getDailyAnswerLimit();
        return cap != null && todayPoints >= cap;
    }

    @Override
    public PageResult<Question> pageQuestions(String grade, String type, Integer status, long page, long size) {
        LambdaQueryWrapper<Question> wrapper = new LambdaQueryWrapper<>();
        if (StringUtils.hasText(grade)) {
            wrapper.eq(Question::getGrade, grade);
        }
        if (StringUtils.hasText(type)) {
            wrapper.eq(Question::getType, type);
        }
        if (status != null) {
            wrapper.eq(Question::getStatus, status);
        }
        wrapper.orderByDesc(Question::getUpdateTime);
        Page<Question> pageReq = new Page<>(page, size);
        Page<Question> result = page(pageReq, wrapper);
        return PageResult.of(result.getCurrent(), result.getSize(), result.getTotal(), result.getRecords());
    }

    @Override
    public Question getQuestionDetail(Long questionId) {
        Question question = getById(questionId);
        if (question == null) {
            throw new BusinessException(ErrorCode.QUESTION_NOT_FOUND_OBJ);
        }
        return question;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Question createQuestion(QuestionSaveDTO dto) {
        validateQuestionSave(dto, false);
        long now = System.currentTimeMillis();
        Question question = mapDtoToEntity(dto, new Question());
        question.setCreateTime(now);
        question.setUpdateTime(now);
        if (question.getStatus() == null) {
            question.setStatus(1);
        }
        if (question.getDifficulty() == null) {
            question.setDifficulty(1);
        }
        if (!StringUtils.hasText(question.getType())) {
            question.setType("choice");
        }
        save(question);
        return question;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Question updateQuestion(QuestionSaveDTO dto) {
        if (dto.getQuestionId() == null) {
            throw new BusinessException(ErrorCode.PARAM_ERROR_OBJ);
        }
        Question existing = getById(dto.getQuestionId());
        if (existing == null) {
            throw new BusinessException(ErrorCode.QUESTION_NOT_FOUND_OBJ);
        }
        validateQuestionSave(dto, true);
        mapDtoToEntity(dto, existing);
        existing.setUpdateTime(System.currentTimeMillis());
        updateById(existing);
        return existing;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deleteQuestion(Long questionId) {
        if (!removeById(questionId)) {
            throw new BusinessException(ErrorCode.QUESTION_NOT_FOUND_OBJ);
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public int batchUpdateStatus(List<Long> questionIds, Integer status) {
        if (questionIds == null || questionIds.isEmpty() || status == null) {
            return 0;
        }
        LambdaUpdateWrapper<Question> wrapper = new LambdaUpdateWrapper<>();
        wrapper.in(Question::getQuestionId, questionIds)
                .set(Question::getStatus, status)
                .set(Question::getUpdateTime, System.currentTimeMillis());
        return questionMapper.update(null, wrapper);
    }

    private ParentLimit getParentLimit(Long kidId) {
        try {
            ParentLimit limit = parentService.getParentLimit(kidId);
            if (limit != null) {
                if (limit.getDailyAnswerLimit() == null) {
                    limit.setDailyAnswerLimit(10);
                }
                if (limit.getAnswerGetPoints() == null) {
                    limit.setAnswerGetPoints(1);
                }
                return limit;
            }
        } catch (Exception e) {
            log.warn("Failed to load parent limit for kid {}, using defaults", kidId, e);
        }
        ParentLimit fallback = new ParentLimit();
        fallback.setDailyAnswerLimit(10);
        fallback.setAnswerGetPoints(1);
        return fallback;
    }

    private Question sanitizeForExam(Question question) {
        Question copy = new Question();
        copy.setQuestionId(question.getQuestionId());
        copy.setContent(question.getContent());
        copy.setOptions(question.getOptions());
        copy.setGrade(question.getGrade());
        copy.setType(question.getType());
        copy.setDifficulty(question.getDifficulty());
        copy.setStatus(question.getStatus());
        return copy;
    }

    private void validateQuestionSave(QuestionSaveDTO dto, boolean isUpdate) {
        if (!StringUtils.hasText(dto.getContent())) {
            throw new BusinessException(ErrorCode.PARAM_ERROR_OBJ);
        }
        if (!StringUtils.hasText(dto.getCorrectAnswer())) {
            throw new BusinessException(ErrorCode.PARAM_ERROR_OBJ);
        }
        if (!isUpdate && !StringUtils.hasText(dto.getGrade())) {
            throw new BusinessException(ErrorCode.PARAM_ERROR_OBJ);
        }
        String type = StringUtils.hasText(dto.getType()) ? dto.getType().trim().toLowerCase() : "choice";
        if (!"choice".equals(type) && !"fill".equals(type) && !"judgment".equals(type)) {
            throw new BusinessException(ErrorCode.PARAM_ERROR_OBJ, "题型无效");
        }
        if ("choice".equals(type) || "judgment".equals(type)) {
            List<String> opts = QuestionAnswerEvaluator.parseOptions(dto.getOptions());
            if (opts.isEmpty()) {
                throw new BusinessException(ErrorCode.PARAM_ERROR_OBJ, "选择题/判断题需填写选项");
            }
            QuestionContext ctx = new QuestionContext(type, dto.getOptions(), dto.getCorrectAnswer());
            String normalized = QuestionAnswerEvaluator.normalizeCorrectAnswer(ctx);
            boolean match = opts.stream().anyMatch(o -> o.trim().equals(normalized));
            if ("judgment".equals(type)) {
                match = "对".equals(normalized) || "错".equals(normalized)
                        || opts.stream().anyMatch(o -> o.trim().equalsIgnoreCase(normalized));
            }
            if (!match) {
                if ("choice".equals(type)) {
                    throw new BusinessException(ErrorCode.PARAM_ERROR_OBJ, "正确答案需与选项一致或为 A/B/C/D");
                }
                if ("judgment".equals(type)) {
                    throw new BusinessException(ErrorCode.PARAM_ERROR_OBJ, "判断题正确答案需为 对/错 或与选项一致");
                }
            }
        }
    }

    private Question mapDtoToEntity(QuestionSaveDTO dto, Question target) {
        if (dto.getContent() != null) {
            target.setContent(dto.getContent());
        }
        if (dto.getOptions() != null) {
            target.setOptions(dto.getOptions());
        }
        if (dto.getCorrectAnswer() != null) {
            target.setCorrectAnswer(dto.getCorrectAnswer());
        }
        if (dto.getAnalysis() != null) {
            target.setAnalysis(dto.getAnalysis());
        }
        if (dto.getGrade() != null) {
            target.setGrade(dto.getGrade());
        }
        if (dto.getType() != null) {
            target.setType(dto.getType());
        }
        if (dto.getDifficulty() != null) {
            target.setDifficulty(dto.getDifficulty());
        }
        if (dto.getStatus() != null) {
            target.setStatus(dto.getStatus());
        }
        return target;
    }
}
