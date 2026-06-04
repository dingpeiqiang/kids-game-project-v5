import CONST from '../Const';
import { createMultilineText } from '../../utilities/TextHelper';

function clearDialogue(scene) {
  scene.dialogueBoxContainer.removeAll(true);
}

function loadDialogue(scene, dialogue) {

  const dialogueBoxBackground = scene.add.image(0, 0, 'dialogueBox');
  dialogueBoxBackground.scaleX = CONST.SCALE;
  dialogueBoxBackground.scaleY = CONST.SCALE;

  // 使用智能文本渲染（支持中文）
  const dialogueText = createMultilineText(scene, 0, -4 * 4, dialogue, CONST.TXT_S, {
    origin: 0.5,
    tint: CONST.TXT_COLOR,
    align: 'center'
  });

  scene.dialogueBoxContainer.add([dialogueBoxBackground, dialogueText]);
}

export { clearDialogue, loadDialogue };
