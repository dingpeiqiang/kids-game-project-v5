import type { Tower, Enemy, Bullet, Particle, FloatingText } from './types';
import { W, H, HUD_H, GRID, CELL, PATH_COLOR, PATH_POINTS, TOWER_TYPES } from './config';
export function drawPath(ctx: CanvasRenderingContext2D, pathPixels: {
 x: number;
 y: number;
}[]) {
 ctx.fillStyle = PATH_COLOR;
 PATH_POINTS.forEach((p, i) => {
 const prev = PATH_POINTS[i - 1];
 if (!prev)
 return;
 const dx = Math.sign(p.gx - prev.gx);
 const dy = Math.sign(p.gy - prev.gy);
 let cx = prev.gx, cy = prev.gy;
 for (let j = 0; j <= Math.abs(p.gx - prev.gx) + Math.abs(p.gy - prev.gy); j++) {
 if (cx >= 0 && cx < GRID && cy >= 0 && cy < GRID) {
 ctx.fillRect(cx * CELL + 1, cy * CELL + HUD_H + 1, CELL - 2, CELL - 2);
 }
 cx += dx;
 cy += dy;
 }
 });
 ctx.fillStyle = 'rgba(255,255,255,0.08)';
 ctx.font = '14px sans-serif';
 ctx.textAlign = 'center';
 for (let i = 1; i < pathPixels.length; i++) {
 const p = pathPixels[i - 1], c = pathPixels[i];
 const mx = (p.x + c.x) / 2, my = (p.y + c.y) / 2;
 const angle = Math.atan2(c.y - p.y, c.x - p.x);
 ctx.save();
 ctx.translate(mx, my);
 ctx.rotate(angle);
 ctx.fillText('→', 0, 4);
 ctx.restore();
 }
 ctx.fillStyle = '#2ECC71';
 ctx.font = 'bold 10px sans-serif';
 ctx.textAlign = 'center';
 ctx.fillText('入口 →', 25, pathPixels[0].y + 4);
 ctx.fillStyle = '#E74C3C';
 ctx.fillText('← 终点', W - 25, pathPixels[pathPixels.length - 1].y + 4);
}
export function drawTowers(ctx: CanvasRenderingContext2D, towers: Tower[], selectedTowerType: number) {
 towers.forEach(t => {
 const { x, y, type, angle } = t;
 ctx.fillStyle = 'rgba(255,255,255,0.08)';
 ctx.fillRect(t.gx * CELL + 2, t.gy * CELL + HUD_H + 2, CELL - 4, CELL - 4);
 if (TOWER_TYPES.indexOf(type) === selectedTowerType) {
 ctx.strokeStyle = type.color + '40';
 ctx.lineWidth = 2;
 ctx.setLineDash([5, 3]);
 ctx.beginPath();
 ctx.arc(x, y, type.range * CELL, 0, Math.PI * 2);
 ctx.stroke();
 ctx.setLineDash([]);
 }
 ctx.save();
 ctx.translate(x, y);
 const glowSize = 22 + t.level * 3;
 const glowIntensity = Math.min(1.0, 0.4 + t.level * 0.15);
 const alphaHex = Math.floor(glowIntensity * 255).toString(16).padStart(2, '0');
 const glow = ctx.createRadialGradient(0, 0, 4, 0, 0, glowSize);
 glow.addColorStop(0, type.color + alphaHex);
 glow.addColorStop(1, type.color + '00');
 ctx.fillStyle = glow;
 ctx.beginPath();
 ctx.arc(0, 0, glowSize, 0, Math.PI * 2);
 ctx.fill();
 if (t.level >= 2) {
 const outerGlow = ctx.createRadialGradient(0, 0, glowSize - 5, 0, 0, glowSize + 8);
 outerGlow.addColorStop(0, '#FFD700' + (t.level === 3 ? '40' : '20'));
 outerGlow.addColorStop(1, '#FFD700' + '00');
 ctx.fillStyle = outerGlow;
 ctx.beginPath();
 ctx.arc(0, 0, glowSize + 8, 0, Math.PI * 2);
 ctx.fill();
 }
 const baseSize = 14 + t.level * 2;
 ctx.fillStyle = '#2d3436';
 ctx.beginPath();
 ctx.arc(0, 0, baseSize, 0, Math.PI * 2);
 ctx.fill();
 ctx.strokeStyle = type.color;
 ctx.lineWidth = 2 + t.level * 0.5;
 ctx.beginPath();
 ctx.arc(0, 0, baseSize, 0, Math.PI * 2);
 ctx.stroke();
 if (t.level >= 2) {
 ctx.strokeStyle = '#FFD700';
 ctx.lineWidth = 1.5;
 ctx.beginPath();
 ctx.arc(0, 0, baseSize - 5, 0, Math.PI * 2);
 ctx.stroke();
 }
 if (t.level >= 3) {
 ctx.strokeStyle = '#00E5FF';
 ctx.lineWidth = 1.2;
 ctx.beginPath();
 ctx.arc(0, 0, baseSize - 9, 0, Math.PI * 2);
 ctx.stroke();
 }
 if (t.level >= 4) {
 ctx.strokeStyle = '#9C27B0';
 ctx.lineWidth = 1;
 ctx.setLineDash([3, 2]);
 ctx.beginPath();
 ctx.arc(0, 0, baseSize + 3, 0, Math.PI * 2);
 ctx.stroke();
 ctx.setLineDash([]);
 }
 if (t.level >= 5) {
 ctx.fillStyle = '#FFD700';
 ctx.beginPath();
 ctx.arc(0, 0, 5, 0, Math.PI * 2);
 ctx.fill();
 ctx.shadowColor = '#FFD700';
 ctx.shadowBlur = 10;
 ctx.beginPath();
 ctx.arc(0, 0, 3, 0, Math.PI * 2);
 ctx.fill();
 ctx.shadowBlur = 0;
 }
 ctx.rotate(angle);
 const barrelLength = 18 + t.level * 3;
 const barrelWidth = 6 + t.level;
 ctx.fillStyle = type.color;
 ctx.fillRect(0, -barrelWidth / 2, barrelLength, barrelWidth);
 ctx.fillStyle = '#fff';
 ctx.shadowColor = type.color;
 ctx.shadowBlur = 5 + t.level * 3;
 ctx.fillRect(barrelLength - 2, -barrelWidth / 2 - 2, 6, barrelWidth + 4);
 ctx.shadowBlur = 0;
 ctx.restore();
 ctx.font = '12px sans-serif';
 ctx.textAlign = 'center';
 ctx.fillStyle = type.color;
 ctx.fillText(type.icon, x, y - 20);
 if (t.level > 1) {
 ctx.font = 'bold 11px sans-serif';
 ctx.fillStyle = '#FFD700';
 ctx.fillText(`Lv.${t.level}`, x, y + 22);
 if (t.level >= 10) {
 ctx.font = 'bold 9px sans-serif';
 ctx.fillStyle = '#FF6B6B';
 ctx.fillText('🔥', x, y + 34);
 }
 else if (t.level >= 5) {
 const stars = '★'.repeat(Math.min(t.level - 1, 8));
 ctx.font = '9px sans-serif';
 ctx.fillStyle = '#FFA502';
 ctx.fillText(stars, x, y + 34);
 }
 }
 const upgradeCost = Math.floor(type.cost * (0.4 + t.level * 0.4));
 ctx.font = 'bold 9px sans-serif';
 ctx.fillStyle = '#00E5FF';
 ctx.fillText(`点击升级 ${upgradeCost}💰`, x, y + 46);
 });
}
export function drawEnemies(ctx: CanvasRenderingContext2D, enemies: Enemy[]) {
 enemies.forEach(e => {
 const { x, y, hp, maxHp, color, size, isBoss, slowTimer } = e;
 if (slowTimer > 0) {
 ctx.fillStyle = 'rgba(112, 161, 255, 0.15)';
 ctx.beginPath();
 ctx.arc(x, y, size + 6, 0, Math.PI * 2);
 ctx.fill();
 }
 ctx.shadowColor = color;
 ctx.shadowBlur = isBoss ? 12 : 6;
 ctx.fillStyle = color;
 ctx.beginPath();
 ctx.arc(x, y, size, 0, Math.PI * 2);
 ctx.fill();
 ctx.shadowBlur = 0;
 ctx.fillStyle = 'rgba(255,255,255,0.3)';
 ctx.beginPath();
 ctx.arc(x - size * 0.25, y - size * 0.25, size * 0.4, 0, Math.PI * 2);
 ctx.fill();
 if (isBoss) {
 ctx.strokeStyle = '#FFD700';
 ctx.lineWidth = 2;
 ctx.beginPath();
 ctx.arc(x, y, size + 3, 0, Math.PI * 2);
 ctx.stroke();
 ctx.font = 'bold 10px sans-serif';
 ctx.textAlign = 'center';
 ctx.fillStyle = '#FFD700';
 ctx.fillText('BOSS', x, y - size - 6);
 }
 if (hp < maxHp) {
 const bw = size * 2.5;
 const bx = x - bw / 2, by = y - size - 6;
 ctx.fillStyle = 'rgba(0,0,0,0.6)';
 ctx.fillRect(bx - 1, by - 1, bw + 2, 5);
 ctx.fillStyle = '#E74C3C';
 ctx.fillRect(bx, by, bw, 3);
 ctx.fillStyle = '#2ECC71';
 ctx.fillRect(bx, by, bw * (hp / maxHp), 3);
 }
 });
}
export function drawBullets(ctx: CanvasRenderingContext2D, bullets: Bullet[], enemies: Enemy[]) {
 bullets.forEach(b => {
 if (enemies.includes(b.target)) {
 ctx.strokeStyle = b.color + '40';
 ctx.lineWidth = 2;
 ctx.setLineDash([5, 3]);
 ctx.beginPath();
 ctx.moveTo(b.x, b.y);
 ctx.lineTo(b.target.x, b.target.y);
 ctx.stroke();
 ctx.setLineDash([]);
 }
 ctx.shadowColor = b.color;
 ctx.shadowBlur = 10;
 ctx.fillStyle = b.color;
 ctx.beginPath();
 ctx.arc(b.x, b.y, 4, 0, Math.PI * 2);
 ctx.fill();
 ctx.shadowBlur = 0;
 ctx.fillStyle = b.color + '66';
 ctx.beginPath();
 ctx.arc(b.x, b.y, 7, 0, Math.PI * 2);
 ctx.fill();
 ctx.fillStyle = '#FFFFFF';
 ctx.beginPath();
 ctx.arc(b.x, b.y, 2, 0, Math.PI * 2);
 ctx.fill();
 });
}
export function drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[]) {
 particles.forEach(p => {
 ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
 if (p.type === 'explosion') {
 ctx.fillStyle = p.color;
 ctx.beginPath();
 ctx.arc(p.x, p.y, p.size * (p.life / p.maxLife) * 1.5, 0, Math.PI * 2);
 ctx.fill();
 ctx.fillStyle = '#FFFFFF';
 ctx.beginPath();
 ctx.arc(p.x, p.y, p.size * (p.life / p.maxLife) * 0.5, 0, Math.PI * 2);
 ctx.fill();
 }
 else if (p.type === 'spark') {
 ctx.fillStyle = p.color;
 ctx.beginPath();
 ctx.arc(p.x, p.y, p.size * (p.life / p.maxLife) * 0.8, 0, Math.PI * 2);
 ctx.fill();
 }
 else {
 ctx.fillStyle = p.color;
 ctx.beginPath();
 ctx.arc(p.x, p.y, p.size * (p.life / p.maxLife), 0, Math.PI * 2);
 ctx.fill();
 }
 });
 ctx.globalAlpha = 1;
}
export function drawFloats(ctx: CanvasRenderingContext2D, floatingTexts: FloatingText[]) {
 floatingTexts.forEach(f => {
 if (f.x >= 10 && f.x <= W - 10 && f.y >= HUD_H + 10 && f.y <= H - 10) {
 ctx.globalAlpha = Math.max(0, f.life / 50);
 ctx.font = 'bold 13px sans-serif';
 ctx.textAlign = 'center';
 ctx.fillStyle = f.color;
 ctx.fillText(f.text, f.x, f.y);
 }
 });
 ctx.globalAlpha = 1;
}
export function drawWaveCountdown(ctx: CanvasRenderingContext2D, waveTimer: number, enemiesToSpawn: number, enemies: Enemy[]) {
 if (enemiesToSpawn === 0 && enemies.length === 0 && waveTimer > 0) {
 const sec = Math.ceil(waveTimer / 60);
 ctx.fillStyle = 'rgba(255,255,255,0.3)';
 ctx.font = '14px sans-serif';
 ctx.textAlign = 'center';
 ctx.fillText(`下一波 ${sec}s`, W / 2, H - 20);
 }
}
export function drawInstructions(ctx: CanvasRenderingContext2D, frameCount: number) {
 if (frameCount < 480) {
 ctx.fillStyle = 'rgba(0,0,0,0.7)';
 ctx.fillRect(10, H - 100, W - 20, 90);
 ctx.strokeStyle = 'rgba(255,255,255,0.3)';
 ctx.lineWidth = 1;
 ctx.strokeRect(10, H - 100, W - 20, 90);
 ctx.fillStyle = '#FFF';
 ctx.font = 'bold 13px sans-serif';
 ctx.textAlign = 'left';
 ctx.fillText('🎮 解压塔防:', 20, H - 85);
 ctx.font = '11px sans-serif';
 ctx.fillText('1.点击选择塔类型，再点击地图放置', 20, H - 70);
 ctx.fillText('2.点击已建造的塔可以升级(最高Lv.5)', 20, H - 57);
 ctx.fillText('3.连续击杀获得连击奖励和道具', 20, H - 44);
 ctx.fillText('4.充能满后点击💥释放全屏爆炸', 20, H - 31);
 ctx.fillText('5.道具助你轻松通关，尽情享受', 20, H - 18);
 }
}
export function drawFlashEffect(ctx: CanvasRenderingContext2D, flashEffect: number) {
 if (flashEffect > 0) {
 ctx.fillStyle = `rgba(255, 255, 255, ${flashEffect * 0.1})`;
 ctx.fillRect(0, 0, W, H);
 }
}

