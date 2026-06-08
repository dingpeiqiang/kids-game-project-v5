import { INPUT_KEYS } from './config';
import type { InputState } from './types';

export class InputManager {
  private inputState: InputState;
  private keyMap: Map<string, boolean>;
  private keydownHandler: (e: KeyboardEvent) => void;
  private keyupHandler: (e: KeyboardEvent) => void;
  
  constructor() {
    this.inputState = {
      moveForward: false,
      moveBackward: false,
      moveLeft: false,
      moveRight: false,
      attack: false,
      block: false,
      dodge: false,
      ultimate: false,
      reset: false,
    };
    
    this.keyMap = new Map();
    
    this.keydownHandler = (e: KeyboardEvent) => this.handleKeyDown(e.code);
    this.keyupHandler = (e: KeyboardEvent) => this.handleKeyUp(e.code);
    
    this.setupEventListeners();
  }
  
  private setupEventListeners(): void {
    window.addEventListener('keydown', this.keydownHandler);
    window.addEventListener('keyup', this.keyupHandler);
  }
  
  private handleKeyDown(key: string): void {
    if (INPUT_KEYS.MOVE_FORWARD.includes(key)) {
      this.inputState.moveForward = true;
    }
    if (INPUT_KEYS.MOVE_BACKWARD.includes(key)) {
      this.inputState.moveBackward = true;
    }
    if (INPUT_KEYS.MOVE_LEFT.includes(key)) {
      this.inputState.moveLeft = true;
    }
    if (INPUT_KEYS.MOVE_RIGHT.includes(key)) {
      this.inputState.moveRight = true;
    }
    if (INPUT_KEYS.ATTACK.includes(key)) {
      this.inputState.attack = true;
    }
    if (INPUT_KEYS.BLOCK.includes(key)) {
      this.inputState.block = true;
    }
    if (INPUT_KEYS.DODGE.includes(key)) {
      this.inputState.dodge = true;
    }
    if (INPUT_KEYS.ULTIMATE.includes(key)) {
      this.inputState.ultimate = true;
    }
    if (INPUT_KEYS.RESET.includes(key)) {
      this.inputState.reset = true;
    }
    
    this.keyMap.set(key, true);
  }
  
  private handleKeyUp(key: string): void {
    if (INPUT_KEYS.MOVE_FORWARD.includes(key)) {
      this.inputState.moveForward = false;
    }
    if (INPUT_KEYS.MOVE_BACKWARD.includes(key)) {
      this.inputState.moveBackward = false;
    }
    if (INPUT_KEYS.MOVE_LEFT.includes(key)) {
      this.inputState.moveLeft = false;
    }
    if (INPUT_KEYS.MOVE_RIGHT.includes(key)) {
      this.inputState.moveRight = false;
    }
    if (INPUT_KEYS.ATTACK.includes(key)) {
      this.inputState.attack = false;
    }
    if (INPUT_KEYS.BLOCK.includes(key)) {
      this.inputState.block = false;
    }
    if (INPUT_KEYS.DODGE.includes(key)) {
      this.inputState.dodge = false;
    }
    if (INPUT_KEYS.ULTIMATE.includes(key)) {
      this.inputState.ultimate = false;
    }
    if (INPUT_KEYS.RESET.includes(key)) {
      this.inputState.reset = false;
    }
    
    this.keyMap.set(key, false);
  }
  
  getState(): InputState {
    return { ...this.inputState };
  }
  
  reset(): void {
    this.inputState = {
      moveForward: false,
      moveBackward: false,
      moveLeft: false,
      moveRight: false,
      attack: false,
      block: false,
      dodge: false,
      ultimate: false,
      reset: false,
    };
  }
  
  dispose(): void {
    window.removeEventListener('keydown', this.keydownHandler);
    window.removeEventListener('keyup', this.keyupHandler);
  }
}