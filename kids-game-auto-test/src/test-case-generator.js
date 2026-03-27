/**
 * 测试用例生成器
 *
 * 功能：
 * 1. 根据代码扫描结果（ScanReport）动态生成测试用例
 * 2. 基础用例（UI渲染/加载/启动）对所有游戏通用
 * 3. 特性用例（射击/碰撞/移动等）根据 detectedFeatures 动态注入
 * 4. 输出标准化的 TestCase[] 供任务管理器使用
 * 5. [API 测试用例] 针对后端 REST API 接口生成 HTTP 级别测试用例
 */

'use strict';

const path = require('path');
const { logger } = require('./utils/logger');

// ── 测试用例模板库 ──────────────────────────────────────────────────────────

/**
 * 所有游戏通用的基础测试用例
 */
const BASE_TEST_CASES = [
    {
        id:          'BASE_LOAD',
        name:        '页面加载验证',
        description: '验证游戏页面能够正常加载，无 JS 错误，无 404 资源',
        category:    'functional',
        priority:    'P0',
        steps: [
            '打开游戏 URL',
            '等待页面完成加载（networkidle）',
            '验证页面标题非空',
            '检查是否存在 JS 运行时错误',
            '检查是否存在 404 资源请求',
        ],
        assertions: [
            { type: 'url_reachable',    description: 'HTTP 状态码 < 400' },
            { type: 'no_js_errors',     description: '控制台无 error 级别日志' },
            { type: 'page_has_content', description: 'body 非空' },
        ],
        soft: false,
    },
    {
        id:          'BASE_CANVAS',
        name:        'Canvas 渲染验证',
        description: '验证游戏 Canvas 元素存在且有实际绘制内容',
        category:    'functional',
        priority:    'P0',
        steps: [
            '等待 canvas 元素出现在 DOM',
            '检查 canvas 尺寸不为 0',
            '抽样检查 canvas 像素非全透明',
        ],
        assertions: [
            { type: 'element_exists',      selector: 'canvas',      description: 'Canvas 元素存在' },
            { type: 'canvas_has_content',  description: 'Canvas 有实际绘制（非全透明）' },
        ],
        soft: true, // canvas 跨域可能无法读取，软断言
    },
    {
        id:          'BASE_START_SCREEN',
        name:        '开始界面验证',
        description: '验证游戏开始界面正常显示，存在可交互的开始按钮',
        category:    'functional',
        priority:    'P0',
        steps: [
            '等待 2s 让游戏初始化',
            '检查开始界面相关元素（按钮/文字/菜单）',
            '验证存在可点击的交互元素',
        ],
        assertions: [
            { type: 'element_exists',  selector: 'button, [class*="start"], [class*="menu"], [class*="begin"]', description: '存在开始/菜单按钮' },
        ],
        soft: true,
    },
    {
        id:          'BASE_PERFORMANCE_LOAD',
        name:        '加载时间性能测试',
        description: '测量页面加载时间，确保在阈值（5s）内完成',
        category:    'performance',
        priority:    'P1',
        steps: [
            '记录导航开始时间',
            '等待 load 事件触发',
            '计算总加载时间',
        ],
        assertions: [
            { type: 'load_time_under', threshold: 5000, description: '加载时间 < 5000ms' },
        ],
        soft: false,
    },
    {
        id:          'BASE_MEMORY',
        name:        '内存使用测试',
        description: '测量运行时 JS 堆内存，确保在阈值（512MB）内',
        category:    'performance',
        priority:    'P2',
        steps: [
            '等待游戏主循环启动（3s）',
            '读取 performance.memory.usedJSHeapSize',
        ],
        assertions: [
            { type: 'memory_under', threshold: 512, unit: 'MB', description: 'JS 堆 < 512MB' },
        ],
        soft: true,
    },
    {
        id:          'BASE_RESPONSIVE',
        name:        '响应式布局测试',
        description: '在不同视口尺寸下验证游戏布局不崩溃',
        category:    'ui',
        priority:    'P2',
        steps: [
            '切换到 1280×720 视口',
            '验证 Canvas 可见',
            '切换到 375×667（移动端）视口',
            '验证 Canvas 可见',
        ],
        assertions: [
            { type: 'element_visible', selector: 'canvas', description: 'Canvas 在不同视口下可见' },
        ],
        soft: true,
    },
];

