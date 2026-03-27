/**
 * AI 音乐生成器
 * 专门用于生成游戏背景音乐
 * 
 * 使用方式:
 *   node src/music.js --prompt "欢快的卡通背景音乐" --output bgm.mp3
 *   node src/music.js --prompt "紧张的打Boss音乐" --output battle.mp3
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { dirname } from 'path';

// 简化版 - 依赖主模块
import('./index.js');
