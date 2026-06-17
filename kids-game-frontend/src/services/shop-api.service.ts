/**
 * 商城 API（委托统一 apiClient，自动带 Authorization / 设备指纹）
 */
import { apiClient } from './api-client.service';

export interface ShopProduct {
  [key: string]: unknown;
}

export interface ShopPurchaseResult {
  [key: string]: unknown;
}

export const shopApi = {
  listProducts(): Promise<ShopProduct[]> {
    return apiClient.get<ShopProduct[]>('/api/shop/products');
  },

  purchase(productId: number, quantity = 1): Promise<ShopPurchaseResult> {
    return apiClient.post<ShopPurchaseResult>('/api/shop/purchase', {
      productId,
      quantity,
    });
  },
};

/** @deprecated 使用 shopApi 对象即可 */
export type ShopApiService = typeof shopApi;

export default shopApi;