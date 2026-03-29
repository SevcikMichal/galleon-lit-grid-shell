import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('galleon-components-browser')
export class GalleonComponentsBrowser extends LitElement {
  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      padding: clamp(4px, 2cqi, 10px);
      gap: clamp(3px, 1.5cqi, 6px);
    }

    @media (orientation: portrait) {
      :host {
        flex-direction: row;
        align-items: stretch;
      }

      ::slotted(*) {
        flex-shrink: 0;
        width: clamp(140px, 30vw, 200px);
      }
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