/**
 * 游戏特性对应的测试用例
 * key 与 code-scanner.js 中的 FEATURE_PATTERNS 对应
 */
const FEATURE_TEST_CASES = {
    difficulty: {
        id:          'FEAT_DIFFICULTY',
        name:        '难度选择功能测试',
        description: '验证游戏难度选择界面可访问，可正确切换难度',
        category:    'functional',
        priority:    'P1',
        steps: [
            '在开始界面寻找难度选择按钮/下拉框',
            '点击"简单/EASY"难度选项',
            '验证选中状态变化',
            '点击"困难/HARD"难度选项',
            '验证选中状态变化',
        ],
        assertions: [
            { type: 'element_exists',   selector: '[class*="diff"], [class*="level"], [class*="易"], [class*="难"]', description: '难度选项存在' },
            { type: 'interactive',      description: '难度选项可点击' },
        ],
        soft: true,
    },

    theme: {
        id:          'FEAT_THEME',
        name:        '主题切换功能测试',
        description: '验证游戏主题（皮肤）切换功能正常',
        category:    'functional',
        priority:    'P1',
        steps: [
            '寻找主题切换按钮',
            '点击切换到第二个主题',
            '验证 Canvas 内容发生变化（截图对比）',
        ],
        assertions: [
            { type: 'element_exists',  selector: '[class*="theme"], [class*="skin"], [class*="主题"]', description: '主题按钮存在' },
        ],
        soft: true,
    },

    shooting: {
        id:          'FEAT_SHOOTING',
        name:        '射击/攻击机制测试',
        description: '验证游戏射击或攻击动作响应正确',
        category:    'functional',
        priority:    'P1',
        steps: [
            '进入游戏主场景',
            '模拟按下攻击键（Space/Z/鼠标点击）',
            '等待 500ms',
            '验证子弹/攻击元素出现',
        ],
        assertions: [
            { type: 'canvas_changed',  description: 'Canvas 内容在攻击后有变化' },
        ],
        soft: true,
    },

    movement: {
        id:          'FEAT_MOVEMENT',
        name:        '移动控制测试',
        description: '验证键盘方向键或 WASD 能正确控制游戏角色',
        category:    'functional',
        priority:    'P1',
        steps: [
            '进入游戏主场景',
            '按下 ArrowUp / W 键（500ms）',
            '验证角色位置变化',
            '按下 ArrowLeft / A 键（500ms）',
            '验证角色位置变化',
        ],
        assertions: [
            { type: 'canvas_changed',  description: '按下方向键后 Canvas 发生变化' },
        ],
        soft: true,
    },

    collision: {
        id:          'FEAT_COLLISION',
        name:        '碰撞检测基础测试',
        description: '验证碰撞事件可被触发（游戏结束/伤害逻辑）',
        category:    'functional',
        priority:    'P1',
        steps: [
            '进入游戏主场景',
            '等待至少一次碰撞事件（通过控制台日志或视觉变化判断）',
        ],
        assertions: [
            { type: 'no_crash', description: '碰撞后游戏不崩溃' },
        ],
        soft: true,
    },

    score: {
        id:          'FEAT_SCORE',
        name:        '分数系统测试',
        description: '验证分数显示元素存在且在游戏过程中更新',
        category:    'functional',
        priority:    'P2',
        steps: [
            '进入游戏主场景',
            '读取初始分数',
            '触发得分事件（通关/吃食物/击杀）',
            '验证分数增加',
        ],
        assertions: [
            { type: 'element_exists',  selector: '[class*="score"], [class*="分数"], [class*="point"]', description: '分数元素存在' },
        ],
        soft: true,
    },

    audio: {
        id:          'FEAT_AUDIO',
        name:        '音频系统测试',
        description: '验证游戏不因音频错误而崩溃（静音/解码失败容忍）',
        category:    'functional',
        priority:    'P2',
        steps: [
            '加载游戏页面',
            '检查是否有 audio 相关的 404 或解码错误',
            '如有音量控件，测试静音切换',
        ],
        assertions: [
            { type: 'no_audio_errors', description: '无音频资源 404 或解码错误' },
        ],
        soft: true,
    },

    pause: {
        id:          'FEAT_PAUSE',
        name:        '暂停/恢复功能测试',
        description: '验证游戏暂停键（ESC/P）可正常暂停与恢复',
        category:    'functional',
        priority:    'P2',
        steps: [
            '进入游戏主场景',
            '按下 Escape 键',
            '验证暂停界面出现',
            '再次按下 Escape / P 键',
            '验证游戏恢复运行',
        ],
        assertions: [
            { type: 'element_appears', selector: '[class*="pause"], [class*="暂停"]', description: '暂停界面出现' },
        ],
        soft: true,
    },

    level: {
        id:          'FEAT_LEVEL',
        name:        '关卡/阶段进度测试',
        description: '验证关卡选择或波次推进功能',
        category:    'functional',
        priority:    'P2',
        steps: [
            '在主界面寻找关卡选择入口',
            '验证关卡信息可读取',
        ],
        assertions: [
            { type: 'element_exists',  selector: '[class*="level"], [class*="stage"], [class*="wave"], [class*="关卡"]', description: '关卡相关元素存在' },
        ],
        soft: true,
    },

    health: {
        id:          'FEAT_HEALTH',
        name:        '生命值/血量系统测试',
        description: '验证生命值显示存在',
        category:    'functional',
        priority:    'P2',
        steps: [
            '进入游戏主场景',
            '寻找生命值/HP 显示元素',
        ],
        assertions: [
            { type: 'element_exists',  selector: '[class*="hp"], [class*="health"], [class*="life"], [class*="生命"]', description: '生命值元素存在' },
        ],
        soft: true,
    },

    resource: {
        id:          'FEAT_RESOURCE',
        name:        '资源管理系统测试',
        description: '验证游戏内资源（阳光/金币等）显示与变化',
        category:    'functional',
        priority:    'P2',
        steps: [
            '进入游戏主场景',
            '寻找资源计数显示元素',
            '等待资源变化（通关/收集）',
        ],
        assertions: [
            { type: 'element_exists',  selector: '[class*="sun"], [class*="coin"], [class*="resource"], [class*="阳光"]', description: '资源显示元素存在' },
        ],
        soft: true,
    },
};

