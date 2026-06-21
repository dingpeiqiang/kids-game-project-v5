package com.kidgame.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.kidgame.dao.entity.AnswerRecord;
import com.kidgame.dao.entity.WrongQuestion;
import com.kidgame.dao.mapper.AnswerRecordMapper;
import com.kidgame.dao.mapper.WrongQuestionMapper;
import com.kidgame.service.KidService;
import com.kidgame.service.ParentReportService;
import com.kidgame.service.WrongBookService;
import com.kidgame.service.util.QuestionAnswerEvaluator;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.Date;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;
import java.util.stream.Collectors;

/**
 * 家长报表业务服务实现
 */
@Slf4j
@Service
public class ParentReportServiceImpl implements ParentReportService {

    /** 薄弱知识点取前 N 个 */
    private static final int WEAK_POINTS_LIMIT = 5;

    @Autowired
    private AnswerRecordMapper answerRecordMapper;

    @Autowired
    private WrongQuestionMapper wrongQuestionMapper;

    @Autowired
    private KidService kidService;

    @Autowired
    private WrongBookService wrongBookService;

    @Override
    public Map<String, Object> kidOverview(Long kidId) {
        List<AnswerRecord> records = listAnswerRecords(kidId, null);
        int totalAnswered = records.size();
        int totalCorrect = 0;
        Set<LocalDate> answerDays = new HashSet<>();
        for (AnswerRecord r : records) {
            if (Integer.valueOf(1).equals(r.getIsCorrect())) {
                totalCorrect++;
            }
            if (r.getCreateTime() != null) {
                answerDays.add(toLocalDate(r.getCreateTime()));
            }
        }
        double accuracy = totalAnswered > 0 ? (totalCorrect * 100.0 / totalAnswered) : 0.0;
        int continuousDays = calcContinuousDays(answerDays);

        LambdaQueryWrapper<WrongQuestion> wqWrapper = new LambdaQueryWrapper<>();
        wqWrapper.eq(WrongQuestion::getUserId, kidId)
                .ne(WrongQuestion::getStatus, 0);
        int wrongCount = Math.toIntExact(wrongQuestionMapper.selectCount(wqWrapper));

        Integer fatiguePoints = kidService.getFatiguePoints(kidId);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("kidId", kidId);
        result.put("totalAnswered", totalAnswered);
        result.put("totalCorrect", totalCorrect);
        result.put("accuracy", Math.round(accuracy * 100) / 100.0);
        result.put("continuousDays", continuousDays);
        result.put("fatiguePoints", fatiguePoints != null ? fatiguePoints : 0);
        result.put("wrongCount", wrongCount);
        return result;
    }

    @Override
    public Map<String, Object> kidTrend(Long kidId, int days) {
        long startMs = LocalDate.now().minusDays(days - 1L)
                .atStartOfDay(ZoneId.systemDefault())
                .toInstant()
                .toEpochMilli();
        List<AnswerRecord> records = listAnswerRecords(kidId, startMs);
        Map<LocalDate, int[]> daily = new TreeMap<>();
        for (int i = 0; i < days; i++) {
            daily.put(LocalDate.now().minusDays(i), new int[]{0, 0});
        }
        for (AnswerRecord r : records) {
            if (r.getCreateTime() == null) {
                continue;
            }
            LocalDate day = toLocalDate(r.getCreateTime());
            int[] stat = daily.computeIfAbsent(day, k -> new int[]{0, 0});
            stat[0]++;
            if (Integer.valueOf(1).equals(r.getIsCorrect())) {
                stat[1]++;
            }
        }
        List<Map<String, Object>> points = new ArrayList<>();
        for (Map.Entry<LocalDate, int[]> entry : daily.entrySet()) {
            int answered = entry.getValue()[0];
            int correct = entry.getValue()[1];
            double acc = answered > 0 ? (correct * 100.0 / answered) : 0.0;
            Map<String, Object> point = new LinkedHashMap<>();
            point.put("date", entry.getKey().toString());
            point.put("answered", answered);
            point.put("correct", correct);
            point.put("accuracy", Math.round(acc * 100) / 100.0);
            points.add(point);
        }
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("kidId", kidId);
        result.put("days", days);
        result.put("points", points);
        return result;
    }

