/**
 * 游戏代码路径扫描器
 *
 * 功能：
 * 1. 扫描指定目录下的游戏项目结构
 * 2. 识别游戏类型（飞机、蛇、坦克、PvZ 等）
 * 3. 提取源码文件列表、核心类/函数、配置文件
 * 4. 输出结构化的 ScanResult，供测试用例生成器使用
 * 5. [API 模式] 从后端 REST API 拉取游戏列表，与本地扫描结果合并
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const { logger } = require('./utils/logger');
const { ensureDir } = require('./utils/helpers');

// ── 常量 ──────────────────────────────────────────────────────────────────────

/** 默认扫描根路径（相对于本文件的位置，往上两级即 kids-game-project-v5） */
const DEFAULT_GAMES_ROOT = path.resolve(__dirname, '../../kids-game-house/games');

/** 游戏类型识别规则（按优先级排序） */
const GAME_TYPE_RULES = [
    { pattern: /plane[-_]?shooter|飞机/i,           type: 'shooter',  label: '飞机大战' },
    { pattern: /snake|贪吃蛇/i,                      type: 'arcade',   label: '贪吃蛇'  },
    { pattern: /tank[-_]?battle|坦克/i,              type: 'action',   label: '坦克大战' },
    { pattern: /plant.*zombie|zombie|pvz|植物/i,     type: 'strategy', label: '植物大战僵尸' },
];

/** 重要源码目录（按优先级） */
const SRC_DIRS = ['src', 'source', 'lib', 'game'];

/** 入口文件名模式 */
const ENTRY_PATTERNS = [
    /^main\.(ts|js|vue)$/i,
    /^index\.(ts|js|vue)$/i,
    /^App\.vue$/i,
    /Game\.(ts|js)$/i,
    /Phaser\.(ts|js)$/i,
];

/** 关键词提取正则（从 TS/JS/Vue 源码中识别核心逻辑） */
const FEATURE_PATTERNS = {
    difficulty:    /difficulty|难度|EASY|NORMAL|HARD/i,
    theme:         /theme|主题|GTRS|ThemeStore/i,
    collision:     /collision|碰撞|hitTest|intersect/i,
    movement:      /movement|move|方向|direction|velocity/i,
    shooting:      /shoot|bullet|子弹|fire|attack/i,
    audio:         /audio|sound|music|bgm|AudioManager/i,
    score:         /score|分数|point|得分/i,
    level:         /level|关卡|stage|wave/i,
    pause:         /pause|暂停|resume/i,
    restart:       /restart|重新开始|retry/i,
    health:        /health|hp|生命|blood/i,
    resource:      /resource|资源|sun|阳光/i,
};

// ── 主类 ──────────────────────────────────────────────────────────────────────

class CodeScanner {
    /**
     * @param {object} options
     * @param {string}   [options.gamesRoot]      游戏根目录
     * @param {string[]} [options.targetGames]    限定扫描的游戏名称列表（为空则扫全部）
     * @param {boolean}  [options.deep]           是否深度分析源码内容（慢但更准确）
     * @param {number}   [options.maxFileSize]    深度分析时读取的最大文件大小（字节）
     * @param {boolean}  [options.apiMode]        是否开启 API 模式（从后端拉取游戏信息）
     * @param {ApiClient} [options.apiClient]     已初始化的 ApiClient 实例（apiMode=true 时使用）
     */
    constructor(options = {}) {
        this.gamesRoot    = options.gamesRoot    || DEFAULT_GAMES_ROOT;
        this.targetGames  = options.targetGames  || [];
        this.deep         = options.deep         !== false; // 默认开启
        this.maxFileSize  = options.maxFileSize  || 256 * 1024; // 256KB
        this.apiMode      = options.apiMode      || false;
        this.apiClient    = options.apiClient    || null;
        this._scanTime    = null;
    }

    // ── 公开 API ─────────────────────────────────────────────────────────────

