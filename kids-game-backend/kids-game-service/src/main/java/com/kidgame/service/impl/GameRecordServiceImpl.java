package com.kidgame.service.impl;

import com.kidgame.dao.mapper.GameSessionScoreMapper;
import com.kidgame.service.GameRecordService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class GameRecordServiceImpl implements GameRecordService {

    private final GameSessionScoreMapper gameSessionScoreMapper;

    @Override
    public List<Map<String, Object>> getUserGameRecords(Long userId) {
        return gameSessionScoreMapper.selectUserGameRecords(userId);
    }
}
