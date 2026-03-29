import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('galleon-components-browser')
export class GalleonComponentsBrowser extends LitElement {
  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      width: 200px;
      border-left: 1px solid #000;
      padding: 12px;
      gap: 8px;
    }
  `;

  render() {
    return html`<slot></slot>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'galleon-components-browser': GalleonComponentsBrowser;
  }
}
