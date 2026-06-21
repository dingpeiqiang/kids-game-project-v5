package com.kidgame.service.dto;

import lombok.Data;

/**
 * 题目创建/更新请求
 */
@Data
public class QuestionSaveDTO {

    private Long questionId;

    /** 学科ID */
    private Long subjectId;

    /** 知识点ID数组（JSON 字符串，如 [1,2,3]） */
    private String knowledgePoints;

    /** 标签数组（JSON 字符串，如 ["易错","重点"]） */
    private String tags;

    /** 媒体附件（JSON 字符串，图片/音频/视频 URL 数组） */
    private String mediaUrls;

    /** 题目内容（纯文本或富文本JSON） */
    private String content;

    /**
     * 选项 JSON 数组字符串，如 ["选项A","选项B","选项C","选项D"]
     * 也支持对象数组 [{"key":"A","content":"..."}]
     */
    private String options;

    /** 正确答案（单选为 A 或选项全文；多选为 A,C,D；填空为 北京|||上海；简答为参考答案） */
    private String correctAnswer;

    /** 答案解析 */
    private String analysis;

    /** 适龄阶段 */
    private String grade;

    /**
     * 题型：single-单选，multiple-多选，judge-判断，fill-填空，short_answer-简答，image-图片题，audio-音频题
     * 兼容历史值：choice-单选，judgment-判断
     */
    private String type;

    /** 难度（1-5） */
    private Integer difficulty;

    /** 分值 */
    private Integer score;

    /** 建议答题限时（秒），0表示不限 */
    private Integer timeLimit;

    /** 作答模式：single-单选，multiple-多选，text-文本作答 */
    private String answerMode;

    /** 填空题配置（JSON 字符串） */
    private String fillConfig;

    /** 简答题关键词（JSON 字符串数组） */
    private String shortAnswerKeywords;

    /** 状态：0-禁用 1-启用 */
    private Integer status;
}
