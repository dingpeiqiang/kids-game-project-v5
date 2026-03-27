#!/usr/bin/env node

/**
 * 🎨 主题资源生成器 - CLI 工具
 * 
 * 用途：从 GDD 自动生成符合设计的主题资源
 * 特点：严格校验，无降级方案
 */

import { program } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises';
import { ResourceGenerator } from './core/resource-generator.js';
import { GDDParser } from './core/gdd-parser.js';
import { StrictValidator } from './core/strict-validator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

program
  .name('generate-theme-resources')
  .description('从 GDD 自动生成游戏主题资源（严格模式，不允许降级）')
  .version('1.0.0');

program
  .command('generate')
  .description('生成主题资源')
  .requiredOption('-g, --gdd <path>', 'GDD 文件路径 (GAME_DESIGN_DOCUMENT.md)')
  .requiredOption('-o, --output <path>', '输出目录路径')
  .requiredOption('-t, --theme <name>', '主题名称')
  .option('-s, --style <style>', '美术风格 (cartoon|pixel|realistic)', 'cartoon')
  .option('--skip-validation', '跳过验证（不推荐）')
  .action(async (options) => {
    const spinner = ora();
    
    try {
      console.log(chalk.cyan('\n🎨 主题资源生成器 v1.0\n'));
      
      // 步骤 1: 解析 GDD
      spinner.start('解析 GDD 文档');
      const gddContent = await fs.readFile(options.gdd, 'utf-8');
      const resourceRequirements = GDDParser.parse(gddContent);
      spinner.succeed(`解析成功：发现 ${resourceRequirements.images.length} 个图片需求，${resourceRequirements.audio.length} 个音频需求`);
      
      // 步骤 2: 验证需求完整性
      if (!options.skipValidation) {
        spinner.start('验证资源需求完整性');
        StrictValidator.validateRequirements(resourceRequirements);
        spinner.succeed('需求验证通过');
      }
      
      // 步骤 3: 生成资源
      spinner.start('生成主题资源');
      const generator = new ResourceGenerator({
        outputDir: options.output,
        themeName: options.theme,
        style: options.style
      });
      
      const result = await generator.generate(resourceRequirements);
      spinner.succeed(`生成完成：${result.totalGenerated} 个资源文件`);
      
      // 步骤 4: 严格校验
      spinner.start('严格校验生成的资源');
      const validationResult = StrictValidator.validateGeneratedResources(result);
      
      if (!validationResult.passed) {
        spinner.fail('资源校验失败');
        console.error(chalk.red('\n❌ 以下资源未通过校验:\n'));
        validationResult.failures.forEach(failure => {
          console.error(`  - ${failure.name}: ${failure.reason}`);
        });
        process.exit(1);
      }
      spinner.succeed('所有资源通过校验');
      
      // 输出结果
      console.log(chalk.green('\n✅ 资源生成完成！\n'));
      console.log('📊 生成统计:');
      console.log(`  - 图片资源：${result.images.generated} / ${result.images.required}`);
      console.log(`  - 音频资源：${result.audio.generated} / ${result.audio.required}`);
      console.log(`  - 配置文件：1 (GTRS config.json)`);
      console.log(`  - 总计：${result.totalGenerated} 个文件\n`);
      
      console.log('📁 输出目录:', chalk.blue(options.output));
      console.log('🎯 主题名称:', chalk.blue(options.theme));
      console.log('🎨 美术风格:', chalk.blue(options.style));
      console.log('\n💡 下一步：将生成的资源上传到 GTRS 系统\n');
      
    } catch (error) {
      spinner.fail(error.message || '生成失败');
      console.error(chalk.red('\n错误详情:\n'), error);
      process.exit(1);
    }
  });

program
  .command('validate')
  .description('验证现有资源是否符合 GDD')
  .requiredOption('-g, --gdd <path>', 'GDD 文件路径')
  .requiredOption('-r, --resources <path>', '资源目录路径')
  .action(async (options) => {
    const spinner = ora();
    
    try {
      console.log(chalk.cyan('\n🔍 资源验证器\n'));
      
      // 解析 GDD
      spinner.start('解析 GDD 文档');
      const gddContent = await fs.readFile(options.gdd, 'utf-8');
      const requirements = GDDParser.parse(gddContent);
      spinner.succeed(`解析完成：需要 ${requirements.images.length} 个图片，${requirements.audio.length} 个音频`);
      
      // 验证资源
      spinner.start('检查资源文件');
      const validation = await StrictValidator.validateExistingResources(
        requirements,
        options.resources
      );
      
      if (validation.allPresent) {
        spinner.succeed('所有资源文件存在');
      } else {
        spinner.fail('缺少资源文件');
        console.error(chalk.red('\n❌ 缺失的资源:\n'));
        validation.missing.forEach(name => {
          console.error(`  - ${name}`);
        });
        process.exit(1);
      }
      
      console.log(chalk.green('\n✅ 所有资源验证通过！\n'));
      
    } catch (error) {
      spinner.fail(error.message || '验证失败');
      process.exit(1);
    }
  });

program
  .command('clean')
  .description('清理生成的资源')
  .requiredOption('-o, --output <path>', '输出目录路径')
  .action(async (options) => {
    const spinner = ora();
    
    try {
      spinner.start('清理生成的资源');
      await fs.rm(options.output, { recursive: true, force: true });
      spinner.succeed('清理完成');
      
    } catch (error) {
      spinner.fail(error.message || '清理失败');
      process.exit(1);
    }
  });

program.parse();
