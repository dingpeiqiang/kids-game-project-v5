/**
 * 文档索引配置
 * 用于管理所有项目文档
 */

export interface DocConfig {
  id: string;
  title: string;
  icon?: string;
  category: string;
  path: string;
}

export const docCategories = [
  {
    name: '快速开始',
    icon: '🚀',
    docs: [
      {
        id: 'readme',
        title: '项目说明',
        icon: '📖',
        category: '快速开始',
        path: 'README.md'
      },
      {
        id: 'quick-start',
        title: '快速启动指南',
        icon: '⚡',
        category: '快速开始',
        path: '01-quick-start/index.md'
      }
    ]
  },
  {
    name: 'API 参考',
    icon: '🌐',
    docs: [
      {
        id: 'api-reference',
        title: 'API 文档',
        icon: '📡',
        category: 'API 参考',
        path: '02-api-reference/index.md'
      }
    ]
  },
  {
    name: '开发规范',
    icon: '🔧',
    docs: [
      {
        id: 'coding-standards',
        title: '编码规范',
        icon: '📝',
        category: '开发规范',
        path: '../../../CODING_STANDARDS.md'
      },
      {
        id: 'ai-coding-guide',
        title: 'AI 编码指南',
        icon: '🤖',
        category: '开发规范',
        path: '../../../AI_CODING_GUIDE.md'
      },
      {
        id: 'development-guide',
        title: '开发指南',
        icon: '💻',
        category: '开发规范',
        path: '03-development/index.md'
      }
    ]
  },
  {
    name: '架构设计',
    icon: '🏗️',
    docs: [
      {
        id: 'architecture',
        title: '系统架构',
        icon: '🏛️',
        category: '架构设计',
        path: '04-architecture/index.md'
      }
    ]
  },
  {
    name: '项目指南',
    icon: '📚',
    docs: [
      {
        id: 'guides-index',
        title: '指南概览',
        icon: '📋',
        category: '项目指南',
        path: '05-guides/index.md'
      },
      {
        id: 'gtrs-overview',
        title: 'GTRS 主题系统概述',
        icon: '🎨',
        category: '项目指南',
        path: '05-guides/gtrs-overview.md'
      },
      {
        id: 'gtrs-migration',
        title: 'GTRS 迁移指南',
        icon: '🔄',
        category: '项目指南',
        path: '05-guides/gtrs-migration.md'
      },
      {
        id: 'gtrs-integration',
        title: 'GTRS 游戏集成指南',
        icon: '🎮',
        category: '项目指南',
        path: '05-guides/gtrs-integration.md'
      },
      {
        id: 'theme-resource-spec',
        title: '主题资源模板规范',
        icon: '📐',
        category: '项目指南',
        path: '05-guides/theme-resource-spec.md'
      },
      {
        id: 'theme-quickstart',
        title: '主题快速开始',
        icon: '⚡',
        category: '项目指南',
        path: '05-guides/theme-quickstart.md'
      },
      {
        id: 'game-development',
        title: '游戏开发对接文档',
        icon: '🎯',
        category: '项目指南',
        path: '05-guides/game-development.md'
      },
      {
        id: 'port-config',
        title: '端口配置说明',
        icon: '🔌',
        category: '项目指南',
        path: '05-guides/port-config.md'
      }
    ]
  }
];

/**
 * 根据 ID 获取文档配置
 */
export function getDocById(id: string): DocConfig | undefined {
  for (const category of docCategories) {
    const doc = category.docs.find(d => d.id === id);
    if (doc) {
      return doc;
    }
  }
  return undefined;
}

/**
 * 搜索文档
 */
export function searchDocs(query: string): DocConfig[] {
  const results: DocConfig[] = [];
  const lowerQuery = query.toLowerCase();
  
  for (const category of docCategories) {
    for (const doc of category.docs) {
      if (doc.title.toLowerCase().includes(lowerQuery)) {
        results.push(doc);
      }
    }
  }
  
  return results;
}
