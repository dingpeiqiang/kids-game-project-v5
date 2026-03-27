/**
 * GDD 解析器 - 从游戏设计文档提取资源需求
 */

export class GDDParser {
  
  /**
   * 解析 GDD 内容，提取资源需求
   */
  static parse(gddContent) {
    const requirements = {
      images: [],
      audio: []
    };
    
    // 解析图片资源需求
    const imageSection = this.extractSection(gddContent, '图片资源清单');
    if (imageSection) {
      requirements.images = this.parseImageRequirements(imageSection);
    }
    
    // 解析音频资源需求
    const audioSection = this.extractSection(gddContent, '音频资源清单');
    if (audioSection) {
      requirements.audio = this.parseAudioRequirements(audioSection);
    }
    
    // 解析游戏对象（自动生成对应的资源需求）
    const playerSection = this.extractSection(gddContent, '玩家角色');
    if (playerSection) {
      requirements.images.push({
        name: 'player',
        description: '玩家角色',
        format: 'PNG',
        priority: '必需'
      });
    }
    
    const enemySection = this.extractSection(gddContent, '敌对单位');
    if (enemySection) {
      const enemyTypes = this.extractEnemyTypes(enemySection);
      enemyTypes.forEach(type => {
        requirements.images.push({
          name: `enemy_${type}`,
          description: `${type}敌机`,
          format: 'PNG',
          priority: '必需'
        });
      });
    }
    
    const bulletSection = this.extractSection(gddContent, '子弹设计');
    if (bulletSection) {
      requirements.images.push(
        { name: 'bullet_player', description: '玩家子弹', format: 'PNG', priority: '必需' },
        { name: 'bullet_enemy', description: '敌机子弹', format: 'PNG', priority: '必需' }
      );
    }
    
    const powerupSection = this.extractSection(gddContent, '道具设计');
    if (powerupSection) {
      const powerupTypes = this.extractPowerupTypes(powerupSection);
      powerupTypes.forEach(type => {
        requirements.images.push({
          name: `powerup_${type}`,
          description: `${type}道具`,
          format: 'PNG',
          priority: '必需'
        });
      });
    }
    
    return requirements;
  }
  
  /**
   * 提取 Markdown 章节
   */
  static extractSection(content, sectionTitle) {
    const lines = content.split('\n');
    let inSection = false;
    let sectionContent = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line.includes(sectionTitle)) {
        inSection = true;
        continue;
      }
      
      if (inSection) {
        // 遇到下一个章节标题就停止
        if (line.startsWith('###') || line.startsWith('##')) {
          break;
        }
        sectionContent.push(lines[i]);
      }
    }
    
    return sectionContent.join('\n');
  }
  
  /**
   * 解析图片需求表格
   */
  static parseImageRequirements(section) {
    const requirements = [];
    const lines = section.split('\n').filter(l => l.trim());
    
    // 跳过表头，解析数据行
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line.startsWith('|')) continue;
      
      const columns = line.split('|').map(c => c.trim()).filter(c => c);
      if (columns.length >= 3) {
        // 去除 Markdown 粗体标记 **xxx**
        const cleanName = columns[0].replace(/\*\*/g, '');
        const cleanDesc = columns[1].replace(/\*\*/g, '');
        const cleanFormat = columns[3] ? columns[3].replace(/\*\*/g, '') : 'PNG';
        
        requirements.push({
          name: cleanName,
          description: cleanDesc,
          quantity: columns[2],
          format: cleanFormat,
          priority: columns[4] || '必需'
        });
      }
    }
    
    return requirements;
  }
  
  /**
   * 解析音频需求表格
   */
  static parseAudioRequirements(section) {
    const requirements = [];
    const lines = section.split('\n').filter(l => l.trim());
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line.startsWith('|')) continue;
      
      const columns = line.split('|').map(c => c.trim()).filter(c => c);
      if (columns.length >= 4) {
        requirements.push({
          name: columns[0],
          description: columns[1],
          duration: columns[2],
          format: columns[3],
          priority: columns[4] || '必需'
        });
      }
    }
    
    return requirements;
  }
  
  /**
   * 提取敌机类型
   */
  static extractEnemyTypes(section) {
    const types = [];
    const lines = section.split('\n');
    
    for (const line of lines) {
      if (line.includes('小型') || line.includes('small')) types.push('small');
      if (line.includes('中型') || line.includes('medium')) types.push('medium');
      if (line.includes('大型') || line.includes('large')) types.push('large');
    }
    
    return [...new Set(types)];
  }
  
  /**
   * 提取道具类型
   */
  static extractPowerupTypes(section) {
    const types = [];
    const lines = section.split('\n');
    
    for (const line of lines) {
      if (line.includes('加速')) types.push('speed');
      if (line.includes('散弹')) types.push('spread');
      if (line.includes('护盾')) types.push('shield');
      if (line.includes('生命')) types.push('life');
      if (line.includes('炸弹')) types.push('bomb');
    }
    
    return [...new Set(types)];
  }
}
