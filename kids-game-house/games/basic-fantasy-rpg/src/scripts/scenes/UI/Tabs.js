import CONST from '../Const';
import { t } from '../../localization/i18n';
import { createText } from '../../utilities/TextHelper';

export default function Tabs(scene) {

  const labels = scene.add.container(CONST.GAME_VIEW_CENTER_X, CONST.GAME_VIEW_CENTER_Y);

  this.init = function (active) {

    const inventoryLabel = createText(scene, -29 * 4, -62 * 4, t('ui.inventory'), 18, {
      origin: 0.5,
      tint: CONST.TXT_COLOR
    });

    const equipLabel = createText(scene, -82 * 4, -62 * 4, t('ui.character'), 18, {
      origin: 0.5,
      tint: CONST.TXT_COLOR
    });

    const questLabel = createText(scene, 25 * 4, -62 * 4, t('ui.quests'), 18, {
      origin: 0.5,
      tint: CONST.TXT_COLOR
    });

    labels.setDepth(1000)
    labels.add([inventoryLabel, equipLabel, questLabel]);
  }



  this.destroy = function() {
    labels.removeAll(true);
  }

}
