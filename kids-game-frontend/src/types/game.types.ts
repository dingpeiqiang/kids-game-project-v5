/**
 * 游戏分类和筛选系统类型定义
 * 支持大量游戏时的易用性优化
 */

// ==================== 游戏基础类型 ====================

/**
 * 游戏难度等级
 */
export enum GameDifficulty {
  EASY = 'easy',       // 简单
  MEDIUM = 'medium',   // 中等
  HARD = 'hard',       // 困难
  EXPERT = 'expert'    // 专家
}

/**
 * 游戏年龄分级
 */
export enum GameAgeRating {
  AGE_3 = '3+',    // 3岁以上
  AGE_6 = '6+',    // 6岁以上
  AGE_9 = '9+',    // 9岁以上
  AGE_12 = '12+',  // 12岁以上
  AGE_16 = '16+',  // 16岁以上
}

/**
 * 游戏主题标签
 */
export enum GameThemeTag {
  // 学科类型
  MATH = 'math',              // 数学
  LANGUAGE = 'language',      // 语言
  SCIENCE = 'science',        // 科学
  ART = 'art',                // 艺术
  MUSIC = 'music',            // 音乐
  
  // 游戏类型
  PUZZLE = 'puzzle',          // 解谜
  ADVENTURE = 'adventure',    // 冒险
  ACTION = 'action',          // 动作
  STRATEGY = 'strategy',      // 策略
  ARCADE = 'arcade',          // 街机
  EDUCATIONAL = 'educational',// 教育
  
  // 视觉风格
  CARTOON = 'cartoon',        // 卡通
  REALISTIC = 'realistic',    // 写实
  ANIME = 'anime',            // 动漫
  PIXEL = 'pixel',            // 像素
  
  // 特殊属性
  MULTIPLAYER = 'multiplayer',// 多人游戏
  SINGLE_PLAYER = 'single',   // 单人游戏
  OFFLINE = 'offline',        // 离线游戏
  ONLINE = 'online',          // 在线游戏
}

/**
 * 游戏类别（一级分类）
 */
export enum GameCategory {
  EDUCATIONAL = 'educational',  // 教育类
  ENTERTAINMENT = 'entertainment', // 娱乐类
  PUZZLE = 'puzzle',          // 益智类
  ACTION = 'action',          // 动作类
  ADVENTURE = 'adventure',    // 冒险类
  STRATEGY = 'strategy',      // 策略类
  SIMULATION = 'simulation',  // 模拟类
  SPORTS = 'sports',          // 体育类
  MUSIC = 'music',            // 音乐类
  ART = 'art',                // 艺术类
}

/**
 * 游戏子类别（二级分类）
 */
export enum GameSubCategory {
  // 教育类子类
  MATH = 'math',              // 数学
  LANGUAGE = 'language',      // 语言
  SCIENCE = 'science',        // 科学
  GEOGRAPHY = 'geography',    // 地理
  HISTORY = 'history',        // 历史
  LOGIC = 'logic',            // 逻辑
  
  // 益智类子类
  MEMORY = 'memory',          // 记忆
  PATTERN = 'pattern',        // 模式识别
  MAZE = 'maze',              // 迷宫
  MATCHING = 'matching',      // 配对
  
  // 动作类子类
  SHOOTING = 'shooting',      // 射击
  PLATFORM = 'platform',      // 平台跳跃
  RACING = 'racing',          // 赛车
  FIGHTING = 'fighting',      // 格斗
}

// ==================== 游戏详细信息 ====================

/**
 * 游戏扩展信息
 */
export interface GameExtendedInfo {
  // 基本信息
  icon?: string;              // 游戏图标URL
  coverImage?: string;        // 封面图URL
  screenshots?: string[];     // 截图URL列表
  videoPreview?: string;      // 预览视频URL
  
  // 游戏属性
  difficulty: GameDifficulty; // 难度等级
  ageRating: GameAgeRating;   // 年龄分级
  estimatedPlayTime: number;  // 预计游戏时长（分钟）
  minPlayers: number;         // 最少玩家数
  maxPlayers: number;         // 最多玩家数
  
  // 分类标签
  category: GameCategory;     // 主类别
  subCategory?: GameSubCategory; // 子类别
  tags: GameThemeTag[];       // 主题标签
  
  // 教育属性
  educationalObjectives?: string[]; // 教育目标
  skillsDeveloped?: string[]; // 培养技能
  
  // 游戏数据
  rating?: number;            // 评分（0-5）
  reviewCount?: number;       // 评价数量
  averageScore?: number;      // 平均得分
  completionRate?: number;    // 完成率
  popularRank?: number;       // 热门排名
}

