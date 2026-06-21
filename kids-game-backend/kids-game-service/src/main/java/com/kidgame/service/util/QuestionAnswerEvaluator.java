package com.kidgame.service.util;

import com.alibaba.fastjson2.JSON;
import com.alibaba.fastjson2.JSONArray;
import com.alibaba.fastjson2.JSONObject;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.TreeSet;

/**
 * 题目答案比对器
 *
 * 支持题型：
 * - single / choice：单选（兼容历史 choice）
 * - multiple：多选（全对才正确）
 * - judge / judgment：判断（兼容历史 judgment）
 * - fill：填空（支持多空、容错、关键词）
 * - short_answer：简答（关键词辅助判分）
 * - image / audio：按 answerMode 判分
 *
 * 填空题 correctAnswer 约定：
 * - 单空：直接写答案，如 "北京"
 * - 多空：用 ||| 分隔，如 "北京|||上海|||广州"
 * - 每空多备选答案：用 | 分隔，如 "北京|北平|||上海|沪"
 *
 * fillConfig JSON 约定：
 * {
 *   "tolerance": "IGNORE_CASE",        // 容错模式：EXACT/IGNORE_CASE/IGNORE_WHITESPACE/IGNORE_PUNCTUATION/KEYWORD
 *   "caseSensitive": false,
 *   "ignoreWhitespace": true,
 *   "ignorePunctuation": false
 * }
 */
public final class QuestionAnswerEvaluator {

    /** 多空分隔符 */
    private static final String MULTI_BLANK_SEP = "|||";
    /** 同空备选答案分隔符 */
    private static final String ALT_ANSWER_SEP = "|";
    /** 多选答案分隔符（用户提交时） */
    private static final String MULTI_CHOICE_SEP = ",";

    private QuestionAnswerEvaluator() {
    }

    /**
     * 判分入口
     */
    public static boolean isCorrect(QuestionContext ctx, String userAnswer) {
        if (ctx == null || !StringUtils.hasText(ctx.correctAnswer)) {
            return false;
        }
        String type = normalizeType(ctx.type);
        switch (type) {
            case "single":
                return isSingleCorrect(ctx, userAnswer);
            case "multiple":
                return isMultipleCorrect(ctx, userAnswer);
            case "judge":
                return isJudgeCorrect(ctx, userAnswer);
            case "fill":
                return isFillCorrect(ctx, userAnswer);
            case "short_answer":
                return isShortAnswerCorrect(ctx, userAnswer);
            case "image":
            case "audio":
                // 图片/音频题按 answerMode 决定判分方式
                return isMediaCorrect(ctx, userAnswer);
            default:
                return isSingleCorrect(ctx, userAnswer);
        }
    }

    /**
     * 规范化正确答案（用于展示）
     */
    public static String normalizeCorrectAnswer(QuestionContext ctx) {
        if (ctx == null || !StringUtils.hasText(ctx.correctAnswer)) {
            return "";
        }
        String type = normalizeType(ctx.type);
        String raw = ctx.correctAnswer.trim();
        switch (type) {
            case "judge":
                return normalizeJudgment(raw);
            case "fill":
                return normalizeFillCorrect(raw);
            case "multiple":
                return normalizeMultipleCorrect(ctx, raw);
            case "short_answer":
                return raw;
            default:
                return normalizeChoiceAnswer(raw, ctx.options);
        }
    }

    /**
     * 规范化用户答案（用于展示）
     */
    public static String normalizeUserAnswer(QuestionContext ctx, String userAnswer) {
        if (!StringUtils.hasText(userAnswer)) {
            return "";
        }
        String type = normalizeType(ctx.type);
        String raw = userAnswer.trim();
        switch (type) {
            case "judge":
                return normalizeJudgment(raw);
            case "fill":
            case "short_answer":
                return raw;
            case "multiple":
                return normalizeMultipleUser(ctx, raw);
            default:
                return normalizeChoiceAnswer(raw, ctx.options);
        }
    }

    // ==================== 题型判分实现 ====================

    /** 单选题判分 */
    private static boolean isSingleCorrect(QuestionContext ctx, String userAnswer) {
        String normalizedUser = normalizeChoiceAnswer(userAnswer, ctx.options);
        String normalizedCorrect = normalizeChoiceAnswer(ctx.correctAnswer, ctx.options);
        return StringUtils.hasText(normalizedUser) && normalizedUser.equals(normalizedCorrect);
    }