/**
 * 按游戏类型额外追加的测试用例
 */
const GAME_TYPE_EXTRA_CASES = {
    shooter: [
        {
            id:          'TYPE_SHOOTER_ENEMY',
            name:        '敌机生成测试',
            description: '验证敌机在游戏开始后正常生成',
            category:    'functional',
            priority:    'P1',
            steps: ['进入游戏', '等待 3s', '验证敌机出现（Canvas 变化）'],
            assertions: [{ type: 'canvas_changed', description: '敌机出现后画面有变化' }],
            soft: true,
        },
    ],
    arcade: [
        {
            id:          'TYPE_ARCADE_FOOD',
            name:        '食物/道具收集测试',
            description: '验证食物/道具出现且可被收集',
            category:    'functional',
            priority:    'P1',
            steps: ['进入游戏', '等待食物出现', '导航蛇前往食物', '验证得分增加'],
            assertions: [{ type: 'canvas_changed', description: '食物收集后画面变化' }],
            soft: true,
        },
    ],
    strategy: [
        {
            id:          'TYPE_STRATEGY_PLANT',
            name:        '植物放置测试',
            description: '验证可在格子上放置植物',
            category:    'functional',
            priority:    'P1',
            steps: ['进入游戏', '选择植物卡片', '点击草坪格子', '验证植物出现'],
            assertions: [{ type: 'canvas_changed', description: '放置植物后画面变化' }],
            soft: true,
        },
    ],
    action: [
        {
            id:          'TYPE_ACTION_TANK_MOVE',
            name:        '坦克移动测试',
            description: '验证坦克可响应方向键移动',
            category:    'functional',
            priority:    'P1',
            steps: ['进入游戏', '按方向键 500ms', '验证坦克位移'],
            assertions: [{ type: 'canvas_changed', description: '移动后画面变化' }],
            soft: true,
        },
    ],
};

