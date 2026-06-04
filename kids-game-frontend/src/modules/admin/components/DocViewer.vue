<template>
  <div class="doc-viewer-container">
    <!-- 阅读进度条 -->
    <div class="reading-progress" :style="{ width: scrollProgress + '%' }"></div>
    
    <!-- 侧边栏：文档目录 -->
    <aside class="doc-sidebar">
      <div class="sidebar-header">
        <h2 class="sidebar-title">📚 项目手册</h2>
        <div class="search-box">
          <input 
            ref="searchInputRef"
            v-model="searchQuery" 
            type="text" 
            placeholder="搜索文档... (Ctrl+F)" 
            class="search-input"
          />
        </div>
      </div>
      
      <div class="doc-categories">
        <div 
          v-for="category in filteredCategories" 
          :key="category.name"
          class="category-group"
        >
          <h3 class="category-title">{{ category.icon }} {{ category.name }}</h3>
          <ul class="doc-list">
            <li 
              v-for="doc in category.docs" 
              :key="doc.id"
              :class="{ active: currentDocId === doc.id }"
              @click="loadDoc(doc)"
              class="doc-item"
            >
              <span class="doc-icon">{{ doc.icon || '📄' }}</span>
              <span class="doc-name">{{ doc.title }}</span>
            </li>
          </ul>
        </div>
      </div>
    </aside>

    <!-- 主内容区：Markdown 渲染 -->
    <main class="doc-content" @scroll="handleScroll">
      <!-- 文档目录 (TOC) -->
      <aside v-if="showToc && tableOfContents.length > 0" class="toc-sidebar">
        <div class="toc-header">
          <h3>📑 目录</h3>
          <button @click="toggleToc" class="toc-toggle" title="隐藏目录">✕</button>
        </div>
        <nav class="toc-nav">
          <a 
            v-for="(heading, index) in tableOfContents" 
            :key="index"
            :href="'#' + heading.id"
            :class="['toc-item', 'level-' + heading.level, { active: activeHeading === heading.id }]"
            @click="scrollToHeading(heading.id, $event)"
          >
            {{ heading.text }}
          </a>
        </nav>
      </aside>
      
      <div class="doc-main-content">
        <!-- 文档头部操作栏 -->
        <div class="doc-header-bar">
          <div class="doc-title-section">
            <h1 class="doc-main-title">{{ currentDoc?.title || '选择文档' }}</h1>
            <button 
              v-if="tableOfContents.length > 0" 
              @click="toggleToc" 
              class="toc-btn"
              title="显示/隐藏目录"
            >
              📑
            </button>
          </div>
          <div class="doc-actions">
            <button @click="copyContent" class="action-btn" title="复制内容">
              📋 复制
            </button>
            <button @click="downloadDoc" class="action-btn" title="下载文档">
              ⬇️ 下载
            </button>
          </div>
        </div>
        
        <!-- Markdown 内容 -->
        <div v-if="loading" class="loading-state">
          <div class="loading-spinner"></div>
          <p>正在加载文档...</p>
        </div>
        
        <div v-else-if="error" class="error-state">
          <div class="error-icon">❌</div>
          <p class="error-message">{{ error }}</p>
          <button @click="retryLoad" class="retry-btn">重试</button>
        </div>
        
        <div v-else class="markdown-body" v-html="renderedContent"></div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { marked } from 'marked'
import FlexSearch from 'flexsearch'
import { dialog } from '@/composables/useDialog';
// 导入统一的文档索引配置
import { docCategories, type DocConfig as DocConfigType } from '@/docs/index'

interface Doc {
  id: string
  title: string
  icon?: string
  path: string
  content?: string
}

interface Category {
  name: string
  icon: string
  docs: Doc[]
}

interface Heading {
  level: number
  text: string
  id: string
}

const searchQuery = ref('')
const currentDocId = ref('')
const loading = ref(false)
const error = ref('')
const markdownContent = ref('')
const currentDoc = ref<Doc | null>(null)
const scrollProgress = ref(0)
const showToc = ref(true)
const activeHeading = ref('')
const searchInputRef = ref<HTMLInputElement | null>(null)

// 全文搜索索引
const searchIndex = new FlexSearch.Index({
  tokenize: 'forward'
})

// 文档内容缓存
const docContentCache = new Map<string, string>()

