package com.kidgame.service.impl;

import com.kidgame.dao.entity.UserGameRecord;
import com.kidgame.dao.mapper.UserGameRecordMapper;
import com.kidgame.service.UserGameRecordService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 用户游戏记录服务实现
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class UserGameRecordServiceImpl implements UserGameRecordService {

    private final UserGameRecordMapper userGameRecordMapper;

    private static final DateTimeFormatter ISO_FORMATTER = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    @Override
    @Transactional
    public void saveGameRecord(Long userId, Integer gameId, Integer score, Boolean isNewBest) {
        UserGameRecord record = new UserGameRecord();
        record.setUserId(userId);
        record.setGameId(gameId);
        record.setScore(score);
        record.setIsNewBest(isNewBest);
        record.setPlayedAt(LocalDateTime.now());
        record.setCreatedAt(LocalDateTime.now());
        
        userGameRecordMapper.insert(record);
        log.info("保存游戏记录: userId={}, gameId={}, score={}", userId, gameId, score);
    }

    @Override
    public List<GameRecordDTO> getRecentRecords(Long userId, Integer limit) {
        List<UserGameRecord> records = userGameRecordMapper.selectRecentRecords(userId, limit);
        return records.stream()
                .map(r -> new GameRecordDTO(
                        r.getGameId(),
                        r.getScore(),
                        r.getPlayedAt().format(ISO_FORMATTER),
                        r.getIsNewBest()
                ))
                .collect(Collectors.toList());
    }

    @Override
    public List<Integer> getFrequentGames(Long userId, Integer limit) {
        List<UserGameRecordMapper.GamePlayCount> counts = userGameRecordMapper.selectFrequentGames(userId, limit);
        return counts.stream()
                .map(UserGameRecordMapper.GamePlayCount::getGameId)
                .collect(Collectors.toList());
    }
}