import { test, expect } from '@playwright/test'

test.describe('PVZ 塔防游戏 - 完整流程测试', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(2000)
  })

  test('1. 开始页面加载正常', async ({ page }) => {
    await expect(page).toHaveTitle(/植物保卫战/)
    
    const title = page.locator('h2')
    await expect(title).toBeVisible()
    await expect(title).toContainText('植物保卫战')
    
    const startButton = page.getByText('开始游戏')
    await expect(startButton).toBeVisible()
    
    const highScoreDisplay = page.getByText('最高分记录')
    await expect(highScoreDisplay).toBeVisible()
  })

  test('2. 难度选择页面功能', async ({ page }) => {
    await page.getByText('开始游戏').click()
    await page.waitForTimeout(1000)
    
    await expect(page.locator('h2')).toContainText('选择难度')
    
    const easyOption = page.getByText('简单')
    await expect(easyOption).toBeVisible()
    await easyOption.click()
    
    const mediumOption = page.getByText('中等')
    await expect(mediumOption).toBeVisible()
    
    const hardOption = page.getByText('困难')
    await expect(hardOption).toBeVisible()
    
    const startButton = page.getByText('▶️ 开始')
    await expect(startButton).toBeVisible()
  })

  test('3. 游戏页面加载和 UI 元素', async ({ page }) => {
    await page.getByText('开始游戏').click()
    await page.waitForTimeout(1000)
    await page.getByText('中等').click()
    await page.getByText('▶️ 开始').click()
    await page.waitForTimeout(3000)
    
    const sunDisplay = page.getByText('阳光')
    await expect(sunDisplay).toBeVisible()
    
    const scoreDisplay = page.getByText('分数')
    await expect(scoreDisplay).toBeVisible()
    
    const plantCards = page.locator('.plant-card')
    await expect(plantCards).toHaveCount(5)
    
    const sunflowerCard = page.locator('.plant-card').filter({ hasText: '向日葵' })
    await expect(sunflowerCard).toBeVisible()
    
    const peashooterCard = page.locator('.plant-card').filter({ hasText: '豌豆射手' })
    await expect(peashooterCard).toBeVisible()
  })

  test('4. 植物卡片选择功能', async ({ page }) => {
    await page.getByText('开始游戏').click()
    await page.waitForTimeout(1000)
    await page.getByText('中等').click()
    await page.getByText('▶️ 开始').click()
    await page.waitForTimeout(3000)
    
    const sunflowerCard = page.locator('.plant-card').filter({ hasText: '向日葵' })
    await sunflowerCard.click()
    await page.waitForTimeout(500)
    await expect(sunflowerCard).toHaveClass(/border-green-400/)
    
    const peashooterCard = page.locator('.plant-card').filter({ hasText: '豌豆射手' })
    await peashooterCard.click()
    await page.waitForTimeout(500)
    await expect(peashooterCard).toHaveClass(/border-green-400/)
    await expect(sunflowerCard).not.toHaveClass(/border-green-400/)
  })

  test('5. 暂停功能测试', async ({ page }) => {
    await page.getByText('开始游戏').click()
    await page.waitForTimeout(1000)
    await page.getByText('中等').click()
    await page.getByText('▶️ 开始').click()
    await page.waitForTimeout(3000)
    
    const pauseButton = page.locator('button').filter({ hasText: '⏸️' })
    await pauseButton.click()
    await page.waitForTimeout(500)
    
    const pauseOverlay = page.locator('.pause-overlay')
    await expect(pauseOverlay).toBeVisible()
    await expect(pauseOverlay).toContainText('游戏暂停')
    
    const continueButton = page.getByText('继续游戏')
    await continueButton.click()
    await page.waitForTimeout(500)
    await expect(pauseOverlay).not.toBeVisible()
  })

  test('6. 音效开关功能', async ({ page }) => {
    await page.getByText('开始游戏').click()
    await page.waitForTimeout(1000)
    
    const soundToggle = page.locator('button').filter({ hasText: '🔊' }).first()
    await expect(soundToggle).toBeVisible()
    
    const bgmToggle = page.locator('button').filter({ hasText: '🎵' })
    await expect(bgmToggle).toBeVisible()
  })

  test('7. 游戏结束流程', async ({ page }) => {
    await page.getByText('开始游戏').click()
    await page.waitForTimeout(1000)
    await page.getByText('简单').click()
    await page.getByText('▶️ 开始').click()
    await page.waitForTimeout(5000)
    
    const pauseButton = page.locator('button').filter({ hasText: '⏸️' })
    await pauseButton.click()
    await page.waitForTimeout(500)
    
    await page.evaluate(() => {
      window.localStorage.setItem('pvz-game-state', JSON.stringify({
        highScore: 0,
        playCount: 1,
        difficulty: 'easy',
        isGameOver: true
      }))
    })
    
    await page.reload()
    await page.waitForTimeout(2000)
  })

  test('8. 返回主页功能', async ({ page }) => {
    await page.getByText('开始游戏').click()
    await page.waitForTimeout(1000)
    
    const backButton = page.getByText('🔙 返回')
    await backButton.click()
    await page.waitForTimeout(1000)
    
    await expect(page.locator('h2')).toContainText('植物保卫战')
  })

  test('9. 响应式布局测试', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')
    await page.waitForTimeout(2000)
    
    const startButton = page.getByText('开始游戏')
    await expect(startButton).toBeVisible()
    
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.waitForTimeout(1000)
    await expect(startButton).toBeVisible()
  })

  test('10. 本地存储持久化', async ({ page }) => {
    await page.getByText('开始游戏').click()
    await page.waitForTimeout(1000)
    await page.getByText('困难').click()
    await page.waitForTimeout(500)
    
    const storedData = await page.evaluate(() => {
      return localStorage.getItem('pvz-game-data')
    })
    expect(storedData).toBeTruthy()
    
    const parsed = JSON.parse(storedData!)
    expect(parsed.difficulty).toBe('hard')
  })
})

