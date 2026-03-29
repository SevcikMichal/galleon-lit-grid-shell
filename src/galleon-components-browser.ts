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
        /* inherited through shadow DOM into galleon-component cards */
        --galleon-item-width: clamp(140px, 30vw, 200px);
      }

      /* directly-slotted cards (no polyfea) */
      ::slotted(galleon-component) {
        flex-shrink: 0;
        width: clamp(140px, 30vw, 200px);
      }

      /*
       * polyfea-context renders cards in its shadow with display:contents.
       * Override it to a flex row so its shadow children lay out correctly
       * and the container gets a real box to scroll within.
       */
      ::slotted(polyfea-context) {
        display: flex;
        flex-direction: row;
        flex-shrink: 0;
        align-items: stretch;
        gap: clamp(3px, 1.5cqi, 6px);
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
