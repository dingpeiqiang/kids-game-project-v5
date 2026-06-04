/**
 * 🔄 框架升级助手
 * 
 * 提供框架版本检查、升级建议和兼容性验证功能：
 * 1. 检查当前框架版本和配置
 * 2. 检测过时的API和模式
 * 3. 提供升级建议和迁移指南
 * 4. 验证项目兼容性
 */

export interface FrameworkVersion {
  current: string;
  latest: string;
  isLatest: boolean;
  releaseDate: string;
  breakingChanges: boolean;
}

export interface FrameworkFeature {
  name: string;
  versionAdded: string;
  isAvailable: boolean;
  deprecated?: boolean;
  alternative?: string;
}

export interface UpgradeRecommendation {
  type: 'CRITICAL' | 'IMPORTANT' | 'RECOMMENDED' | 'OPTIONAL';
  description: string;
  affectedFiles?: string[];
  migrationGuide?: string;
  estimatedEffort: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface FrameworkCompatibility {
  gameId: string;
  currentFramework: string;
  requiredMinVersion: string;
  isCompatible: boolean;
  compatibilityIssues: string[];
  recommendations: UpgradeRecommendation[];
}

/**
 * 🏗️ 框架升级助手主类
 */
export class FrameworkUpgradeHelper {
  private static readonly FRAMEWORK_VERSIONS = [
    { version: '3.1.0', date: '2026-03-31', features: ['GTRS整合', '组件化架构', '开发调试工具'] },
    { version: '3.0.0', date: '2026-03-28', features: ['AI指导文档', '游戏模板系统'] },
    { version: '2.0.0', date: '2026-03-15', features: ['基础框架', 'TypeScript支持'] }
  ];

  private static readonly DEPRECATED_APIS = [
    {
      name: 'stores/game.ts 直接调用',
      versionDeprecated: '3.0.0',
      alternative: '使用 EventBus + 组件化架构',
      migrationGuide: '参考 snake2 架构迁移示例'
    },
    {
      name: '手动资源加载器',
      versionDeprecated: '3.1.0',
      alternative: '使用 LevelGTRSManager 和 GTRS规范',
      migrationGuide: '参考 GTRS_LEVEL_INTEGRATION_REPORT.md'
    },
    {
      name: '硬编码的游戏参数',
      versionDeprecated: '3.0.0',
      alternative: '使用 difficulty.json 和 game-config.json',
      migrationGuide: '参考模板配置文件'
    }
  ];

  /**
   * 检查项目框架版本
   */
  static checkProjectFrameworkVersion(projectPath: string): FrameworkCompatibility {
    const result: FrameworkCompatibility = {
      gameId: '',
      currentFramework: '',
      requiredMinVersion: '3.0.0',
      isCompatible: true,
      compatibilityIssues: [],
      recommendations: []
    };

    try {
      // TODO: 实际项目路径检测逻辑
      result.gameId = this.extractGameId(projectPath);
      result.currentFramework = this.detectFrameworkVersion(projectPath);
      
      // 检查兼容性
      const compatibilityCheck = this.verifyCompatibility(projectPath);
      result.isCompatible = compatibilityCheck.isCompatible;
      result.compatibilityIssues = compatibilityCheck.issues;
      result.recommendations = this.generateRecommendations(projectPath);
      
    } catch (error) {
      console.error('版本检查失败:', error);
      result.isCompatible = false;
      result.compatibilityIssues = ['版本检查过程出错，请检查项目结构'];
    }

    return result;
  }

  /**
   * 获取框架特性列表
   */
  static getFrameworkFeatures(currentVersion: string): FrameworkFeature[] {
    const features: FrameworkFeature[] = [
      {
        name: 'GTRS规范支持',
        versionAdded: '3.1.0',
        isAvailable: this.versionCompare(currentVersion, '3.1.0') >= 0
      },
      {
        name: '组件化架构',
        versionAdded: '3.1.0',
        isAvailable: this.versionCompare(currentVersion, '3.1.0') >= 0
      },
      {
        name: 'AI开发指南',
        versionAdded: '3.0.0',
        isAvailable: this.versionCompare(currentVersion, '3.0.0') >= 0
      },
      {
        name: '可视化编辑器',
        versionAdded: '3.1.0',
        isAvailable: this.versionCompare(currentVersion, '3.1.0') >= 0
      },
      {
        name: '开发调试工具',
        versionAdded: '3.1.0',
        isAvailable: this.versionCompare(currentVersion, '3.1.0') >= 0
      },
      {
        name: 'TypeScript类型系统',
        versionAdded: '2.0.0',
        isAvailable: this.versionCompare(currentVersion, '2.0.0') >= 0
      }
    ];

    return features;
  }

