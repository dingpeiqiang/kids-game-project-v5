/**
 * 登录入口（统一走 /api/auth/login）
 * 所有用户登录后都跳转到终端首页，家长/管理员在首页通过中心按钮跳转到管理端
 */
import { useUserStore } from '@/core/store/user.store';
import { toast } from '@/services/toast.service';

export async function loginWithFallback(username: string, password: string): Promise<void> {
  const userStore = useUserStore();
  const result = await userStore.unifiedLogin(username, password);

  if (result.userType === 0) {
    toast.success('登录成功！开始游戏吧~');
    window.location.href = '/';
  } else if (result.userType === 1) {
    toast.success('家长登录成功！');
    window.location.href = '/';
  } else if (result.userType === 2) {
    toast.success('管理员登录成功！');
    window.location.href = '/';
  } else {
    throw new Error('用户类型异常，请联系管理员');
  }
}