    /**
     * 执行扫描，返回完整的扫描结果
     * @returns {Promise<ScanReport>}
     */
    async scan() {
        const startTime = Date.now();
        logger.info(`\n🔍 Code Scanner starting...`);
        logger.info(`   Root: ${this.gamesRoot}`);
        if (this.apiMode) logger.info(`   Mode: API（后端 + 本地合并）`);

        // ── API 模式：从后端拉取游戏列表 ────────────────────────────────────
        let apiGames = [];
        if (this.apiMode && this.apiClient) {
            apiGames = await this._fetchGamesFromApi();
        }

        // ── 本地文件系统扫描 ─────────────────────────────────────────────────
        let fileSystemGames = [];
        if (!fs.existsSync(this.gamesRoot)) {
            logger.warn(`   ⚠️  Games root not found: ${this.gamesRoot}`);
            if (!this.apiMode) {
                logger.warn(`       Falling back to config-based scan...`);
                return this._buildEmptyScanReport(startTime, apiGames);
            }
        } else {
            const gameDirs = this._listGameDirs();
            logger.info(`   Found ${gameDirs.length} game director${gameDirs.length === 1 ? 'y' : 'ies'}: ${gameDirs.map(g => g.name).join(', ')}`);

            for (const dir of gameDirs) {
                const profile = await this._scanGameDir(dir);
                fileSystemGames.push(profile);
                const featCount = Object.keys(profile.detectedFeatures).filter(k => profile.detectedFeatures[k]).length;
                logger.info(`   ✅ ${profile.name.padEnd(20)} type=${profile.gameType.padEnd(10)} files=${profile.sourceFiles.length}  features=${featCount}`);
            }
        }

        // ── 合并结果（API 信息注入到 local profile） ────────────────────────
        const mergedGames = this._mergeProfiles(fileSystemGames, apiGames);

        const elapsed = Date.now() - startTime;
        this._scanTime = elapsed;

        const report = {
            scannedAt:    new Date().toISOString(),
            gamesRoot:    this.gamesRoot,
            duration:     elapsed,
            totalGames:   mergedGames.length,
            games:        mergedGames,
            apiMode:      this.apiMode,
            apiGamesCount: apiGames.length,
        };

        logger.info(`   ✅ Scan complete in ${elapsed}ms  (${mergedGames.length} games)\n`);
        return report;
    }

    // ── 内部方法 ─────────────────────────────────────────────────────────────

    /**
     * 列出根目录下所有游戏目录
     * @returns {{ name:string, fullPath:string }[]}
     * @private
     */
    _listGameDirs() {
        const entries = fs.readdirSync(this.gamesRoot, { withFileTypes: true });
        const dirs = entries
            .filter(e => e.isDirectory() && !e.name.startsWith('.'))
            .map(e => ({ name: e.name, fullPath: path.join(this.gamesRoot, e.name) }));

        if (this.targetGames.length > 0) {
            return dirs.filter(d => this.targetGames.some(t =>
                d.name.toLowerCase().includes(t.toLowerCase())
            ));
        }
        return dirs;
    }

    /**
     * 扫描单个游戏目录
     * @private
     */
    async _scanGameDir(dir) {
        const { name, fullPath } = dir;

        const profile = {
            name,
            fullPath,
            gameType:         'unknown',
            gameLabel:        name,
            packageJson:      null,
            entryFiles:       [],
            sourceFiles:      [],
            configFiles:      [],
            testFiles:        [],
            docFiles:         [],
            detectedFeatures: {},
            stats: {
                totalFiles:   0,
                sourceLines:  0,
                tsFiles:      0,
                vueFiles:     0,
                jsFiles:      0,
            }
        };

        // 1. 识别游戏类型
        const typeInfo = this._detectGameType(name);
        profile.gameType  = typeInfo.type;
        profile.gameLabel = typeInfo.label;

        // 2. 读取 package.json
        const pkgPath = path.join(fullPath, 'package.json');
        if (fs.existsSync(pkgPath)) {
            try {
                profile.packageJson = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
            } catch (_) { /* ignore */ }
        }

        // 3. 收集所有文件
        const allFiles = this._collectFiles(fullPath);
        profile.stats.totalFiles = allFiles.length;

        // 4. 分类文件
        for (const f of allFiles) {
            const rel  = path.relative(fullPath, f);
            const ext  = path.extname(f).toLowerCase();
            const base = path.basename(f);

            if (['.ts', '.js', '.vue', '.mjs'].includes(ext)) {
                profile.sourceFiles.push(rel);
                if (ext === '.ts') profile.stats.tsFiles++;
                else if (ext === '.vue') profile.stats.vueFiles++;
                else profile.stats.jsFiles++;

                // 识别入口文件
                if (ENTRY_PATTERNS.some(p => p.test(base))) {
                    profile.entryFiles.push(rel);
                }
            } else if (['.json'].includes(ext) && !rel.includes('node_modules')) {
                profile.configFiles.push(rel);
            } else if (['.md', '.txt'].includes(ext)) {
                profile.docFiles.push(rel);
            }

            // 测试文件
            if (/\.test\.|\.spec\.|__tests__/.test(rel)) {
                profile.testFiles.push(rel);
            }
        }

        // 5. 深度分析源码（提取特性标记）
        if (this.deep) {
            await this._analyzeSourceFeatures(profile);
        }

        return profile;
    }

