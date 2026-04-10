
//  src/game/EventBus.ts
//  Lightweight typed event bus shared between
//  Phaser scenes and React components.

import { HUDState } from '../types';

type EventMap = {
  // Phaser → React
  'hud-update': HUDState;
  'game-over': { score: number };
  'level-complete': { level: number; score: number; lives: number; nextLevel: number };
  'game-paused': void;
  'game-resumed': void;
  'scene-ready': Phaser.Scene;

  // React → Phaser
  'resume-game': void;
  'restart-game': void;
  'menu-requested': void;
};

type Listener<T> = (data: T) => void;

class TypedEventBus {
  private listeners = new Map<string, Set<Listener<unknown>>>();

  on<K extends keyof EventMap>(event: K, fn: Listener<EventMap[K]>): void {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(fn as Listener<unknown>);
  }

  off<K extends keyof EventMap>(event: K, fn: Listener<EventMap[K]>): void {
    this.listeners.get(event)?.delete(fn as Listener<unknown>);
  }

  emit<K extends keyof EventMap>(
    event: K,
    ...args: EventMap[K] extends void ? [] : [EventMap[K]]
  ): void {
    this.listeners.get(event)?.forEach(fn => fn(args[0] as EventMap[K]));
  }

  removeAll<K extends keyof EventMap>(event: K): void {
    this.listeners.get(event)?.clear();
  }
}

export const EventBus = new TypedEventBus();
