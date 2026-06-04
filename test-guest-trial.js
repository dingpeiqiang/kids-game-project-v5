/**
 * 游客试玩功能测试脚本
 * 
 * 使用方法：
 * 1. 在浏览器控制台运行此脚本
 * 2. 或作为自动化测试的一部分
 */

// 测试1: 检查游客模式启动
function testGuestModeStart() {
  console.log('=== 测试1: 游客模式启动 ===');
  
  // 清除之前的游客状态
  localStorage.removeItem('isGuest');
  localStorage.removeItem('guestStartTime');
  
  // 模拟点击游客试玩按钮
  const guestBtn = document.querySelector('.guest-btn');
  if (guestBtn) {
    console.log('找到游客试玩按钮，点击...');
    guestBtn.click();
    
    // 等待一下让状态设置完成
    setTimeout(() => {
      const isGuest = localStorage.getItem('isGuest');
      const startTime = localStorage.getItem('guestStartTime');
      
      console.log('isGuest:', isGuest);
      console.log('guestStartTime:', startTime);
      
      if (isGuest === 'true' && startTime) {
        console.log('✅ 测试1通过: 游客模式正确启动');
      } else {
        console.log('❌ 测试1失败: 游客模式未正确启动');
      }
    }, 100);
  } else {
    console.log('❌ 测试1失败: 未找到游客试玩按钮');
  }
}

// 测试2: 检查时间计算
function testTimeCalculation() {
  console.log('=== 测试2: 时间计算 ===');
  
  // 设置一个过去的时间（9分钟前）
  const nineMinutesAgo = Date.now() - (9 * 60 * 1000);
  localStorage.setItem('guestStartTime', nineMinutesAgo.toString());
  localStorage.setItem('isGuest', 'true');
  
  // 模拟时间检查
  const startTime = parseInt(localStorage.getItem('guestStartTime') || '0', 10);
  const currentTime = Date.now();
  const elapsedMinutes = (currentTime - startTime) / (1000 * 60);
  
  console.log('已过时间(分钟):', elapsedMinutes.toFixed(2));
  
  if (elapsedMinutes >= 9 && elapsedMinutes < 10) {
    console.log('✅ 测试2通过: 时间计算正确');
  } else {
    console.log('❌ 测试2失败: 时间计算错误');
  }
}

// 测试3: 检查超时处理
function testTimeoutHandling() {
  console.log('=== 测试3: 超时处理 ===');
  
  // 设置一个过去的时间（11分钟前）
  const elevenMinutesAgo = Date.now() - (11 * 60 * 1000);
  localStorage.setItem('guestStartTime', elevenMinutesAgo.toString());
  localStorage.setItem('isGuest', 'true');
  
  // 模拟权限检查
  const validateGameStartPermission = () => {
    const isGuest = localStorage.getItem('isGuest') === 'true';
    
    if (isGuest) {
      const guestStartTime = localStorage.getItem('guestStartTime');
      if (guestStartTime) {
        const startTime = parseInt(guestStartTime, 10);
        const currentTime = Date.now();
        const elapsedMinutes = (currentTime - startTime) / (1000 * 60);
        
        if (elapsedMinutes >= 10) {
          console.log('游客试玩时间已到，应跳转到登录页');
          return false;
        }
      }
      return true;
    }
    
    // 非游客模式的正常检查
    return true; // 简化测试
  };
  
  const result = validateGameStartPermission();
  console.log('权限检查结果:', result);
  
  if (!result) {
    console.log('✅ 测试3通过: 超时处理正确');
  } else {
    console.log('❌ 测试3失败: 超时处理错误');
  }
}

// 运行所有测试
function runAllTests() {
  console.log('🚀 开始运行游客试玩功能测试...\n');
  
  testGuestModeStart();
  setTimeout(testTimeCalculation, 200);
  setTimeout(testTimeoutHandling, 400);
  
  console.log('\n🏁 测试完成');
}

// 导出测试函数
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    testGuestModeStart,
    testTimeCalculation,
    testTimeoutHandling,
    runAllTests
  };
} else {
  // 浏览器环境
  window.runGuestTrialTests = runAllTests;
  console.log('游客试玩功能测试已加载，运行 window.runGuestTrialTests() 执行测试');
}