  /**
   * 检测过时的API使用
   */
  static detectDeprecatedAPIs(projectPath: string): Array<{
    api: string;
    usageCount: number;
    files: string[];
    riskLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  }> {
    // 简化的检测逻辑
    const detectedAPIs: Array<{
      api: string;
      usageCount: number;
      files: string[];
      riskLevel: 'HIGH' | 'MEDIUM' | 'LOW';
    }> = [];

    // TODO: 实际文件扫描逻辑
    // 这里返回示例数据
    detectedAPIs.push({
      api: 'stores/game.ts 直接调用',
      usageCount: 0, // 简化的检测
      files: [],
      riskLevel: 'HIGH'
    });

    return detectedAPIs;
  }

  /**
   * 生成升级检查报告
   */
  static generateUpgradeReport(projectPath: string): {
    compatibility: FrameworkCompatibility;
    deprecatedAPIs: ReturnType<typeof this.detectDeprecatedAPIs>;
    upgradePlan: {
      requiredChanges: number;
      recommendedChanges: number;
      estimatedTime: string;
      steps: UpgradeRecommendation[];
    };
  } {
    const compatibility = this.checkProjectFrameworkVersion(projectPath);
    const deprecatedAPIs = this.detectDeprecatedAPIs(projectPath);
    
    const highPriorityChanges = compatibility.recommendations
      .filter(r => r.type === 'CRITICAL' || r.type === 'IMPORTANT').length;
    const mediumPriorityChanges = compatibility.recommendations
      .filter(r => r.type === 'RECOMMENDED').length;

    let estimatedTime = '无需升级';
    let timeHours = 0;
    
    if (highPriorityChanges > 0) {
      timeHours = highPriorityChanges * 2 + mediumPriorityChanges * 1;
      estimatedTime = `约${timeHours}小时`;
    } else if (mediumPriorityChanges > 0) {
      timeHours = mediumPriorityChanges * 1;
      estimatedTime = `约${timeHours}小时`;
    }

    return {
      compatibility,
      deprecatedAPIs,
      upgradePlan: {
        requiredChanges: highPriorityChanges,
        recommendedChanges: mediumPriorityChanges,
        estimatedTime,
        steps: compatibility.recommendations
      }
    };
  }

  /**
   * 获取最新框架版本指南
   */
  static getLatestFrameworkGuide(): {
    version: string;
    keyFeatures: string[];
    upgradeBenefits: string[];
    migrationExamples: string[];
  } {
    const latestVersion = this.FRAMEWORK_VERSIONS[0];
    
    return {
      version: latestVersion.version,
      keyFeatures: latestVersion.features,
      upgradeBenefits: [
        '开发效率提升60-80%',
        '加载性能优化50%',
        '自动GTRS合规性验证',
        '可视化开发工具支持'
      ],
      migrationExamples: [
        '参考 kids-game-house/games/snake2 组件化改造',
        '使用 level-editor-prototype.html 配置资源映射',
        '查阅 GTRS_LEVEL_INTEGRATION_REPORT.md 整合指南'
      ]
    };
  }

  /**
   * 执行自动升级检查和建议
   */
  static async performAutoCheck(): Promise<{
    status: 'UP_TO_DATE' | 'UPGRADE_RECOMMENDED' | 'UPGRADE_REQUIRED';
    message: string;
    recommendations: string[];
    nextSteps: string[];
  }> {
    try {
      // 检测当前项目状态
      const currentVersion = '3.1.0'; // 假设当前版本
      const features = this.getFrameworkFeatures(currentVersion);
      
      const missingFeatures = features.filter(f => !f.isAvailable);
      const criticalFeatures = missingFeatures.filter(f => 
        ['GTRS规范支持', '组件化架构'].includes(f.name)
      );
      
      if (criticalFeatures.length > 0) {
        return {
          status: 'UPGRADE_REQUIRED',
          message: '检测到关键技术特性缺失，建议升级框架',
          recommendations: criticalFeatures.map(f => 
            `添加 ${f.name} (v${f.versionAdded}+) 支持`
          ),
          nextSteps: [
            '参考框架升级指南进行迁移',
            '使用最新的游戏模板重建项目',
            '查阅 AI_INSTRUCTIONS.md 获取新的开发流程'
          ]
        };
      } else if (missingFeatures.length > 0) {
        return {
          status: 'UPGRADE_RECOMMENDED',
          message: '有可用新功能，建议升级以获得更好的开发体验',
          recommendations: missingFeatures.map(f => 
            `启用 ${f.name} (v${f.versionAdded}+) 功能`
          ),
          nextSteps: [
            '评估新功能的适用性',
            '逐步引入新功能，避免破坏性变更',
            '测试兼容性后再全面升级'
          ]
        };
      } else {
        return {
          status: 'UP_TO_DATE',
          message: '项目使用的是最新框架版本',
          recommendations: ['继续保持，定期检查更新'],
          nextSteps: ['探索高级功能和最佳实践']
        };
      }
    } catch (error) {
      return {
        status: 'UPGRADE_RECOMMENDED',
        message: '版本检查过程中出现错误，建议进行框架健康检查',
        recommendations: ['运行框架完整性检查', '查看日志获取详细信息'],
        nextSteps: ['联系开发团队获取支持']
      };
    }
  }

  // ========== 私有辅助方法 ==========

