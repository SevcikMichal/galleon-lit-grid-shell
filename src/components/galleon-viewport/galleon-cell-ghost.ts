import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { ghostStyles } from './styles.js';

/**
 * A translucent placeholder rendered during drag-over to preview where
 * a component will land. Positioned using CSS grid lines on the host element.
 * Absolutely positioned inside the grid-surface so it overlays without
 * disrupting grid flow.
 */
@customElement('galleon-cell-ghost')
export class GalleonCellGhost extends LitElement {
  static override styles = ghostStyles;

  @property({ type: Number }) colStart = 1;
  @property({ type: Number }) colSpan = 1;
  @property({ type: Number }) rowStart = 1;
  @property({ type: Number }) rowSpan = 1;

  override updated() {
    this.style.gridColumn = `${this.colStart} / span ${this.colSpan}`;
    this.style.gridRow = `${this.rowStart} / span ${this.rowSpan}`;
    // Override absolute positioning — participate in grid instead.
    this.style.position = '';
  }

  override render() {
    return html``;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'galleon-cell-ghost': GalleonCellGhost;
  }
}
