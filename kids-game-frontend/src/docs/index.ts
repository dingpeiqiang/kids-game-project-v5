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
        id: 'development-guide',
        title: '开发指南',
        icon: '💻',
        category: '开发规范',
        path: '03-development/index.md'
      },
      {
        id: 'refactoring',
        title: '重构指南',
        icon: '🔄',
        category: '开发规范',
        path: '../../../REFACTORING_GUIDE.md'
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
      },
      {
        id: 'permission-design',
        title: '权限设计',
        icon: '🔐',
        category: '架构设计',
        path: '../../../GAME_PERMISSION_REFACTOR_DESIGN.md'
      }
    ]
  },
  {
    name: '功能文档',
    icon: '📊',
    docs: [
      {
        id: 'admin-dashboard',
        title: '管理员后台',
        icon: '🎯',
        category: '功能文档',
        path: '../../../ADMIN_DASHBOARD_README.md'
      },
      {
        id: 'fatigue-system',
        title: '疲劳值系统',
        icon: '💪',
        category: '功能文档',
        path: '../../../UNIFIED_FATIGUE_SYSTEM_SUMMARY.md'
      },
      {
        id: 'registration',
        title: '注册功能',
        icon: '📝',
        category: '功能文档',
        path: '../../../REGISTRATION_FEATURE.md'
      }
    ]
  },
  {
    name: '快速参考',
    icon: '⚡',
    docs: [
      {
        id: 'quick-reference',
        title: '快速参考',
        icon: '📋',
        category: '快速参考',
        path: '../../../QUICK_REFERENCE.md'
      },
      {
        id: 'phase2-reference',
        title: '阶段二参考',
        icon: '📖',
        category: '快速参考',
        path: '../../../PHASE2_QUICK_REFERENCE.md'
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