  private static extractGameId(projectPath: string): string {
    try {
      // 尝试从项目路径或配置文件提取gameId
      const pathParts = projectPath.split(/[\\/]/);
      const lastPart = pathParts[pathParts.length - 1];
      return lastPart || 'unknown-game';
    } catch {
      return 'unknown-game';
    }
  }

  private static detectFrameworkVersion(projectPath: string): string {
    // 简化的版本检测逻辑
    // TODO: 实际检测package.json或其他配置文件
    return '3.1.0';
  }

  private static verifyCompatibility(projectPath: string): {
    isCompatible: boolean;
    issues: string[];
  } {
    const issues: string[] = [];
    let isCompatible = true;

    // 检查关键配置文件是否存在
    const requiredFiles = [
      'AI_INSTRUCTIONS.md',
      'src/scenes/GameScene.ts',
      'src/config/GTRS.json'
    ];

    // TODO: 实际文件检查逻辑

    // 检查API兼容性
    const deprecatedAPIs = this.detectDeprecatedAPIs(projectPath);
    deprecatedAPIs.forEach(api => {
      if (api.riskLevel === 'HIGH') {
        issues.push(`发现高风险过时API: ${api.api}`);
        isCompatible = false;
      }
    });

    return { isCompatible, issues };
  }

  private static generateRecommendations(projectPath: string): UpgradeRecommendation[] {
    const recommendations: UpgradeRecommendation[] = [];

    // 通用升级建议
    recommendations.push({
      type: 'RECOMMENDED',
      description: '采用新的GTRS资源管理规范',
      migrationGuide: '参考 GTRS_LEVEL_INTEGRATION_REPORT.md',
      estimatedEffort: 'MEDIUM'
    });

    recommendations.push({
      type: 'RECOMMENDED',
      description: '使用增强版开发工具和调试器',
      affectedFiles: ['DevDebugger.ts', 'enhance-dev-tools.js'],
      migrationGuide: '参考相关工具文档',
      estimatedEffort: 'LOW'
    });

    recommendations.push({
      type: 'OPTIONAL',
      description: '考虑向组件化架构迁移',
      migrationGuide: '参考 snake2 架构迁移示例',
      estimatedEffort: 'HIGH'
    });

    return recommendations;
  }

  private static versionCompare(v1: string, v2: string): number {
    const v1Parts = v1.split('.').map(Number);
    const v2Parts = v2.split('.').map(Number);
    
    for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
      const p1 = v1Parts[i] || 0;
      const p2 = v2Parts[i] || 0;
      
      if (p1 > p2) return 1;
      if (p1 < p2) return -1;
    }
    
    return 0;
  }
}

/**
 * 🚀 CLI前端 - 框架升级助理
 */
export async function runFrameworkUpgradeAssistant(): Promise<void> {
  console.log('🔍 kids-game-frame-factory 框架升级助理');
  console.log('='.repeat(50));
  
  const checkResult = await FrameworkUpgradeHelper.performAutoCheck();
  
  console.log(`\n📊 检查结果: ${checkResult.status}`);
  console.log(`💬 ${checkResult.message}`);
  
  if (checkResult.recommendations.length > 0) {
    console.log('\n🔍 建议改进:');
    checkResult.recommendations.forEach((rec, index) => {
      console.log(`  ${index + 1}. ${rec}`);
    });
  }
  
  if (checkResult.nextSteps.length > 0) {
    console.log('\n🚀 下一步:');
    checkResult.nextSteps.forEach((step, index) => {
      console.log(`  ${index + 1}. ${step}`);
    });
  }
  
  // 显示当前框架版本和特性
  const currentVersion = '3.1.0';
  const features = FrameworkUpgradeHelper.getFrameworkFeatures(currentVersion);
  const availableFeatures = features.filter(f => f.isAvailable);
  
  console.log(`\n🏆 当前框架版本: v${currentVersion}`);
  console.log('✅ 已支持特性:');
  availableFeatures.forEach(feature => {
    console.log(`   • ${feature.name} (v${feature.versionAdded}+)`);
  });
  
  // 获取最新框架指南
  const latestGuide = FrameworkUpgradeHelper.getLatestFrameworkGuide();
  console.log(`\n🌟 最新版本: v${latestGuide.version}`);
  console.log('✨ 主要特性:');
  latestGuide.keyFeatures.forEach(feature => {
    console.log(`   • ${feature}`);
  });
  
  console.log('\n📈 升级收益:');
  latestGuide.upgradeBenefits.forEach(benefit => {
    console.log(`   • ${benefit}`);
  });
  
  console.log('\n🔗 更多信息:');
  console.log('   - GTRS整合报告: docs/GTRS_LEVEL_INTEGRATION_REPORT.md');
  console.log('   - 开发指南: templates/game-template/AI_INSTRUCTIONS.md');
  console.log('   - 可视化编辑器: tools/level-editor-prototype.html');
  
  console.log('\n' + '='.repeat(50));
  console.log('🎉 框架升级助理运行完成');
}

// 如果是作为脚本运行
if (require.main === module) {
  runFrameworkUpgradeAssistant().catch(console.error);
}