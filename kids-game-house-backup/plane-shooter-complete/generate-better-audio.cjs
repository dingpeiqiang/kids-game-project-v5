/**
 * 生成贪吃蛇游戏音频 - 更好听的音效和BGM
 * 运行: node generate-better-audio.cjs
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const AUDIO_DIR = path.join(__dirname, 'public/themes/default/audio');

// 确保目录存在
if (!fs.existsSync(AUDIO_DIR)) {
  fs.mkdirSync(AUDIO_DIR, { recursive: true });
}

// 运行 FFmpeg 命令
function runFFmpeg(cmd) {
  try {
    execSync(cmd, { stdio: 'pipe', windowsHide: true });
    return true;
  } catch (e) {
    console.error('FFmpeg 错误:', e.message);
    return false;
  }
}

// 生成 BGM - 主菜单音乐 (温暖的旋律)
function createBgmMain() {
  const output = path.join(AUDIO_DIR, 'bgm_main.mp3');
  // 创建一个温暖的上行旋律，使用多个振荡器混合
  const cmd = `ffmpeg -f lavfi -i "anoisesrc=d=6:c=pink:r=44100:a=0.02,lowpass=f=800,highpass=f=100" -f lavfi -i "sine=frequency=261.63:d=6" -f lavfi -i "sine=frequency=329.63:d=6" -f lavfi -i "sine=frequency=392.00:d=6" -filter_complex "[1]aformat=sample_fmts=fltp:sample_rates=44100,volume=0.3[a1];[2]aformat=sample_fmts=fltp:sample_rates=44100,volume=0.25[a2];[3]aformat=sample_fmts=fltp:sample_rates=44100,volume=0.2[a3];[0][a1][a2][a3]amix=inputs=4:duration=first:dropout_transition=2" -t 6 -y "${output}"`;
  return runFFmpeg(cmd);
}

// 生成 BGM - 游戏中音乐 (更有节奏感)
function createBgmGameplay() {
  const output = path.join(AUDIO_DIR, 'bgm_gameplay.mp3');
  // 快速节奏，用更快的节拍和稍高音调
  const cmd = `ffmpeg -f lavfi -i "anoisesrc=d=8:c=pink:r=44100:a=0.015,lowpass=f=1000" -f lavfi -i "sine=frequency=293.66:d=8" -f lavfi -i "sine=frequency=349.23:d=8" -f lavfi -i "sine=frequency=440.00:d=8" -f lavfi -i "sine=frequency=523.25:d=4" -filter_complex "[1]aformat=sample_fmts=fltp:sample_rates=44100,volume=0.25[a1];[2]aformat=sample_fmts=fltp:sample_rates=44100,volume=0.2[a2];[3]aformat=sample_fmts=fltp:sample_rates=44100,volume=0.15[a3];[4]aformat=sample_fmts=fltp:sample_rates=44100,volume=0.1[a4];[0][a1][a2][a3][a4]amix=inputs=5:duration=first:dropout_transition=2" -t 8 -y "${output}"`;
  return runFFmpeg(cmd);
}

// 生成 BGM - 游戏结束音乐 (低沉的)
function createBgmGameover() {
  const output = path.join(AUDIO_DIR, 'bgm_gameover.mp3');
  // 下行旋律，悲伤的感觉
  const cmd = `ffmpeg -f lavfi -i "anoisesrc=d=5:c=brown:r=44100:a=0.02,lowpass=f=600" -f lavfi -i "sine=frequency=196.00:d=5" -f lavfi -i "sine=frequency=174.61:d=5" -f lavfi -i "sine=frequency=146.83:d=5" -filter_complex "[1]aformat=sample_fmts=fltp:sample_rates=44100,volume=0.3[a1];[2]aformat=sample_fmts=fltp:sample_rates=44100,volume=0.25[a2];[3]aformat=sample_fmts=fltp:sample_rates=44100,volume=0.2[a3];[0][a1][a2][a3]amix=inputs=4:duration=first:dropout_transition=2" -t 5 -y "${output}"`;
  return runFFmpeg(cmd);
}

// 生成音效 - 吃到食物 (清脆上升)
function createEffectEat() {
  const output = path.join(AUDIO_DIR, 'effect_eat.mp3');
  // 快速的上升音调
  const cmd = `ffmpeg -f lavfi -i "sine=frequency=600:duration=0.1" -f lavfi -i "sine=frequency=800:duration=0.1" -f lavfi -i "sine=frequency=1000:duration=0.15" -filter_complex "[0]aformat=sample_fmts=fltp:sample_rates=44100,volume=0.4[a0];[1]aformat=sample_fmts=fltp:sample_rates=44100,volume=0.4[a1];[2]aformat=sample_fmts=fltp:sample_rates=44100,volume=0.3[a2];[a0][a1][a2]concat=n=3:v=0:a=1" -t 0.35 -y "${output}"`;
  return runFFmpeg(cmd);
}

// 生成音效 - 碰撞 (低沉的撞击声)
function createEffectCrash() {
  const output = path.join(AUDIO_DIR, 'effect_crash.mp3');
  // 低频噪音 + 正弦波
  const cmd = `ffmpeg -f lavfi -i "anoisesrc=c=white:d=0.3:a=0.5" -f lavfi -i "sine=frequency=80:d=0.3" -f lavfi -i "sine=frequency=60:d=0.2" -filter_complex "[0]lowpass=f=400,volume=0.6[a0];[1]aformat=sample_fmts=fltp:sample_rates=44100,volume=0.5[a1];[2]aformat=sample_fmts=fltp:sample_rates=44100,volume=0.4[a2];[a0][a1][a2]amix=inputs=3:duration=first" -t 0.4 -y "${output}"`;
  return runFFmpeg(cmd);
}

// 生成音效 - 游戏结束 (长的下降音)
function createEffectGameover() {
  const output = path.join(AUDIO_DIR, 'effect_gameover.mp3');
  // 频率快速下降
  const cmd = `ffmpeg -f lavfi -i "sine=frequency=500:duration=0.5" -filter_complex "[0]aformat=sample_fmts=fltp:volume=0.5,tremolo=f=5:d=0.5" -t 0.5 -y "${output}"`;
  return runFFmpeg(cmd);
}

// 生成音效 - 升级 (欢快的上升)
function createEffectLevelup() {
  const output = path.join(AUDIO_DIR, 'effect_levelup.mp3');
  // 快乐的上行和弦
  const cmd = `ffmpeg -f lavfi -i "sine=frequency=523.25:duration=0.15" -f lavfi -i "sine=frequency=659.25:duration=0.15" -f lavfi -i "sine=frequency=783.99:duration=0.2" -filter_complex "[0]aformat=sample_fmts=fltp:sample_rates=44100,volume=0.35[a0];[1]aformat=sample_fmts=fltp:sample_rates=44100,volume=0.35[a1];[2]aformat=sample_fmts=fltp:sample_rates=44100,volume=0.3[a2];[a0][a1][a2]concat=n=3:v=0:a=1" -t 0.5 -y "${output}"`;
  return runFFmpeg(cmd);
}

// 生成音效 - 按钮点击 (短促的)
function createEffectButtonClick() {
  const output = path.join(AUDIO_DIR, 'effect_button_click.mp3');
  // 非常短的滴答声
  const cmd = `ffmpeg -f lavfi -i "sine=frequency=1000:duration=0.05" -f lavfi -i "sine=frequency=800:duration=0.05" -filter_complex "[0]aformat=sample_fmts=fltp:sample_rates=44100,volume=0.3[a0];[1]aformat=sample_fmts=fltp:sample_rates=44100,volume=0.2[a1];[a0][a1]concat=n=2:v=0:a=1" -t 0.1 -y "${output}"`;
  return runFFmpeg(cmd);
}

// 主程序
console.log('🎵 开始生成音频资源...\n');

const results = [
  { name: 'bgm_main.mp3', fn: createBgmMain },
  { name: 'bgm_gameplay.mp3', fn: createBgmGameplay },
  { name: 'bgm_gameover.mp3', fn: createBgmGameover },
  { name: 'effect_eat.mp3', fn: createEffectEat },
  { name: 'effect_crash.mp3', fn: createEffectCrash },
  { name: 'effect_gameover.mp3', fn: createEffectGameover },
  { name: 'effect_levelup.mp3', fn: createEffectLevelup },
  { name: 'effect_button_click.mp3', fn: createEffectButtonClick },
];

for (const { name, fn } of results) {
  if (fn()) {
    console.log(`✓ 生成音频: ${name}`);
  }
}

console.log('\n✅ 所有音频生成完成！');
console.log('📁 音频目录:', AUDIO_DIR);
