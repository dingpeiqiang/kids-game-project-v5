import tkinter as tk
from tkinter import ttk, messagebox, filedialog
import threading
import os
import re
import requests
from urllib.parse import quote, urlparse
import pygame
import json
from datetime import datetime

# ===================== 配置 =====================
CONFIG = {
    "save_root": "小游戏音频",
    "audio_formats": [".mp3", ".wav", ".ogg", ".m4a"],
    "max_search_results": 20,
    "max_pages_to_crawl": 5,
    "request_timeout": 10,
    "max_retries": 3,
    "concurrent_threads": 3,
    "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}

HEADERS = {
    "User-Agent": CONFIG["user_agent"],
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
    "Connection": "keep-alive"
}

AUDIO_KEYWORDS = ["audio", "sound", "bgm", "music", "sfx", "effect", "音效", "音乐", "背景"]
GAME_URL_PATTERNS = ["game", "play", "yx", "mini", "xiaoyoux", "4399", "7k7k"]
# 排除的域名（小程序、广告等）
EXCLUDE_DOMAINS = ["smartapps.baidu.com", "bdstatic.com", "baidu.com", "doubleclick.net"]

pygame.mixer.init()

class Logger:
    """简单日志记录器"""
    def __init__(self, log_file=None):
        self.log_file = log_file
        self.logs = []
    
    def log(self, message, level="INFO"):
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        log_entry = f"[{timestamp}] [{level}] {message}"
        self.logs.append(log_entry)
        if self.log_file:
            with open(self.log_file, "a", encoding="utf-8") as f:
                f.write(log_entry + "\n")
        print(log_entry)
    
    def clear(self):
        self.logs.clear()

logger = Logger()

class AudioCrawlerGUI:
    """
    小游戏音频爬取工具 GUI
    
    功能:
    - 搜索并爬取小游戏音频资源
    - 试听音频
    - 批量下载音频
    - 自动管理保存路径
    """
    
    def __init__(self, root):
        self.root = root
        self.root.title("🎵 小游戏音频爬取工具（优化版）")
        self.root.geometry("900x650")
        self.root.minsize(800, 600)
        
        self.audio_list = []
        self.downloaded_files = []
        self.is_playing = False
        self.current_audio = None
        self.progress_window = None
        self.should_stop = False
        
        self.create_folder()
        self.create_widgets()
        self.load_config()
        logger.log("应用程序启动")

    def create_folder(self):
        """创建保存文件夹"""
        if not os.path.exists(CONFIG["save_root"]):
            os.makedirs(CONFIG["save_root"])
            logger.log(f"创建保存目录：{CONFIG['save_root']}")

    def create_widgets(self):
        """创建 UI 组件"""
        style = ttk.Style()
        style.theme_use('clam')
        style.configure('Title.TLabel', font=('微软雅黑', 20, 'bold'), foreground='#2c3e50')
        style.configure('Status.TLabel', font=('微软雅黑', 10), foreground='#27ae60')
        style.configure('Warning.TLabel', font=('微软雅黑', 10), foreground='#e74c3c')
        
        main_frame = ttk.Frame(self.root, padding="10")
        main_frame.pack(fill=tk.BOTH, expand=True)
        
        self._create_title_section(main_frame)
        self._create_search_section(main_frame)
        self._create_list_section(main_frame)
        self._create_button_section(main_frame)
        self._create_status_section(main_frame)

    def _create_title_section(self, parent):
        """创建标题区域"""
        title_frame = ttk.Frame(parent)
        title_frame.pack(pady=(0, 10), fill=tk.X)
        
        title_label = ttk.Label(title_frame, text="🎵 小游戏音频爬取工具", style='Title.TLabel')
        title_label.pack(side=tk.LEFT)
        
        tip_label = ttk.Label(title_frame, text="⚠️ 仅用于个人学习 | 优化版 v2.0", style='Warning.TLabel')
        tip_label.pack(side=tk.RIGHT)

    def _create_search_section(self, parent):
        """创建搜索区域"""
        search_frame = ttk.LabelFrame(parent, text="搜索设置", padding="10")
        search_frame.pack(pady=10, fill=tk.X)
        
        ttk.Label(search_frame, text="关键词:").grid(row=0, column=0, padx=5, sticky=tk.W)
        self.keyword_entry = ttk.Entry(search_frame, font=("微软雅黑", 11), width=40)
        self.keyword_entry.grid(row=0, column=1, padx=5, pady=5, sticky=tk.W+tk.E)
        self.keyword_entry.insert(0, "消消乐 小游戏")
        
        ttk.Label(search_frame, text="最大结果数:").grid(row=0, column=2, padx=5, sticky=tk.W)
        self.max_results_var = tk.StringVar(value=str(CONFIG["max_search_results"]))
        max_results_spin = ttk.Spinbox(search_frame, from_=5, to=50, width=5, textvariable=self.max_results_var)
        max_results_spin.grid(row=0, column=3, padx=5, sticky=tk.W)
        
        self.search_btn = ttk.Button(search_frame, text="🔍 开始搜索", command=self.start_search_thread)
        self.search_btn.grid(row=0, column=4, padx=10)
        
        self.stop_btn = ttk.Button(search_frame, text="⏹ 停止", command=self.stop_search, state=tk.DISABLED)
        self.stop_btn.grid(row=0, column=5, padx=5)

    def _create_list_section(self, parent):
        """创建列表区域"""
        list_frame = ttk.LabelFrame(parent, text="音频搜索结果", padding="10")
        list_frame.pack(pady=10, fill=tk.BOTH, expand=True)
        
        list_header = ttk.Frame(list_frame)
        list_header.pack(fill=tk.X)
        
        ttk.Label(list_header, text=f"共 {{}} 个音频").pack(side=tk.LEFT)
        self.count_label = ttk.Label(list_header, text="共 0 个音频", font=("微软雅黑", 10, "bold"))
        self.count_label.pack(side=tk.LEFT)
        
        scrollbar = ttk.Scrollbar(list_frame)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        
        self.audio_listbox = tk.Listbox(list_frame, font=("微软雅黑", 10), height=15, yscrollcommand=scrollbar.set)
        self.audio_listbox.pack(fill=tk.BOTH, expand=True, pady=5)
        scrollbar.config(command=self.audio_listbox.yview)
        
        self.audio_listbox.bind('<Double-Button-1>', lambda e: self.play_audio())

    def _create_button_section(self, parent):
        """创建按钮区域"""
        btn_frame = ttk.Frame(parent)
        btn_frame.pack(pady=15)
        
        button_configs = [
            ("▶️ 试听", self.play_audio, tk.NORMAL, 0),
            ("⏹ 停止播放", self.stop_audio, tk.DISABLED, 1),
            ("💾 下载选中", self.download_audio, tk.DISABLED, 2),
            ("📥 批量下载", self.batch_download, tk.DISABLED, 3),
            ("📂 打开目录", self.open_folder, tk.NORMAL, 4),
            ("🗑 清空列表", self.clear_list, tk.DISABLED, 5),
        ]
        
        self.buttons = {}
        for text, command, state, col in button_configs:
            btn = ttk.Button(btn_frame, text=text, command=command, state=state)
            btn.grid(row=0, column=col, padx=8, pady=5)
            self.buttons[text] = btn

    def _create_status_section(self, parent):
        """创建状态区域"""
        self.status_label = ttk.Label(parent, text="✅ 就绪 | 推荐关键词：消消乐、贪吃蛇、俄罗斯方块、飞机大战", style='Status.TLabel')
        self.status_label.pack(pady=10)
        
        self.progress_var = tk.DoubleVar()
        self.progress_bar = ttk.Progressbar(parent, variable=self.progress_var, maximum=100)
        self.progress_bar.pack(fill=tk.X, padx=20, pady=5)

    def update_status(self, text, color="#27ae60"):
        """更新状态栏"""
        self.status_label.config(text=text, foreground=color)
        self.root.update_idletasks()

    def update_progress(self, value):
        """更新进度条"""
        self.progress_var.set(value)
        self.root.update_idletasks()

    def load_config(self):
        """加载配置文件"""
        config_path = os.path.join(CONFIG["save_root"], "config.json")
        if os.path.exists(config_path):
            try:
                with open(config_path, "r", encoding="utf-8") as f:
                    saved_config = json.load(f)
                    CONFIG.update(saved_config)
                logger.log("加载配置文件成功")
            except:
                pass

    def save_config(self):
        """保存配置文件"""
        config_path = os.path.join(CONFIG["save_root"], "config.json")
        try:
            with open(config_path, "w", encoding="utf-8") as f:
                json.dump(CONFIG, f, indent=2, ensure_ascii=False)
            logger.log("保存配置文件成功")
        except Exception as e:
            logger.log(f"保存配置失败：{e}", "ERROR")

    def make_request(self, url, method="get", **kwargs):
        """发送 HTTP 请求（带重试机制）"""
        kwargs.setdefault("timeout", CONFIG["request_timeout"])
        kwargs.setdefault("headers", HEADERS)
        
        for attempt in range(CONFIG["max_retries"]):
            try:
                if method == "get":
                    response = requests.get(url, **kwargs)
                elif method == "head":
                    response = requests.head(url, **kwargs)
                
                response.raise_for_status()
                return response
            except requests.exceptions.RequestException as e:
                if attempt == CONFIG["max_retries"] - 1:
                    logger.log(f"请求失败 {url}: {e}", "ERROR")
                    return None
                threading.Event().wait(1 * (attempt + 1))

    def get_real_url(self, short_url):
        """解析重定向获取真实 URL"""
        try:
            response = self.make_request(short_url, method="head", allow_redirects=True)
            if response:
                return response.url
        except Exception as e:
            logger.log(f"解析链接失败：{e}", "WARNING")
        return None

    def _get_direct_game_sites(self, keyword):
        """获取直接的游戏网站链接"""
        sites = []
        
        # 根据关键词推荐网站
        keyword_lower = keyword.lower()
        
        if "消消乐" in keyword_lower or "消除" in keyword_lower:
            sites.extend([
                "https://www.4399.com/tag/xiaoxiaole",
                "https://www.7k7k.com/tag/xiaoxiaole",
            ])
        elif "贪吃蛇" in keyword_lower:
            sites.extend([
                "https://www.4399.com/tag/tanchishe",
                "https://www.7k7k.com/tag/tanchishe",
            ])
        elif "俄罗斯方块" in keyword_lower:
            sites.extend([
                "https://www.4399.com/tag/eluosifangkuai",
                "https://www.7k7k.com/tag/eluosifangkuai",
            ])
        elif "飞机大战" in keyword_lower or "射击" in keyword_lower:
            sites.extend([
                "https://www.4399.com/tag/feijidazhan",
                "https://www.7k7k.com/tag/sheji",
            ])
        
        # 通用小游戏网站
        sites.extend([
            "https://www.4399.com/xiaoyouxi/",
            "https://www.7k7k.com/xiaoyouxi/",
        ])
        
        logger.log(f"推荐直接访问网站：{len(sites)} 个")
        return sites
    
    def _extract_audio_urls(self, html, audio_set, callback=None):
        """从 HTML 中提取音频 URL（增强版）"""
        found_count = 0
        
        # 规则 1: 直接匹配音频文件扩展名
        for ext in CONFIG["audio_formats"]:
            # 匹配 http://xxx.mp3 或 https://xxx.mp3
            pattern = re.compile(
                r'(https?://[^\s"\'<>:\?#]+\.' + ext[1:] + r')',
                re.IGNORECASE
            )
            matches = pattern.findall(html)
            
            for audio_url in matches:
                # 清理 URL（移除末尾的引号等）
                clean_url = audio_url.rstrip('"\'>')
                
                # 检查是否包含音频关键词
                if any(kw in clean_url.lower() for kw in AUDIO_KEYWORDS):
                    if clean_url not in audio_set:
                        audio_set.add(clean_url)
                        found_count += 1
                        logger.log(f"发现音频：{clean_url[:80]}...")
                        
                        if callback:
                            callback(len(audio_set))
        
        # 规则 2: 匹配 data-src 或 src 属性中的音频
        attr_patterns = [
            r'data-src=["\']([^"\']+\.(mp3|wav|ogg|m4a))["\']',
            r'src=["\']([^"\']+\.(mp3|wav|ogg|m4a))["\']',
            r'url\(["\']?([^"\')]+\.(mp3|wav|ogg|m4a))["\']?\)',
        ]
        
        for attr_pattern in attr_patterns:
            matches = re.findall(attr_pattern, html, re.IGNORECASE)
            for match in matches:
                audio_url = match[0] if isinstance(match, tuple) else match
                if audio_url.startswith('http') and any(kw in audio_url.lower() for kw in AUDIO_KEYWORDS):
                    if audio_url not in audio_set:
                        audio_set.add(audio_url)
                        found_count += 1
        
        return found_count
        """判断是否为音频链接"""
        parsed = urlparse(url)
        path = parsed.path.lower()
        
        if any(path.endswith(fmt) for fmt in CONFIG["audio_formats"]):
            return True
        
        if any(keyword in path for keyword in AUDIO_KEYWORDS):
            if any(ext in path for ext in CONFIG["audio_formats"]):
                return True
        
        return False

    def crawl_audio(self, keyword, callback=None):
        """爬取音频资源（优化版 - 增强策略）"""
        all_audios = set()
        total_progress = 0
        
        try:
            # 策略 1: 百度搜索
            search_url = f"https://www.baidu.com/s?wd={quote(keyword)} 在线小游戏 free"
            logger.log(f"搜索：{search_url}")
            
            response = self.make_request(search_url)
            if not response:
                return []
            
            html = response.text
            # 改进：提取更多类型的链接
            links = re.findall(r'href="(https?://[^"<>]+)', html)
            
            valid_urls = []
            for link in links:
                if self.should_stop:
                    break
                    
                # 跳过排除的域名
                if any(exclude in link.lower() for exclude in EXCLUDE_DOMAINS):
                    continue
                    
                if any(pattern in link.lower() for pattern in GAME_URL_PATTERNS):
                    real_url = self.get_real_url(link)
                    if real_url and real_url not in valid_urls:
                        valid_urls.append(real_url)
                        logger.log(f"找到有效游戏链接：{real_url[:60]}...")
            
            # 策略 2: 直接访问已知小游戏网站
            direct_sites = self._get_direct_game_sites(keyword)
            valid_urls.extend(direct_sites)
            
            logger.log(f"共找到 {len(valid_urls)} 个游戏页面")
            
            total_urls = len(valid_urls)
            for idx, url in enumerate(valid_urls[:CONFIG["max_pages_to_crawl"]]):
                if self.should_stop:
                    break
                    
                try:
                    page_response = self.make_request(url)
                    if not page_response:
                        continue
                    
                    page_html = page_response.text
                    
                    # 策略 3: 多种匹配规则
                    found_count = self._extract_audio_urls(page_html, all_audios, callback)
                    logger.log(f"从 {url[:50]} 找到 {found_count} 个音频")
                
                except Exception as e:
                    logger.log(f"爬取页面失败 {url}: {e}", "WARNING")
                    continue
                
                total_progress = ((idx + 1) / min(total_urls, CONFIG["max_pages_to_crawl"])) * 100
                if callback:
                    callback(total_progress, "progress")
        
        except Exception as e:
            logger.log(f"搜索失败：{e}", "ERROR")
        
        logger.log(f"总共找到 {len(all_audios)} 个音频")
        return list(all_audios)

    def search_task(self):
        """搜索任务线程"""
        keyword = self.keyword_entry.get().strip()
        if not keyword:
            messagebox.showwarning("提示", "请输入搜索关键词！")
            return
        
        self.search_btn.config(state=tk.DISABLED)
        self.stop_btn.config(state=tk.NORMAL)
        self.update_status("🔍 正在搜索小游戏音频...", "#2980b9")
        self.update_progress(0)
        self.should_stop = False
        
        def on_update(count, type="count"):
            if type == "count":
                self.count_label.config(text=f"共 {count} 个音频")
            elif type == "progress":
                self.update_progress(count)
        
        audio_urls = self.crawl_audio(keyword, callback=on_update)
        
        self.audio_listbox.delete(0, tk.END)
        self.audio_list.clear()
        
        if not audio_urls:
            messagebox.showinfo("结果", "未找到音频资源\n\n💡 推荐关键词:\n• 消消乐 小游戏\n• 贪吃蛇 音效\n• 俄罗斯方块 音频\n• 飞机大战 音乐")
            self.reset_ui()
            return
        
        self.audio_list = audio_urls
        for i, url in enumerate(audio_urls, 1):
            ext = os.path.splitext(urlparse(url).path)[-1] or ".unknown"
            filename = os.path.basename(urlparse(url).path)
            self.audio_listbox.insert(tk.END, f"🎵 {i}. {filename[:50]} ({ext})")
        
        self.count_label.config(text=f"共 {len(audio_urls)} 个音频")
        self.update_status(f"🎉 抓取成功！共 {len(audio_urls)} 个音频", "#27ae60")
        self.update_progress(100)
        
        self.buttons["▶️ 试听"].config(state=tk.NORMAL)
        self.buttons["💾 下载选中"].config(state=tk.NORMAL)
        self.buttons["📥 批量下载"].config(state=tk.NORMAL)
        self.buttons["🗑 清空列表"].config(state=tk.NORMAL)
        
        self.reset_ui()
        logger.log(f"搜索完成，找到 {len(audio_urls)} 个音频")

    def start_search_thread(self):
        """启动搜索线程"""
        threading.Thread(target=self.search_task, daemon=True).start()

    def stop_search(self):
        """停止搜索"""
        self.should_stop = True
        self.update_status("⏹ 正在停止搜索...", "#e67e22")
        logger.log("用户停止搜索")

    def reset_ui(self):
        """重置 UI 状态"""
        self.search_btn.config(state=tk.NORMAL)
        self.stop_btn.config(state=tk.DISABLED)

    def play_audio(self):
        """播放选中的音频"""
        selected = self.audio_listbox.curselection()
        if not selected:
            messagebox.showwarning("提示", "请选择要试听的音频！")
            return
        
        if self.is_playing:
            self.stop_audio()
        
        url = self.audio_list[selected[0]]
        self.update_status("🔊 正在加载音频...", "#2980b9")
        
        def play_thread():
            try:
                temp_file = "temp_audio.tmp"
                response = self.make_request(url)
                
                if not response:
                    raise Exception("下载失败")
                
                with open(temp_file, "wb") as f:
                    f.write(response.content)
                
                pygame.mixer.music.load(temp_file)
                pygame.mixer.music.play()
                
                self.is_playing = True
                self.current_audio = temp_file
                self.update_status("🔊 正在播放中...", "#27ae60")
                self.buttons["⏹ 停止播放"].config(state=tk.NORMAL)
                
                while pygame.mixer.music.get_busy():
                    threading.Event().wait(0.1)
                
                self.is_playing = False
                self.current_audio = None
                self.buttons["⏹ 停止播放"].config(state=tk.DISABLED)
                
                if os.path.exists(temp_file):
                    try:
                        os.remove(temp_file)
                    except:
                        pass
            
            except Exception as e:
                self.update_status("❌ 播放失败", "#e74c3c")
                messagebox.showerror("错误", f"播放失败:\n{str(e)}")
                logger.log(f"播放失败：{e}", "ERROR")
        
        threading.Thread(target=play_thread, daemon=True).start()

    def stop_audio(self):
        """停止播放"""
        try:
            pygame.mixer.music.stop()
            self.is_playing = False
            self.buttons["⏹ 停止播放"].config(state=tk.DISABLED)
            self.update_status("⏹ 已停止播放", "#7f8c8d")
            logger.log("停止播放")
        except:
            pass

    def download_single(self, url, index, progress_callback=None):
        """下载单个音频"""
        try:
            parsed_url = urlparse(url)
            ext = os.path.splitext(parsed_url.path)[-1] or ".mp3"
            filename = f"音频_{index+1}{ext}"
            filepath = os.path.join(CONFIG["save_root"], filename)
            
            response = self.make_request(url, stream=True)
            if not response:
                return False
            
            total_size = int(response.headers.get('content-length', 0))
            downloaded = 0
            
            with open(filepath, "wb") as f:
                for chunk in response.iter_content(chunk_size=8192):
                    if chunk:
                        f.write(chunk)
                        downloaded += len(chunk)
                        
                        if total_size > 0 and progress_callback:
                            progress = (downloaded / total_size) * 100
                            progress_callback(progress)
            
            self.downloaded_files.append(filepath)
            logger.log(f"下载成功：{filename}")
            return True
        
        except Exception as e:
            logger.log(f"下载失败：{e}", "ERROR")
            return False

    def download_audio(self):
        """下载选中的音频"""
        selected = self.audio_listbox.curselection()
        if not selected:
            messagebox.showwarning("提示", "请选择要下载的音频！")
            return
        
        self.update_status("💾 正在下载...", "#2980b9")
        
        def download_thread():
            success = self.download_single(self.audio_list[selected[0]], selected[0])
            
            if success:
                self.update_status(f"✅ 下载完成", "#27ae60")
                messagebox.showinfo("成功", f"音频已保存到:\n{CONFIG['save_root']} 目录")
            else:
                self.update_status("❌ 下载失败", "#e74c3c")
                messagebox.showerror("错误", "下载失败，请检查网络连接")
        
        threading.Thread(target=download_thread, daemon=True).start()

    def batch_download(self):
        """批量下载所有音频"""
        if not self.audio_list:
            messagebox.showwarning("提示", "列表中没有音频！")
            return
        
        confirm = messagebox.askyesno("确认", f"确定要下载全部 {len(self.audio_list)} 个音频吗？")
        if not confirm:
            return
        
        progress_window = tk.Toplevel(self.root)
        progress_window.title("批量下载")
        progress_window.geometry("400x200")
        progress_window.transient(self.root)
        progress_window.grab_set()
        
        ttk.Label(progress_window, text="正在批量下载...", font=("微软雅黑", 12)).pack(pady=20)
        
        progress_var = tk.DoubleVar()
        progress_bar = ttk.Progressbar(progress_window, variable=progress_var, maximum=len(self.audio_list))
        progress_bar.pack(fill=tk.X, padx=20, pady=10)
        
        status_label = ttk.Label(progress_window, text="", font=("微软雅黑", 10))
        status_label.pack()
        
        def download_all():
            success_count = 0
            
            for i, url in enumerate(self.audio_list):
                status_label.config(text=f"下载中：{i+1}/{len(self.audio_list)}")
                progress_var.set(i + 1)
                
                if self.download_single(url, i):
                    success_count += 1
                
                progress_window.update()
            
            progress_window.destroy()
            
            if success_count == len(self.audio_list):
                messagebox.showinfo("成功", f"✅ 全部下载完成!\n成功：{success_count}/{len(self.audio_list)}")
            else:
                messagebox.showinfo("完成", f"下载完成\n成功：{success_count}/{len(self.audio_list)}")
            
            self.update_status(f"✅ 批量下载完成：{success_count}/{len(self.audio_list)}", "#27ae60")
        
        threading.Thread(target=download_all, daemon=True).start()

    def clear_list(self):
        """清空列表"""
        confirm = messagebox.askyesno("确认", "确定要清空列表吗？")
        if confirm:
            self.audio_listbox.delete(0, tk.END)
            self.audio_list.clear()
            self.count_label.config(text="共 0 个音频")
            self.update_status("🗑 列表已清空", "#7f8c8d")
            logger.log("清空列表")

    def open_folder(self):
        """打开保存目录"""
        folder_path = CONFIG["save_root"]
        if os.path.exists(folder_path):
            os.startfile(folder_path)
            logger.log(f"打开目录：{folder_path}")
        else:
            messagebox.showerror("错误", f"目录不存在:\n{folder_path}")

    def on_closing(self):
        """窗口关闭时的清理"""
        try:
            pygame.mixer.music.stop()
            pygame.mixer.quit()
            self.save_config()
            logger.log("应用程序关闭")
        except:
            pass
        self.root.destroy()

if __name__ == "__main__":
    root = tk.Tk()
    app = AudioCrawlerGUI(root)
    root.protocol("WM_DELETE_WINDOW", app.on_closing)
    root.mainloop()