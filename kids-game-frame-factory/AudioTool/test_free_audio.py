"""
免费音频爬取工具 - 自动测试版
"""
import requests
import re
from urllib.parse import quote

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
}

def test_isounds():
    """测试免费音效网"""
    print("=" * 60)
    print("🔍 测试：免费音效网 (isounds.org)")
    print("=" * 60)
    
    keyword = "游戏音效"
    url = f"https://www.isounds.org/search?q={quote(keyword)}"
    
    try:
        response = requests.get(url, headers=HEADERS, timeout=10)
        
        if response.status_code == 200:
            # 查找音频下载链接
            audio_pattern = r'https?://[^\s"\'<>]+\.mp3'
            matches = re.findall(audio_pattern, response.text)
            
            found = 0
            for audio_url in matches[:10]:
                print(f"  🎵 {audio_url}")
                found += 1
            
            if found > 0:
                print(f"\n  ✅ 成功找到 {found} 个音频！")
            else:
                print(f"\n  ❌ 未找到音频")
                
                # 尝试查找其他格式
                wav_pattern = r'https?://[^\s"\'<>]+\.wav'
                matches = re.findall(wav_pattern, response.text)
                
                if matches:
                    print(f"  💡 找到 {len(matches)} 个 WAV 文件:")
                    for m in matches[:5]:
                        print(f"    {m}")
        else:
            print(f"  ❌ 状态码：{response.status_code}")
            
    except Exception as e:
        print(f"  ❌ 错误：{e}")

def test_aigei():
    """测试爱给网"""
    print("\n" + "=" * 60)
    print("🔍 测试：爱给网 (aigei.com)")
    print("=" * 60)
    
    keyword = "小游戏背景音乐"
    url = f"https://www.aigei.com/search/audio/{quote(keyword)}"
    
    try:
        response = requests.get(url, headers=HEADERS, timeout=10)
        
        if response.status_code == 200:
            # 查找试听链接
            mp3_pattern = r'https?://[^\s"\'<>]+\.mp3'
            matches = re.findall(mp3_pattern, response.text)
            
            found = 0
            for audio_url in matches[:10]:
                if 'test' in audio_url or 'preview' in audio_url:
                    print(f"  🎵 {audio_url}")
                    found += 1
            
            if found > 0:
                print(f"\n  ✅ 找到 {found} 个试听音频！")
            else:
                print(f"\n  ℹ️  该网站可能需要登录后才能下载")
        else:
            print(f"  ❌ 状态码：{response.status_code}")
            
    except Exception as e:
        print(f"  ❌ 错误：{e}")

if __name__ == "__main__":
    print("\n🎵 免费音频资源爬取 - 自动测试\n")
    test_isounds()
    test_aigei()
    
    print("\n" + "=" * 60)
    print("📊 测试完成")
    print("=" * 60)
    print("\n💡 建议:")
    print("1. 如果免费网站都失败，建议使用开源资源站")
    print("2. 推荐访问 OpenGameArt.org（无需爬取）")
    print("3. 可以手动下载 Freesound.org 的 CC0 音效")
