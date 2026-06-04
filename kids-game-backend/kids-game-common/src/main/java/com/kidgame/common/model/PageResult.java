package com.kidgame.common.model;

import lombok.Data;

import java.io.Serializable;
import java.util.List;

/**
 * 分页返回体
 */
@Data
public class PageResult<T> implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 当前页
     */
    private Long page;

    /**
     * 每页大小
     */
    private Long size;

    /**
     * 总记录数
     */
    private Long total;

    /**
     * 总页数
     */
    private Long totalPages;

    /**
     * 数据列表
     */
    private List<T> records;

    public PageResult() {
    }

    public PageResult(Long page, Long size, Long total, List<T> records) {
        this.page = page;
        this.size = size;
        this.total = total;
        this.records = records;
        this.totalPages = (total + size - 1) / size;
    }

    /**
     * 构建分页结果
     */
    public static <T> PageResult<T> of(Long page, Long size, Long total, List<T> records) {
        return new PageResult<>(page, size, total, records);
    }
}
