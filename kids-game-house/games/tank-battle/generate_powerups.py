#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
坦克大战道具图片生成器
为所有缺失的道具类型生成统一的像素风格图标
"""

from PIL import Image, ImageDraw
import os

# 道具配置：类型、颜色、图标形状
POWERUP_CONFIGS = {
    'gun': {
        'color': '#FF4444',
        'shape': 'gun',
        'desc': '散弹枪 - 红色枪管'
    },
    'homing': {
        'color': '#FF8800',
        'shape': 'missile',
        'desc': '追踪导弹 - 橙色导弹'
    },
    'bomb': {
        'color': '#8800FF',
        'shape': 'bomb',
        'desc': '全屏炸弹 - 紫色炸弹'
    },
    'speed': {
        'color': '#00FFFF',
        'shape': 'lightning',
        'desc': '速度提升 - 青色闪电'
    },
    'health': {
        'color': '#00FF00',
        'shape': 'heart',
        'desc': '生命恢复 - 绿色爱心'
    },
    'armor': {
        'color': '#888888',
        'shape': 'shield',
        'desc': '装甲强化 - 灰色盾牌'
    },
    'grenade': {
        'color': '#FF6600',
        'shape': 'grenade',
        'desc': '手榴弹 - 橙色手雷'
    },
    'invincible': {
        'color': '#FFD700',
        'shape': 'star_shield',
        'desc': '无敌状态 - 金色护盾'
    },
    'life': {
        'color': '#FF1493',
        'shape': 'heart_big',
        'desc': '额外生命 - 粉色大爱心'
    }
}

def draw_pixel_rect(draw, x1, y1, x2, y2, color):
    """绘制像素风格的矩形（带边框效果）"""
    # 主色填充
    draw.rectangle([x1, y1, x2, y2], fill=color)
    # 亮边（上、左）
    draw.line([(x1, y1), (x2, y1)], fill='#FFFFFF', width=1)
    draw.line([(x1, y1), (x1, y2)], fill='#FFFFFF', width=1)
    # 暗边（下、右）
    draw.line([(x1, y2), (x2, y2)], fill='#000000', width=1)
    draw.line([(x2, y1), (x2, y2)], fill='#000000', width=1)

def draw_gun_icon(draw, cx, cy, color):
    """绘制枪管图标"""
    # 枪管主体
    draw_pixel_rect(draw, cx-8, cy-4, cx+8, cy+4, color)
    # 枪口
    draw_pixel_rect(draw, cx+8, cy-2, cx+12, cy+2, '#333333')
    # 握把
    draw_pixel_rect(draw, cx-4, cy+4, cx+4, cy+10, '#654321')

def draw_missile_icon(draw, cx, cy, color):
    """绘制导弹图标"""
    # 导弹身体（菱形）
    points = [
        (cx, cy-10),  # 顶部
        (cx+6, cy),   # 右
        (cx, cy+10),  # 底部
        (cx-6, cy),   # 左
    ]
    draw.polygon(points, fill=color)
    # 尾翼
    draw.line([(cx-8, cy-4), (cx-4, cy)], fill='#FF6600', width=2)
    draw.line([(cx-8, cy+4), (cx-4, cy)], fill='#FF6600', width=2)

def draw_bomb_icon(draw, cx, cy, color):
    """绘制炸弹图标"""
    # 圆形炸弹主体
    draw.ellipse([cx-10, cy-10, cx+10, cx+10], fill=color)
    # 引信
    draw.line([(cx, cy-10), (cx+4, cy-16)], fill='#000000', width=2)
    # 火花
    draw.ellipse([cx+2, cy-18, cx+6, cy-14], fill='#FFCC00')

def draw_lightning_icon(draw, cx, cy, color):
    """绘制闪电图标"""
    points = [
        (cx+2, cy-10),
        (cx-6, cy+2),
        (cx-2, cy+2),
        (cx-4, cy+10),
        (cx+6, cy-2),
        (cx+2, cy-2),
    ]
    draw.polygon(points, fill=color)

def draw_heart_icon(draw, cx, cy, color):
    """绘制爱心图标"""
    # 左圆
    draw.ellipse([cx-10, cy-8, cx-2, cy+4], fill=color)
    # 右圆
    draw.ellipse([cx+2, cy-8, cx+10, cy+4], fill=color)
    # 下三角
    draw.polygon([(cx-8, cy), (cx+8, cy), (cx, cy+10)], fill=color)

def draw_shield_icon(draw, cx, cy, color):
    """绘制盾牌图标"""
    # 盾牌外形
    points = [
        (cx-8, cy-10),
        (cx+8, cy-10),
        (cx+8, cy+4),
        (cx, cy+10),
        (cx-8, cy+4),
    ]
    draw.polygon(points, fill=color)
    # 内部装饰
    draw.line([(cx-4, cy-6), (cx+4, cy-6)], fill='#CCCCCC', width=2)

def draw_grenade_icon(draw, cx, cy, color):
    """绘制手榴弹图标"""
    # 弹体
    draw.ellipse([cx-8, cy-6, cx+8, cy+6], fill=color)
    # 握把
    draw_pixel_rect(draw, cx-3, cy+6, cx+3, cy+10, '#654321')
    # 引信
    draw.line([(cx, cy-6), (cx, cy-10)], fill='#333333', width=2)

def draw_star_shield_icon(draw, cx, cy, color):
    """绘制无敌护盾图标"""
    # 外圈
    draw.ellipse([cx-10, cy-10, cx+10, cy+10], outline=color, width=2)
    # 内星
    for i in range(5):
        angle = 3.14159 * 2 * i / 5 - 3.14159 / 2
        x1 = cx + int(6 * (angle if angle < 0 else -angle))
        y1 = cy + int(6 * (1 if angle > 0 else -1))
        draw.line([(cx, cy), (x1, y1)], fill=color, width=2)

def draw_heart_big_icon(draw, cx, cy, color):
    """绘制大爱心图标"""
    # 更大的爱心
    draw.ellipse([cx-12, cy-10, cx-2, cy+6], fill=color)
    draw.ellipse([cx+2, cy-10, cx+12, cy+6], fill=color)
    draw.polygon([(cx-10, cy), (cx+10, cy), (cx, cy+14)], fill=color)

def generate_powerup_image(powerup_type, config, size=64):
    """生成单个道具图片"""
    # 创建透明背景
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    cx, cy = size // 2, size // 2
    
    # 根据形状调用不同的绘制函数
    shape_funcs = {
        'gun': draw_gun_icon,
        'missile': draw_missile_icon,
        'bomb': draw_bomb_icon,
        'lightning': draw_lightning_icon,
        'heart': draw_heart_icon,
        'shield': draw_shield_icon,
        'grenade': draw_grenade_icon,
        'star_shield': draw_star_shield_icon,
        'heart_big': draw_heart_big_icon,
    }
    
    if config['shape'] in shape_funcs:
        shape_funcs[config['shape']](draw, cx, cy, config['color'])
    
    return img

def main():
    """主函数"""
    output_dir = r'd:\工作\sitech\项目\研发\git_workspace\AI\kids-game-project-v5\kids-game-house\games\tank-battle\public\themes\tank_default\assets\scene'
    
    print("🎨 开始生成道具图片...")
    print(f"输出目录：{output_dir}\n")
    
    for powerup_type, config in POWERUP_CONFIGS.items():
        filename = f'prop_{powerup_type}.png'
        filepath = os.path.join(output_dir, filename)
        
        print(f"生成：{filename} - {config['desc']}")
        
        # 生成图片
        img = generate_powerup_image(powerup_type, config)
        
        # 保存图片
        img.save(filepath, 'PNG')
        print(f"  ✓ 已保存：{filepath}\n")
    
    print("✅ 所有道具图片生成完成！")
    print(f"\n共生成 {len(POWERUP_CONFIGS)} 个道具图片文件。")

if __name__ == '__main__':
    main()
