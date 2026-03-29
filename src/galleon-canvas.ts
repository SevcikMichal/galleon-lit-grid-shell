import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('galleon-canvas')
export class GalleonCanvas extends LitElement {
  @property({ type: Number }) columns = 12;
  @property({ type: Number }) rows = 8;

  static styles = css`
    :host {
      display: grid;
      width: 100%;
      height: 100%;
      position: relative;
      isolation: isolate;
    }

    #grid {
      position: absolute;
      inset: 0;
      display: grid;
      pointer-events: none;
      z-index: -1;
    }

    .track {
      border: 1px solid #ddd;
    }

    slot {
      display: contents;
    }
  `;

  render() {
    const tracks = Array.from({ length: this.columns * this.rows });
    return html`
      <div id="grid" style="
        grid-template-columns: repeat(${this.columns}, 1fr);
        grid-template-rows: repeat(${this.rows}, 1fr);
      ">
        ${tracks.map(() => html`<div class="track"></div>`)}
      </div>
      <slot></slot>
    `;
  }

  updated() {
    this.style.gridTemplateColumns = `repeat(${this.columns}, 1fr)`;
    this.style.gridTemplateRows = `repeat(${this.rows}, 1fr)`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'galleon-canvas': GalleonCanvas;
  }
}
