package com.kidgame.dao.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.kidgame.dao.entity.AnswerRecord;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * 答题记录Mapper
 */
@Mapper
public interface AnswerRecordMapper extends BaseMapper<AnswerRecord> {

    /**
     * 根据日期统计答题数据
     */
    @Select("SELECT COUNT(*) as totalCount, SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correctCount " +
            "FROM t_answer_record WHERE DATE(create_time) = #{date}")
    Map<String, Object> selectAnswerStatsByDate(@Param("date") LocalDate date);

    /**
     * 查询指定儿童在指定日期的答题统计
     */
    @Select("SELECT COUNT(*) as totalCount, SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correctCount " +
            "FROM t_answer_record WHERE kid_id = #{kidId} AND DATE(create_time) = #{date}")
    Map<String, Object> selectStatsByKidAndDate(@Param("kidId") Long kidId, @Param("date") LocalDate date);

    /**
     * 查询指定儿童的总答题统计
     */
    @Select("SELECT COUNT(*) as totalCount, SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correctCount " +
            "FROM t_answer_record WHERE kid_id = #{kidId}")
    Map<String, Object> selectTotalStatsByKid(@Param("kidId") Long kidId);

    /**
     * 查询指定儿童的答题记录列表
     */
    @Select("SELECT * FROM t_answer_record WHERE kid_id = #{kidId} ORDER BY create_time DESC LIMIT #{limit}")
    List<AnswerRecord> selectByKidIdWithLimit(@Param("kidId") Long kidId, @Param("limit") int limit);

    /**
     * 查询指定儿童在指定日期范围的答题记录
     */
    @Select("SELECT * FROM t_answer_record WHERE kid_id = #{kidId} " +
            "AND DATE(create_time) >= #{startDate} AND DATE(create_time) <= #{endDate} " +
            "ORDER BY create_time DESC")
    List<AnswerRecord> selectByKidIdAndDateRange(
            @Param("kidId") Long kidId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );
}
