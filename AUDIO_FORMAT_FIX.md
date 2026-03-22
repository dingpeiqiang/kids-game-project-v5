# GTRS 编辑器音频格式显示修复

## 问题描述
GTRS 编辑器 DIY 模式时，加载的音频资源显示格式为 wmv，但实际的资源格式是 mp3。

## 根本原因
1. **音频类型检测不完整**：文件上传时只支持 `mp3`、`wav`、`ogg` 三种格式，不支持录音功能生成的 `webm` 格式
2. **格式显示逻辑错误**：显示时使用默认值 `'mp3'`，而不是根据实际的 `type` 字段或从 URL 中提取格式
3. **录音转换后类型未更新**：录音经过截取处理后转换为 WAV 格式，但上传时类型仍设置为 `webm`

## 修复内容

### 1. 添加格式提取函数
新增 `getFormatFromSrc` 函数，从音频资源的 src URL 中提取实际的文件格式：

```typescript
const getFormatFromSrc = (src: string): string => {
  if (!src) return '未知'
  
  // 处理查询参数，先去掉
  const cleanSrc = src.split('?')[0]
  const extension = cleanSrc.split('.').pop()?.toLowerCase()
  
  // 常见的音频格式映射
  const formatMap: Record<string, string> = {
    'mp3': 'mp3',
    'wav': 'wav',
    'ogg': 'ogg',
    'webm': 'webm',
    'm4a': 'm4a',
    'flac': 'flac',
    'aac': 'aac'
  }
  
  return formatMap[extension || ''] || extension || '未知'
}
```

### 2. 更新格式显示逻辑
将音频格式显示从固定默认值改为动态获取：

```vue
<div class="info-row">
  <span class="info-label">格式:</span>
  <span class="info-value">{{ item.type || getFormatFromSrc(item.src) }}</span>
</div>
```

**修改前**：`{{ item.type || 'mp3' }}` - 总是显示 mp3
**修改后**：`{{ item.type || getFormatFromSrc(item.src) }}` - 根据实际文件格式显示

### 3. 支持 webm 格式识别
在文件上传时，增加对 `webm` 格式的支持：

```typescript
// 根据文件扩展名判断类型（更可靠），而不是依赖浏览器的 MIME type
const extension = file.name.split('.').pop()?.toLowerCase() || 'mp3'
const audioType = ['mp3', 'wav', 'ogg', 'webm'].includes(extension) ? extension : 'mp3'
```

**修改前**：`['mp3', 'wav', 'ogg']` - 不支持 webm
**修改后**：`['mp3', 'wav', 'ogg', 'webm']` - 支持 webm

### 4. 智能检测录音格式
在确认上传录音时，根据 Blob 的实际类型动态确定格式：

```typescript
// 根据 Blob 类型确定文件格式
const blobType = previewAudioBlob.value.type.split('/')[1] || 'webm'
const formatMap: Record<string, string> = {
  'webm': 'webm',
  'wav': 'wav',
  'mp3': 'mp3',
  'ogg': 'ogg',
  'mpeg': 'mp3',
  'x-matroska': 'webm'
}
const audioFormat = formatMap[blobType] || blobType || 'webm'

// 将 Blob 转换为 File，使用实际的格式
const file = new File(
  [previewAudioBlob.value],
  `recording_${Date.now()}.${audioFormat}`,
  { type: previewAudioBlob.value.type }
)

// 更新数据时使用实际格式
categoryData[key] = {
  ...categoryData[key],
  src: result.url,
  type: audioFormat
}
```

**修改前**：硬编码为 `type: 'webm'`
**修改后**：根据实际 Blob 类型动态确定 `type: audioFormat`

## 修复效果

### 场景 1：上传 MP3 文件
- **修改前**：格式显示为 `mp3`（正确）
- **修改后**：格式显示为 `mp3`（正确）✅

### 场景 2：上传 WAV 文件
- **修改前**：格式显示为 `wav`（正确）
- **修改后**：格式显示为 `wav`（正确）✅

### 场景 3：录音功能（WebM）
- **修改前**：格式显示为 `mp3`（❌ 错误）
- **修改后**：格式显示为 `webm`（✅ 正确）

### 场景 4：录音截取后（WAV）
- **修改前**：格式显示为 `webm`（❌ 错误，实际已转换为 WAV）
- **修改后**：格式显示为 `wav`（✅ 正确）

### 场景 5：DIY 模式加载已有主题
- **修改前**：格式显示为 `mp3`（❌ 错误，实际可能是其他格式）
- **修改后**：格式显示为实际格式（如 `mp3`、`wav`、`webm` 等）✅

## 支持的音频格式
现在系统支持以下音频格式的自动识别和显示：
- **MP3** (.mp3) - 最常用的音频格式
- **WAV** (.wav) - 无损音频格式
- **OGG** (.ogg) - 开源音频格式
- **WebM** (.webm) - 录音功能默认格式
- **M4A** (.m4a) - Apple 设备音频格式
- **FLAC** (.flac) - 无损压缩音频格式
- **AAC** (.aac) - 高级音频编码格式

## 修改文件
- `kids-game-frontend/src/modules/creator-center/panels/AudioResourcePanel.vue`

## 测试建议
1. 在 DIY 模式下加载包含不同格式音频的主题，验证格式显示是否正确
2. 测试上传各种格式的音频文件，验证格式识别是否准确
3. 测试录音功能，验证录音格式显示是否为 webm
4. 测试录音截取功能，验证截取后格式显示是否变为 wav
5. 检查后端数据库中存储的 type 字段是否正确

## 注意事项
- 该修复仅影响前端显示，不改变后端存储逻辑
- 如果后端要求特定格式，需要在上传服务中进行格式转换或校验
- 建议后端也存储实际的音频格式信息，确保前后端一致