/**
 * 完整的游戏信息
 */
export interface FullGameInfo {
  // 基础信息
  gameId: number;
  gameName: string;
  gameCode: string;
  gameUrl?: string;
  status?: string;
  
  // 扩展信息
  extended?: GameExtendedInfo;
  
  // 统计信息
  playCount?: number;         // 游玩次数
  totalPlayTime?: number;     // 总游玩时长（分钟）
  lastPlayed?: Date;          // 最后游玩时间
  favoriteCount?: number;     // 收藏次数
}

// ==================== 筛选和分类系统 ====================

/**
 * 游戏筛选条件
 */
export interface GameFilterCriteria {
  // 分类筛选
  category?: GameCategory;
  subCategory?: GameSubCategory;
  tags?: GameThemeTag[];
  
  // 属性筛选
  difficulty?: GameDifficulty | GameDifficulty[];
  ageRating?: GameAgeRating | GameAgeRating[];
  minPlayers?: number;
  maxPlayers?: number;
  
  // 时间筛选
  minPlayTime?: number;
  maxPlayTime?: number;
  
  // 排序方式
  sortBy?: 'name' | 'difficulty' | 'rating' | 'popularity' | 'playCount' | 'recent';
  sortOrder?: 'asc' | 'desc';
  
  // 搜索关键词
  keyword?: string;
  
  // 分页
  page?: number;
  pageSize?: number;
}

/**
 * 分类统计信息
 */
export interface CategoryStats {
  category: GameCategory;
  count: number;
  subCategories?: {
    subCategory: GameSubCategory;
    count: number;
  }[];
}

/**
 * 标签云数据
 */
export interface TagCloudItem {
  tag: GameThemeTag;
  count: number;
  label: string;  // 中文标签
}

// ==================== 用户偏好和推荐 ====================

/**
 * 用户游戏偏好
 */
export interface UserGamePreference {
  userId: number;
  
  // 喜欢的游戏类型
  preferredCategories: GameCategory[];
  preferredTags: GameThemeTag[];
  difficultyPreference: GameDifficulty;
  
  // 游玩历史
  recentlyPlayedGames: number[];      // 最近游玩游戏ID
  frequentlyPlayedGames: number[];    // 经常游玩游戏ID
  favoriteGames: number[];            // 收藏的游戏ID
  
  // 评分和反馈
  ratedGames: Record<number, number>; // gameId -> 评分（1-5）
  completedGames: number[];           // 完成的游戏ID
  
  // 更新时间
  lastUpdated: Date;
}

/**
 * 游戏推荐规则
 */
export interface GameRecommendationRule {
  id: string;
  name: string;
  description: string;
  
  // 匹配条件
  conditions: GameFilterCriteria;
  
  // 权重和优先级
  weight: number;
  priority: number;
  
  // 推荐理由
  reasonTemplate: string;
}

// ==================== 游戏分组和管理 ====================

/**
 * 游戏分组
 */
export interface GameGroup {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  
  // 分组类型
  type: 'system' | 'user' | 'smart'; // 系统分组/用户自定义/智能分组
  
  // 分组规则
  rule?: GameFilterCriteria;         // 智能分组的规则
  gameIds?: number[];                // 手动指定的游戏ID
  
  // 统计信息
  gameCount: number;
  createdBy?: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 批量操作配置
 */
export interface BatchOperationConfig {
  operation: 'add' | 'remove' | 'update' | 'export';
  targetType: 'game' | 'group' | 'theme';
  criteria?: GameFilterCriteria;
  gameIds?: number[];
  data?: Record<string, any>;
}

// ==================== API 响应类型 ====================

/**
 * 游戏列表响应（支持分页和筛选）
 */
export interface GameListResponse {
  games: FullGameInfo[];
  total: number;
  page: number;
  pageSize: number;
  filters?: GameFilterCriteria;
  
  // 分类统计
  categoryStats?: CategoryStats[];
  tagCloud?: TagCloudItem[];
  
  // 用户相关
  userPreference?: UserGamePreference;
  recommendations?: number[]; // 推荐游戏ID
}

/**
 * 游戏详情响应
 */
export interface GameDetailResponse extends FullGameInfo {
  // 相关游戏
  similarGames?: FullGameInfo[];
  
  // 用户特定数据
  userStats?: {
    playCount: number;
    totalPlayTime: number;
    bestScore?: number;
    completed: boolean;
    favorite: boolean;
  };
  
  // 排行榜数据
  leaderboard?: {
    userId: number;
    username: string;
    score: number;
    rank: number;
  }[];
}