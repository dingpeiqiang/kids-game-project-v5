const GAME_STORAGE_KEY = 'kidGameData';

export function saveGameData(data: any) {
  try {
    localStorage.setItem(GAME_STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('[GameStorage] 保存失败:', error);
  }
}

export function loadGameData(): any {
  try {
    const data = localStorage.getItem(GAME_STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('[GameStorage] 加载失败:', error);
    return null;
  }
}

export function clearGameData() {
  localStorage.removeItem(GAME_STORAGE_KEY);
}
