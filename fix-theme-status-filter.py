import re

file_path = r'd:\工作\sitech\项目\研发\git_workspace\AI\kids-game-project-v5\kids-game-backend\kids-game-service\src\main\java\com\kidgame\service\impl\ThemeServiceImpl.java'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 删除全局的 status 过滤
content = re.sub(
    r'        // 基础条件：已上架\r?\n        wrapper\.eq\(ThemeInfo::getStatus, "on_sale"\);\r?\n',
    '',
    content
)

# 为 official 添加 status 过滤
content = re.sub(
    r'(            case "official":\r?\n                // 官方主题：只显示官方的\r?\n                wrapper\.eq\(ThemeInfo::getIsOfficial, true\);)',
    r'            case "official":\n                // 官方主题：只显示官方的且已上架的\n                wrapper.eq(ThemeInfo::getIsOfficial, true)\n                       .eq(ThemeInfo::getStatus, "on_sale");',
    content
)

# 为 purchased 添加 status 过滤
content = re.sub(
    r'(                    // 在已购买列表中，且不是自己创作的（包含官方主题）\r?\n                    wrapper\.in\(ThemeInfo::getThemeId, purchasedIds\)\r?\n                           \.ne\(ThemeInfo::getAuthorId, userId\);)',
    r'                    // 在已购买列表中，且不是自己创作的（包含官方主题）\n                    wrapper.in(ThemeInfo::getThemeId, purchasedIds)\n                           .ne(ThemeInfo::getAuthorId, userId)\n                           .eq(ThemeInfo::getStatus, "on_sale");  // 已购买的只显示已上架的',
    content
)

# 修改 mine 的注释
content = re.sub(
    r'(            case "mine":\r?\n                // 自己创作的主题\r?\n                wrapper\.eq\(ThemeInfo::getAuthorId, userId\);)',
    r'            case "mine":\n                // ⭐ 自己创作的主题：显示所有状态（pending/on_sale/offline）\n                wrapper.eq(ThemeInfo::getAuthorId, userId);\n                // 不添加 status 过滤条件',
    content
)

# 为 all 添加 status 过滤
content = re.sub(
    r'(                if \(allPurchasedIds\.isEmpty\(\)\) \{\r?\n                    // 没有购买记录：只显示官方和我的\r?\n                    wrapper\.and\(w -> w\r?\n                        \.eq\(ThemeInfo::getIsOfficial, true\)\r?\n                        \.or\(or -> or\.eq\(ThemeInfo::getAuthorId, userId\)\)\r?\n                    \);)',
    r'                if (allPurchasedIds.isEmpty()) {\n                    // 没有购买记录：只显示官方和我的（已上架）\n                    wrapper.and(w -> w\n                        .eq(ThemeInfo::getIsOfficial, true)\n                        .or(or -> or.eq(ThemeInfo::getAuthorId, userId))\n                    ).eq(ThemeInfo::getStatus, "on_sale");',
    content
)

content = re.sub(
    r'(                \} else \{\r?\n                    // 有购买记录：官方 OR 我的 OR 已购买的（排除自己创作的重复项）\r?\n                    wrapper\.and\(w -> w\r?\n                        \.eq\(ThemeInfo::getIsOfficial, true\)  // 官方主题\r?\n                        \.or\(or -> or\r?\n                            \.eq\(ThemeInfo::getAuthorId, userId\)  // 我的主题\r?\n                            \.or\(in -> in\r?\n                                \.in\(ThemeInfo::getThemeId, allPurchasedIds\)  // 已购买\r?\n                                \.ne\(ThemeInfo::getAuthorId, userId\)  // 排除自己创作的\r?\n                            \)\r?\n                        \)\r?\n                    \);)',
    r'                } else {\n                    // 有购买记录：官方 OR 我的 OR 已购买的（排除自己创作的重复项，都已上架）\n                    wrapper.and(w -> w\n                        .eq(ThemeInfo::getIsOfficial, true)  // 官方主题\n                        .or(or -> or\n                            .eq(ThemeInfo::getAuthorId, userId)  // 我的主题\n                            .or(in -> in\n                                .in(ThemeInfo::getThemeId, allPurchasedIds)  // 已购买\n                                .ne(ThemeInfo::getAuthorId, userId)  // 排除自己创作的\n                            )\n                        )\n                    ).eq(ThemeInfo::getStatus, "on_sale");',
    content
)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print('✅ 文件修改完成！')