    /** 多选题判分：用户答案与正确答案的选项集合完全一致才正确 */
    private static boolean isMultipleCorrect(QuestionContext ctx, String userAnswer) {
        Set<String> correctKeys = parseMultipleKeys(ctx.correctAnswer, ctx.options);
        Set<String> userKeys = parseMultipleKeys(userAnswer, ctx.options);
        if (correctKeys.isEmpty() || userKeys.isEmpty()) {
            return false;
        }
        return correctKeys.equals(userKeys);
    }

    /** 判断题判分 */
    private static boolean isJudgeCorrect(QuestionContext ctx, String userAnswer) {
        String normalizedUser = normalizeJudgment(userAnswer);
        String normalizedCorrect = normalizeJudgment(ctx.correctAnswer);
        return StringUtils.hasText(normalizedUser) && normalizedUser.equals(normalizedCorrect);
    }

    /** 填空题判分：支持多空、备选答案、容错模式 */
    private static boolean isFillCorrect(QuestionContext ctx, String userAnswer) {
        FillConfig config = parseFillConfig(ctx.fillConfig);
        // 正确答案按多空拆分
        String[] correctBlanks = ctx.correctAnswer.split(escapeRegex(MULTI_BLANK_SEP));
        // 用户答案按多空拆分（用户也用 ||| 分隔多空，或按顺序对应）
        String[] userBlanks = splitUserFillAnswer(userAnswer, correctBlanks.length);

        if (userBlanks.length != correctBlanks.length) {
            return false;
        }
        for (int i = 0; i < correctBlanks.length; i++) {
            if (!isSingleBlankCorrect(correctBlanks[i].trim(), userBlanks[i], config)) {
                return false;
            }
        }
        return true;
    }

    /** 简答题判分：关键词匹配（包含全部关键词判对，否则判错需人工复核） */
    private static boolean isShortAnswerCorrect(QuestionContext ctx, String userAnswer) {
        List<String> keywords = parseStringArray(ctx.shortAnswerKeywords);
        if (keywords.isEmpty()) {
            // 无关键词配置，无法自动判分，返回 false（需人工阅卷）
            return false;
        }
        String normalized = userAnswer.trim().toLowerCase(Locale.ROOT);
        for (String kw : keywords) {
            if (!normalized.contains(kw.trim().toLowerCase(Locale.ROOT))) {
                return false;
            }
        }
        return true;
    }

    /** 图片/音频题判分：按 answerMode 分发 */
    private static boolean isMediaCorrect(QuestionContext ctx, String userAnswer) {
        String mode = ctx.answerMode != null ? ctx.answerMode : "single";
        if ("multiple".equals(mode)) {
            return isMultipleCorrect(ctx, userAnswer);
        }
        if ("text".equals(mode)) {
            return isFillCorrect(ctx, userAnswer);
        }
        return isSingleCorrect(ctx, userAnswer);
    }

    // ==================== 单空判分 ====================

    private static boolean isSingleBlankCorrect(String correctBlank, String userBlank, FillConfig config) {
        // 备选答案按 | 分隔
        String[] alternatives = correctBlank.split(escapeRegex(ALT_ANSWER_SEP));
        String normalizedUser = applyTolerance(userBlank, config);
        for (String alt : alternatives) {
            String normalizedAlt = applyTolerance(alt.trim(), config);
            if (config.tolerance == FillTolerance.KEYWORD) {
                if (normalizedUser.contains(normalizedAlt)) {
                    return true;
                }
            } else if (normalizedUser.equals(normalizedAlt)) {
                return true;
            }
        }
        return false;
    }

    // ==================== 容错处理 ====================

    private static String applyTolerance(String text, FillConfig config) {
        if (text == null) {
            return "";
        }
        String result = text;
        if (config.ignoreWhitespace) {
            result = result.replaceAll("\\s+", "");
        }
        if (config.ignorePunctuation) {
            result = result.replaceAll("[\\p{Punct}\uff0c\u3002\u3001\uff1b\uff1a\uff01\u201c\u201d\u2018\u2019\uff08\uff09\u3010\u3011\u300a\u300b]", "");
        }
        if (!config.caseSensitive) {
            result = result.toLowerCase(Locale.ROOT);
        }
        return result.trim();
    }