    @Override
    public Map<String, Object> kidWeakPoints(Long kidId) {
        // 统计每个知识点的错误数与总答题数，按错误率降序取前5
        List<AnswerRecord> records = listAnswerRecords(kidId, null);
        Map<Long, int[]> statByKp = new HashMap<>(); // [total, wrong]
        for (AnswerRecord r : records) {
            List<Long> kpIds = QuestionAnswerEvaluator.parseLongArray(r.getKnowledgePointIds());
            if (kpIds.isEmpty()) {
                continue;
            }
            boolean isWrong = Integer.valueOf(0).equals(r.getIsCorrect());
            for (Long kpId : kpIds) {
                int[] stat = statByKp.computeIfAbsent(kpId, k -> new int[]{0, 0});
                stat[0]++;
                if (isWrong) {
                    stat[1]++;
                }
            }
        }
        List<Map<String, Object>> items = statByKp.entrySet().stream()
                .map(e -> {
                    int total = e.getValue()[0];
                    int wrong = e.getValue()[1];
                    double wrongRate = total > 0 ? (wrong * 100.0 / total) : 0.0;
                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("knowledgePointId", e.getKey());
                    item.put("total", total);
                    item.put("wrong", wrong);
                    item.put("wrongRate", Math.round(wrongRate * 100) / 100.0);
                    return item;
                })
                .sorted(Comparator.<Map<String, Object>, Double>comparing(m -> (Double) m.get("wrongRate")).reversed()
                        .thenComparingInt(m -> (int) m.get("wrong")).reversed())
                .limit(WEAK_POINTS_LIMIT)
                .collect(Collectors.toList());
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("kidId", kidId);
        result.put("items", items);
        return result;
    }

    @Override
    public Map<String, Object> kidWrongBookOverview(Long kidId) {
        // 复用错题本统计逻辑
        Map<String, Object> stats = wrongBookService.stats(kidId);
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("kidId", kidId);
        result.put("total", stats.get("total"));
        result.put("dueReview", stats.get("dueReview"));
        result.put("mastered", stats.get("mastered"));
        result.put("bySubject", stats.get("bySubject"));
        return result;
    }

    @Override
    public List<Map<String, Object>> kidRecentRecords(Long kidId, int limit) {
        LambdaQueryWrapper<AnswerRecord> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(AnswerRecord::getKidId, kidId)
                .orderByDesc(AnswerRecord::getCreateTime);
        if (limit > 0) {
            wrapper.last("LIMIT " + limit);
        }
        List<AnswerRecord> records = answerRecordMapper.selectList(wrapper);
        List<Map<String, Object>> result = new ArrayList<>();
        for (AnswerRecord r : records) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("recordId", r.getRecordId());
            item.put("questionId", r.getQuestionId());
            item.put("sessionId", r.getSessionId());
            item.put("subjectId", r.getSubjectId());
            item.put("questionType", r.getQuestionType());
            item.put("difficulty", r.getDifficulty());
            item.put("isCorrect", r.getIsCorrect());
            item.put("getPoints", r.getGetPoints());
            item.put("answerTime", r.getAnswerTime());
            item.put("createTime", r.getCreateTime());
            result.add(item);
        }
        return result;
    }

    // ==================== 内部方法 ====================

    /** 查询儿童答题记录（可选起始时间） */
    private List<AnswerRecord> listAnswerRecords(Long kidId, Long startMs) {
        LambdaQueryWrapper<AnswerRecord> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(AnswerRecord::getKidId, kidId);
        if (startMs != null) {
            wrapper.ge(AnswerRecord::getCreateTime, startMs);
        }
        wrapper.orderByDesc(AnswerRecord::getCreateTime);
        return answerRecordMapper.selectList(wrapper);
    }

    /** 毫秒时间戳转 LocalDate */
    private LocalDate toLocalDate(long timestamp) {
        return new Date(timestamp).toInstant()
                .atZone(ZoneId.systemDefault())
                .toLocalDate();
    }

    /** 计算连续答题天数（从今天往前数，今天没答允许从昨天起算） */
    private int calcContinuousDays(Set<LocalDate> answerDays) {
        if (answerDays.isEmpty()) {
            return 0;
        }
        int continuous = 0;
        LocalDate cursor = LocalDate.now();
        if (!answerDays.contains(cursor)) {
            cursor = cursor.minusDays(1);
        }
        while (answerDays.contains(cursor)) {
            continuous++;
            cursor = cursor.minusDays(1);
        }
        return continuous;
    }
}
