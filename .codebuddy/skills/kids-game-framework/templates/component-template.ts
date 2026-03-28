import { ComponentBase } from '../../../core/ComponentBase';
import { GameEventType } from '../../../types/GameEventType';
import { ComponentContainer } from '../../../core/ComponentContainer';

/**
 * 组件模板
 *
 * 说明：
 * 1. 所有组件必须继承 ComponentBase
 * 2. 在 constructor 中注册事件监听
 * 3. 使用 eventBus.emit() 发送事件
 * 4. 使用相对路径导入其他模块（禁止 @/ 别名）
 *
 * 使用方法：
 * 将此文件复制到组件目录，重命名为 XxxComponent.ts，
 * 然后根据具体需求修改内容。
 */
export class ComponentTemplate extends ComponentBase {
  private value: number;

  constructor(
    container: ComponentContainer,
    private eventBus: import('../../../core/EventBus').EventBus
  ) {
    super(container);
    this.value = 0;

    // 注册事件监听
    this.eventBus.on(GameEventType.SCORE_CHANGED, this.handleScoreChanged, this);
  }

  /**
   * 处理分数变化事件
   */
  private handleScoreChanged(score: number): void {
    this.value = score;
    console.log(`分数变化: ${score}`);
  }

  /**
   * 更新组件
   */
  public update(time: number, delta: number): void {
    // 更新逻辑
  }

  /**
   * 销毁组件
   */
  public destroy(): void {
    // 移除事件监听
    this.eventBus.off(GameEventType.SCORE_CHANGED, this.handleScoreChanged, this);
    super.destroy();
  }

  /**
   * 触发自定义事件
   */
  protected emitCustomEvent(data: any): void {
    this.eventBus.emit('CUSTOM_EVENT', data);
  }
}
