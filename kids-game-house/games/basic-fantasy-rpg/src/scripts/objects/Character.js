import Stat from './Managers/Stats';
import Skills from './Managers/Skills';
import Timer from './Managers/Timer';
import Inventory from './Managers/Inventory';
import Combat from './Managers/Combat';
import Movement from './Managers/Movement';
import Equipment from './Managers/Equipment';
import Lvl from './Managers/Level';
import Target from './Managers/Target';
import Threat from './Managers/Threat';
import Buffs from './Managers/Buffs';
import Consumables from './Managers/Consumables';
import ResourceBar from './Managers/ResourceBar';
import playerUpdate from '../player/playerUpdate';
import KillLog from './Managers/KillLog';
import Const from './Managers/Const';
import { globalLogger } from '../utilities/Logger';

const MELEE_RANGE = 25;
const MOVEMENT_SPEED = 40;

// 创建角色模块的日志器
const logger = globalLogger.createChild('Character');

/**
 * Main character class, inherited by all characters.
 */
export default class Character extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x = 0, y = 0) {
    super(scene, x, y)

    scene.add.existing(this)
    scene.physics.add.existing(this);

    this.knownAbilities = [];

    // working on this: keeps messing up the hit test though when they are circles.
    // this.setInteractive().setCircle(8)

    // who is controlling this character:
    this.controller = 'AI';
    this.playerTarget = false;

    this.xpVal = 10;


    const humanStartingStats = {strength: 20, agility: 20, intellect: 20, stamina: 20, spirit: 20};

    // managers to track and change state:
    this.stat = new Stat(this, humanStartingStats);
    this.skills = new Skills(this);
    this.equipment = new Equipment(this);
    this.timer = new Timer(this);
    this.consumables = new Consumables(this);
    this.combat = new Combat(this);
    this.movement = new Movement(this, x, y);
    this.equipment = new Equipment(this);
    this.lvl = new Lvl(this, 1);
    this.target = new Target(this);
    this.threat = new Threat(this);
    this.buffs = new Buffs(this);
    this.inventory = new Inventory(this);
    this.healthBar = new ResourceBar(scene, 'health', this.stat.maxHp());
    this.killLog = new KillLog(this);

    this.hands = scene.add.sprite(x, y - 4);
    this.depth = 1;
    this.hands.depth = 2;

    scene.characters.add(this);

    // 角色基本信息（改为实例属性以支持序列化）
    this.characterName = '';
    this.race = 'human';
    this.characterClass = '';
    this.faction = '';  // 阵营（避免与 team() 方法冲突）
    this.tappedBy = null;
    this.lootData = null;
    this.isCasting = false;
    // 更新血条和资源条显示
    this.updateBars = function() {
      // keep hands in right place:
      this.depth = this.y + 1;
      this.hands.x = this.x;
      this.hands.y = this.y - 4;
      this.hands.depth = this.y + 2;
      this.healthBar.set(this.stat.hp());
      this.healthBar.p = 14 / (this.stat.maxHp());
      this.healthBar.x = this.x - 8;
      this.healthBar.y = this.y - 20;
      this.healthBar.bar.depth = this.y;
      this.healthBar.draw();
      if (this.rage) {
        this.rageBar.set(this.rage.rage());
        this.rageBar.x = this.x - 8;
        this.rageBar.y = this.y - 17;
        this.rageBar.bar.depth = this.y;
        this.rageBar.draw();
      } else if (this.mana) {
        this.manaBar.p = 14 / (this.mana.maxMana());
        this.manaBar.set(this.mana.mana());
        this.manaBar.x = this.x - 8;
        this.manaBar.y = this.y - 17;
        this.manaBar.bar.depth = this.y;
        this.manaBar.draw();
      }

    }

    this.playerControlled = playerUpdate();

    /**
     * 检查是否正在施法
     * @returns {boolean} 是否正在施法
     */
    this.casting = function() {
      return this.isCasting;
    }
    
    /**
     * 设置施法状态
     * @param {boolean} bool - 施法状态
     */
    this.setCasting = function(bool) {
      this.isCasting = bool;
    }

    /**
     * 获取角色名称
     * @returns {string} 角色名称
     */
    this.getName = function() {
      return this.characterName;
    }

    /**
     * 获取角色种族
     * @returns {string} 角色种族
     */
    this.getRace = function() {
      return this.race;
    }

    /**
     * 获取角色职业
     * @returns {string} 角色职业
     */
    this.getCharacterClass = function() {
      return this.characterClass;
    }

    /**
     * 获取角色阵营
     * @returns {string} 角色阵营
     */
    this.team = function() {
      return this.faction;
    }

    /**
     * 获取首次攻击者（用于战利品归属）
     * @returns {Character} 首次攻击者
     */
    this.tapped = function() {
      return this.tappedBy;
    }

    /**
     * 获取战利品数据
     * @returns {object|undefined} 战利品对象
     */
    this.loot = function() {
      return this.lootData;
    }

    /**
     * 拾取战利品
     * @param {Character} character - 拾取战利品的角色
     */
    this.takeLoot = function(character) {
      if (!this.lootData) {
        logger.warn('No loot to take');
        return;
      }
      character.inventory.add(Object.assign({}, this.lootData));
      this.lootData = null;
    }

    /**
     * 设置角色名称
     * @param {string} newName - 新名称
     */
    this.setName = function(newName) {
      this.characterName = newName;
    }

    /**
     * 设置角色种族
     * @param {string} newRace - 新种族
     */
    this.setRace = function(newRace) {
      this.race = newRace;
    }

    /**
     * 设置角色职业
     * @param {string} newCharacterClass - 新职业
     */
    this.setCharacterClass = function(newCharacterClass) {
      this.characterClass = newCharacterClass;
    }

    /**
     * 设置角色阵营
     * @param {string} newTeam - 新阵营
     */
    this.setTeam = function(newTeam) {
      this.faction = newTeam;
    }

    /**
     * 设置首次攻击者
     * @param {Character} newTapped - 首次攻击者
     */
    this.setTapped = function(newTapped) {
      if (this.tappedBy) {
        logger.debug('Already tapped by another character');
        return;
      }
      this.tappedBy = newTapped;
    }

    /**
     * 设置战利品数据
     * @param {object} newLoot - 战利品对象
     */
    this.setLoot = function(newLoot) {
      this.lootData = newLoot;
    }
    
    /**
     * 序列化角色数据（用于存档或网络传输）
     * @returns {Object} 序列化的角色数据
     */
    this.serialize = function() {
      return {
        name: this.characterName,
        race: this.race,
        class: this.characterClass,
        faction: this.faction,
        level: this.lvl.getLevel(),
        xp: this.xpVal,
        position: { x: this.x, y: this.y },
        stats: this.stat.displayStats(),
        equipment: this.equipment.getEquippedItems(),
        inventory: this.inventory.getItems(),
        skills: this.skills.getLearnedSkills()
      };
    };
    
    /**
     * 从序列化数据加载角色
     * @param {Object} data - 序列化的角色数据
     */
    this.deserialize = function(data) {
      if (!data) {
        logger.error('Invalid data for deserialization');
        return;
      }
      
      this.characterName = data.name || this.characterName;
      this.race = data.race || this.race;
      this.characterClass = data.class || this.characterClass;
      this.faction = data.faction || this.faction;
      
      if (data.position) {
        this.x = data.position.x;
        this.y = data.position.y;
      }
      
      logger.info('Character deserialized:', this.characterName);
    };
  }
}
