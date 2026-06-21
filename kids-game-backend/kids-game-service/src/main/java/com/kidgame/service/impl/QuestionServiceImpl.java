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
import com.kidgame.dao.entity.WrongQuestion;
import com.kidgame.dao.mapper.AnswerRecordMapper;
import com.kidgame.dao.mapper.QuestionMapper;
import com.kidgame.dao.mapper.WrongQuestionMapper;
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
import java.util.ArrayList;
import java.util.List;
import java.util.Random;
import java.util.stream.Collectors;

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

    @Autowired
    private WrongQuestionMapper wrongQuestionMapper;

    @Override
    @Deprecated
    public Question getRandomQuestion(String grade) {
        return getRandomQuestion(grade, null);
    }

    @Override
    @Deprecated
    public Question getRandomQuestion(String grade, List<Long> excludeQuestionIds) {
        QuestionQuery query = new QuestionQuery()
                .grade(grade)
                .excludeQuestionIds(excludeQuestionIds);
        return getRandomQuestion(query);
    }

    @Override
    public Question getRandomQuestion(QuestionQuery query) {
        if (query == null || !StringUtils.hasText(query.grade)) {
            throw new BusinessException(ErrorCode.PARAM_ERROR_OBJ);
        }
        LambdaQueryWrapper<Question> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Question::getGrade, query.grade.trim())
                .eq(Question::getStatus, 1);
        if (query.subjectId != null) {
            wrapper.eq(Question::getSubjectId, query.subjectId);
        }
        if (StringUtils.hasText(query.questionType)) {
            // 兼容历史 type 别名
            String type = query.questionType.trim().toLowerCase();
            if ("choice".equals(type)) type = "single";
            if ("judgment".equals(type)) type = "judge";
            wrapper.eq(Question::getType, type);
        }
        if (StringUtils.hasText(query.difficultyRange) && !"ALL".equalsIgnoreCase(query.difficultyRange)) {
            applyDifficultyRange(wrapper, query.difficultyRange);
        }
        if (query.excludeQuestionIds != null && !query.excludeQuestionIds.isEmpty()) {
            wrapper.notIn(Question::getQuestionId, query.excludeQuestionIds);
        }

        List<Question> questions = list(wrapper);

        // 知识点筛选（JSON 字段内存过滤）
        if (query.knowledgePointIds != null && !query.knowledgePointIds.isEmpty() && !questions.isEmpty()) {
            questions = questions.stream()
                    .filter(q -> containsAnyKnowledgePoint(q.getKnowledgePoints(), query.knowledgePointIds))
                    .collect(Collectors.toList());
        }

        // 回退：排除后为空则去掉排除条件重查
        if (questions.isEmpty() && query.excludeQuestionIds != null && !query.excludeQuestionIds.isEmpty()) {
            LambdaQueryWrapper<Question> fallback = new LambdaQueryWrapper<>();
            fallback.eq(Question::getGrade, query.grade.trim()).eq(Question::getStatus, 1);
            if (query.subjectId != null) {
                fallback.eq(Question::getSubjectId, query.subjectId);
            }
            if (StringUtils.hasText(query.questionType)) {
                fallback.eq(Question::getType, query.questionType);
            }
            if (StringUtils.hasText(query.difficultyRange) && !"ALL".equalsIgnoreCase(query.difficultyRange)) {
                applyDifficultyRange(fallback, query.difficultyRange);
            }
            questions = list(fallback);
            if (query.knowledgePointIds != null && !query.knowledgePointIds.isEmpty() && !questions.isEmpty()) {
                questions = questions.stream()
                        .filter(q -> containsAnyKnowledgePoint(q.getKnowledgePoints(), query.knowledgePointIds))
                        .collect(Collectors.toList());
            }
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

        // 构造判分上下文（含填空配置、简答关键词、作答模式）
        QuestionContext ctx = new QuestionContext(
                question.getType(),
                question.getOptions(),
                question.getCorrectAnswer(),
                question.getFillConfig(),
                question.getShortAnswerKeywords(),
                question.getAnswerMode());
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

        // 记录答题（填充新字段）
        AnswerRecord record = new AnswerRecord();
        record.setKidId(dto.getKidId());
        record.setQuestionId(dto.getQuestionId());
        record.setSessionId(dto.getSessionId());
        record.setSubjectId(question.getSubjectId());
        record.setKnowledgePointIds(question.getKnowledgePoints());
        record.setQuestionType(question.getType());
        record.setDifficulty(question.getDifficulty());
        record.setUserAnswer(dto.getUserAnswer());
        record.setIsCorrect(isCorrect ? 1 : 0);
        record.setIsMarked(Boolean.TRUE.equals(dto.getMarked()) ? 1 : 0);
        record.setIsCollected(Boolean.TRUE.equals(dto.getCollected()) ? 1 : 0);
        record.setIsWrong(isCorrect ? 0 : 1);
        record.setGetPoints(getPoints);
        record.setAnswerTime(dto.getAnswerTime());
        record.setCreateTime(System.currentTimeMillis());
        answerRecordMapper.insert(record);

        // 错题本联动：答错自动加入错题本
        boolean addedToWrongBook = false;
        if (!isCorrect) {
            addedToWrongBook = addToWrongBook(dto.getKidId(), question, dto.getUserAnswer());
        }

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
        result.setQuestionType(question.getType());
        result.setKnowledgePoints(question.getKnowledgePoints());
        result.setAddedToWrongBook(addedToWrongBook);

        // 简答题返回关键词匹配提示
        String normalizedType = QuestionAnswerEvaluator.normalizeType(question.getType());
        if ("short_answer".equals(normalizedType)) {
            result.setMatchedKeywords(calcMatchedKeywords(question.getShortAnswerKeywords(), dto.getUserAnswer()));
        }

        log.info("Answer submitted. KidId: {}, QuestionId: {}, Type: {}, IsCorrect: {}, GetPoints: {}, AddedToWrongBook: {}",
                dto.getKidId(), dto.getQuestionId(), question.getType(), isCorrect, getPoints, addedToWrongBook);

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
        QuestionPageQuery query = new QuestionPageQuery();
        query.grade = grade;
        query.type = type;
        query.status = status;
        query.page = page;
        query.size = size;
        return pageQuestions(query);
    }

    @Override
    public PageResult<Question> pageQuestions(QuestionPageQuery query) {
        LambdaQueryWrapper<Question> wrapper = new LambdaQueryWrapper<>();
        if (StringUtils.hasText(query.grade)) {
            wrapper.eq(Question::getGrade, query.grade);
        }
        if (query.subjectId != null) {
            wrapper.eq(Question::getSubjectId, query.subjectId);
        }
        if (StringUtils.hasText(query.type)) {
            wrapper.eq(Question::getType, query.type);
        }
        if (query.difficulty != null) {
            wrapper.eq(Question::getDifficulty, query.difficulty);
        }
        if (query.status != null) {
            wrapper.eq(Question::getStatus, query.status);
        }
        if (StringUtils.hasText(query.keyword)) {
            wrapper.like(Question::getContent, query.keyword);
        }
        wrapper.orderByDesc(Question::getUpdateTime);
        Page<Question> pageReq = new Page<>(query.page, query.size);
        Page<Question> result = page(pageReq, wrapper);

        // 知识点筛选（内存过滤）
        List<Question> records = result.getRecords();
        if (query.knowledgePointId != null && !records.isEmpty()) {
            records = records.stream()
                    .filter(q -> containsAnyKnowledgePoint(q.getKnowledgePoints(), List.of(query.knowledgePointId)))
                    .collect(Collectors.toList());
        }
        return PageResult.of(result.getCurrent(), result.getSize(), result.getTotal(), records);
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
            question.setType("single");
        }
        if (question.getScore() == null) {
            question.setScore(1);
        }
        if (question.getTimeLimit() == null) {
            question.setTimeLimit(0);
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

    @Override
    @Transactional(rollbackFor = Exception.class)
    public int batchImport(List<QuestionSaveDTO> questions) {
        if (questions == null || questions.isEmpty()) {
            return 0;
        }
        int inserted = 0;
        long now = System.currentTimeMillis();
        for (QuestionSaveDTO dto : questions) {
            // 基本校验：type 和 content 必填
            if (!StringUtils.hasText(dto.getContent()) || !StringUtils.hasText(dto.getType())) {
                log.warn("批量导入跳过：type 或 content 为空, content={}", dto.getContent());
                continue;
            }
            // 查重：按 content + type 判断是否已存在
            LambdaQueryWrapper<Question> dupCheck = new LambdaQueryWrapper<>();
            dupCheck.eq(Question::getContent, dto.getContent().trim())
                    .eq(Question::getType, dto.getType().trim().toLowerCase());
            if (count(dupCheck) > 0) {
                log.info("批量导入跳过重复题目: content={}", dto.getContent());
                continue;
            }
            // 构建实体并插入
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
                question.setType("single");
            }
            if (question.getScore() == null) {
                question.setScore(1);
            }
            if (question.getTimeLimit() == null) {
                question.setTimeLimit(0);
            }
            save(question);
            inserted++;
        }
        return inserted;
    }

    // ==================== 内部方法 ====================

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

    /** 返回给儿童的题目需剥离答案与解析 */
    private Question sanitizeForExam(Question question) {
        Question copy = new Question();
        copy.setQuestionId(question.getQuestionId());
        copy.setSubjectId(question.getSubjectId());
        copy.setKnowledgePoints(question.getKnowledgePoints());
        copy.setTags(question.getTags());
        copy.setMediaUrls(question.getMediaUrls());
        copy.setContent(question.getContent());
        copy.setOptions(question.getOptions());
        copy.setGrade(question.getGrade());
        copy.setType(question.getType());
        copy.setDifficulty(question.getDifficulty());
        copy.setScore(question.getScore());
        copy.setTimeLimit(question.getTimeLimit());
        copy.setAnswerMode(question.getAnswerMode());
        copy.setFillConfig(question.getFillConfig());
        copy.setStatus(question.getStatus());
        return copy;
    }

    /** 难度范围筛选 */
    private void applyDifficultyRange(LambdaQueryWrapper<Question> wrapper, String range) {
        switch (range.toUpperCase()) {
            case "EASY":
                wrapper.in(Question::getDifficulty, 1, 2);
                break;
            case "MEDIUM":
                wrapper.eq(Question::getDifficulty, 3);
                break;
            case "HARD":
                wrapper.in(Question::getDifficulty, 4, 5);
                break;
            default:
                break;
        }
    }

    /** 检查题目的知识点是否包含指定任一知识点 */
    private boolean containsAnyKnowledgePoint(String knowledgePointsJson, List<Long> targetIds) {
        if (!StringUtils.hasText(knowledgePointsJson) || targetIds == null || targetIds.isEmpty()) {
            return false;
        }
        List<Long> questionKps = QuestionAnswerEvaluator.parseLongArray(knowledgePointsJson);
        for (Long target : targetIds) {
            if (questionKps.contains(target)) {
                return true;
            }
        }
        return false;
    }

    /** 答错自动加入错题本（已存在则更新错误次数与时间） */
    private boolean addToWrongBook(Long kidId, Question question, String userAnswer) {
        try {
            LambdaQueryWrapper<WrongQuestion> wrapper = new LambdaQueryWrapper<>();
            wrapper.eq(WrongQuestion::getUserId, kidId)
                    .eq(WrongQuestion::getQuestionId, question.getQuestionId());
            WrongQuestion existing = wrongQuestionMapper.selectOne(wrapper);
            long now = System.currentTimeMillis();
            if (existing != null) {
                existing.setWrongCount((existing.getWrongCount() != null ? existing.getWrongCount() : 0) + 1);
                existing.setLastWrongTime(now);
                existing.setLastWrongAnswer(userAnswer);
                // 重新答错则重置掌握度
                if (existing.getMasteryLevel() != null && existing.getMasteryLevel() > 0) {
                    existing.setMasteryLevel(0);
                    existing.setStatus(1);
                }
                existing.setUpdateTime(now);
                wrongQuestionMapper.updateById(existing);
            } else {
                WrongQuestion wq = new WrongQuestion();
                wq.setUserId(kidId);
                wq.setQuestionId(question.getQuestionId());
                wq.setSubjectId(question.getSubjectId());
                wq.setKnowledgePointIds(question.getKnowledgePoints());
                wq.setWrongCount(1);
                wq.setLastWrongTime(now);
                wq.setLastWrongAnswer(userAnswer);
                wq.setMasteryLevel(0);
                wq.setReviewCount(0);
                wq.setStatus(1);
                wq.setCreateTime(now);
                wq.setUpdateTime(now);
                wrongQuestionMapper.insert(wq);
            }
            return true;
        } catch (Exception e) {
            log.warn("Failed to add to wrong book. kidId={}, questionId={}", kidId, question.getQuestionId(), e);
            return false;
        }
    }

    /** 简答题关键词匹配度计算 */
    private List<String> calcMatchedKeywords(String keywordsJson, String userAnswer) {
        List<String> keywords = QuestionAnswerEvaluator.parseStringArray(keywordsJson);
        if (keywords.isEmpty() || !StringUtils.hasText(userAnswer)) {
            return new ArrayList<>();
        }
        String normalized = userAnswer.trim().toLowerCase();
        List<String> matched = new ArrayList<>();
        for (String kw : keywords) {
            if (normalized.contains(kw.trim().toLowerCase())) {
                matched.add(kw);
            }
        }
        return matched;
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
        String type = StringUtils.hasText(dto.getType()) ? dto.getType().trim().toLowerCase() : "single";
        // 归一化后校验题型
        String normalizedType = QuestionAnswerEvaluator.normalizeType(type);
        if (!isValidType(normalizedType)) {
            throw new BusinessException(ErrorCode.PARAM_ERROR_OBJ, "题型无效");
        }
        // 选择题/判断题需校验选项与答案
        if ("single".equals(normalizedType) || "judge".equals(normalizedType) || "multiple".equals(normalizedType)) {
            List<String> opts = QuestionAnswerEvaluator.parseOptions(dto.getOptions());
            if (opts.isEmpty()) {
                throw new BusinessException(ErrorCode.PARAM_ERROR_OBJ, "选择题/判断题需填写选项");
            }
            QuestionContext ctx = new QuestionContext(type, dto.getOptions(), dto.getCorrectAnswer());
            if ("single".equals(normalizedType)) {
                String normalized = QuestionAnswerEvaluator.normalizeCorrectAnswer(ctx);
                boolean match = opts.stream().anyMatch(o -> o.trim().equals(normalized));
                if (!match && normalized.length() == 1 && Character.isLetter(normalized.charAt(0))) {
                    int idx = normalized.charAt(0) - 'A';
                    match = idx >= 0 && idx < opts.size();
                }
                if (!match) {
                    throw new BusinessException(ErrorCode.PARAM_ERROR_OBJ, "单选题正确答案需与选项一致或为 A/B/C/D");
                }
            } else if ("judge".equals(normalizedType)) {
                String normalized = QuestionAnswerEvaluator.normalizeCorrectAnswer(ctx);
                boolean match = "对".equals(normalized) || "错".equals(normalized)
                        || opts.stream().anyMatch(o -> o.trim().equalsIgnoreCase(normalized));
                if (!match) {
                    throw new BusinessException(ErrorCode.PARAM_ERROR_OBJ, "判断题正确答案需为 对/错 或与选项一致");
                }
            } else if ("multiple".equals(normalizedType)) {
                // 多选题：正确答案应为多个字母或选项，用逗号分隔
                // 校验每个字母/选项都在选项中
                // 此处仅做基本非空校验，详细校验由前端保证
            }
        }
    }

    private boolean isValidType(String normalizedType) {
        return "single".equals(normalizedType) || "multiple".equals(normalizedType)
                || "judge".equals(normalizedType) || "fill".equals(normalizedType)
                || "short_answer".equals(normalizedType) || "image".equals(normalizedType)
                || "audio".equals(normalizedType);
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
        // 新增字段
        target.setSubjectId(dto.getSubjectId());
        target.setKnowledgePoints(dto.getKnowledgePoints());
        target.setTags(dto.getTags());
        target.setMediaUrls(dto.getMediaUrls());
        target.setScore(dto.getScore());
        target.setTimeLimit(dto.getTimeLimit());
        target.setAnswerMode(dto.getAnswerMode());
        target.setFillConfig(dto.getFillConfig());
        target.setShortAnswerKeywords(dto.getShortAnswerKeywords());
        return target;
    }
}
