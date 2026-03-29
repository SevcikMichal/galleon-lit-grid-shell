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
      background: #fff;
      border-radius: 10px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.06);
      margin: 4px;
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