    // ==================== 类型归一化 ====================

    /** 归一化题型：兼容历史值 choice→single，judgment→judge */
    public static String normalizeType(String type) {
        if (!StringUtils.hasText(type)) {
            return "single";
        }
        String t = type.trim().toLowerCase(Locale.ROOT);
        switch (t) {
            case "choice":
                return "single";
            case "judgment":
                return "judge";
            default:
                return t;
        }
    }

    // ==================== 选项解析 ====================

    private static String normalizeChoiceAnswer(String raw, String optionsJson) {
        String trimmed = raw.trim();
        // 单字母选项 A/B/C/D
        if (trimmed.length() == 1 && Character.isLetter(trimmed.charAt(0))) {
            List<String> options = parseOptions(optionsJson);
            int idx = Character.toUpperCase(trimmed.charAt(0)) - 'A';
            if (idx >= 0 && idx < options.size()) {
                return options.get(idx).trim();
            }
        }
        List<String> options = parseOptions(optionsJson);
        for (String option : options) {
            if (option.trim().equals(trimmed)) {
                return option.trim();
            }
        }
        return trimmed;
    }

    private static String normalizeJudgment(String value) {
        String v = value.trim();
        if ("true".equalsIgnoreCase(v) || "1".equals(v) || "对".equals(v) || "正确".equals(v) || "是".equals(v)) {
            return "对";
        }
        if ("false".equalsIgnoreCase(v) || "0".equals(v) || "错".equals(v) || "错误".equals(v) || "否".equals(v)) {
            return "错";
        }
        return v;
    }

    private static String normalizeFillCorrect(String raw) {
        // 多空展示用 ||| 分隔，保留备选答案的 |
        return raw.trim();
    }

    private static String normalizeMultipleCorrect(QuestionContext ctx, String raw) {
        Set<String> keys = parseMultipleKeys(raw, ctx.options);
        return String.join(MULTI_CHOICE_SEP, keys);
    }

    private static String normalizeMultipleUser(QuestionContext ctx, String raw) {
        Set<String> keys = parseMultipleKeys(raw, ctx.options);
        return String.join(MULTI_CHOICE_SEP, keys);
    }

    /**
     * 解析多选答案为选项 key 集合（统一转为大写字母 A/B/C/D）
     */
    private static Set<String> parseMultipleKeys(String answer, String optionsJson) {
        Set<String> keys = new TreeSet<>();
        if (!StringUtils.hasText(answer)) {
            return keys;
        }
        List<String> options = parseOptions(optionsJson);
        // 支持逗号、中文逗号、分号分隔
        String[] parts = answer.split("[,，;；]");
        for (String part : parts) {
            String p = part.trim();
            if (p.isEmpty()) {
                continue;
            }
            // 单字母
            if (p.length() == 1 && Character.isLetter(p.charAt(0))) {
                keys.add(String.valueOf(Character.toUpperCase(p.charAt(0))));
                continue;
            }
            // 选项全文 → 转字母
            for (int i = 0; i < options.size(); i++) {
                if (options.get(i).trim().equals(p)) {
                    keys.add(String.valueOf((char) ('A' + i)));
                    break;
                }
            }
        }
        return keys;
    }

    // ==================== 工具方法 ====================

    public static List<String> parseOptions(String optionsJson) {
        List<String> result = new ArrayList<>();
        if (!StringUtils.hasText(optionsJson)) {
            return result;
        }
        String trimmed = optionsJson.trim();
        try {
            JSONArray arr = JSON.parseArray(trimmed);
            for (int i = 0; i < arr.size(); i++) {
                Object item = arr.get(i);
                if (item instanceof JSONObject) {
                    // 支持对象形式选项 {key:"A", content:"..."}
                    JSONObject obj = (JSONObject) item;
                    result.add(obj.getString("content") != null ? obj.getString("content").trim() : String.valueOf(item));
                } else {
                    result.add(String.valueOf(item).trim());
                }
            }
            return result;
        } catch (Exception ignored) {
            for (String part : trimmed.split("[,，]")) {
                if (StringUtils.hasText(part)) {
                    result.add(part.trim());
                }
            }
            return result;
        }
    }