// ── 后端 API 测试用例模板 ─────────────────────────────────────────────────────

/**
 * 通用后端 API 基础测试用例（不依赖具体游戏）
 * type: 'api' 标记为 API 测试，由 ApiTestRunner 执行
 */
const API_BASE_TEST_CASES = [
    {
        id:          'API_AUTH_LOGIN',
        name:        '登录接口测试',
        description: '验证 POST /api/auth/login 正常返回 JWT Token',
        category:    'api',
        priority:    'P0',
        type:        'api',
        steps: [
            '发送 POST /api/auth/login 携带有效凭据',
            '验证响应 code === 200',
            '验证 data.token 非空字符串',
        ],
        assertions: [
            { type: 'api_status_ok',    description: 'HTTP 状态码 200' },
            { type: 'api_code_ok',      description: '业务 code === 200' },
            { type: 'api_field_exists', field: 'token', description: 'data.token 字段存在' },
        ],
        apiSpec: {
            method:   'POST',
            path:     '/api/auth/login',
            body:     { username: '{{username}}', password: '{{password}}', userType: '{{userType}}' },
            authRequired: false,
        },
        soft: false,
    },
    {
        id:          'API_AUTH_LOGIN_FAIL',
        name:        '登录失败容错测试',
        description: '验证错误密码时返回正确的错误信息，不暴露敏感信息',
        category:    'api',
        priority:    'P1',
        type:        'api',
        steps: [
            '发送 POST /api/auth/login 携带错误密码',
            '验证响应 code !== 200',
            '验证 message 存在（非空）',
        ],
        assertions: [
            { type: 'api_code_not_ok', description: '业务 code 非 200（登录失败）' },
            { type: 'api_field_exists', field: 'message', description: 'message 字段存在' },
        ],
        apiSpec: {
            method:   'POST',
            path:     '/api/auth/login',
            body:     { username: 'wrong_user', password: 'wrong_pass', userType: 'ADMIN' },
            authRequired: false,
        },
        soft: false,
    },
    {
        id:          'API_GAME_LIST',
        name:        '游戏列表接口测试',
        description: '验证 GET /api/game/list 正常返回游戏列表',
        category:    'api',
        priority:    'P0',
        type:        'api',
        steps: [
            '使用有效 Token 请求 GET /api/game/list',
            '验证响应 code === 200',
            '验证 data 为数组或分页对象',
        ],
        assertions: [
            { type: 'api_status_ok',      description: 'HTTP 200' },
            { type: 'api_code_ok',        description: '业务 code 200' },
            { type: 'api_data_not_null',  description: 'data 非 null' },
        ],
        apiSpec: {
            method:       'GET',
            path:         '/api/game/list',
            authRequired: true,
        },
        soft: false,
    },
    {
        id:          'API_GAME_LIST_UNAUTH',
        name:        '游戏列表未授权访问测试',
        description: '验证不携带 Token 时接口返回 401',
        category:    'api',
        priority:    'P1',
        type:        'api',
        steps: [
            '不带 Authorization 请求 GET /api/game/list',
            '验证响应 HTTP 状态码为 401 或业务 code 为未授权',
        ],
        assertions: [
            { type: 'api_unauthorized', description: 'HTTP 401 或业务 code 表示未授权' },
        ],
        apiSpec: {
            method:       'GET',
            path:         '/api/game/list',
            authRequired: false,
            skipAuth:     true,  // 故意不带 Token
        },
        soft: false,
    },
    {
        id:          'API_STATS_TODAY',
        name:        '今日统计接口测试',
        description: '验证 GET /api/stats/today 正常返回统计数据',
        category:    'api',
        priority:    'P1',
        type:        'api',
        steps: [
            '使用有效 Token 请求 GET /api/stats/today',
            '验证响应结构包含统计字段',
        ],
        assertions: [
            { type: 'api_status_ok',     description: 'HTTP 200' },
            { type: 'api_code_ok',       description: '业务 code 200' },
            { type: 'api_data_not_null', description: 'data 非 null' },
        ],
        apiSpec: {
            method:       'GET',
            path:         '/api/stats/today',
            authRequired: true,
        },
        soft: true,
    },
    {
        id:          'API_DASHBOARD',
        name:        '仪表盘概览接口测试',
        description: '验证 GET /api/admin/dashboard/overview 正常返回',
        category:    'api',
        priority:    'P1',
        type:        'api',
        steps: [
            '使用管理员 Token 请求 GET /api/admin/dashboard/overview',
            '验证响应 code === 200 且 data 包含概览信息',
        ],
        assertions: [
            { type: 'api_status_ok',     description: 'HTTP 200' },
            { type: 'api_code_ok',       description: '业务 code 200' },
            { type: 'api_data_not_null', description: 'data 非 null' },
        ],
        apiSpec: {
            method:       'GET',
            path:         '/api/admin/dashboard/overview',
            authRequired: true,
        },
        soft: true,
    },
];

