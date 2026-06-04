#!/usr/bin/env bash
# =============================================================================
# 新游戏初始化脚本
# 用法: bash init-game.sh <game-id> [game-name]
# 示例: bash init-game.sh my-puzzle 拼图游戏
# =============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
TEMPLATE_DIR="$SCRIPT_DIR/../templates/game-template"
GAMES_DIR="$PROJECT_ROOT/kids-game-house/games"

# ─── 参数检查 ─────────────────────────────────────────────────────────────────
GAME_ID="${1:-}"
GAME_NAME="${2:-$GAME_ID}"

if [ -z "$GAME_ID" ]; then
  echo "❌ 错误: 缺少游戏 ID"
  echo ""
  echo "用法: bash init-game.sh <game-id> [game-name]"
  echo "示例: bash init-game.sh my-puzzle 拼图游戏"
  exit 1
fi

TARGET_DIR="$GAMES_DIR/$GAME_ID"

if [ -d "$TARGET_DIR" ]; then
  echo "❌ 错误: 目录已存在: $TARGET_DIR"
  exit 1
fi

# ─── 创建游戏目录 ─────────────────────────────────────────────────────────────
echo "🚀 创建游戏: $GAME_ID ($GAME_NAME)"
echo ""

mkdir -p "$TARGET_DIR"
cp -r "$TEMPLATE_DIR/." "$TARGET_DIR/"
echo "✅ 复制模板完成"

# ─── 替换占位符 ───────────────────────────────────────────────────────────────
# 处理 JSON 配置文件
find "$TARGET_DIR" -name "*.json" -not -path "*/node_modules/*" | while read file; do
  sed -i.bak "s/__GAME_ID__/$GAME_ID/g" "$file"
  sed -i.bak "s/__GAME_TYPE__/$GAME_ID/g" "$file"
  sed -i.bak "s/__GAME_NAME__/$GAME_NAME/g" "$file"
  rm -f "$file.bak"
done

# 处理 SQL 文件
find "$TARGET_DIR" -name "*.sql" | while read file; do
  sed -i.bak "s/__GAME_CODE__/$GAME_ID/g" "$file"
  sed -i.bak "s/__GAME_NAME__/$GAME_NAME/g" "$file"
  rm -f "$file.bak"
done

# 处理 HTML 文件（title）
find "$TARGET_DIR" -name "*.html" | while read file; do
  sed -i.bak "s/游戏模板/$GAME_NAME/g" "$file"
  rm -f "$file.bak"
done

# 修改 package.json 名称
PACKAGE_JSON="$TARGET_DIR/package.json"
sed -i.bak "s/\"name\": \"game-template\"/\"name\": \"@kids-game\/$GAME_ID\"/" "$PACKAGE_JSON"
rm -f "$PACKAGE_JSON.bak"

echo "✅ 占位符替换完成"

# ─── 安装依赖 ─────────────────────────────────────────────────────────────────
echo ""
echo "📦 安装依赖..."
cd "$TARGET_DIR"
npm install --silent
echo "✅ 依赖安装完成"

# ─── 完成提示 ─────────────────────────────────────────────────────────────────
echo ""
echo "🎉 游戏初始化完成！"
echo ""
echo "游戏目录: $TARGET_DIR"
echo ""
echo "下一步:"
echo "  1. cd kids-game-house/games/$GAME_ID"
echo "  2. 编辑 src/config/GTRS.json（资源配置）"
echo "  3. 编辑 src/scenes/GameScene.ts（游戏逻辑）"
echo "  4. npm run dev （启动开发服务器）"
echo ""
echo "参考: 贪吃蛇实现 → kids-game-house/games/snake/src/scenes/"
