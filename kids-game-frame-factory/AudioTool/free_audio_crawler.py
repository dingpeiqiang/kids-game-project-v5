"""
免费音频资源爬取工具
专门用于查找可免费下载的游戏音频资源
"""
import requests
import re
from urllib.parse import quote

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
}

# 免费音频网站列表
FREE_AUDIO_SITES = [
    # 免费音效网
    "https://www.isounds.org/search?q={keyword}",
    # 爱给网（部分免费）
    "https://www.aigei.com/search/audio/{keyword}",
    # 站长素材 - 音效
    "https://sc.chinaz.com/search.aspx?keyword={keyword}&class=audio",
]

def search_free_audio(keyword):
    """搜索免费音频资源"""
    print("=" * 60)
    print(f"🔍 搜索关键词：{keyword}")
    print("=" * 60)
    
    all_audios = []
    
    for site in FREE_AUDIO_SITES:
        url = site.format(keyword=quote(keyword))
        print(f"\n🌐 搜索：{url[:60]}...")
        
        try:
            response = requests.get(url, headers=HEADERS, timeout=10)
            
            if response.status_code == 200:
                # 查找 mp3/wav 等音频链接
                audio_pattern = r'https?://[^\s"\'<>]+\.mp3'
                matches = re.findall(audio_pattern, response.text)
                
                found = 0
                for audio_url in matches[:5]:  # 每个网站最多显示 5 个
                    if audio_url not in all_audios:
                        all_audios.append(audio_url)
                        print(f"  🎵 {audio_url}")
                        found += 1
                
                if found > 0:
                    print(f"  ✅ 找到 {found} 个音频")
                else:
                    print(f"  ❌ 未找到")
            else:
                print(f"  ❌ 状态码：{response.status_code}")
                
        except Exception as e:
            print(f"  ❌ 错误：{e}")
    
    print("\n" + "=" * 60)
    print(f"📊 总共找到：{len(all_audios)} 个音频")
    print("=" * 60)
    
    return all_audios

if __name__ == "__main__":
    keyword = input("请输入搜索关键词（如：消消乐 音效）: ")
    search_free_audio(keyword)