/**
 * 针对每个游戏的 API 测试用例（需要 gameId / gameCode）
 */
const API_GAME_TEST_CASES = [
    {
        id:          'API_GAME_DETAIL',
        name:        '游戏详情接口测试',
        description: '验证 GET /api/game/{gameId} 能正确返回指定游戏',
        category:    'api',
        priority:    'P0',
        type:        'api',
        steps: [
            '请求 GET /api/game/{gameId}',
            '验证 code === 200',
            '验证 data.gameId 或 data.id 与请求一致',
        ],
        assertions: [
            { type: 'api_status_ok',     description: 'HTTP 200' },
            { type: 'api_code_ok',       description: '业务 code 200' },
            { type: 'api_data_not_null', description: 'data 非 null' },
        ],
        apiSpec: {
            method:       'GET',
            path:         '/api/game/{{gameId}}',
            authRequired: true,
        },
        soft: false,
    },
    {
        id:          'API_GAME_BY_CODE',
        name:        '按 gameCode 查询游戏接口测试',
        description: '验证 GET /api/game/code/{gameCode} 能返回对应游戏',
        category:    'api',
        priority:    'P1',
        type:        'api',
        steps: [
            '请求 GET /api/game/code/{gameCode}',
            '验证 code === 200',
            '验证返回游戏名称正确',
        ],
        assertions: [
            { type: 'api_status_ok',     description: 'HTTP 200' },
            { type: 'api_code_ok',       description: '业务 code 200' },
            { type: 'api_data_not_null', description: 'data 非 null' },
        ],
        apiSpec: {
            method:       'GET',
            path:         '/api/game/code/{{gameCode}}',
            authRequired: true,
        },
        soft: true,
    },
    {
        id:          'API_GAME_CONFIG',
        name:        '游戏配置接口测试',
        description: '验证 GET /api/game/config/{gameCode} 能返回游戏配置',
        category:    'api',
        priority:    'P1',
        type:        'api',
        steps: [
            '请求 GET /api/game/config/{gameCode}',
            '验证响应包含配置信息',
        ],
        assertions: [
            { type: 'api_status_ok',     description: 'HTTP 200' },
            { type: 'api_code_ok',       description: '业务 code 200' },
        ],
        apiSpec: {
            method:       'GET',
            path:         '/api/game/config/{{gameCode}}',
            authRequired: true,
        },
        soft: true,
    },
    {
        id:          'API_GAME_SESSION_START',
        name:        '启动游戏会话接口测试',
        description: '验证 POST /api/game/session/start 能创建游戏会话',
        category:    'api',
        priority:    'P1',
        type:        'api',
        steps: [
            '发送 POST /api/game/session/start（携带 gameId）',
            '验证 code === 200',
            '验证 data.sessionId 存在',
        ],
        assertions: [
            { type: 'api_status_ok',      description: 'HTTP 200' },
            { type: 'api_code_ok',        description: '业务 code 200' },
            { type: 'api_field_exists',   field: 'sessionId', description: 'sessionId 字段存在' },
        ],
        apiSpec: {
            method:       'POST',
            path:         '/api/game/session/start',
            body:         { gameId: '{{gameId}}' },
            authRequired: true,
        },
        soft: true,
    },
];

