import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { ResizeDirection } from '../../controllers/resize-controller.js';

/**
 * A small drag handle rendered inside galleon-cell for resize interactions.
 * Fires a pointerdown event that the parent ResizeController handles.
 *
 * Not registered as a public custom element by default — registered internally
 * by galleon-cell when the viewport module is loaded.
 */
@customElement('galleon-resize-handle')
export class GalleonResizeHandle extends LitElement {
  static override styles = css`
    :host {
      display: flex;
      align-items: center;
      justify-content: center;
      position: absolute;
      background: transparent;
      z-index: 2;
      opacity: 0;
      transition: opacity 120ms ease;
    }
    :host(:hover),
    :host([active]) {
      opacity: 1;
    }
    :host([direction='se']) {
      bottom: 0; right: 0;
      width: 16px; height: 16px;
      cursor: se-resize;
    }
    :host([direction='s']) {
      bottom: 0; left: 50%; transform: translateX(-50%);
      width: 32px; height: 8px;
      cursor: s-resize;
    }
    :host([direction='e']) {
      right: 0; top: 50%; transform: translateY(-50%);
      width: 8px; height: 32px;
      cursor: e-resize;
    }
    .dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--galleon-handle-color, #94a3b8);
      pointer-events: none;
    }
    :host([direction='s']) .dot,
    :host([direction='e']) .dot {
      width: 20px;
      height: 3px;
      border-radius: 2px;
    }
    :host([direction='s']) .dot { transform: rotate(0deg); }
    :host([direction='e']) .dot { transform: rotate(90deg); }
  `;

  @property({ reflect: true }) direction: ResizeDirection = 'se';

  override render() {
    return html`<div class="dot"></div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'galleon-resize-handle': GalleonResizeHandle;
  }
}