// 使用统一的文档索引配置
const categories = computed<Category[]>(() => {
  return docCategories.map(cat => ({
    name: cat.name,
    icon: cat.icon,
    docs: cat.docs.map(doc => ({
      id: doc.id,
      title: doc.title,
      icon: doc.icon,
      path: doc.path
    }))
  }))
})

// 过滤后的分类（支持搜索）
const filteredCategories = computed(() => {
  if (!searchQuery.value) return categories.value
  
  const query = searchQuery.value.toLowerCase()
  
  return categories.value.map(cat => ({
    ...cat,
    docs: cat.docs.filter(doc => 
      doc.title.toLowerCase().includes(query)
    )
  })).filter(cat => cat.docs.length > 0)
})

// 渲染 Markdown
const renderedContent = computed(() => {
  if (!markdownContent.value) return ''
  return marked(markdownContent.value)
})

// 生成文档目录 (TOC)
const tableOfContents = computed<Heading[]>(() => {
  if (!markdownContent.value) return []
  
  const headings: Heading[] = []
  const headingRegex = /^(#{1,6})\s+(.+)$/gm
  let match
  
  while ((match = headingRegex.exec(markdownContent.value)) !== null) {
    const level = match[1].length
    const text = match[2]
    const id = text
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
      .replace(/^-+|-+$/g, '')
    
    headings.push({ level, text, id })
  }
  
  return headings
})

// 加载文档
async function loadDoc(doc: Doc) {
  loading.value = true
  error.value = ''
  currentDocId.value = doc.id
  currentDoc.value = doc
  scrollProgress.value = 0
  activeHeading.value = ''
  
  try {
    // 检查缓存
    if (docContentCache.has(doc.id)) {
      markdownContent.value = docContentCache.get(doc.id)!
      loading.value = false
      addToSearchIndex(doc.id, markdownContent.value)
      return
    }
    
    // 从 Vite 加载文档（使用 import.meta.glob）
    // 支持两种路径：
    // 1. /src/docs/**/*.md - src/docs 目录内的文档
    // 2. @root/*.md - 项目根目录的文档
    
    const docModulesInDocs = import.meta.glob('../../../../docs/**/*.md', { query: '?raw', import: 'default' })
    const docModulesInRoot = import.meta.glob('../../../../../*.md', { query: '?raw', import: 'default' })
    
    // 合并两个模块映射
    const docModules = {
      ...docModulesInRoot,
      ...docModulesInDocs
    }
    
    // 构建文档路径 - 处理不同类型的路径
    let docPath: string
    let altDocPath: string | undefined // 备选路径
    
    if (doc.path.startsWith('../../../')) {
      // 根目录的文档（如 GAME_PERMISSION_REFACTOR_DESIGN.md）
      // 将 ../../../XXX.md 转换为 @root/XXX.md
      const fileName = doc.path.replace(/^\.\.\/\.\.\/\.\.\//, '')
      docPath = `@root/${fileName}`
      // 备选路径：相对路径格式
      altDocPath = `../${fileName}`
    } else if (doc.path.startsWith('../')) {
      // 其他相对路径，需要解析
      // 从 src/docs 出发，解析相对路径
      const basePath = '/src/docs'
      const segments = basePath.split('/')
      const pathSegments = doc.path.split('/')
      
      for (const segment of pathSegments) {
        if (segment === '..') {
          segments.pop()
        } else if (segment !== '.') {
          segments.push(segment)
        }
      }
      
      docPath = segments.join('/')
    } else {
      // src/docs 目录内的文档（如 README.md, 01-quick-start/index.md）
      docPath = `/src/docs/${doc.path}`
    }
    
    console.log('\n=== 加载文档 ===')
    console.log('文档标题:', doc.title)
    console.log('文档 ID:', doc.id)
    console.log('配置的 path:', doc.path)
    console.log('解析后的完整路径:', docPath)
    console.log('可用的文档模块数量:', Object.keys(docModules).length)
    console.log('可用的文档模块路径:')
    Object.keys(docModules).forEach(path => {
      console.log('  -', path)
    })
    
    if (!docModules[docPath]) {
      console.error('❌ 主路径不存在:', docPath)
      
      // 尝试备选路径
      if (altDocPath && docModules[altDocPath]) {
        console.log('✅ 使用备选路径:', altDocPath)
        docPath = altDocPath
      } else {
        console.error('❌ 备选路径也不存在:', altDocPath)
        
        // 尝试查找相似路径（用于调试）
        const fileName = doc.path.split('/').pop() || ''
        const similarPaths = Object.keys(docModules).filter(path => 
          path.includes(fileName)
        )
        
        if (similarPaths.length > 0) {
          console.warn('⚠️ 找到相似路径:', similarPaths)
          throw new Error(`文档 "${doc.title}" 不存在，但找到相似文件：${similarPaths.join(', ')}`)
        } else {
          console.log('可用路径列表:')
          Object.keys(docModules).forEach(path => {
            console.log('  -', path)
          })
          throw new Error(`文档不存在：${doc.title} (路径：${docPath})`)
        }
      }
    }
    
    console.log('✅ 找到文档，开始加载...')
    try {
      const content = await docModules[docPath]()
      markdownContent.value = content
      console.log('✅ 文档加载成功，内容长度:', content.length)
      
      // 缓存内容
      docContentCache.set(doc.id, content)
      
      // 添加到搜索索引
      addToSearchIndex(doc.id, content)
      
      // 等待 DOM 渲染后重新计算 TOC
      await nextTick()
    } catch (err) {
      console.error('加载文档内容失败:', err)
      throw new Error(`加载文档失败：${err}`)
    }
  } finally {
    loading.value = false
  }
}

// 添加到搜索索引
function addToSearchIndex(docId: string, content: string) {
  // 提取纯文本内容（去除 Markdown 标记）
  const plainText = content
    .replace(/^[#*`\[\]>]/gm, '')
    .replace(/\s+/g, ' ')
  
  searchIndex.add(docId, plainText)
}

// 全文搜索（阶段二预留）
function fullTextSearch(query: string): any[] {
  return searchIndex.search(query) as any[]
}

// 重试加载
function retryLoad() {
  if (currentDoc.value) {
    loadDoc(currentDoc.value)
  }
}

// 处理滚动，更新进度条和活跃标题
function handleScroll(event: Event) {
  const target = event.target as HTMLElement
  const scrollTop = target.scrollTop
  const scrollHeight = target.scrollHeight - target.clientHeight
  
  scrollProgress.value = Math.min(100, Math.max(0, (scrollTop / scrollHeight) * 100))
  
  // 更新活跃的标题（TOC 高亮）
  updateActiveHeading(scrollTop)
}

// 更新活跃的标题
function updateActiveHeading(scrollTop: number) {
  if (tableOfContents.value.length === 0) return
  
  for (let i = tableOfContents.value.length - 1; i >= 0; i--) {
    const heading = tableOfContents.value[i]
    const element = document.getElementById(heading.id)
    if (element && element.offsetTop <= scrollTop + 100) {
      activeHeading.value = heading.id
      break
    }
  }
}

// 滚动到指定标题
function scrollToHeading(headingId: string, event: MouseEvent) {
  event.preventDefault()
  const element = document.getElementById(headingId)
  if (element) {
    const docContent = document.querySelector('.doc-main-content') as HTMLElement
    if (docContent) {
      docContent.scrollTo({
        top: element.offsetTop - 20,
        behavior: 'smooth'
      })
    }
  }
}

// 切换 TOC 显示/隐藏
function toggleToc() {
  showToc.value = !showToc.value
}

// 复制文档内容
async function copyContent() {
  if (!markdownContent.value) return
  
  try {
    await navigator.clipboard.writeText(markdownContent.value)
    await dialog.success('内容已复制到剪贴板！')
  } catch (err) {
    console.error('复制失败:', err)
    await dialog.error('复制失败，请手动选择复制')
  }
}

// 下载文档
function downloadDoc() {
  if (!markdownContent.value || !currentDoc.value) return
  
  const blob = new Blob([markdownContent.value], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${currentDoc.value.title}.md`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// 键盘快捷键处理
function handleKeyboard(event: KeyboardEvent) {
  // Ctrl+F: 聚焦搜索框
  if (event.ctrlKey && event.key === 'f') {
    event.preventDefault()
    searchInputRef.value?.focus()
    return
  }
  
  // ESC: 清除搜索
  if (event.key === 'Escape') {
    if (searchQuery.value) {
      searchQuery.value = ''
    } else if (showToc.value) {
      showToc.value = false
    }
    return
  }
  
  // T: 切换 TOC
  if (event.key === 't' && !isInputFocused()) {
    toggleToc()
    return
  }
  
  // ↑/↓: 切换文档（在列表中）
  if ((event.key === 'ArrowUp' || event.key === 'ArrowDown') && !isInputFocused()) {
    navigateDocumentList(event.key === 'ArrowUp')
  }
}

// 检查是否在输入框中
function isInputFocused(): boolean {
  const activeElement = document.activeElement
  return activeElement?.tagName === 'INPUT' || activeElement?.tagName === 'TEXTAREA'
}

// 导航文档列表
function navigateDocumentList(goUp: boolean) {
  const flatDocs = categories.value.flatMap(cat => cat.docs)
  const currentIndex = flatDocs.findIndex(doc => doc.id === currentDocId.value)
  
  if (currentIndex === -1) return
  
  const nextIndex = goUp ? currentIndex - 1 : currentIndex + 1
  if (nextIndex >= 0 && nextIndex < flatDocs.length) {
    loadDoc(flatDocs[nextIndex])
  }
}

onMounted(() => {
  // 默认加载第一个文档
  if (categories.value[0]?.docs[0]) {
    loadDoc(categories.value[0].docs[0])
  }
  
  // 注册键盘事件监听
  document.addEventListener('keydown', handleKeyboard)
})

onUnmounted(() => {
  // 移除键盘事件监听
  document.removeEventListener('keydown', handleKeyboard)
})
</script>

<style scoped>
.doc-viewer-container {
  display: flex;
  height: calc(100vh - 140px);
  background: #f8fafc;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  position: relative;
}

/* 阅读进度条 */
.reading-progress {
  position: absolute;
  top: 0;
  left: 0;
  height: 4px;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  z-index: 100;
  transition: width 0.1s ease-out;
  box-shadow: 0 0 4px rgba(102, 126, 234, 0.5);
}

/* 侧边栏样式 */
.doc-sidebar {
  width: 320px;
  background: white;
  border-right: 2px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.sidebar-header {
  padding: 1.5rem;
  border-bottom: 2px solid #e2e8f0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.sidebar-title {
  margin: 0 0 1rem 0;
  font-size: 1.5rem;
  font-weight: bold;
}

.search-box {
  position: relative;
}

.search-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.95);
  color: #333;
  font-size: 0.9rem;
  transition: all 0.3s;
}

.search-input:focus {
  outline: none;
  background: white;
  box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.3);
}

/* 文档分类列表 */
.doc-categories {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
}

.category-group {
  margin-bottom: 1.5rem;
}

.category-title {
  font-size: 1rem;
  font-weight: bold;
  color: #4a5568;
  margin: 0 0 0.75rem 0;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #e2e8f0;
}

.doc-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.doc-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  margin: 0.25rem 0;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.3s;
  color: #4a5568;
}

.doc-item:hover {
  background: #f0f4f8;
  transform: translateX(4px);
}

.doc-item.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 4px 6px rgba(102, 126, 234, 0.3);
}

.doc-icon {
  font-size: 1.2rem;
}

.doc-name {
  font-size: 0.95rem;
  font-weight: 500;
}

/* 主内容区样式 */
.doc-content {
  flex: 1;
  padding: 0;
  overflow: hidden;
  background: white;
  display: flex;
}

/* TOC 侧边栏 */
.toc-sidebar {
  width: 260px;
  background: #f8fafc;
  border-right: 2px solid #e2e8f0;
  overflow-y: auto;
  padding: 1.5rem;
}

.toc-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 0.75rem;
  border-bottom: 2px solid #e2e8f0;
}

.toc-header h3 {
  margin: 0;
  font-size: 1rem;
  color: #4a5568;
}

.toc-toggle {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.2rem;
  color: #718096;
  padding: 0.25rem;
  border-radius: 4px;
  transition: all 0.3s;
}

.toc-toggle:hover {
  background: #e2e8f0;
  color: #2d3748;
}

.toc-nav {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.toc-item {
  text-decoration: none;
  color: #4a5568;
  font-size: 0.9rem;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  transition: all 0.3s;
  display: block;
  border-left: 3px solid transparent;
}

.toc-item:hover {
  background: #e2e8f0;
  border-left-color: #667eea;
}

.toc-item.active {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
  border-left-color: #667eea;
  color: #667eea;
  font-weight: 600;
}

.level-1 {
  font-weight: 600;
  font-size: 0.95rem;
}

.level-2 {
  padding-left: 1.5rem;
}

.level-3 {
  padding-left: 2.5rem;
  font-size: 0.85rem;
}

.level-4,
.level-5,
.level-6 {
  padding-left: 3.5rem;
  font-size: 0.8rem;
  color: #718096;
}

/* 文档主内容区 */
.doc-main-content {
  flex: 1;
  overflow-y: auto;
  padding: 2rem;
  position: relative;
}

/* 文档头部操作栏 */
.doc-header-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 0;
  margin-bottom: 2rem;
  border-bottom: 3px solid #e2e8f0;
}

.doc-title-section {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.doc-main-title {
  margin: 0;
  font-size: 2rem;
  color: #2d3748;
  font-weight: bold;
}

.toc-btn {
  background: none;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  padding: 0.5rem 0.75rem;
  cursor: pointer;
  font-size: 1.2rem;
  transition: all 0.3s;
}

.toc-btn:hover {
  background: #f0f4f8;
  border-color: #667eea;
  transform: scale(1.05);
}

.doc-actions {
  display: flex;
  gap: 0.75rem;
}

.action-btn {
  padding: 0.6rem 1.25rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.9rem;
  transition: all 0.3s;
}

.action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.action-btn:active {
  transform: translateY(0);
}

/* 加载状态 */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 1rem;
  color: #718096;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #e2e8f0;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 错误状态 */
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 1rem;
  text-align: center;
}

.error-icon {
  font-size: 4rem;
}

.error-message {
  color: #e53e3e;
  font-size: 1.1rem;
  max-width: 400px;
}

.retry-btn {
  padding: 0.75rem 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s;
}

.retry-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

/* Markdown 内容样式 */
.markdown-body {
  max-width: 900px;
  margin: 0 auto;
  line-height: 1.8;
  color: #2d3748;
}

.markdown-body :deep(h1) {
  font-size: 2.5rem;
  font-weight: bold;
  margin-bottom: 1.5rem;
  color: #1a202c;
  border-bottom: 3px solid #667eea;
  padding-bottom: 0.5rem;
}

.markdown-body :deep(h2) {
  font-size: 2rem;
  font-weight: bold;
  margin-top: 2rem;
  margin-bottom: 1rem;
  color: #2d3748;
}

.markdown-body :deep(h3) {
  font-size: 1.5rem;
  font-weight: bold;
  margin-top: 1.5rem;
  margin-bottom: 0.75rem;
  color: #4a5568;
}

.markdown-body :deep(p) {
  margin-bottom: 1rem;
}

.markdown-body :deep(ul),
.markdown-body :deep(ol) {
  margin-bottom: 1rem;
  padding-left: 2rem;
}

.markdown-body :deep(li) {
  margin-bottom: 0.5rem;
}

.markdown-body :deep(a) {
  color: #667eea;
  text-decoration: none;
  transition: all 0.3s;
}

.markdown-body :deep(a:hover) {
  color: #764ba2;
  text-decoration: underline;
}

.markdown-body :deep(code) {
  background: #f7fafc;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 0.9em;
  color: #e53e3e;
}

.markdown-body :deep(pre) {
  background: #1a202c;
  color: #f7fafc;
  padding: 1.5rem;
  border-radius: 8px;
  overflow-x: auto;
  margin-bottom: 1rem;
}

.markdown-body :deep(pre code) {
  background: transparent;
  color: inherit;
  padding: 0;
}

.markdown-body :deep(blockquote) {
  border-left: 4px solid #667eea;
  padding-left: 1rem;
  margin: 1rem 0;
  color: #718096;
  font-style: italic;
}

.markdown-body :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 1rem;
}

.markdown-body :deep(th),
.markdown-body :deep(td) {
  border: 2px solid #e2e8f0;
  padding: 0.75rem;
  text-align: left;
}

.markdown-body :deep(th) {
  background: #f7fafc;
  font-weight: bold;
}

.markdown-body :deep(img) {
  max-width: 100%;
  height: auto;
  display: block;
  margin: 1rem auto;
}

/* 滚动条样式 */
.doc-sidebar ::-webkit-scrollbar,
.doc-content ::-webkit-scrollbar {
  width: 8px;
}

.doc-sidebar ::-webkit-scrollbar-track,
.doc-content ::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.doc-sidebar ::-webkit-scrollbar-thumb,
.doc-content ::-webkit-scrollbar-thumb {
  background: #cbd5e0;
  border-radius: 4px;
}

.doc-sidebar ::-webkit-scrollbar-thumb:hover,
.doc-content ::-webkit-scrollbar-thumb:hover {
  background: #a0aec0;
}
</style>