// ── 主类 ──────────────────────────────────────────────────────────────────────

class TestCaseGenerator {
    /**
     * @param {object} options
     * @param {boolean} [options.includePerformance]  是否包含性能测试用例（默认 true）
     * @param {boolean} [options.includeUI]           是否包含 UI 测试用例（默认 true）
     * @param {boolean} [options.includeApi]          是否包含 API 测试用例（默认 true，需 apiMode）
     * @param {string[]} [options.priorityFilter]     仅生成指定优先级用例（如 ['P0','P1']）
     */
    constructor(options = {}) {
        this.includePerformance = options.includePerformance !== false;
        this.includeUI          = options.includeUI          !== false;
        this.includeApi         = options.includeApi         !== false;
        this.priorityFilter     = options.priorityFilter     || ['P0', 'P1', 'P2'];
    }

    // ── 公开 API ─────────────────────────────────────────────────────────────

    /**
     * 根据扫描报告生成所有游戏的测试用例集
     * @param {ScanReport} scanReport
     * @param {object} testConfig  来自 config/test-config.json 的 games 配置
     * @returns {GeneratedTestSuite[]}
     */
    generate(scanReport, testConfig = {}) {
        const suites = [];

        // 若扫描到了游戏，按扫描结果生成
        if (scanReport && scanReport.games && scanReport.games.length > 0) {
            for (const gameProfile of scanReport.games) {
                const configEntry = this._findConfigEntry(gameProfile.name, testConfig);
                const suite = this._generateSuite(gameProfile, configEntry);
                suites.push(suite);
            }
        }

        // 对于配置中有但目录扫描未涉及的游戏（如 tank / pvz），也生成基础用例
        const scannedNames = new Set(suites.map(s => s.gameId));
        for (const [gameId, gameCfg] of Object.entries(testConfig)) {
            if (!scannedNames.has(gameId)) {
                const fallbackProfile = this._buildFallbackProfile(gameId, gameCfg);
                const suite = this._generateSuite(fallbackProfile, gameCfg);
                suites.push(suite);
            }
        }

        const totalCases = suites.reduce((n, s) => n + s.testCases.length, 0);
        logger.info(`📝 TestCaseGenerator: ${suites.length} suites, ${totalCases} test cases generated`);

        return suites;
    }

    /**
     * 生成独立的后端 API 测试套件（全局，不依赖具体游戏）
     * @param {ScanReport} scanReport   扫描报告（用于从 apiInfo 提取 gameId）
     * @param {object}     apiOptions   { baseUrl, username, password, userType }
     * @returns {ApiTestSuite}
     */
    generateApiSuite(scanReport, apiOptions = {}) {
        if (!this.includeApi) return null;

        // 1. 全局 API 基础用例
        const cases = [];
        for (const tmpl of API_BASE_TEST_CASES) {
            if (!this._inPriorityFilter(tmpl.priority)) continue;
            cases.push(this._instantiateApiCase(tmpl, null, apiOptions));
        }

        // 2. 针对每个游戏的 API 用例（需要 gameId / gameCode）
        const apiGames = (scanReport?.games || []).filter(g => g.apiInfo?.id);
        for (const gameProfile of apiGames) {
            for (const tmpl of API_GAME_TEST_CASES) {
                if (!this._inPriorityFilter(tmpl.priority)) continue;
                cases.push(this._instantiateApiCase(tmpl, gameProfile, apiOptions));
            }
        }

        const byPriority = this._countByPriority(cases);

        logger.info(`📝 API TestSuite: ${cases.length} API test cases (P0=${byPriority.P0||0} P1=${byPriority.P1||0} P2=${byPriority.P2||0})`);

        return {
            suiteId:     `api_suite_${Date.now()}`,
            suiteType:   'api',
            gameName:    'Backend API Tests',
            gameId:      '__api__',
            generatedAt: new Date().toISOString(),
            apiOptions,
            testCases:   cases,
            stats: {
                total:      cases.length,
                byPriority,
                byCategory: this._countByCategory(cases),
            },
        };
    }

