/**
 * 游戏中文化翻译文件
 * Game Chinese Localization
 */

export const zhCN = {
  // UI 标签
  ui: {
    inventory: '物品栏',
    character: '角色',
    quests: '任务',
    equipment: '装备',
    skills: '技能',
    stats: '属性',
    level: '等级',
    xp: '经验值',
    hp: '生命值',
    rage: '怒气值',
    mana: '法力值',
  },

  // 职业名称
  classes: {
    barbarian: '野蛮人',
    mage: '法师',
    priest: '牧师',
    thief: '盗贼',
    necro: '死灵法师',
    huntress: '女猎手',
  },

  // 种族
  races: {
    human: '人类',
    orc: '兽人',
    elf: '精灵',
    dwarf: '矮人',
  },

  // 阵营
  factions: {
    alliance: '联盟',
    horde: '部落',
    mob: '怪物',
    neutral: '中立',
  },

  // 角色选择界面文本
  characterSelection: {
    title: '选择你的角色',
    continue: '继续...',
    barbarian: '你一生都在迷宫深处度过，一次又一次地击退敌人的进攻，徒劳地试图保护日渐衰弱的家人和朋友。现在你是氏族中唯一的幸存者，你已经没有什么可失去的了。你用痛苦和愤怒来 fuel 你不顾一切的复仇欲望。',
    mage: '在你年幼时，你目睹了迷宫夺走了你所爱的一切。你沉浸在魔法的研究中，选择了冰冷无情的冰霜法师之路。多年来，你的思维变得敏锐而冷酷，你的身体破碎并用冰霜强化，时间模糊成无尽的战斗循环。',
    priest: '你在很小的时候就被选中，当你还是个孩子时就听到了疯狂之神的低语。他选择你带领他的子民离开迷宫，他在你脑海中持续的存在将你逼到了疯狂的边缘。你破损的身体和心灵是旧神的工具，你坚定的信仰使你成为致命的对手。',
    locked: '未解锁',
  },

  // 技能教程对话
  abilities: {
    rush: {
      name: '冲锋',
      instructions: '欢迎来到训练场。我们没有时间完成你的正式训练，我们需要你立即投入战斗。你必须学会的第一件事就是出其不意地攻击敌人。使用"冲锋"冲向敌人并使其失去平衡。',
    },
    hobble: {
      name: '致残',
      instructions: '你的速度太慢了，我担心我们的胜算。也许我应该教你与敌人保持距离。使用"致残"粉碎受害者的脚踝，阻止他们以正常速度奔跑。',
    },
    gore: {
      name: '穿刺',
      instructions: '我们没有时间让你闲逛！当你浪费时间的时候，我们失去了好几个好人。也许如果你使用"穿刺"，处理一个该死的兽人就不会花那么长时间。',
    },
    precision: {
      name: '精准',
      instructions: '为了成为一名伟大的战士，你必须利用你的怒气，仔细瞄准头部。启用"精准"后，你的下一次攻击将完美命中，造成更多伤害。注意，这只有在你有足够怒气时才会发生。',
    },
    shout: {
      name: '战吼',
      instructions: '有时候你需要激励你的盟友。使用"战吼"提高附近所有友军单位的攻击力和防御力。',
    },
    whirlwind: {
      name: '旋风斩',
      instructions: '当被多个敌人包围时，使用"旋风斩"对周围所有敌人造成伤害。',
    },
  },

  // 任务状态
  quest: {
    notGiven: '未接受',
    inProgress: '进行中',
    readyForTurnIn: '可以交付',
    completed: '已完成',
    easy: '简单',
    medium: '中等',
    hard: '困难',
  },

  // 物品类型
  items: {
    weapon: '武器',
    armor: '护甲',
    consumable: '消耗品',
    quest: '任务物品',
    misc: '杂物',
  },

  // 装备部位
  equipmentSlots: {
    head: '头部',
    chest: '胸部',
    legs: '腿部',
    feet: '脚部',
    hands: '手部',
    mainHand: '主手',
    offHand: '副手',
  },

  // 属性
  stats: {
    strength: '力量',
    stamina: '耐力',
    agility: '敏捷',
    intellect: '智力',
    spirit: '精神',
    crit: '暴击',
    dodge: '闪避',
    armor: '护甲',
    damage: '伤害',
  },

  // 战斗信息
  combat: {
    damage: '伤害',
    heal: '治疗',
    miss: '未命中',
    dodge: '闪避',
    critical: '暴击',
    dead: '已死亡',
    victory: '胜利',
    defeat: '失败',
  },

  // 通用消息
  messages: {
    welcome: '欢迎来到基本幻想 RPG！',
    tutorial: '使用 WASD 移动，点击敌人进行攻击。',
    noTarget: '没有目标',
    outOfRange: '超出范围',
    cooldown: '冷却中',
    notEnoughRage: '怒气不足',
    notEnoughMana: '法力不足',
    inventoryFull: '物品栏已满',
    itemEquipped: '已装备',
    questAccepted: '任务已接受',
    questCompleted: '任务已完成',
    levelUp: '升级！',
  },

  // NPC 对话
  npc: {
    greeting: '你好，冒险者！',
    farewell: '祝你好运！',
    help: '我能为你做什么？',
    training: '你需要更多的训练。',
  },
};

// 默认导出中文翻译
export default zhCN;
