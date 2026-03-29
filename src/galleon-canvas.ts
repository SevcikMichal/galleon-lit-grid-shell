import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('galleon-canvas')
export class GalleonCanvas extends LitElement {
  static styles = css`
    :host {
      display: grid;
      width: 100%;
      height: 100%;
      outline: 2px dashed #888;
    }
  `;

  render() {
    return html`<slot></slot>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'galleon-canvas': GalleonCanvas;
  }
}