    /**
     * 为单个游戏 Profile 生成测试套件
     * @param {object} gameProfile
     * @param {object|null} configEntry
     * @returns {GeneratedTestSuite}
     */
    _generateSuite(gameProfile, configEntry = null) {
        const cases = [];

        // 1. 通用基础用例
        for (const tmpl of BASE_TEST_CASES) {
            if (!this._inPriorityFilter(tmpl.priority)) continue;
            if (!this.includePerformance && tmpl.category === 'performance') continue;
            if (!this.includeUI && tmpl.category === 'ui') continue;
            cases.push(this._instantiate(tmpl, gameProfile, configEntry));
        }

        // 2. 特性驱动用例
        const features = gameProfile.detectedFeatures || {};
        for (const [featureKey, tmpl] of Object.entries(FEATURE_TEST_CASES)) {
            if (!features[featureKey]) continue;
            if (!this._inPriorityFilter(tmpl.priority)) continue;
            cases.push(this._instantiate(tmpl, gameProfile, configEntry));
        }

        // 3. 游戏类型专属用例
        const extraCases = GAME_TYPE_EXTRA_CASES[gameProfile.gameType] || [];
        for (const tmpl of extraCases) {
            if (!this._inPriorityFilter(tmpl.priority)) continue;
            cases.push(this._instantiate(tmpl, gameProfile, configEntry));
        }

        // 4. 从 config 的 testScenarios 字段补充用例
        if (configEntry && Array.isArray(configEntry.testScenarios)) {
            for (const scenarioKey of configEntry.testScenarios) {
                if (!cases.some(c => c.tags && c.tags.includes(scenarioKey))) {
                    const scenarioCase = this._buildScenarioCase(scenarioKey, gameProfile, configEntry);
                    if (scenarioCase) cases.push(scenarioCase);
                }
            }
        }

        return {
            suiteId:       `suite_${gameProfile.name}_${Date.now()}`,
            gameId:        gameProfile.name,
            gameName:      gameProfile.gameLabel || gameProfile.name,
            gameType:      gameProfile.gameType,
            url:           configEntry?.url || '',
            generatedAt:   new Date().toISOString(),
            sourceProfile: {
                fullPath:      gameProfile.fullPath || '',
                sourceFiles:   (gameProfile.sourceFiles || []).length,
                detectedFeatures: Object.keys(features).filter(k => features[k]),
            },
            testCases: cases,
            stats: {
                total:       cases.length,
                byPriority:  this._countByPriority(cases),
                byCategory:  this._countByCategory(cases),
            },
        };
    }

    // ── 内部工具 ─────────────────────────────────────────────────────────────

    _instantiate(template, gameProfile, configEntry) {
        return {
            ...JSON.parse(JSON.stringify(template)), // 深拷贝
            caseId:    `${gameProfile.name}_${template.id}`,
            gameId:    gameProfile.name,
            gameName:  gameProfile.gameLabel || gameProfile.name,
            url:       configEntry?.url || gameProfile.apiInfo?.url || '',
            tags:      [template.id.toLowerCase(), template.category, gameProfile.gameType],
            createdAt: new Date().toISOString(),
        };
    }

