#!/bin/bash
#
# init-game.sh - 初始化新游戏项目
# 用法: ./init-game.sh <game-name> <game-id>
# 示例: ./init-game.sh tank-battle tank-battle-001
#

set -e

GAME_NAME=$1
GAME_ID=$2

if [ -z "$GAME_NAME" ] || [ -z "$GAME_ID" ]; then
    echo "用法: $0 <game-name> <game-id>"
    echo "示例: $0 tank-battle tank-battle-001"
    exit 1
fi

# 获取脚本所在目录的绝对路径
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRAMEWORK_DIR="$(dirname "$SCRIPT_DIR")"

echo "🎮 初始化游戏项目..."
echo "游戏名称: $GAME_NAME"
echo "游戏ID: $GAME_ID"

# 检查游戏ID格式
if [[ ! $GAME_ID =~ ^[a-z0-9-]+$ ]]; then
    echo "❌ 错误: 游戏ID只能包含小写字母、数字和横线"
    exit 1
fi

# 1. 创建项目基础目录结构
echo "📁 创建项目目录结构..."

# 创建游戏项目根目录（在games下）
GAMES_DIR="$FRAMEWORK_DIR/../games"
mkdir -p "$GAMES_DIR/$GAME_NAME"
GAME_DIR="$GAMES_DIR/$GAME_NAME"

# 创建标准目录结构
mkdir -p "$GAME_DIR/src"
mkdir -p "$GAME_DIR/src/components"
mkdir -p "$GAME_DIR/src/logic"
mkdir -p "$GAME_DIR/src/render"
mkdir -p "$GAME_DIR/src/control"
mkdir -p "$GAME_DIR/src/scene"
mkdir -p "$GAME_DIR/src/utils"
mkdir -p "$GAME_DIR/assets/images"
mkdir -p "$GAME_DIR/assets/audio"
mkdir -p "$GAME_DIR/assets/data"

# 2. 创建配置文件
echo "📝 创建配置文件..."

# package.json
cat > "$GAME_DIR/package.json" << EOF
{
  "name": "$GAME_ID",
  "version": "1.0.0",
  "description": "$GAME_NAME - Built with kids-game-frame-factory",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "phaser": "^3.80.0",
    "kids-game-frame-factory": "file:../kids-game-frame-factory"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0",
    "vite": "^5.0.0",
    "vite-plugin-dts": "^3.0.0"
  }
}
EOF

# tsconfig.json
cat > "$GAME_DIR/tsconfig.json" << EOF
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "jsx": "preserve",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "declaration": true,
    "declarationMap": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
EOF

# vite.config.ts
cat > "$GAME_DIR/vite.config.ts" << EOF
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import path from 'path';

