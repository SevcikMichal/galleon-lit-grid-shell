import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('galleon-cell')
export class GalleonCell extends LitElement {
  @property({ type: Number }) col = 1;
  @property({ type: Number }) row = 1;
  @property({ type: Number }) colspan = 1;
  @property({ type: Number }) rowspan = 1;

  static styles = css`
    :host {
      display: block;
      border: 1px solid #000;
      background: #fff;
    }
  `;

  render() {
    return html`<slot></slot>`;
  }

  updated() {
    this.style.gridColumn = `${this.col} / span ${this.colspan}`;
    this.style.gridRow = `${this.row} / span ${this.rowspan}`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'galleon-cell': GalleonCell;
  }
}
