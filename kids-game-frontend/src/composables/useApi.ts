/**
 * 统一 API 调用入口（组合式 API）
 *
 * @example
 * const { shop, task, client, auth } = useApi();
 * const products = await shop.listProducts();
 * await client.get('/api/foo');
 */
import { apiClient } from '@/services/api-client.service';
import { shopApi } from '@/services/shop-api.service';
import { taskApi } from '@/services/task-api.service';
import { authApi } from '@/services/auth-api.service';
import { kidApi } from '@/services/kid-api.service';
import { parentApi } from '@/services/parent-api.service';
import { gameApi } from '@/services/game-api.service';
import { authUtils } from '@/core/network/auth-interceptor';

export function useApi() {
  return {
    /** 唯一 HTTP 客户端（get/post/put/delete，自动 Token + 401 刷新） */
    client: apiClient,
    shop: shopApi,
    task: taskApi,
    auth: authApi,
    kid: kidApi,
    parent: parentApi,
    game: gameApi,
    authUtils,
  };
}

export type UseApiReturn = ReturnType<typeof useApi>;