"""
音频爬取工具 - 问题诊断脚本
用于测试和调试爬取逻辑
"""
import requests
import re
from urllib.parse import quote, urlparse

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
}

AUDIO_KEYWORDS = ["audio", "sound", "bgm", "music", "sfx", "effect", "音效", "音乐", "背景"]
GAME_URL_PATTERNS = ["game", "play", "yx", "mini", "xiaoyoux", "4399", "7k7k"]
AUDIO_FORMATS = [".mp3", ".wav", ".ogg", ".m4a"]

def test_baidu_search():
    """测试百度搜索爬取"""
    print("=" * 60)
    print("🔍 测试百度搜索爬取")
    print("=" * 60)
    
    keyword = "消消乐 小游戏"
    search_url = f"https://www.baidu.com/s?wd={quote(keyword)} 在线小游戏 free"
    
    print(f"\n搜索 URL: {search_url}")
    
    try:
        response = requests.get(search_url, headers=HEADERS, timeout=10)
        print(f"✅ 请求成功！状态码：{response.status_code}")
        print(f"响应大小：{len(response.text)} 字节")
        
        # 提取链接
        links = re.findall(r'href="(https?://[^"]+)"', response.text)
        print(f"\n找到链接数量：{len(links)}")
        
        # 过滤有效游戏链接
        valid_urls = []
        for link in links:
            if any(pattern in link.lower() for pattern in GAME_URL_PATTERNS):
                if link not in valid_urls:
                    valid_urls.append(link)
                    print(f"  ✓ {link[:80]}...")
        
        print(f"\n有效游戏链接：{len(valid_urls)} 个")
        
        # 尝试访问这些链接
        print("\n" + "=" * 60)
        print("🌐 测试访问游戏页面")
        print("=" * 60)
        
        for i, url in enumerate(valid_urls[:3]):  # 只测试前 3 个
            print(f"\n[{i+1}] 测试：{url[:60]}...")
            
            try:
                # 处理重定向
                res = requests.head(url, headers=HEADERS, allow_redirects=True, timeout=5)
                real_url = res.url
                print(f"    真实 URL: {real_url[:80]}...")
                
                # 访问页面
                page_res = requests.get(real_url, headers=HEADERS, timeout=10)
                print(f"    状态码：{page_res.status_code}")
                
                # 查找音频
                found_audios = []
                for ext in AUDIO_FORMATS:
                    pattern = re.compile(r'https?://[^\s"\'<>]+\.' + ext[1:], re.IGNORECASE)
                    matches = pattern.findall(page_res.text)
                    
                    for audio_url in matches:
                        if any(kw in audio_url.lower() for kw in AUDIO_KEYWORDS):
                            if audio_url not in found_audios:
                                found_audios.append(audio_url)
                                print(f"    🎵 发现音频：{audio_url[:80]}...")
                
                if not found_audios:
                    print(f"    ❌ 未找到音频")
                
            except Exception as e:
                print(f"    ❌ 错误：{e}")
    
    except Exception as e:
        print(f"❌ 搜索失败：{e}")

def test_direct_game_sites():
    """测试直接访问游戏网站"""
    print("\n" + "=" * 60)
    print("🎮 测试直接访问游戏网站")
    print("=" * 60)
    
    # 直接测试一些已知的小游戏网站
    test_sites = [
        "https://www.4399.com/",
        "https://www.7k7k.com/",
    ]
    
    for site in test_sites:
        print(f"\n测试：{site}")
        try:
            res = requests.get(site, headers=HEADERS, timeout=10)
            print(f"  状态码：{res.status_code}")
            
            # 查找音频
            audio_count = 0
            for ext in AUDIO_FORMATS:
                pattern = re.compile(r'https?://[^\s"\'<>]+\.' + ext[1:], re.IGNORECASE)
                matches = pattern.findall(res.text)
                
                for audio_url in matches:
                    if any(kw in audio_url.lower() for kw in AUDIO_KEYWORDS):
                        audio_count += 1
                        if audio_count <= 3:
                            print(f"  🎵 {audio_url[:80]}...")
            
            if audio_count > 0:
                print(f"  ✅ 找到 {audio_count} 个音频链接")
            else:
                print(f"  ❌ 未找到音频链接")
                
        except Exception as e:
            print(f"  ❌ 错误：{e}")

if __name__ == "__main__":
    print("\n" + "🔧" * 30)
    print("音频爬取工具 - 问题诊断")
    print("🔧" * 30 + "\n")
    
    test_baidu_search()
    test_direct_game_sites()
    
    print("\n" + "=" * 60)
    print("📊 诊断完成")
    print("=" * 60)
    print("\n可能的问题:")
    print("1. 百度搜索结果指向小程序，不是真实网页")
    print("2. 游戏网站使用 iframe 或动态加载音频")
    print("3. 需要更精确的音频链接匹配规则")
    print("\n建议解决方案:")
    print("1. 更换搜索引擎或使用其他搜索关键词")
    print("2. 使用 Selenium 等工具处理动态网页")
    print("3. 增加更多小游戏网站源")
