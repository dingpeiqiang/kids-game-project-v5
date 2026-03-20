/**
 * 游戏资源预检测测试脚本
 * 
 * 使用方法：
 * 1. 在浏览器控制台运行
 * 2. 或在 Node.js 环境中配合 puppeteer 使用
 */

import { GameAssetValidator } from './GameAssetValidator';

// 模拟 Phaser Scene
class MockScene {
  load: any;
  textures: any;
  sound: any;

  constructor() {
    this.load = {
      image: jest.fn(),
      audio: jest.fn(),
      json: jest.fn(),
      spritesheet: jest.fn(),
      once: jest.fn(),
      setAudioType: jest.fn(),
    };
    this.textures = {
      exists: jest.fn().mockReturnValue(false),
    };
    this.sound = {
      exists: jest.fn().mockReturnValue(false),
    };
  }
}

// 测试用例
async function runTests() {
  console.log('🧪 开始测试游戏资源预检测系统...\n');

  // 测试 1: 正常资源加载
  console.log('测试 1: 正常资源加载');
  try {
    const scene = new MockScene() as any;
    const validator = new GameAssetValidator(scene);
    
    validator.registerAssets([
      { key: 'test_image', type: 'image', required: true, path: '/valid/path.png' },
      { key: 'test_audio', type: 'audio', required: true, path: '/valid/path.mp3' },
    ]);

    // 这里应该抛出错误，因为路径不存在
    await validator.validateAndLoad();
    console.log('❌ 测试 1 失败：应该抛出错误但没有\n');
  } catch (error: any) {
    console.log('✅ 测试 1 通过：正确捕获资源缺失错误\n');
  }

  // 测试 2: 可选资源
  console.log('测试 2: 可选资源（非必需）');
  try {
    const scene = new MockScene() as any;
    const validator = new GameAssetValidator(scene);
    
    validator.registerAssets([
      { key: 'optional_image', type: 'image', required: false, path: '/invalid/path.png' },
    ]);

    const result = await validator.validateAndLoad();
    console.log('✅ 测试 2 通过：可选资源缺失不会抛出错误\n');
  } catch (error: any) {
    console.log('❌ 测试 2 失败：不应该抛出错误\n');
  }

  // 测试 3: 混合资源（部分必需，部分可选）
  console.log('测试 3: 混合资源配置');
  try {
    const scene = new MockScene() as any;
    const validator = new GameAssetValidator(scene);
    
    validator.registerAssets([
      { key: 'required_asset', type: 'image', required: true, path: '/invalid/required.png' },
      { key: 'optional_asset', type: 'image', required: false, path: '/invalid/optional.png' },
    ]);

    await validator.validateAndLoad();
    console.log('❌ 测试 3 失败：必需资源缺失应该抛出错误\n');
  } catch (error: any) {
    console.log('✅ 测试 3 通过：必需资源缺失会抛出错误，忽略可选资源\n');
  }

  // 测试 4: 错误信息格式
  console.log('测试 4: 错误信息格式检查');
  try {
    const scene = new MockScene() as any;
    const validator = new GameAssetValidator(scene);
    
    validator.registerAssets([
      { key: 'missing_image_1', type: 'image', required: true },
      { key: 'missing_image_2', type: 'image', required: true, path: '/bad/path.png' },
    ]);

    await validator.validateAndLoad();
  } catch (error: any) {
    const errorMessage = error.message;
    if (errorMessage.includes('缺少') && errorMessage.includes('必需资源')) {
      console.log('✅ 测试 4 通过：错误信息包含详细资源列表\n');
    } else {
      console.log('❌ 测试 4 失败：错误信息格式不正确\n');
      console.log('实际错误:', errorMessage);
    }
  }

  console.log('🎉 所有测试完成！');
}

// 运行测试
runTests().catch(console.error);
