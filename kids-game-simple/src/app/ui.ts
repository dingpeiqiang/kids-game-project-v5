import type { PlatformContext } from './types'

/**
 * 渲染主界面 HTML 模板
 */
export function renderUI(ctx: PlatformContext) {
  const data = ctx.store
  const u = ctx.userServiceCurrent
  const avatarContent = u ? u.avatar : '我'
  const coinVal = u ? u.coins : data.coins
  const root = document.getElementById('app')!
  root.innerHTML = `
      <!-- Loading -->
      <div id="loading">
        <div class="loader"></div>
        <p>正在加载平台...</p>
      </div>

      <!-- 顶部栏 -->
      <div class="top-bar" id="topBar">
        <div class="top-left">
            <span class="brand-text">星光游学</span>
            <img class="brand-logo" src="/icon-512x512.png" alt="星光游学" />
          </div>
        <div class="top-right">
          <div class="search-box" id="searchBox">
            <input type="text" id="searchInput" placeholder="搜索..." />
            <button class="search-btn" id="searchBtn">🔍</button>
          </div>
          <div class="coin-display">
            <div class="coin-icon">★</div>
            <span id="coinCount">${coinVal}</span>
          </div>
          <div class="user-avatar" id="userAvatar" title="${u ? u.username : '点击登录'}">${avatarContent}</div>
        </div>
      </div>

      <!-- 主界面 -->
      <div class="main-container" id="mainView">
        <!-- 首页内容 -->
        <div id="homeContent">
          <div class="daily-banner" id="dailyBanner">
            <div class="banner-label">每日惊喜</div>
            <div class="banner-title">今日可领取双倍积分卡!</div>
            <div class="banner-sub">已连续登录 ${u ? u.consecutiveLoginDays : data.loginDays} 天，加油!</div>
            <div class="banner-tag">
              <div class="tag-num" id="todayGames">${u ? u.todayGames : data.todayGames}</div>
              <div class="tag-label">今日游戏</div>
            </div>
          </div>

          <div id="categorySections"></div>
        </div>

        <!-- 搜索结果页面 -->
        <div id="searchResults" style="display:none;">
          <div class="search-header">
            <div class="search-title">🔍 搜索结果</div>
            <button class="btn btn-secondary" id="btnCloseSearch">返回</button>
          </div>
          <div class="search-count" id="searchCount"></div>
          <div id="searchGameList" class="game-grid"></div>
          <div class="no-results" id="noResults" style="display:none;">
            <div class="no-results-icon">😕</div>
            <div class="no-results-text">没有找到相关游戏</div>
          </div>
        </div>

        <!-- 收藏列表页面 -->
        <div id="favoritesContent" style="display:none;">
          <div class="favorites-header">
            <div class="favorites-title">❤️ 我的收藏</div>
          </div>
          <div class="favorites-count" id="favoritesCount"></div>
          <div id="favoritesGameList" class="game-grid"></div>
          <div class="no-favorites" id="noFavorites" style="display:none;">
            <div class="no-favorites-icon">💔</div>
            <div class="no-favorites-text">暂无收藏游戏</div>
            <div class="no-favorites-hint">点击游戏卡片上的 ❤️ 图标即可收藏</div>
          </div>
        </div>
      </div>

      <!-- 底部导航 -->
      <div class="bottom-nav" id="bottomNav">
        <div class="nav-item active" data-page="home">
          <svg viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
          首页
        </div>
        <div class="nav-item" data-page="rank">
          <svg viewBox="0 0 24 24"><path d="M7.5 21H2V9l10-7 10 7v12h-5.5v-7h-9v7zm7-11.5L18.5 17H15v-7.5z"/></svg>
          排行
        </div>
        <div class="nav-item" data-page="favorites">
          <svg viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
          收藏
        </div>
        <div class="nav-item" data-page="me">
          <svg viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
          我的
        </div>
      </div>

      <!-- Buff 飘窗 -->
      <div class="buff-popup" id="buffPopup">
        <div class="buff-icon" id="buffIcon">⚡</div>
        <div class="buff-text" id="buffText">双倍积分!</div>
        <div class="buff-time" id="buffTime">3s</div>
      </div>

      <!-- 暴击闪屏 -->
      <div class="crit-flash" id="critFlash"></div>

      <!-- 连击环 -->
      <div class="combo-ring" id="comboRing">
        <div class="combo-num" id="comboNum">0</div>
        <div class="combo-label">连击</div>
      </div>

      <!-- 游戏画布层 -->
      <div id="game-layer"><div id="gameCanvas"></div></div>

      <!-- 横屏旋转提示 -->
      <div id="rotate-overlay">
        <div class="rotate-device">
          <div class="rotate-icon">📱</div>
          <div class="rotate-title">横屏畅玩</div>
          <div class="rotate-text">切换至横屏模式，获得最佳游戏体验</div>
          <button class="rotate-btn" id="rotateBtn">切换到横屏</button>
          <div class="rotate-dismiss" id="rotateDismiss">继续竖屏（体验不佳）</div>
          <div class="rotate-auto-hint" id="rotateAutoHint">或手动旋转设备</div>
        </div>
      </div>

      <!-- 结果弹窗 -->
      <div id="result-overlay">
        <div class="result-card">
          <div class="result-icon" id="resultIcon"></div>
          <div class="result-title" id="resultTitle">本局结束!</div>
          <div class="result-score" id="resultScore">0</div>
          <div class="result-best" id="resultBest">历史最高: 0</div>

          <!-- 游戏统计数据 -->
          <div class="result-stats" id="resultStats" style="display:none; margin:12px 0; padding:12px; background:linear-gradient(135deg,#f8f9fa,#e9ecef); border-radius:12px;"></div>

          <div class="result-rank" id="resultRank" style="display:none">
            <div class="rank-badge" id="rankBadge"></div>
            <div class="rank-text" id="rankText"></div>
          </div>
          <div class="buff-list" id="resultBuffs"></div>
          <div class="btn-group">
            <button class="btn btn-secondary" id="btnBack">返回大厅</button>
            <button class="btn btn-primary" id="btnReplay">再来一局</button>
          </div>
          <div style="margin-top:12px">
            <a href="#" id="btnResetGuide" style="font-size:11px;color:#bbb;text-decoration:none">重看游戏引导</a>
          </div>
        </div>
      </div>

      <!-- 排行榜 -->
      <div id="rank-overlay">
        <div class="rank-panel">
          <div class="rank-header">
            <div class="rank-title">🏆 排行榜</div>
            <div class="rank-close" id="rankClose">✕</div>
          </div>

          <!-- 游戏选择器 -->
          <div class="rank-game-selector">
            <select id="rankGameSelect" class="rank-game-select">
              <option value="">-- 选择游戏 --</option>
            </select>
          </div>

          <div class="rank-tabs">
            <div class="rank-tab active" data-tab="global">全局</div>
            <div class="rank-tab" data-tab="daily">今日</div>
            <div class="rank-tab" data-tab="friend">好友</div>
          </div>

          <!-- 我的排名卡片 -->
          <div class="my-rank-card" id="myRankCard" style="display:none;">
            <div class="my-rank-info">
              <div class="my-rank-label">我的排名</div>
              <div class="my-rank-value" id="myRankPosition">-</div>
            </div>
            <div class="my-rank-score">
              <div class="my-rank-label">分数</div>
              <div class="my-rank-value" id="myRankScore">0</div>
            </div>
            <button class="my-rank-btn" id="btnScrollToMyRank">
              📍 定位到我的排名
            </button>
          </div>

          <div class="rank-list" id="rankList"></div>
        </div>
      </div>

      <!-- 每日奖励 -->
      <div id="daily-overlay">
        <div class="daily-card">
          <div class="dc-icon">🎁</div>
          <div class="dc-title">首日登录奖励</div>
          <div class="dc-desc">今日首次登录！获得 🎓 游学币 x1</div>
          <button class="dc-btn" id="btnClaimDaily">领取奖励</button>
        </div>
      </div>

      <!-- 玩法引导 -->
      <div id="guide-overlay">
        <div class="guide-card">
          <!-- 游戏名称和图标 -->
          <div class="guide-header">
            <div class="guide-icon" id="guideIcon">🎯</div>
            <div class="guide-title-section">
              <div class="guide-name" id="guideName">游戏名称</div>
              <div class="guide-desc" id="guideDesc">游戏描述</div>
            </div>
          </div>

          <!-- 玩法说明 -->
          <div class="guide-ops" id="guideOps"></div>

          <!-- 小技巧 -->
          <div class="guide-tips" id="guideTips"></div>

          <!-- 跳过选项 -->
          <div class="guide-skip">
            <label><input type="checkbox" id="guideSkipCheck">不再显示本游戏引导</label>
          </div>

          <!-- 开始按钮 -->
          <button class="guide-btn" id="btnStartGame">开始游戏</button>

          <!-- 游戏评论区 -->
          <div class="comment-section" id="commentSection">
            <div class="comment-header">
              <div class="comment-title">📝 游戏评论</div>
              <div class="comment-stats" id="commentStats"></div>
            </div>

            <!-- 评论输入区 -->
            <div class="comment-input-area">
              <div class="rating-stars" id="ratingStars">
                <span class="star" data-rating="1">★</span>
                <span class="star" data-rating="2">★</span>
                <span class="star" data-rating="3">★</span>
                <span class="star" data-rating="4">★</span>
                <span class="star" data-rating="5">★</span>
              </div>
              <textarea id="commentInput" placeholder="分享你的游戏感受..." maxlength="200"></textarea>
              <button class="btn btn-comment" id="btnSubmitComment">发布评论</button>
            </div>

            <!-- 评论列表 -->
            <div class="comment-list" id="commentList">
              <div class="no-comments" id="noComments">暂无评论，快来发表第一条吧！</div>
            </div>
          </div>
        </div>
      </div>
    `

  // 渲染游戏卡片
  ctx.renderGameCards()
}

export function showDailyPop() {
  document.getElementById('daily-overlay')!.classList.add('show')
}

export function closeDailyPop() {
  document.getElementById('daily-overlay')!.classList.remove('show')
}