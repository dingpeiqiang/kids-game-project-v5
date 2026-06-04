import { ref } from 'vue';

const FATIGUE_POINTS_KEY = 'fatiguePoints';
const MAX_DAILY_FATIGUE = 100;

export function useFatigueService() {
  const fatiguePoints = ref<number>(loadFatiguePoints());

  function loadFatiguePoints(): number {
    try {
      const stored = localStorage.getItem(FATIGUE_POINTS_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        const today = new Date().toDateString();
        if (data.date === today) {
          return data.points;
        }
      }
      return MAX_DAILY_FATIGUE;
    } catch (error) {
      console.error('[FatigueService] 加载疲劳点失败:', error);
      return MAX_DAILY_FATIGUE;
    }
  }

  function saveFatiguePoints(points: number) {
    try {
      const data = {
        points,
        date: new Date().toDateString(),
      };
      localStorage.setItem(FATIGUE_POINTS_KEY, JSON.stringify(data));
      fatiguePoints.value = points;
    } catch (error) {
      console.error('[FatigueService] 保存疲劳点失败:', error);
    }
  }

  function consumeFatigue(points: number = 1): boolean {
    if (fatiguePoints.value >= points) {
      saveFatiguePoints(fatiguePoints.value - points);
      return true;
    }
    return false;
  }

  function hasEnoughFatigue(points: number = 1): boolean {
    return fatiguePoints.value >= points;
  }

  function resetDailyFatigue() {
    saveFatiguePoints(MAX_DAILY_FATIGUE);
  }

  return {
    fatiguePoints,
    consumeFatigue,
    hasEnoughFatigue,
    resetDailyFatigue,
  };
}