    /** 解析字符串数组字段（knowledgePoints/tags/shortAnswerKeywords） */
    public static List<String> parseStringArray(String json) {
        List<String> result = new ArrayList<>();
        if (!StringUtils.hasText(json)) {
            return result;
        }
        try {
            JSONArray arr = JSON.parseArray(json.trim());
            for (int i = 0; i < arr.size(); i++) {
                result.add(String.valueOf(arr.get(i)).trim());
            }
        } catch (Exception ignored) {
            // 非 JSON，按逗号分隔
            for (String part : json.split("[,，]")) {
                if (StringUtils.hasText(part)) {
                    result.add(part.trim());
                }
            }
        }
        return result;
    }

    /** 解析 Long 数组字段（knowledgePoints 存 ID） */
    public static List<Long> parseLongArray(String json) {
        List<Long> result = new ArrayList<>();
        if (!StringUtils.hasText(json)) {
            return result;
        }
        try {
            JSONArray arr = JSON.parseArray(json.trim());
            for (int i = 0; i < arr.size(); i++) {
                try {
                    result.add(arr.getLong(i));
                } catch (Exception ignored) {
                }
            }
        } catch (Exception ignored) {
            for (String part : json.split("[,，]")) {
                try {
                    result.add(Long.parseLong(part.trim()));
                } catch (Exception ignored2) {
                }
            }
        }
        return result;
    }

    private static String[] splitUserFillAnswer(String userAnswer, int expectedBlanks) {
        if (userAnswer == null) {
            return new String[0];
        }
        // 用户用 ||| 分隔多空
        if (userAnswer.contains(MULTI_BLANK_SEP)) {
            return userAnswer.split(escapeRegex(MULTI_BLANK_SEP));
        }
        // 单空
        return new String[]{userAnswer.trim()};
    }

    private static String escapeRegex(String s) {
        return s.replaceAll("([|])", "\\\\$1");
    }

    private static FillConfig parseFillConfig(String json) {
        FillConfig config = new FillConfig();
        if (!StringUtils.hasText(json)) {
            return config;
        }
        try {
            JSONObject obj = JSON.parseObject(json.trim());
            String tolerance = obj.getString("tolerance");
            if (tolerance != null) {
                config.tolerance = FillTolerance.valueOf(tolerance.toUpperCase(Locale.ROOT));
            }
            Boolean caseSensitive = obj.getBoolean("caseSensitive");
            if (caseSensitive != null) {
                config.caseSensitive = caseSensitive;
            }
            Boolean ignoreWhitespace = obj.getBoolean("ignoreWhitespace");
            if (ignoreWhitespace != null) {
                config.ignoreWhitespace = ignoreWhitespace;
            }
            Boolean ignorePunctuation = obj.getBoolean("ignorePunctuation");
            if (ignorePunctuation != null) {
                config.ignorePunctuation = ignorePunctuation;
            }
        } catch (Exception ignored) {
        }
        return config;
    }

    // ==================== 内部类型 ====================

    enum FillTolerance {
        EXACT, IGNORE_CASE, IGNORE_WHITESPACE, IGNORE_PUNCTUATION, KEYWORD
    }

    static class FillConfig {
        FillTolerance tolerance = FillTolerance.IGNORE_CASE;
        boolean caseSensitive = false;
        boolean ignoreWhitespace = true;
        boolean ignorePunctuation = false;
    }

    /**
     * 题目判分上下文
     * 兼容历史三参构造（type/options/correctAnswer），新增字段可选
     */
    public static class QuestionContext {
        public final String type;
        public final String options;
        public final String correctAnswer;
        public final String fillConfig;
        public final String shortAnswerKeywords;
        public final String answerMode;

        public QuestionContext(String type, String options, String correctAnswer) {
            this(type, options, correctAnswer, null, null, null);
        }

        public QuestionContext(String type, String options, String correctAnswer,
                               String fillConfig, String shortAnswerKeywords, String answerMode) {
            this.type = type;
            this.options = options;
            this.correctAnswer = correctAnswer;
            this.fillConfig = fillConfig;
            this.shortAnswerKeywords = shortAnswerKeywords;
            this.answerMode = answerMode;
        }
    }
}
