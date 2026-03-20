/**
 * 本地存储封装
 */
export class Storage {
  static set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('[Storage] set error:', error);
    }
  }

  static get<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('[Storage] get error:', error);
      return null;
    }
  }

  static remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('[Storage] remove error:', error);
    }
  }

  static clear(): void {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('[Storage] clear error:', error);
    }
  }

  static has(key: string): boolean {
    return localStorage.getItem(key) !== null;
  }
}

export class SessionStorage {
  static set<T>(key: string, value: T): void {
    try {
      sessionStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('[SessionStorage] set error:', error);
    }
  }

  static get<T>(key: string): T | null {
    try {
      const item = sessionStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('[SessionStorage] get error:', error);
      return null;
    }
  }

  static remove(key: string): void {
    try {
      sessionStorage.removeItem(key);
    } catch (error) {
      console.error('[SessionStorage] remove error:', error);
    }
  }

  static clear(): void {
    try {
      sessionStorage.clear();
    } catch (error) {
      console.error('[SessionStorage] clear error:', error);
    }
  }
}
