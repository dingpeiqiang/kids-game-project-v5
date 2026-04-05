

/**
 * load assets here:
 */
export default class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' })
  }

  preload() {

    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // bitmap data:
    this.load.bitmapFont('font',
    '/fonts/font.png',
    '/fonts/font.fnt');


    const loadingText = this.make.text({
    x: width / 2,
    y: height / 2,
    text: 'Loading...',
    style: {
        font: '28px monospace',
        fill: '#ffffff'
      }
    });

    loadingText.setOrigin(0.5, 0.5);

    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();

    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(380, 270, 520, 50);

    // casting animations:
    this.load.spritesheet('mage-sword-frost-cast',
      '/anims/mage_sword_frost_cast_spritesheet.png',
      { frameWidth: 24, frameHeight: 36 }
    );

    this.load.spritesheet('priest-sword-nature-cast',
      '/anims/priest_sword_nature_cast_spritesheet.png',
      { frameWidth: 24, frameHeight: 36 }
    );

    // npc anims:
    this.load.spritesheet('npc-idle',
      '/anims/npc_idle_spritesheet.png',
      { frameWidth: 16, frameHeight: 16 }
    );

    this.load.spritesheet('npc-unarmed-idle',
      '/anims/npc_unarmed_idle_spritesheet.png',
      { frameWidth: 24, frameHeight: 36 }
    );

    // npc anims:
    this.load.spritesheet('guard-idle',
      '/anims/guard_idle_spritesheet.png',
      { frameWidth: 16, frameHeight: 16 }
    );

    this.load.spritesheet('guard-sword-idle',
      '/anims/guard_sword_idle_spritesheet.png',
      { frameWidth: 24, frameHeight: 24 }
    );


    // priest anims:
    this.load.spritesheet('priest-idle',
      '/anims/priest_idle_spritesheet.png',
      { frameWidth: 16, frameHeight: 16 }
    );

    // red mage:
    this.load.spritesheet('archmage-idle',
      '/anims/red_mage_idle_spritesheet.png',
      { frameWidth: 16, frameHeight: 16 }
    );

    // mage amims:
    this.load.spritesheet('mage-idle',
      '/anims/mage_idle_spritesheet.png',
      { frameWidth: 16, frameHeight: 16 }
    );

    this.load.spritesheet('mage-run',
      '/anims/mage_run_spritesheet.png',
      { frameWidth: 16, frameHeight: 16 }
    );

    this.load.spritesheet('mage-combat',
      '/anims/mage_combat_spritesheet.png',
      { frameWidth: 16, frameHeight: 16 }
    );

    // mage sword anims (i know, its not a sword, TODO: change character.ANIM):
    this.load.spritesheet('mage-sword-idle',
      '/anims/mage_sword_idle_spritesheet.png',
      { frameWidth: 24, frameHeight: 36 }
    );

    this.load.spritesheet('mage-sword-run',
      '/anims/mage_sword_run_spritesheet.png',
      { frameWidth: 24, frameHeight: 36 }
    );

    this.load.spritesheet('mage-sword-stab',
      '/anims/mage_sword_stab_spritesheet.png',
      { frameWidth: 36, frameHeight: 24 }
    );


    // barbarian anims:
    this.load.spritesheet('barbarian-idle',
      '/anims/barbarian_idle_spritesheet.png',
      { frameWidth: 16, frameHeight: 16 }
    );

    this.load.spritesheet('barbarian-run',
      '/anims/barbarian_run_spritesheet.png',
      { frameWidth: 16, frameHeight: 16 }
    );

    this.load.spritesheet('barbarian-combat',
      '/anims/barbarian_combat_spritesheet.png',
      { frameWidth: 16, frameHeight: 16 }
    );

    this.load.spritesheet('barbarian-die',
      '/anims/barbarian_die_spritesheet.png',
      { frameWidth: 16, frameHeight: 16 }
    );

    // barbarian sword anims:
    this.load.spritesheet('barbarian-sword-idle',
      '/anims/barbarian_sword_idle_spritesheet.png',
      { frameWidth: 24, frameHeight: 36 }
    );

    this.load.spritesheet('barbarian-sword-stab',
      '/anims/barbarian_sword_stab_spritesheet.png',
      { frameWidth: 36, frameHeight: 24 }
    );

    this.load.spritesheet('barbarian-sword-run',
      '/anims/barbarian_sword_run_spritesheet.png',
      { frameWidth: 24, frameHeight: 36 }
    );

    // orc anims:
    this.load.spritesheet('orc-mask-idle',
      '/anims/orc_mask_idle_spritesheet.png',
      { frameWidth: 16, frameHeight: 16 }
    );

    this.load.spritesheet('orc-mask-run',
      '/anims/orc_mask_run_spritesheet.png',
      { frameWidth: 16, frameHeight: 16 }
    );

    this.load.spritesheet('orc-mask-combat',
      '/anims/orc_mask_combat_spritesheet.png',
      { frameWidth: 16, frameHeight: 16 }
    );

    this.load.spritesheet('orc-mask-die',
      '/anims/orc_mask_die_spritesheet.png',
      { frameWidth: 16, frameHeight: 16 }
    );

    this.load.spritesheet('orc-mask-stun',
      '/anims/orc_mask_stun_spritesheet.png',
      { frameWidth: 16, frameHeight: 16 }
    );

    // orc sword anims:
    this.load.spritesheet('orc-sword-idle',
      '/anims/orc_sword_idle_spritesheet.png',
      { frameWidth: 24, frameHeight: 24 }
    );

    this.load.spritesheet('orc-sword-stab',
      '/anims/orc_sword_stab_spritesheet.png',
      { frameWidth: 36, frameHeight: 24 }
    );

    this.load.spritesheet('orc-sword-run',
      '/anims/orc_sword_run_spritesheet.png',
      { frameWidth: 24, frameHeight: 24 }
    );

    // drink anim:
    this.load.spritesheet('small-red',
      '/anims/red_potion_small_spritesheet.png',
      { frameWidth: 40, frameHeight: 16 }
    );

    // poly anim:
    this.load.spritesheet('polymorph',
      '/anims/poly_spritesheet.png',
      { frameWidth: 16, frameHeight: 16 }
    );


    // map data:
    this.load.tilemapTiledJSON('map', '/map/combat.json');
    this.load.image('v4', '/map/0x72_16x16DungeonTileset_extruded.v4.png');

    // icons:
    // barbarian:
    this.load.image('rush', '/icons/rush.png');
    this.load.image('gore', '/icons/gore.png');
    this.load.image('precision', '/icons/precision.png');
    this.load.image('shout', '/icons/shout.png');
    this.load.image('intimidate', '/icons/intimidate.png');
    this.load.image('hobble', '/icons/hobble.png');

    // mage:
    this.load.image('wand', '/icons/wand.png');
    this.load.image('focus', '/icons/focus.png');
    this.load.image('bomb', '/icons/bomb.png');
    this.load.image('frostbolt', '/icons/frostbolt.png');
    this.load.image('poly', '/icons/poly.png');

    //priest:
    this.load.image('heal', '/icons/heal.png');
    this.load.image('renew', '/icons/renew.png');

    // large item bg's:
    this.load.image('brown-bg', '/icons/brown_bg.png');
    this.load.image('green-bg', '/icons/green_bg.png');
    this.load.image('yellow-bg', '/icons/yellow_bg.png');
    this.load.image('blue-bg', '/icons/blue_bg.png');
    this.load.image('purple-bg', '/icons/purple_bg.png');
    this.load.image('red-bg', '/icons/red_bg.png');
    this.load.image('grey-bg', '/icons/grey_bg.png');

    // small item bg's:
    this.load.image('brown-sm-bg', '/icons/brown_small_bg.png');
    this.load.image('green-sm-bg', '/icons/green_small_bg.png');
    this.load.image('yellow-sm-bg', '/icons/yellow_small_bg.png');
    this.load.image('blue-sm-bg', '/icons/blue_small_bg.png');
    this.load.image('purple-sm-bg', '/icons/purple_small_bg.png');
    this.load.image('red-sm-bg', '/icons/red_small_bg.png');
    this.load.image('grey-sm-bg', '/icons/grey_small_bg.png');

    // items:
    this.load.image('leather_scraps', '/icons/leather_scraps.png');
    this.load.image('ichor', '/icons/ichor.png');
    this.load.image('ore', '/icons/ore.png');

    this.load.image('white_shirt', '/icons/white_shirt.png');
    this.load.image('shadow_staff', '/icons/shadow_staff.png');
    this.load.image('ring_01', '/icons/ring_01.png');
    this.load.image('slippers', '/icons/slippers.png');
    this.load.image('cloth', '/icons/cloth.png');
    this.load.image('water', '/icons/water.png');
    this.load.image('cheese', '/icons/cheese.png');
    this.load.image('frost_wand', '/icons/frost_wand.png');
    this.load.image('shadow_wand', '/icons/shadow_wand.png');
    this.load.image('short_sword', '/icons/short_sword.png');
    this.load.image('mail_chest', '/icons/mail_chest.png');
    this.load.image('mail_boots', '/icons/mail_boots.png');
    this.load.image('leather', '/icons/leather.png');
    this.load.image('tarnished_sword', '/icons/tarnished_sword.png');
    this.load.image('black_dagger', '/icons/black_dagger.png');
    this.load.image('emerald', '/icons/emerald.png');
    this.load.image('flame_sword', '/icons/flame_sword.png');

    this.load.image('nature-ball', '/anims/nature_ball.png');
    this.load.image('frost-ball', '/anims/frost_ball.png');
    this.load.image('fire-ball', '/anims/fire_ball.png');
    this.load.image('arcane-ball', '/anims/arcane_ball.png');
    this.load.image('shadow-ball', '/anims/shadow_ball.png');


    this.load.image('inventory', '/icons/inventory.png');
    this.load.image('quest', '/icons/quest.png');
    this.load.image('equipment', '/icons/equipment.png');

    // ui:
    this.load.image('ui', '/ui/ui.png');
    this.load.image('dialogueBox', '/ui/dialogue.png');
    this.load.image('questLog', '/ui/quest_log.png');
    this.load.image('inventory-background', '/ui/inventory.png');
    this.load.image('equipment-background', '/ui/equipment.png');
    this.load.image('loot-box-background', '/ui/loot_box.png');

    this.load.image('hidden', '/anims/empty.png');


    // character selection screen:
    this.load.image('character-select', '/ui/character_selection.png');

    this.load.on('progress', function (value) {
      progressBar.clear();
      progressBar.fillStyle(0xbf7b3f, 1);
      progressBar.fillRect(390, 280, 500 * value, 30);
    });


    this.registry.set('reloadUI');
    this.registry.set('refreshXpBar');

    this.registry.set('openEquipment');
    this.registry.set('closeEquipment');

    this.registry.set('openLootBox');
    this.registry.set('closeLootBox');

    this.registry.set('openInventory');
    this.registry.set('closeInventory');

    this.registry.set('openDialogueBox');
    this.registry.set('closeDialogueBox');

    this.registry.set('openQuestLog');
    this.registry.set('closeQuestLog');

    this.registry.set('selectItem');
    this.registry.set('showComparison');
    this.registry.set('selectQuest');
    this.registry.set('selectEquipment');
    this.registry.set('targetChange');
    this.registry.set('error');


    // load event:
    this.load.on('complete', ()=> {
      loadingText.destroy();
      progressBar.destroy();
      progressBox.destroy();
      this.scene.start('CharacterSelectionScene')
    })

  }

}
