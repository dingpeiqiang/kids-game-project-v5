#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
主题资源生成器
为贪吃蛇和 PVZ 游戏生成主题资源图片
"""

import os
from PIL import Image, ImageDraw, ImageFont
import json

# 输出目录配置
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), '..', 'kids-game-frontend', 'dist', 'games')
ASSETS_DIR = os.path.join(os.path.dirname(__file__), '..', 'kids-game-frontend', 'assets', 'games')

# 资源尺寸配置
RESOURCE_SIZES = {
    'snake': {
        'snakeHead': (64, 64),
        'snakeBody': (48, 48),
        'snakeTail': (32, 32),
        'food': (32, 32),
        'background': (1920, 1080)
    },
    'pvz': {
        'plant_peashooter': (64, 64),
        'plant_sunflower': (64, 64),
        'plant_wallnut': (64, 64),
        'zombie_normal': (64, 64),
        'zombie_conehead': (64, 64),
        'sun': (48, 48),
        'pea': (16, 16),
        'gameBg': (800, 600),
        'plant_slot': (100, 60)
    }
}

# 主题颜色配置
THEME_COLORS = {
    'snake': {
        'default': {
            'snakeHead': '#00ff00',
            'snakeBody': '#42b983',
            'snakeTail': '#22c55e',
            'food': '#ff0000',
            'background': '#0a0a1a'
        },
        'retro': {
            'snakeHead': '#32cd32',
            'snakeBody': '#228b22',
            'snakeTail': '#006400',
            'food': '#ffff00',
            'background': '#000000'
        },
        'orange': {
            'snakeHead': '#ff6600',
            'snakeBody': '#ff9933',
            'snakeTail': '#cc5500',
            'food': '#00ffff',
            'background': '#1a1a2e'
        }
    },
    'pvz': {
        'default': {
            'plant_peashooter': '#4caf50',
            'plant_sunflower': '#ffeb3b',
            'plant_wallnut': '#8d6e63',
            'zombie_normal': '#757575',
            'zombie_conehead': '#ff9800',
            'sun': '#ffeb3b',
            'pea': '#4caf50',
            'background': '#1a472a'
        },
        'moon': {
            'plant_peashooter': '#9c27b0',
            'plant_sunflower': '#cddc39',
            'plant_wallnut': '#5d4037',
            'zombie_normal': '#424242',
            'zombie_conehead': '#ff9800',
            'sun': '#cddc39',
            'pea': '#9c27b0',
            'background': '#0f0216'
        },
        'cute': {
            'plant_peashooter': '#ec407a',
            'plant_sunflower': '#f06292',
            'plant_wallnut': '#a1887f',
            'zombie_normal': '#bdbdbd',
            'zombie_conehead': '#ffa726',
            'sun': '#ff9800',
            'pea': '#f06292',
            'background': '#fce4ec'
        }
    }
}


def create_gradient_background(width, height, color1, color2):
    """创建渐变背景"""
    img = Image.new('RGB', (width, height), color1)
    draw = ImageDraw.Draw(img)
    
    for y in range(height):
        r = int(color1[0] + (color2[0] - color1[0]) * y / height)
        g = int(color1[1] + (color2[1] - color1[1]) * y / height)
        b = int(color1[2] + (color2[2] - color1[2]) * y / height)
        draw.line((0, y, width, y), fill=(r, g, b))
    
    return img


def create_simple_shape_image(width, height, bg_color, shape_type, text_label=''):
    """创建简单的几何图形图片"""
    # 创建图片
    img = Image.new('RGBA', (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # 计算中心点
    cx, cy = width // 2, height // 2
    
    if shape_type == 'circle':
        # 绘制圆形
        radius = min(width, height) // 2 - 2
        draw.ellipse(
            [cx - radius, cy - radius, cx + radius, cy + radius],
            fill=bg_color
        )
    elif shape_type == 'rectangle':
        # 绘制矩形
        margin = 2
        draw.rectangle(
            [margin, margin, width - margin, height - margin],
            fill=bg_color
        )
    elif shape_type == 'rounded_rect':
        # 绘制圆角矩形
        margin = 2
        radius = 8
        draw.rounded_rectangle(
            [margin, margin, width - margin, height - margin],
            radius=radius,
            fill=bg_color
        )
    elif shape_type == 'gradient_bg':
        # 渐变背景（简化版）
        img = Image.new('RGB', (width, height), bg_color)
        return img.convert('RGBA')
    
    # 添加文字标签（如果有）
    if text_label:
        try:
            # 尝试使用系统字体
            font_size = max(12, min(width, height) // 4)
            font = ImageFont.truetype("simhei.ttf", font_size)  # 黑体
        except:
            font = ImageFont.load_default()
        
        # 获取文字边界框
        bbox = draw.textbbox((0, 0), text_label, font=font)
        text_width = bbox[2] - bbox[0]
        text_height = bbox[3] - bbox[1]
        
        # 居中绘制文字
        text_x = (width - text_width) // 2
        text_y = (height - text_height) // 2
        draw.text((text_x, text_y), text_label, fill='white', font=font)
    
    return img


def generate_snake_resources(theme_name, theme_colors):
    """生成贪吃蛇主题资源"""
    # 生成到 dist 目录
    game_dir = os.path.join(OUTPUT_DIR, 'snake-vue3', 'themes', theme_name, 'images')
    os.makedirs(game_dir, exist_ok=True)
    
    # 也生成到 assets 目录（方便后续构建）
    assets_game_dir = os.path.join(ASSETS_DIR, 'snake-vue3', 'themes', theme_name, 'images')
    os.makedirs(assets_game_dir, exist_ok=True)
    
    print(f"🎨 生成贪吃蛇 - {theme_name} 主题资源...")
    
    # 生成蛇头（圆形）
    size = RESOURCE_SIZES['snake']['snakeHead']
    color = theme_colors.get('snakeHead', '#00ff00')
    img = create_simple_shape_image(size[0], size[1], color, 'circle', 'Head')
    img.save(os.path.join(game_dir, 'snakeHead.png'))
    img.save(os.path.join(assets_game_dir, 'snakeHead.png'))
    
    # 生成蛇身（圆角矩形）
    size = RESOURCE_SIZES['snake']['snakeBody']
    color = theme_colors.get('snakeBody', '#42b983')
    img = create_simple_shape_image(size[0], size[1], color, 'rounded_rect')
    img.save(os.path.join(game_dir, 'snakeBody.png'))
    img.save(os.path.join(assets_game_dir, 'snakeBody.png'))
    
    # 生成蛇尾（圆形，稍小）
    size = RESOURCE_SIZES['snake']['snakeTail']
    color = theme_colors.get('snakeTail', '#22c55e')
    img = create_simple_shape_image(size[0], size[1], color, 'circle', 'Tail')
    img.save(os.path.join(game_dir, 'snakeTail.png'))
    img.save(os.path.join(assets_game_dir, 'snakeTail.png'))
    
    # 生成食物（圆形）
    size = RESOURCE_SIZES['snake']['food']
    color = theme_colors.get('food', '#ff0000')
    img = create_simple_shape_image(size[0], size[1], color, 'circle', 'Food')
    img.save(os.path.join(game_dir, 'food.png'))
    img.save(os.path.join(assets_game_dir, 'food.png'))
    
    # 生成背景（渐变色）
    size = RESOURCE_SIZES['snake']['background']
    bg_color = theme_colors.get('background', '#0a0a1a')
    # 将十六进制颜色转换为 RGB 元组
    bg_rgb = tuple(int(bg_color[i:i+2], 16) for i in (1, 3, 5))
    darker_rgb = tuple(max(0, c - 30) for c in bg_rgb)
    img = create_gradient_background(size[0], size[1], bg_rgb, darker_rgb)
    img.save(os.path.join(game_dir, 'background.png'))
    img.save(os.path.join(assets_game_dir, 'background.png'))
    
    print(f"✅ 贪吃蛇 - {theme_name} 主题资源生成完成")


def generate_pvz_resources(theme_name, theme_colors):
    """生成 PVZ 主题资源"""
    game_dir = os.path.join(OUTPUT_DIR, 'plants-vs-zombie', 'themes', theme_name, 'images')
    os.makedirs(game_dir, exist_ok=True)
    
    print(f"🧟 生成 PVZ - {theme_name} 主题资源...")
    
    # 生成植物资源
    plant_types = ['plant_peashooter', 'plant_sunflower', 'plant_wallnut']
    for plant in plant_types:
        size = RESOURCE_SIZES['pvz'][plant]
        color = theme_colors.get(plant, '#4caf50')
        label = plant.replace('plant_', '').replace('_', ' ').title()
        img = create_simple_shape_image(size[0], size[1], color, 'rounded_rect', label)
        img.save(os.path.join(game_dir, f'{plant}.png'))
    
    # 生成僵尸资源
    zombie_types = ['zombie_normal', 'zombie_conehead']
    for zombie in zombie_types:
        size = RESOURCE_SIZES['pvz'][zombie]
        color = theme_colors.get(zombie, '#757575')
        label = zombie.replace('zombie_', '').replace('_', ' ').title()
        img = create_simple_shape_image(size[0], size[1], color, 'rectangle', label)
        img.save(os.path.join(game_dir, f'{zombie}.png'))
    
    # 生成阳光（圆形）
    size = RESOURCE_SIZES['pvz']['sun']
    color = theme_colors.get('sun', '#ffeb3b')
    img = create_simple_shape_image(size[0], size[1], color, 'circle', 'Sun')
    img.save(os.path.join(game_dir, 'sun.png'))
    
    # 生成豌豆子弹（圆形）
    size = RESOURCE_SIZES['pvz']['pea']
    color = theme_colors.get('pea', '#4caf50')
    img = create_simple_shape_image(size[0], size[1], color, 'circle')
    img.save(os.path.join(game_dir, 'pea.png'))
    
    # 生成游戏背景
    size = RESOURCE_SIZES['pvz']['gameBg']
    bg_color = theme_colors.get('background', '#1a472a')
    bg_rgb = tuple(int(bg_color[i:i+2], 16) for i in (1, 3, 5))
    darker_rgb = tuple(max(0, c - 40) for c in bg_rgb)
    img = create_gradient_background(size[0], size[1], bg_rgb, darker_rgb)
    img.save(os.path.join(game_dir, 'gameBg.png'))
    
    # 生成植物卡片槽
    size = RESOURCE_SIZES['pvz']['plant_slot']
    img = create_simple_shape_image(size[0], size[1], '#2d5a3d', 'rounded_rect', 'Slot')
    img.save(os.path.join(game_dir, 'plant_slot.png'))
    
    print(f"✅ PVZ - {theme_name} 主题资源生成完成")


def main():
    """主函数"""
    print("="*60)
    print("🎨 开始生成游戏主题资源")
    print("="*60)
    
    # 确保输出目录存在
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    # 生成贪吃蛇主题资源
    for theme_name, colors in THEME_COLORS['snake'].items():
        generate_snake_resources(theme_name, colors)
    
    # 生成 PVZ 主题资源
    for theme_name, colors in THEME_COLORS['pvz'].items():
        generate_pvz_resources(theme_name, colors)
    
    print("\n" + "="*60)
    print("✅ 所有主题资源生成完成！")
    print("="*60)
    print(f"\n📂 资源保存位置：{OUTPUT_DIR}")
    print("\n📝 提示:")
    print("1. 启动前端服务器后，可以通过 http://localhost:5173/games/... 访问资源")
    print("2. 后端需要配置 CORS 允许跨域访问")
    print("3. 数据库中的 URL 应该指向本地资源路径")


if __name__ == "__main__":
    main()