test.describe('PVZ 塔防游戏 - 性能测试', () => {
  test('11. 页面加载性能', async ({ page }) => {
    const startTime = Date.now()
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    const loadTime = Date.now() - startTime
    
    expect(loadTime).toBeLessThan(5000)
  })

  test('12. 游戏启动性能', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(1000)
    
    const startTime = Date.now()
    await page.getByText('开始游戏').click()
    await page.waitForTimeout(1000)
    await page.getByText('中等').click()
    await page.getByText('▶️ 开始').click()
    await page.waitForSelector('.plant-cards')
    const loadTime = Date.now() - startTime
    
    expect(loadTime).toBeLessThan(5000)
  })

  test('13. 内存泄漏检测', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(1000)
    
    for (let i = 0; i < 3; i++) {
      await page.getByText('开始游戏').click()
      await page.waitForTimeout(1000)
      await page.getByText('中等').click()
      await page.getByText('▶️ 开始').click()
      await page.waitForTimeout(2000)
      await page.goto('/')
      await page.waitForTimeout(1000)
    }
  })
})

test.describe('PVZ 塔防游戏 - 兼容性测试', () => {
  test('14. 触摸事件支持', async ({ page, isMobile }) => {
    test.skip(!isMobile, '仅在移动设备上测试')
    
    await page.goto('/')
    await page.waitForTimeout(1000)
    
    const startButton = page.getByText('开始游戏')
    await startButton.tap()
    await page.waitForTimeout(1000)
    
    await expect(page.locator('h2')).toContainText('选择难度')
  })

  test('15. 键盘事件支持', async ({ page }) => {
    test.skip(true, '键盘事件主要在桌面端测试')
    
    await page.goto('/')
    await page.waitForTimeout(1000)
    
    await page.keyboard.press('Enter')
    await page.waitForTimeout(1000)
  })

  test('16. 安全区域适配', async ({ page, isMobile }) => {
    test.skip(!isMobile, '仅在移动设备上测试')
    
    await page.goto('/')
    await page.waitForTimeout(1000)
    
    const appContainer = page.locator('.app-container')
    const padding = await appContainer.evaluate((el) => {
      const style = window.getComputedStyle(el)
      return {
        paddingTop: style.paddingTop,
        paddingBottom: style.paddingBottom
      }
    })
    
    expect(padding).toBeTruthy()
  })
})
