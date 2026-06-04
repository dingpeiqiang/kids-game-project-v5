/**
 * 后台管理菜单配置
 */

export interface MenuItem {
  id: string;
  name: string;
  icon: string;
  path: string;
}

export const adminMenuItems: MenuItem[] = [
  {
    id: 'dashboard',
    name: '仪表盘',
    icon: '📊',
    path: '/admin/dashboard'
  },
  {
    id: 'users',
    name: '用户管理',
    icon: '👥',
    path: '/admin/users'
  },
  {
    id: 'relations',
    name: '关系管理',
    icon: '🔗',
    path: '/admin/relations'
  },
  {
    id: 'configs',
    name: '管控配置',
    icon: '⚙️',
    path: '/admin/configs'
  },
  {
    id: 'stats',
    name: '统计报表',
    icon: '📈',
    path: '/admin/stats'
  },
  {
    id: 'games',
    name: '游戏管理',
    icon: '🎮',
    path: '/admin/games'
  },
  {
    id: 'questions',
    name: '题库管理',
    icon: '📝',
    path: '/admin/questions'
  },
  {
    id: 'docs',
    name: '项目手册',
    icon: '📚',
    path: '/admin/docs'
  },
  {
    id: 'themes',
    name: '主题管理',
    icon: '🎨',
    path: '/admin/themes'
  },
  {
    id: 'game-resources',
    name: '游戏资源管理',
    icon: '🖼️',
    path: '/admin/game-resources'
  }
];
