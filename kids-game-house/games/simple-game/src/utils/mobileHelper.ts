/**
 * mobileHelper.ts - 移动端适配辅助工具
 * 
 * 提供统一的移动端检测和事件绑定功能
 */

// 检测是否为移动设备
export function isMobile(): boolean {
  return window.innerWidth < 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

// 获取Canvas缩放比例（移动端缩小）
export function getCanvasScale(): number {
  return isMobile() ? 0.85 : 1.0
}

// 为Canvas元素同时绑定点击和触摸事件
export function bindCanvasEvents(
  canvas: HTMLCanvasElement,
  handler: (e: MouseEvent | TouchEvent) => void,
  options?: {
    preventDefault?: boolean
    passive?: boolean
  }
): void {
  const { preventDefault = true, passive = false } = options || {}

  // 清除旧的事件监听器
  canvas.onclick = null
  canvas.onmousedown = null
  
  // 绑定鼠标事件（桌面端）
  canvas.addEventListener('click', (e: MouseEvent) => {
    if (preventDefault) e.preventDefault()
    handler(e)
  })

  // 绑定触摸事件（移动端）
  canvas.addEventListener('touchstart', (e: TouchEvent) => {
    if (preventDefault) e.preventDefault()
    handler(e)
  }, { passive })

  // 绑定鼠标移动事件（桌面端）
  canvas.addEventListener('mousemove', (e: MouseEvent) => {
    if (preventDefault) e.preventDefault()
    ;(handler as any)(e)
  })

  // 绑定触摸移动事件（移动端）
  canvas.addEventListener('touchmove', (e: TouchEvent) => {
    if (preventDefault) e.preventDefault()
    ;(handler as any)(e)
  }, { passive })
}

// 获取触摸/鼠标坐标（统一接口）
export function getPointerPos(
  e: MouseEvent | TouchEvent,
  canvas: HTMLCanvasElement
): { x: number; y: number } {
  const rect = canvas.getBoundingClientRect()
  
  if ('touches' in e && e.touches.length > 0) {
    // 触摸事件
    const touch = e.touches[0]
    return {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top
    }
  } else if ('clientX' in e) {
    // 鼠标事件
    return {
      x: (e as MouseEvent).clientX - rect.left,
      y: (e as MouseEvent).clientY - rect.top
    }
  }
  
  return { x: 0, y: 0 }
}

// 创建虚拟摇杆（用于需要方向控制的游戏）
export function createVirtualJoystick(container: HTMLElement): {
  joystick: HTMLElement
  getDirection: () => { x: number; y: number }
  destroy: () => void
} {
  const joystick = document.createElement('div')
  joystick.className = 'virtual-joystick'
  joystick.innerHTML = `
    <div class="joystick-base"></div>
    <div class="joystick-stick"></div>
  `
  
  container.appendChild(joystick)
  
  let active = false
  let baseX = 0, baseY = 0
  let stickX = 0, stickY = 0
  let direction = { x: 0, y: 0 }
  
  const stick = joystick.querySelector('.joystick-stick') as HTMLElement
  const base = joystick.querySelector('.joystick-base') as HTMLElement
  
  const handleStart = (e: TouchEvent | MouseEvent) => {
    e.preventDefault()
    active = true
    const rect = base.getBoundingClientRect()
    baseX = rect.left + rect.width / 2
    baseY = rect.top + rect.height / 2
  }
  
  const handleMove = (e: TouchEvent | MouseEvent) => {
    if (!active) return
    e.preventDefault()
    
    let clientX, clientY
    if ('touches' in e) {
      clientX = e.touches[0].clientX
      clientY = e.touches[0].clientY
    } else {
      clientX = (e as MouseEvent).clientX
      clientY = (e as MouseEvent).clientY
    }
    
    const dx = clientX - baseX
    const dy = clientY - baseY
    const distance = Math.sqrt(dx * dx + dy * dy)
    const maxDistance = 40
    
    if (distance > maxDistance) {
      stickX = (dx / distance) * maxDistance
      stickY = (dy / distance) * maxDistance
    } else {
      stickX = dx
      stickY = dy
    }
    
    stick.style.transform = `translate(${stickX}px, ${stickY}px)`
    
    // 计算方向向量（归一化）
    direction = {
      x: stickX / maxDistance,
      y: stickY / maxDistance
    }
  }
  
  const handleEnd = () => {
    active = false
    stickX = 0
    stickY = 0
    stick.style.transform = 'translate(0px, 0px)'
    direction = { x: 0, y: 0 }
  }
  
  joystick.addEventListener('touchstart', handleStart, { passive: false })
  joystick.addEventListener('touchmove', handleMove, { passive: false })
  joystick.addEventListener('touchend', handleEnd)
  joystick.addEventListener('mousedown', handleStart)
  joystick.addEventListener('mousemove', handleMove)
  joystick.addEventListener('mouseup', handleEnd)
  joystick.addEventListener('mouseleave', handleEnd)
  
  return {
    joystick,
    getDirection: () => ({ ...direction }),
    destroy: () => {
      joystick.remove()
    }
  }
}

// 创建移动端控制按钮
export function createMobileButton(
  container: HTMLElement,
  options: {
    text: string
    position: 'left' | 'right' | 'center'
    onClick: () => void
  }
): HTMLElement {
  const btn = document.createElement('button')
  btn.className = 'mobile-control-btn'
  btn.textContent = options.text
  
  // 设置位置
  if (options.position === 'left') {
    btn.style.left = '20px'
  } else if (options.position === 'right') {
    btn.style.right = '20px'
  } else {
    btn.style.left = '50%'
    btn.style.transform = 'translateX(-50%)'
  }
  
  btn.addEventListener('click', (e) => {
    e.preventDefault()
    options.onClick()
  })
  
  btn.addEventListener('touchstart', (e) => {
    e.preventDefault()
    options.onClick()
  }, { passive: false })
  
  container.appendChild(btn)
  return btn
}

// 调整Canvas尺寸以适应移动端
export function resizeCanvasForMobile(canvas: HTMLCanvasElement): void {
  const scale = getCanvasScale()
  const originalWidth = canvas.width
  const originalHeight = canvas.height
  
  if (isMobile()) {
    canvas.style.width = `${originalWidth * scale}px`
    canvas.style.height = `${originalHeight * scale}px`
  } else {
    canvas.style.width = `${originalWidth}px`
    canvas.style.height = `${originalHeight}px`
  }
}

// 添加移动端样式
export function injectMobileStyles(): void {
  if (document.getElementById('mobile-helper-styles')) return
  
  const style = document.createElement('style')
  style.id = 'mobile-helper-styles'
  style.textContent = `
    /* 虚拟摇杆样式 */
    .virtual-joystick {
      position: fixed;
      bottom: 100px;
      left: 30px;
      width: 100px;
      height: 100px;
      z-index: 1000;
      display: none;
    }
    
    @media (max-width: 768px) {
      .virtual-joystick {
        display: block;
      }
    }
    
    .joystick-base {
      position: absolute;
      width: 100%;
      height: 100%;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.2);
      border: 2px solid rgba(255, 255, 255, 0.4);
    }
    
    .joystick-stick {
      position: absolute;
      top: 50%;
      left: 50%;
      width: 40px;
      height: 40px;
      margin-left: -20px;
      margin-top: -20px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.6);
      transition: transform 0.1s;
    }
    
    /* 移动端控制按钮样式 */
    .mobile-control-btn {
      position: fixed;
      bottom: 30px;
      padding: 12px 24px;
      font-size: 16px;
      font-weight: bold;
      color: white;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border: none;
      border-radius: 25px;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
      z-index: 1000;
      cursor: pointer;
      user-select: none;
      -webkit-tap-highlight-color: transparent;
    }
    
    .mobile-control-btn:active {
      transform: scale(0.95);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    }
    
    /* Canvas 移动端适配 */
    @media (max-width: 768px) {
      canvas#mainGameCanvas {
        touch-action: none;
        -webkit-touch-callout: none;
        -webkit-user-select: none;
        user-select: none;
      }
    }
  `
  
  document.head.appendChild(style)
}
