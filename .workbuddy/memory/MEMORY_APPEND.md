

## PVZ 资源管理器功能扩展（2026-04-15）

**新增功能**：帧序列图制作器

**文件**：`kids-game-house/games/pvz/public/resource-manager.html`

**功能特性**：
1. **批量导入**：支持拖拽或点击导入多张 PNG/JPG 图片作为帧
2. **拖拽排序**：支持拖拽调整帧顺序
3. **动画预览**：实时预览动画效果，可调整帧率（1-30 FPS）
4. **布局设置**：水平排列、网格排列，可设置每行帧数、帧宽高、间距
5. **雪碧图预览**：实时显示输出尺寸和布局效果
6. **导出功能**：同时导出雪碧图 PNG + metadata.json（含帧坐标信息）

**metadata.json 格式**：
```json
{
  "frameWidth": 256,
  "frameHeight": 256,
  "totalFrames": 8,
  "cols": 4,
  "rows": 2,
  "frames": [
    { "index": 0, "col": 0, "row": 0, "x": 0, "y": 0 },
    ...
  ]
}
```

**使用入口**：侧边栏 → 快捷操作 → 🎬 帧序列图制作