    /**
     * 实例化一个 API 测试用例（替换 path 中的模板变量）
     * @private
     */
    _instantiateApiCase(template, gameProfile, apiOptions) {
        const tc = JSON.parse(JSON.stringify(template));
        const gameId   = gameProfile?.apiInfo?.id || '';
        const gameCode = gameProfile?.name         || '';

        // 替换 apiSpec.path 中的占位符
        if (tc.apiSpec?.path) {
            tc.apiSpec.path = tc.apiSpec.path
                .replace('{{gameId}}',   String(gameId))
                .replace('{{gameCode}}', encodeURIComponent(gameCode));
        }

        // 替换 apiSpec.body 中的占位符
        if (tc.apiSpec?.body) {
            const bodyStr = JSON.stringify(tc.apiSpec.body)
                .replace('"{{username}}"', JSON.stringify(apiOptions.username || 'admin'))
                .replace('"{{password}}"', JSON.stringify(apiOptions.password || 'admin123'))
                .replace('"{{userType}}"', JSON.stringify(apiOptions.userType || 'ADMIN'))
                .replace('"{{gameId}}"',   String(gameId));
            try { tc.apiSpec.body = JSON.parse(bodyStr); } catch (_) {}
        }

        return {
            ...tc,
            caseId:    gameProfile
                ? `${gameProfile.name}_${template.id}`
                : `global_${template.id}`,
            gameId:    gameProfile?.name  || '__api__',
            gameName:  gameProfile?.gameLabel || gameProfile?.name || 'Backend API',
            url:       apiOptions.baseUrl || 'http://localhost:8080',
            tags:      [template.id.toLowerCase(), 'api', template.category],
            createdAt: new Date().toISOString(),
            apiOptions,
        };
    }

    _buildScenarioCase(scenarioKey, gameProfile, configEntry) {
        // 通用场景 key → 测试用例映射
        const SCENARIO_MAP = {
            start_screen:         'BASE_START_SCREEN',
            difficulty_selection: 'FEAT_DIFFICULTY',
            theme_selection:      'FEAT_THEME',
            gameplay_flow:        'BASE_CANVAS',
            shooting_mechanism:   'FEAT_SHOOTING',
            collision_detection:  'FEAT_COLLISION',
            movement_control:     'FEAT_MOVEMENT',
            food_collection:      'TYPE_ARCADE_FOOD',
            level_selection:      'FEAT_LEVEL',
            tank_movement:        'TYPE_ACTION_TANK_MOVE',
            enemy_ai:             'FEAT_COLLISION',
            plant_placement:      'TYPE_STRATEGY_PLANT',
            zombie_spawn:         'BASE_CANVAS',
            resource_management:  'FEAT_RESOURCE',
            wave_progression:     'FEAT_LEVEL',
        };

        const templateId = SCENARIO_MAP[scenarioKey];
        if (!templateId) return null;

        // 查找对应模板
        const tmpl = [
            ...BASE_TEST_CASES,
            ...Object.values(FEATURE_TEST_CASES),
            ...Object.values(GAME_TYPE_EXTRA_CASES).flat(),
        ].find(t => t.id === templateId);
        if (!tmpl) return null;

        const c = this._instantiate(tmpl, gameProfile, configEntry);
        c.tags = [...(c.tags || []), scenarioKey];
        return c;
    }

    _findConfigEntry(gameName, testConfig) {
        if (testConfig[gameName]) return testConfig[gameName];
        // 模糊匹配
        for (const [key, val] of Object.entries(testConfig)) {
            if (key.includes(gameName) || gameName.includes(key)) return val;
        }
        return null;
    }

    _buildFallbackProfile(gameId, gameCfg) {
        const typeMap = { shooter: 'shooter', arcade: 'arcade', action: 'action', strategy: 'strategy' };
        return {
            name:             gameId,
            fullPath:         '',
            gameType:         typeMap[gameCfg.type] || 'unknown',
            gameLabel:        gameCfg.name || gameId,
            detectedFeatures: {},
            sourceFiles:      [],
        };
    }

    _inPriorityFilter(priority) {
        return !this.priorityFilter.length || this.priorityFilter.includes(priority);
    }

    _countByPriority(cases) {
        return cases.reduce((acc, c) => {
            acc[c.priority] = (acc[c.priority] || 0) + 1;
            return acc;
        }, {});
    }

    _countByCategory(cases) {
        return cases.reduce((acc, c) => {
            acc[c.category] = (acc[c.category] || 0) + 1;
            return acc;
        }, {});
    }
}

module.exports = { TestCaseGenerator, API_BASE_TEST_CASES, API_GAME_TEST_CASES };
