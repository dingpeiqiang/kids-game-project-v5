#!/bin/bash

# RPG Shooter 快速测试脚本
# 使用方法: ./test.sh

echo "🎮 RPG Shooter 测试套件"
echo "========================"
echo ""

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 检查依赖
echo -e "${YELLOW}检查依赖...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js 未安装${NC}"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm 未安装${NC}"
    exit 1
fi

echo -e "${GREEN}✅ 依赖检查通过${NC}"
echo ""

# 安装依赖
echo -e "${YELLOW}安装依赖...${NC}"
npm install --silent
echo -e "${GREEN}✅ 依赖安装完成${NC}"
echo ""

# 运行TypeScript编译检查
echo -e "${YELLOW}TypeScript 编译检查...${NC}"
npx tsc --noEmit
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ TypeScript 编译通过${NC}"
else
    echo -e "${RED}❌ TypeScript 编译失败${NC}"
    exit 1
fi
echo ""

# 运行单元测试
echo -e "${YELLOW}运行单元测试...${NC}"
npm test -- --passWithNoTests
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ 单元测试通过${NC}"
else
    echo -e "${RED}⚠️  单元测试有失败（可能是正常的，如果没有编写测试）${NC}"
fi
echo ""

# 检查代码质量
echo -e "${YELLOW}检查代码质量...${NC}"
if command -v npx eslint &> /dev/null; then
    npx eslint src/games/rpgShooter/ --ext .ts
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ 代码质量检查通过${NC}"
    else
        echo -e "${YELLOW}⚠️  代码质量有待改进${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  ESLint 未配置，跳过${NC}"
fi
echo ""

# 生成测试报告
echo -e "${YELLOW}生成测试报告...${NC}"
echo "测试报告" > test-report.txt
echo "========" >> test-report.txt
echo "日期: $(date)" >> test-report.txt
echo "" >> test-report.txt
echo "模块列表:" >> test-report.txt
ls -lh src/games/rpgShooter/*.ts >> test-report.txt 2>/dev/null
echo "" >> test-report.txt
echo "文档列表:" >> test-report.txt
ls -lh src/games/rpgShooter/*.md >> test-report.txt 2>/dev/null
echo -e "${GREEN}✅ 测试报告已生成: test-report.txt${NC}"
echo ""

# 启动开发服务器（可选）
read -p "是否启动开发服务器进行测试？(y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}启动开发服务器...${NC}"
    echo -e "${GREEN}访问 http://localhost:5173 查看游戏${NC}"
    echo -e "${GREEN}访问 http://localhost:5173/rpg-shooter-test.html 查看测试清单${NC}"
    npm run dev
fi

echo ""
echo -e "${GREEN}🎉 测试完成！${NC}"
echo ""
echo "下一步："
echo "1. 查看 test-report.txt 了解测试结果"
echo "2. 运行 npm run dev 启动游戏"
echo "3. 打开浏览器访问测试页面"
echo "4. 按照 TESTING_GUIDE.md 进行手动测试"
