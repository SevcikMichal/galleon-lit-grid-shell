import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('galleon-components-browser')
export class GalleonComponentsBrowser extends LitElement {
  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      width: 260px;
      min-width: 260px;
      border-left: 1px solid #e2e2e2;
      background: #fafafa;
      overflow-y: auto;
    }

    header {
      padding: 12px 16px;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #888;
      border-bottom: 1px solid #e2e2e2;
      position: sticky;
      top: 0;
      background: #fafafa;
    }

    .list {
      display: flex;
      flex-direction: column;
      padding: 8px;
      gap: 4px;
    }
  `;

  render() {
    return html`
      <header>Components</header>
      <div class="list"><slot></slot></div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'galleon-components-browser': GalleonComponentsBrowser;
  }
}
