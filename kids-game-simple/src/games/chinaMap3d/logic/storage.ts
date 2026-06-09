import { PlayerRecord } from '../types';

const STORAGE_KEY = 'china_map_3d_records';

const DEFAULT_RECORDS: PlayerRecord = {
  highScore: 0,
  maxLevel: 1,
  perfectCount: 0,
  totalAnswers: 0,
  unlockedKnowledge: [],
};

export function loadRecords(): PlayerRecord {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      return { ...DEFAULT_RECORDS, ...JSON.parse(data) };
    }
  } catch (e) {
    console.error('Failed to load records:', e);
  }
  return { ...DEFAULT_RECORDS };
}

export function saveRecords(records: PlayerRecord): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch (e) {
    console.error('Failed to save records:', e);
  }
}

export function updateHighScore(newScore: number): { newRecord: boolean; records: PlayerRecord } {
  const records = loadRecords();
  const newRecord = newScore > records.highScore;
  if (newRecord) {
    records.highScore = newScore;
    saveRecords(records);
  }
  return { newRecord, records };
}

export function updateMaxLevel(newLevel: number): { newRecord: boolean; records: PlayerRecord } {
  const records = loadRecords();
  const newRecord = newLevel > records.maxLevel;
  if (newRecord) {
    records.maxLevel = newLevel;
    saveRecords(records);
  }
  return { newRecord, records };
}

export function incrementPerfectCount(): PlayerRecord {
  const records = loadRecords();
  records.perfectCount++;
  saveRecords(records);
  return records;
}

export function incrementTotalAnswers(): PlayerRecord {
  const records = loadRecords();
  records.totalAnswers++;
  saveRecords(records);
  return records;
}

export function unlockKnowledge(knowledgeId: string): boolean {
  const records = loadRecords();
  if (!records.unlockedKnowledge.includes(knowledgeId)) {
    records.unlockedKnowledge.push(knowledgeId);
    saveRecords(records);
    return true;
  }
  return false;
}

export function isKnowledgeUnlocked(knowledgeId: string): boolean {
  const records = loadRecords();
  return records.unlockedKnowledge.includes(knowledgeId);
}

export function resetRecords(): PlayerRecord {
  saveRecords(DEFAULT_RECORDS);
  return DEFAULT_RECORDS;
}