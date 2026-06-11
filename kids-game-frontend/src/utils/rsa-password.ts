/**
 * 登录密码 RSA 加密（PKCS#1 v1.5，与后端 RSA/ECB/PKCS1Padding 一致）
 */
import JSEncrypt from 'jsencrypt';
import { envConfig } from '@/core/config/env';

const PUBLIC_KEY_CACHE_TTL_MS = 10 * 60 * 1000;

interface CachedPublicKey {
  publicKey: string;
  keyIndex: number;
  fetchedAt: number;
}

let cached: CachedPublicKey | null = null;

function pemFromBase64Spki(base64: string): string {
  const lines = base64.match(/.{1,64}/g) || [base64];
  return `-----BEGIN PUBLIC KEY-----\n${lines.join('\n')}\n-----END PUBLIC KEY-----`;
}

async function fetchPublicKey(): Promise<CachedPublicKey> {
  const now = Date.now();
  if (cached && now - cached.fetchedAt < PUBLIC_KEY_CACHE_TTL_MS) {
    return cached;
  }

  const baseUrl = envConfig.apiBaseUrl.replace(/\/$/, '');
  const res = await fetch(`${baseUrl}/api/auth/public-key`);
  const json = (await res.json()) as {
    code?: number;
    data?: { publicKey?: string; keyIndex?: number };
  };
  if (json.code !== 200 || !json.data?.publicKey) {
    throw new Error('获取登录公钥失败');
  }
  cached = {
    publicKey: json.data.publicKey,
    keyIndex: json.data.keyIndex ?? 0,
    fetchedAt: now,
  };
  return cached;
}

/**
 * 加密登录密码；失败返回 null（开发环境可回退明文 password）
 */
export async function encryptPasswordForLogin(
  plainPassword: string,
): Promise<{ encryptedPassword: string; keyIndex: number } | null> {
  try {
    const { publicKey, keyIndex } = await fetchPublicKey();
    const encrypt = new JSEncrypt();
    encrypt.setPublicKey(pemFromBase64Spki(publicKey));
    const encryptedPassword = encrypt.encrypt(plainPassword);
    if (!encryptedPassword) {
      return null;
    }
    return { encryptedPassword, keyIndex };
  } catch (e) {
    console.warn('[rsa-password] 加密失败:', e);
    return null;
  }
}