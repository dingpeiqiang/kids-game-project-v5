/**
 * 登录问题临时修复
 * 如果 unifiedLogin 方法不可用，使用此备份方案
 */

import { useUserStore } from '@/core/store/user.store';
import { toast } from '@/services/toast.service';

export async function loginWithFallback(username: string, password: string): Promise<void> {
  const userStore = useUserStore();

  // 尝试统一登录
  try {
    if (typeof userStore.unifiedLogin === 'function') {
      console.log('[Login] 使用 unifiedLogin');
      const result = await userStore.unifiedLogin(username, password);

      // 根据用户类型跳转
      if (result.userType === 0) {
        toast.success('登录成功！开始游戏吧~');
        window.location.href = '/';
      } else if (result.userType === 1) {
        toast.success('家长登录成功！');
        window.location.href = '/parent';
      } else if (result.userType === 2) {
        toast.success('管理员登录成功！');
        window.location.href = '/admin';
      } else {
        throw new Error('未知用户类型');
      }
      return;
    }
  } catch (unifiedError) {
    console.log('[Login] 统一登录失败，尝试其他方式:', unifiedError);
  }

  // 回退到儿童登录
  try {
    console.log('[Login] 尝试儿童登录');
    await userStore.kidLogin(username, password);
    toast.success('登录成功！开始游戏吧~');
    window.location.href = '/';
    return;
  } catch (kidError) {
    console.log('[Login] 儿童登录失败:', kidError);

    // 回退到家长登录
    try {
      console.log('[Login] 尝试家长登录');
      await userStore.parentLogin(username, password);
      toast.success('家长登录成功！');
      window.location.href = '/parent';
      return;
    } catch (parentError) {
      console.log('[Login] 家长登录失败:', parentError);
      throw new Error('用户名或密码错误');
    }
  }
}
