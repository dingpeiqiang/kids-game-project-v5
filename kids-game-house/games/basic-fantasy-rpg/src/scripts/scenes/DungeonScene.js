import Barbarian from '../objects/classTemplates/barbarian/Barbarian';
import Mage from '../objects/classTemplates/mage/Mage';
import Priest from '../objects/classTemplates/priest/Priest';
import Orc from '../objects/mobTemplates/Orc';
import OrcArcher from '../objects/mobTemplates/OrcArcher';
import NPC from '../objects/NPC';
import Trainer from '../objects/Trainer';
import inputListeners from '../player/inputListeners';
import playerUpdate from '../player/playerUpdate';
import updateLiveCharacters from '../updates/updateLiveCharacters';
import updateDeadCharacters from '../updates/updateDeadCharacters';
import { getConsumableByName } from '../loot/consumableAPI';
import { getWeaponByName } from '../loot/weaponAPI';
import animationCreator from './animationCreator';
import mapCreator from './mapCreator';

import Weapon from '../loot/Weapon';

import CONST from './Const';
import formatDialogue from './formatDialogue';
import { t } from '../localization/i18n';


export default class DungeonScene extends Phaser.Scene {
  constructor() {
    super({ key: 'DungeonScene' })
  }


  init(data) {

    // holds all characters:
    this.characters = this.add.group();


    // add animations to scene:
    animationCreator(this);


    // create selected character class:
    this.player = {};
    switch (data.class) {

      default:
      case 'barbarian':
      this.player = new Barbarian(this, 0, 0);
      break;

      case 'mage':
      this.player = new Mage(this, 0, 0);
      break;

      case 'priest':
      this.player = new Priest(this, 0, 0);
      break;

    }

    // init starting characters input:
    inputListeners(this.player);
    this.registry.set('reloadUI', this.player);
    this.registry.set('refreshXpBar', this.player.lvl.lvlInfo());


  }



  create() {
    // is equipped open:
    this.equipmentActive = false;
    // is lootBoxOpen:
    this.lootBoxActive = false;
    // is inventory open:
    this.inventoryActive = false;
    // is quest log open:
    this.questLogActive = false;
    // is dialogue box open:
    this.dialogueBoxActive = false;

    const abilities = {
      rush: {
        name: t('abilities.rush.name'),
        instructions: formatDialogue(t('abilities.rush.instructions'))
      },
      hobble: {
        name: t('abilities.hobble.name'),
        instructions: formatDialogue(t('abilities.hobble.instructions'))
      },
      gore: {
        name: t('abilities.gore.name'),
        instructions: formatDialogue(t('abilities.gore.instructions'))
      },
      precision: {
        name: t('abilities.precision.name'),
        instructions: formatDialogue(t('abilities.precision.instructions'))
      },
      shout: {
        name: t('abilities.shout.name'),
        instructions: formatDialogue(t('abilities.shout.instructions'))
      },
      intimidate: {
        name: '恐吓',
        instructions: formatDialogue("你快成功了，朋友。接下来你必须学会的是将恐惧打入敌人心灵的能力。当你的敌人害怕死亡时，他会变得缓慢而笨拙。利用你的怒气和愤怒来'恐吓'你的对手。")
      },
      bomb: {
        name: '冰霜炸弹',
        instructions: formatDialogue("冰霜炸弹是法师最强大的法术之一。在你的对手身上放置一个不稳定的冰霜能量团，它会在短时间内爆炸三次，造成高额冰霜伤害。现在就去试试吧。")
      },
      frostbolt: {
        name: '寒冰箭',
        instructions: formatDialogue("作为一名受过冰霜艺术训练的战斗法师，你无疑熟悉这个技能。'寒冰箭'会造成中等伤害，但也会减缓目标速度，给你额外的时间。'寒冰箭'消耗的法力很少，所以它是你最常用的法术之一。")
      },
      focus: {
        name: '专注',
        instructions: formatDialogue("战斗法师的主要属性是高智力。高智力意味着法师不仅可以施放更强大的法术，还可以在法力耗尽之前施放更多法术。对自己和盟友使用'专注'可以获得临时的智力提升。")
      },
      wand: {
        name: '魔杖',
        instructions: formatDialogue("魔杖是法师的主要武器。因为它们的能量源在创造过程中被注入，所以它们不需要法力来操作。它们的使用速度很快，可以在奔跑时使用。好好熟悉你的魔杖，你会经常使用它。")
      },
      poly: {
        name: '变形术',
        instructions: formatDialogue("变形术是法师最古老的法术之一。对你的敌人释放大量狂野魔法，会暂时将其变成温顺的生物，无法战斗或伤害你。但要小心，任何伤害都会打破这个法术。")
      }
    }


    // create map:
    const map = mapCreator(this);

    // use map object to spawn mobs:
    map.getObjectLayer('spawns').objects.forEach(spawnPoint => {

      let npc;

      if (spawnPoint.type === 'orc') {

        npc = new Orc(this, spawnPoint.x, spawnPoint.y);


      } else if (spawnPoint.name === 'quest') {
        npc = new NPC(this, spawnPoint.x, spawnPoint.y, spawnPoint.type);

      } else if (spawnPoint.name === 'trainer') {
        if (spawnPoint.type === this.player.getCharacterClass()) {
          npc = new Trainer(this, spawnPoint.x, spawnPoint.y, spawnPoint.type + '-' + spawnPoint.name, abilities[spawnPoint.properties[0].value]);

        }

      } else if (spawnPoint.name === 'entrance') {

        this.player.x = spawnPoint.x;
        this.player.y = spawnPoint.y;
        this.player.movement.setMoveTargetCoords([spawnPoint.x, spawnPoint.y])

      } else if (spawnPoint.name === 'exit') {

        // create rectangle with collider, trigger scene shutdown on collide:
        const exit = this.add.rectangle(spawnPoint.x, spawnPoint.y, spawnPoint.width, spawnPoint.height, 0xffffff).setOrigin(0).setVisible(false);


        this.physics.add.existing(exit);

        exit.body.setImmovable()

        const zoneTrigger = this.physics.add.collider(this.player, exit, (a, b) => {
          zoneTrigger.destroy();
          this.cameras.main.fadeOut(1500);
          this.time.delayedCall(1500, () => {

            this.scene.start('CharacterSelectionScene')
            this.scene.stop('UIScene');
            this.scene.stop('DungeonScene');

          });
        });
      }

    })


    _initCameras(this);


    this.player.controller = 'player';

    this.player.inventory.add(getConsumableByName('Spring Water'));
    this.player.inventory.add(getConsumableByName('Orc Jerky'));
    this.player.inventory.add(getConsumableByName('Orc Jerky'));
    this.player.inventory.add(getWeaponByName('Shadow Wand'));
    this.player.inventory.add(getWeaponByName('Short Sword'));

    this.player.inventory.addCrystals(100);

    this.player.skills.levelUpSkill('twoHandSword')
    this.player.skills.levelUpSkill('twoHandSword')
  }

  update() {
    // update managers:
    updateLiveCharacters(this);
    updateDeadCharacters(this);
  }

}


function _initCameras(scene = {}) {

  // set follow to current player controlled character:
  scene.cameras.main.setRoundPixels(true)
    .setSize(1106, 682)
    .startFollow(scene.player, true, .05, .05)
    .setZoom(3)
    .fadeIn(500)

}
