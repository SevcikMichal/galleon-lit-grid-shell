import type { GalleonEventMap } from '../types/events.js';

type DetailOf<T> = T extends CustomEvent<infer D> ? D : never;
type Handler<T> = (detail: DetailOf<T>) => void;

/**
 * Typed singleton EventTarget for cross-component notifications.
 * Use for fire-and-forget events that cross shadow DOM boundaries
 * without a shared parent (e.g. grid-changed → external K8s tooling).
 *
 * For parent→child or child→parent communication within a known
 * component tree, prefer composed CustomEvents on the DOM instead.
 */
class GalleonBus extends EventTarget {
  emit<K extends keyof GalleonEventMap>(
    type: K,
    detail: DetailOf<GalleonEventMap[K]>,
  ): void {
    this.dispatchEvent(new CustomEvent(type, { detail }));
  }

  on<K extends keyof GalleonEventMap>(
    type: K,
    handler: Handler<GalleonEventMap[K]>,
  ): () => void {
    const wrapped = (e: Event) => handler((e as CustomEvent).detail);
    this.addEventListener(type as string, wrapped);
    return () => this.removeEventListener(type as string, wrapped);
  }
}

export const bus = new GalleonBus();
