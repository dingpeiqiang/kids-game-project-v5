/**
 * 配置类型声明
 */

/**
 * 环境配置类型
 */
export interface EnvConfig {
  environment: 'development' | 'test' | 'production';
  apiBaseUrl: string;
  wsBaseUrl: string;
  resourceBaseUrl: string;
}

/**
 * 游戏配置类型
 */
export interface GameConfig {
  // 适龄范围
  ageRange: {
    min: number;
    max: number;
  };

  // 游戏规则
  rules: {
    maxPlayTime: number;
    maxDailyPlayTime: number;
    breakInterval: number;
    breakDuration: number;
  };

  // 积分规则
  points: {
    puzzleComplete: number;
    arithmeticCorrect: number;
    questionCorrect: number;
    streakBonus: number;
    gameStartCost: number;
    answerReward: number;
    maxDailyAnswerPoints: number;
  };

  // 难度等级
  difficulty: {
    easy: number;
    medium: number;
    hard: number;
  };

  // 疲劳点规则
  fatigue: {
    initialPoints: number;
    pointsPerGame: number;
    dailyReset: boolean;
    maxFatigueLevel: number;
  };
}

/**
 * UI配置类型
 */
export interface UIConfig {
  // 断点配置
  breakpoints: {
    mobile: number;
    tablet: number;
    desktop: number;
  };

  // 字体大小配置
  fontSize: {
    xs: string;
    sm: string;
    base: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
  };

  // 按钮尺寸配置
  button: {
    sm: { padding: string; fontSize: string };
    base: { padding: string; fontSize: string };
    lg: { padding: string; fontSize: string };
    xl: { padding: string; fontSize: string };
  };

  // 游戏容器尺寸
  gameContainer: {
    mobile: { width: number; height: number };
    tablet: { width: number; height: number };
    desktop: { width: number; height: number };
  };
}
