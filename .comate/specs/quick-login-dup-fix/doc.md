# Quick-Login Duplicate Account Fix

## Problem

登录面板快捷登录区域出现两个相同的账号，经排查发现存在 `data-uid="undefined"` 的 DOM 元素，说明 `localStorage` 中 `ugp_accounts` 列表里有 `id` 为 `undefined` 的脏数据。

## Root Cause Analysis

`loadLocalAccounts()` 直接从 `localStorage` 解析 JSON，没有任何数据合法性校验。当 `upsertLocalAccount()` 被调用时传入的 `meta.id` 为 `undefined`，`findIndex(a => a.id === undefined)` 找不到匹配项，就会将这条脏数据 push 到列表中。

所有 `upsertLocalAccount` 的调用点理论上都有正确的 `id`，但以下边缘情况可能导致脏数据写入：
- 旧版本 localStorage 遗留的无效字段
- 后端返回数据结构异常（如 `userId` 缺失）
- 手动修改 localStorage 或跨版本升级

核心问题是缺少**读写的防御性校验**：
1. 写入时：未校验 `id` 的有效性
2. 读取时：未过滤非法条目

## Solution

### 1. 读取时过滤 + 自动清理（Loading time sanitization）

在 `loadLocalAccounts()` 中过滤掉所有 `id` 为 null/undefined/空字符串 的条目，并将其写回 localStorage 完成自动修复。

修改文件：`kids-game-simple/src/services/userService.ts`

```typescript
function loadLocalAccounts(): LocalAccountMeta[] {
  try {
    const raw = JSON.parse(localStorage.getItem(LOCAL_KEYS.accounts) || '[]')
    if (!Array.isArray(raw)) return []
    const valid = raw.filter((a: any) => a && typeof a.id === 'string' && a.id.length > 0)
    // 自动修复：如果有脏数据，清理后写回
    if (valid.length !== raw.length) {
      saveLocalAccounts(valid)
    }
    return valid
  } catch {
    return []
  }
}
```

### 2. 写入时增加防御（Write time guard）

在 `upsertLocalAccount()` 中对 `meta.id` 做有效性校验，避免写入无效数据。

修改文件：`kids-game-simple/src/services/userService.ts`

```typescript
function upsertLocalAccount(meta: LocalAccountMeta) {
  if (!meta.id || typeof meta.id !== 'string') {
    console.warn('[UserService] 忽略无效账号元数据：缺少 id', meta)
    return
  }
  const list = loadLocalAccounts()
  const idx = list.findIndex(a => a.id === meta.id)
  if (idx >= 0) list[idx] = meta
  else list.push(meta)
  saveLocalAccounts(list)
}
```

### 3. UI 层防御性渲染（UI level guard）

在 `loginPanel()` 的模板渲染中增加对 `a.id` 的防御性检查，避免渲染出 `data-uid="undefined"`。

修改文件：`kids-game-simple/src/services/userUI.ts`

```typescript
const accountList = accounts.length > 0 ? `
  <div class="ugp-acct-list-label">本机账号快速登录</div>
  <div class="ugp-acct-list">
    ${accounts.filter(a => a.id).map(a => {
      const lv = getLevelByExp(a.exp)
      return `<div class="ugp-acct-item" data-uid="${a.id}">
        ...
      </div>`
    }).join('')}
  </div>
  ...
` : ''
```

## Affected Files

| File | Modification Type | Description |
|------|-------------------|-------------|
| `kids-game-simple/src/services/userService.ts` | Edit | 修改 `loadLocalAccounts()` 增加过滤，修改 `upsertLocalAccount()` 增加写入校验 |
| `kids-game-simple/src/services/userUI.ts` | Edit | 修改 `loginPanel()` 中的 accounts.map，增加 id 过滤 |

## Boundary Conditions & Exception Handling

- **localStorage 损坏**：`loadLocalAccounts` 已有 try/catch，损坏时返回空数组
- **旧版本 null/undefined id**：过滤逻辑会移除并写回清理后的数据
- **非数组数据**：`!Array.isArray(raw)` 检查，返回空数组
- **空 id 字符串**：`a.id.length > 0` 检查
- **后端返回异常**：UI 层的 filter 作为兜底防护

## Expected Outcome

1. 已有脏数据的用户打开登录面板时，脏账号不会显示
2. 脏数据被自动从 localStorage 清理（写入 clean list）
3. 后续不会再写入无效的账号元数据
4. 正常账号列表不受任何影响