    /**
     * 递归收集文件（排除 node_modules / dist / .git 等）
     * @private
     */
    _collectFiles(dir, files = []) {
        const IGNORE_DIRS = new Set([
            'node_modules', 'dist', '.git', '.vite', 'coverage', '__pycache__', 'public'
        ]);

        let entries;
        try {
            entries = fs.readdirSync(dir, { withFileTypes: true });
        } catch (_) {
            return files;
        }

        for (const entry of entries) {
            if (IGNORE_DIRS.has(entry.name)) continue;
            const full = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                this._collectFiles(full, files);
            } else if (entry.isFile()) {
                files.push(full);
            }
        }
        return files;
    }

    /**
     * 读取源码文件内容，提取特性标记
     * @private
     */
    async _analyzeSourceFeatures(profile) {
        const features = {};
        Object.keys(FEATURE_PATTERNS).forEach(k => (features[k] = false));

        // 只分析 src/ 目录下的核心源文件，避免读太多
        const coreFiles = profile.sourceFiles
            .filter(rel => {
                const parts = rel.split(path.sep);
                return parts.some(p => SRC_DIRS.includes(p.toLowerCase()));
            })
            .slice(0, 30); // 最多分析 30 个文件

        for (const rel of coreFiles) {
            const full = path.join(profile.fullPath, rel);
            let content = '';
            try {
                const stat = fs.statSync(full);
                if (stat.size > this.maxFileSize) continue;
                content = fs.readFileSync(full, 'utf8');
                profile.stats.sourceLines += content.split('\n').length;
            } catch (_) {
                continue;
            }

            // 检测每个特性关键词
            for (const [key, regex] of Object.entries(FEATURE_PATTERNS)) {
                if (!features[key] && regex.test(content)) {
                    features[key] = true;
                }
            }
        }

        profile.detectedFeatures = features;
    }

    /**
     * 根据目录名推断游戏类型
     * @private
     */
    _detectGameType(dirName) {
        for (const rule of GAME_TYPE_RULES) {
            if (rule.pattern.test(dirName)) {
                return { type: rule.type, label: rule.label };
            }
        }
        return { type: 'unknown', label: dirName };
    }

    /**
     * 当游戏根目录不存在时，返回空报告（或仅 API 结果）
     * @private
     */
    _buildEmptyScanReport(startTime, apiGames = []) {
        return {
            scannedAt:  new Date().toISOString(),
            gamesRoot:  this.gamesRoot,
            duration:   Date.now() - startTime,
            totalGames: apiGames.length,
            games:      apiGames,
            warning:    apiGames.length ? undefined : 'Games root directory not found',
            apiMode:    this.apiMode,
            apiGamesCount: apiGames.length,
        };
    }

    // ── API 模式相关 ──────────────────────────────────────────────────────────

    /**
     * 从后端 API 获取游戏列表，转换为 GameProfile 格式
     * @private
     * @returns {Promise<GameProfile[]>}
     */
    async _fetchGamesFromApi() {
        logger.info(`   🌐 Fetching game list from backend API...`);
        try {
            const result = await this.apiClient.getGameList({ size: 100 });
            // 兼容分页格式 { records: [...] } 或直接数组
            const list = Array.isArray(result) ? result
                       : Array.isArray(result?.records) ? result.records
                       : Array.isArray(result?.list)    ? result.list
                       : Array.isArray(result?.content) ? result.content
                       : [];

            logger.info(`   🌐 API returned ${list.length} game(s)`);

            return list.map(g => this._apiGameToProfile(g));
        } catch (err) {
            logger.warn(`   ⚠️  Failed to fetch games from API: ${err.message}`);
            return [];
        }
    }

    /**
     * 将后端 API 游戏对象转换为 GameProfile 格式
     * @param {object} apiGame  后端 Game 实体
     * @returns {GameProfile}
     * @private
     */
    _apiGameToProfile(apiGame) {
        // 兼容多种字段命名风格
        const name      = apiGame.gameCode  || apiGame.code       || apiGame.name       || String(apiGame.id);
        const label     = apiGame.gameName  || apiGame.displayName || apiGame.title      || name;
        const type      = apiGame.gameType  || apiGame.type        || 'unknown';
        const url       = apiGame.gameUrl   || apiGame.url         || apiGame.playUrl    || '';
        const status    = apiGame.status    || apiGame.gameStatus  || 1;
        const thumbnail = apiGame.thumbnail || apiGame.coverImage  || apiGame.icon       || '';

        // 从 type 字符串推断标准化 gameType
        const typeInfo  = this._detectGameType(name) || { type: 'unknown', label };
        if (typeInfo.type === 'unknown' && type) {
            typeInfo.type = this._normalizeGameType(type);
        }

        return {
            name,
            fullPath:         '',       // API 模式无本地路径
            gameType:         typeInfo.type,
            gameLabel:        label,
            packageJson:      null,
            entryFiles:       [],
            sourceFiles:      [],
            configFiles:      [],
            testFiles:        [],
            docFiles:         [],
            detectedFeatures: this._inferFeaturesFromApiGame(apiGame),
            stats: {
                totalFiles:   0,
                sourceLines:  0,
                tsFiles:      0,
                vueFiles:     0,
                jsFiles:      0,
            },
            // 额外的 API 来源信息
            apiInfo: {
                id:        apiGame.id,
                url,
                status,
                thumbnail,
                raw:       apiGame,
            },
        };
    }

    /**
     * 从后端 API 游戏对象推断特性（基于 description/tags/gameType 字段）
     * @private
     */
    _inferFeaturesFromApiGame(apiGame) {
        const features = {};
        Object.keys(FEATURE_PATTERNS).forEach(k => (features[k] = false));

        const searchText = [
            apiGame.description || '',
            apiGame.gameName    || '',
            apiGame.tags        || '',
            apiGame.gameType    || '',
            JSON.stringify(apiGame.config || {}),
        ].join(' ').toLowerCase();

        for (const [key, regex] of Object.entries(FEATURE_PATTERNS)) {
            if (regex.test(searchText)) features[key] = true;
        }

        return features;
    }

    /**
     * 将后端 gameType 字符串规范化为本地 type
     * @private
     */
    _normalizeGameType(raw) {
        const s = String(raw).toLowerCase();
        if (/shoot|plane|飞机/.test(s)) return 'shooter';
        if (/snake|贪吃蛇/.test(s))    return 'arcade';
        if (/tank|坦克/.test(s))        return 'action';
        if (/pvz|plant|zombie|植物/.test(s)) return 'strategy';
        return 'unknown';
    }

    /**
     * 将本地文件扫描结果和 API 游戏列表合并
     * - 优先保留本地扫描结果（含源码分析）
     * - 如果 API 有而本地没有的游戏，追加 API 结果
     * - 如果本地已有对应游戏，将 API 的 url/id 等信息注入到 profile.apiInfo
     * @private
     */
    _mergeProfiles(localProfiles, apiProfiles) {
        if (!apiProfiles.length) return localProfiles;

        const merged = [...localProfiles];
        const localNames = new Set(localProfiles.map(p => p.name.toLowerCase()));

        for (const ap of apiProfiles) {
            // 查找本地是否有对应游戏（模糊匹配）
            const matchIdx = merged.findIndex(p =>
                p.name.toLowerCase() === ap.name.toLowerCase() ||
                p.name.toLowerCase().includes(ap.name.toLowerCase()) ||
                ap.name.toLowerCase().includes(p.name.toLowerCase())
            );

            if (matchIdx >= 0) {
                // 注入 API 信息（url/id/status 等）
                merged[matchIdx].apiInfo = ap.apiInfo;
                // 如果本地未有 URL 但 API 有，补充
                if (!merged[matchIdx].url && ap.apiInfo?.url) {
                    merged[matchIdx].url = ap.apiInfo.url;
                }
                // 合并 features（API 推断的 + 本地分析的，取并集）
                for (const [k, v] of Object.entries(ap.detectedFeatures)) {
                    if (v) merged[matchIdx].detectedFeatures[k] = true;
                }
            } else {
                // API 独有游戏（本地无对应目录），直接追加
                if (!localNames.has(ap.name.toLowerCase())) {
                    merged.push(ap);
                    logger.debug(`   🌐 Added API-only game: ${ap.name}`);
                }
            }
        }

        return merged;
    }
}

// ── 静态工厂方法 ─────────────────────────────────────────────────────────────

/**
 * 便捷方法：一次性扫描并返回结果
 * @param {object} options
 * @returns {Promise<ScanReport>}
 */
CodeScanner.scanOnce = async function (options = {}) {
    const scanner = new CodeScanner(options);
    return scanner.scan();
};

module.exports = { CodeScanner, DEFAULT_GAMES_ROOT };