export default defineConfig({
  plugins: [
    dts({
      include: ['src']
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: '$GAME_NAME',
      fileName: (format) => \`$\{GAME_NAME\}.\${format}.js\`
    },
    rollupOptions: {
      external: ['phaser', 'kids-game-frame-factory'],
      output: {
        globals: {
          phaser: 'Phaser',
          'kids-game-frame-factory': 'KidsGameFramework'
        }
      }
    }
  }
});
EOF

# 3. 创建入口文件
echo "🔧 创建入口文件..."

# src/index.ts
cat > "$GAME_DIR/src/index.ts" << EOF
import { PhaserGame } from './scene/PhaserGame';

export * from './scene/PhaserGame';
export * from './logic/${GAME_NAME}Config';

export { PhaserGame };
EOF

# src/logic/${GAME_NAME}Config.ts
cat > "$GAME_DIR/src/logic/${GAME_NAME}Config.ts" << EOF
import { GameConfig } from 'kids-game-frame-factory';

/**
 * $GAME_NAME 游戏配置
 * 
 * 注意：
 * 1. 所有配置必须在 GameConfig 类中定义
 * 2. 使用相对路径引用框架，禁止使用 @/ 别名
 * 3. 从 'kids-game-frame-factory' 导入 GameConfig 基类
 */
export const ${GAME_ID^^}_CONFIG: GameConfig = {
  // Phaser 配置
  phaserConfig: {
    type: Phaser.AUTO,
    width: '100%',
    height: '100%',
    backgroundColor: '#000000',
    parent: 'game-container',
    scene: [],  // 将在 PhaserGame 中注册
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { x: 0, y: 0 },
        debug: false
      }
    }
  },

  // 游戏ID
  gameId: '$GAME_ID',

  // 游戏名称
  gameName: '$GAME_NAME',

  // 游戏版本
  version: '1.0.0'
};

export default ${GAME_ID^^}_CONFIG;
EOF

# 4. 创建场景模板
echo "🎬 创建场景模板..."

# src/scene/PhaserGame.ts
cat > "$GAME_DIR/src/scene/PhaserGame.ts" << EOF
import { ComponentContainer, EventBus, GameConfig } from 'kids-game-frame-factory';
import { ${GAME_ID^^}_CONFIG } from '../logic/${GAME_NAME}Config';

/**
 * $GAME_NAME 主游戏类
 * 
 * 核心职责：
 * 1. 初始化 Phaser 游戏实例
 * 2. 管理组件容器
 * 3. 管理事件总线
 * 4. 处理游戏生命周期事件
 * 
 * 注意：
 * 1. 不要直接访问 Pinia store，使用回调注入
 * 2. 所有相对路径引用框架，禁止使用 @/
 * 3. 通过 EventBus 与组件通信
 */
export class PhaserGame {
  private game: Phaser.Game | null = null;
  private container: ComponentContainer | null = null;
  private eventBus: EventBus | null = null;
  private config: GameConfig;

  constructor(
    private parentElement: HTMLElement,
    private callbacks?: {
      onScoreChanged?: (score: number) => void;
      onGameStateChanged?: (state: string) => void;
      onLevelCompleted?: (level: number) => void;
      onItemEffect?: (effect: string, value: any) => void;
    }
  ) {
    this.config = ${GAME_ID^^}_CONFIG;
  }

  /**
   * 初始化游戏
   */
  init(): void {
    if (this.game) {
      console.warn('Game already initialized');
      return;
    }

    // 创建事件总线
    this.eventBus = new EventBus();

    // 创建组件容器
    this.container = new ComponentContainer();

    // 注册游戏事件回调
    this.registerEventCallbacks();

    // 创建 Phaser 游戏实例
    this.game = new Phaser.Game({
      ...this.config.phaserConfig,
      parent: this.parentElement
    });

    console.log(\`$GAME_NAME game initialized\`);
  }

  /**
   * 注册事件回调
   */
  private registerEventCallbacks(): void {
    if (!this.eventBus || !this.callbacks) return;

    // 分数变化
    this.eventBus.on('scoreChanged', (score: number) => {
      this.callbacks?.onScoreChanged?.(score);
    });

    // 游戏状态变化
    this.eventBus.on('gameStateChanged', (state: string) => {
      this.callbacks?.onGameStateChanged?.(state);
    });

    // 关卡完成
    this.eventBus.on('levelCompleted', (level: number) => {
      this.callbacks?.onLevelCompleted?.(level);
    });

    // 道具效果
    this.eventBus.on('itemEffect', (effect: string, value: any) => {
      this.callbacks?.onItemEffect?.(effect, value);
    });
  }

  /**
   * 销毁游戏
   */
  destroy(): void {
    if (this.game) {
      this.game.destroy(true);
      this.game = null;
    }
    this.container = null;
    this.eventBus = null;
  }

  /**
   * 获取组件容器
   */
  getContainer(): ComponentContainer | null {
    return this.container;
  }

  /**
   * 获取事件总线
   */
  getEventBus(): EventBus | null {
    return this.eventBus;
  }
}
EOF

# 5. 创建 README
echo "📖 创建 README..."

cat > "$GAME_DIR/README.md" << EOF
# $GAME_NAME

使用 kids-game-frame-factory 构建的游戏

## 开发

\`\`\`bash
npm install
npm run dev
\`\`\`

## 构建

\`\`\`bash
npm run build
\`\`\`

## 项目结构

\`\`\`
$GAME_NAME/
├── src/
│   ├── components/     # 游戏组件
│   ├── logic/         # 游戏逻辑
│   ├── render/        # 渲染组件
│   ├── control/       # 控制组件
│   ├── scene/         # 游戏场景
│   └── utils/         # 工具函数
├── assets/
│   ├── images/        # 图片资源
│   ├── audio/         # 音频资源
│   └── data/          # 数据资源
└── package.json
\`\`\`

## 开发规范

1. 所有组件必须继承 \`ComponentBase\`
2. 使用相对路径引用框架，禁止使用 \`@/\` 别名
3. 不要直接访问 Pinia store，使用回调注入
4. 所有事件类型必须在 \`GameEventType\` 枚举中定义
5. 组件间通过 \`EventBus\` 通信

更多规范请参考：\`../kids-game-frame-factory/README.md\`
EOF

# 6. 创建 .gitignore
echo "🚫 创建 .gitignore..."

cat > "$GAME_DIR/.gitignore" << EOF
node_modules/
dist/
.DS_Store
*.log
.vscode/
.idea/
EOF

echo ""
echo "✅ 游戏项目初始化完成！"
echo ""
echo "下一步："
echo "  1. cd $GAME_NAME"
echo "  2. npm install"
echo "  3. 添加游戏组件：bash ../.codebuddy/skills/kids-game-framework/scripts/add-component.sh <ComponentName>"
echo "  4. 添加游戏场景：bash ../.codebuddy/skills/kids-game-framework/scripts/add-scene.sh <SceneName>"
echo ""
