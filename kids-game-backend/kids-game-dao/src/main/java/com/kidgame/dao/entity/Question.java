package com.kidgame.dao.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.io.Serializable;

/**
 * 题目实体
 */
@Data
@TableName("t_question")
public class Question implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 题目ID
     */
    @TableId(value = "question_id", type = IdType.AUTO)
    private Long questionId;

    /**
     * 学科ID
     */
    private Long subjectId;

    /**
     * 知识点ID数组（JSON）
     */
    private String knowledgePoints;

    /**
     * 标签数组（JSON）
     */
    private String tags;

    /**
     * 媒体附件（图片/音频/视频，JSON数组）
     */
    private String mediaUrls;

    /**
     * 题目内容（纯文本或富文本JSON）
     */
    private String content;

    /**
     * 选项（JSON数组）
     */
    private String options;

    /**
     * 正确答案
     */
    private String correctAnswer;

    /**
     * 答案解析
     */
    private String analysis;

    /**
     * 适龄阶段
     */
    private String grade;

    /**
     * 题型：single-单选，multiple-多选，judge-判断，fill-填空，short_answer-简答，image-图片题，audio-音频题
     * 兼容历史值：choice-单选，judgment-判断
     */
    private String type;

    /**
     * 难度（1-5）
     */
    private Integer difficulty;

    /**
     * 分值
     */
    private Integer score;

    /**
     * 建议答题限时（秒），0表示不限
     */
    private Integer timeLimit;

    /**
     * 作答模式：single-单选，multiple-多选，text-文本作答
     */
    private String answerMode;

    /**
     * 填空题配置（JSON：多空、关键词、容错模式）
     */
    private String fillConfig;

    /**
     * 简答题关键词（JSON数组，用于人工阅卷辅助）
     */
    private String shortAnswerKeywords;

    /**
     * 状态：0-禁用，1-启用
     */
    private Integer status;

    /**
     * 创建时间
     */
    private Long createTime;

    /**
     * 更新时间
     */
    private Long updateTime;

    /**
     * 逻辑删除
     */
    @TableLogic
    private Integer deleted;
}
