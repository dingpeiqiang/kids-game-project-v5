import CONST from './Const';
import formatDialogue from './formatDialogue';
import { t } from '../localization/i18n';
import { createText, createMultilineText } from '../utilities/TextHelper';

// TODO:: do not need to create ALL the animations:
import animationCreator from './animationCreator';



export default class CharacterSelectionScene extends Phaser.Scene {
  constructor() {
    super({ key: 'CharacterSelectionScene' });

  }

 create() {
   animationCreator(this);

    const selectionContainer = this.add.container(this.scale.width / 2, this.scale.height / 2)

    // create background:
    const background = this.add.image(0, 0, 'character-select').setOrigin(0.5);
    background.scaleX = 4;
    background.scaleY = 4;

    selectionContainer.add(background);

    // create scene title:
    const title = createText(this, 0, -238, t('characterSelection.title') || '选择你的角色:', CONST.TXT_L, {
      origin: 0.5,
      tint: CONST.TXT_COLOR
    });

    selectionContainer.add(title);


    // add characters to container:
    const characterContainer = this.add.container(selectionContainer.x, selectionContainer.y - 120);

    // barbarian is default selected, starts animated:
    this.barbarian = this.add.sprite(-424, 14, 'barbarian-idle', 0);

    this.barbarian.anims.play('barbarian-combat', true);

    this.mage = this.add.sprite(-244, 14, 'mage-idle');
    this.priest = this.add.sprite(-84, 14, 'priest-idle');

    characterContainer.add([this.barbarian, this.mage, this.priest]);

    this.barbarian.setScale(6).setInteractive();

    this.mage.setScale(6).setInteractive();
    this.priest.setScale(6).setInteractive();


    // add texts:
    const className = createText(this, 0, 0, `${t(`classes.barbarian`)}:`, CONST.TXT_M, {
      origin: 0.5,
      tint: CONST.BARBARIAN_COLOR
    });

    const text = {
      barbarian: formatDialogue(t('characterSelection.barbarian'), 'characterSelection'),
      mage: formatDialogue(t('characterSelection.mage'), 'characterSelection'),
      priest: formatDialogue(t('characterSelection.priest'), 'characterSelection'),
      thief: [t('characterSelection.locked')],
      necro: [t('characterSelection.locked')],
      huntress: [t('characterSelection.locked')],
    }

    let selectedClass = 'barbarian';
    const selectedText = createMultilineText(this, 0, 98, text[selectedClass], CONST.TXT_S, {
      origin: 0.5,
      tint: CONST.TXT_COLOR,
      align: 'center',
      maxWidth: 900  // 进一步增加段落宽度到 900px
    });

    selectionContainer.add([ className, selectedText ]);


    // event handlers:
    this.barbarian.on('pointerdown', (pointer) => {
      _stopAllAnims(this);
      selectedClass = 'barbarian'
      className.setText(`${t('classes.barbarian')}:`).setTint(CONST.BARBARIAN_COLOR);
      selectedText.setText(text[selectedClass]);
      this.barbarian.anims.play('barbarian-combat', true);
    })

    this.mage.on('pointerdown', (pointer) => {
      _stopAllAnims(this);
      selectedClass = 'mage';
      className.setText(`${t('classes.mage')}:`).setTint(CONST.MAGE_COLOR);
      selectedText.setText(text[selectedClass]);
      this.mage.anims.play('mage-run', true);
    })

    this.priest.on('pointerdown', (pointer) => {
      _stopAllAnims(this);
      selectedClass = 'priest'
      className.setText(`${t('classes.priest')}:`).setTint(CONST.PRIEST_COLOR);
      selectedText.setText(text[selectedClass]);
      this.priest.anims.play('priest-combat', true);
    })



    // add start button:
    const startButton = createText(this, 494, 198, t('characterSelection.continue') || '继续...', CONST.TXT_M, {
      tint: 0x649438
    });
    startButton.setOrigin(1, 0.5);  // 右对齐

    startButton.setInteractive()

    startButton.on('pointerup', (pointer) => {
      this.cameras.main.fadeOut(500);
      this.time.delayedCall(500, () => {

        this.scene.start('UIScene')
        this.scene.start('DungeonScene', { class: selectedClass });
        this.scene.stop('CharacterSelectionScene');

      });
    })



    selectionContainer.add(startButton);
  }

}

function _stopAllAnims(scene) {
  scene.barbarian.anims.stop();
  scene.barbarian.setTexture('barbarian-idle', 0);

  scene.mage.anims.stop();
  scene.mage.setTexture('mage-idle', 0);

  scene.priest.anims.stop();
  scene.priest.setTexture('priest-idle', 0);
}
