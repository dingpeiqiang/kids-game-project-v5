/**
 * 多端适配UI配置
 */
import type { UIConfig } from './types';

export const uiConfig: UIConfig = {
  breakpoints: {
    mobile: 768,
    tablet: 1024,
    desktop: 1280,
  },
  fontSize: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
  },
  button: {
    sm: { padding: '0.5rem 1rem', fontSize: '0.875rem' },
    base: { padding: '0.75rem 1.5rem', fontSize: '1rem' },
    lg: { padding: '1rem 2rem', fontSize: '1.125rem' },
    xl: { padding: '1.25rem 2.5rem', fontSize: '1.25rem' },
  },
  gameContainer: {
    mobile: { width: 360, height: 640 },
    tablet: { width: 768, height: 1024 },
    desktop: { width: 960, height: 640 },
  },
};

