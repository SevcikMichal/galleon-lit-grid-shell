import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';

@customElement('galleon-components-browser')
export class GalleonComponentsBrowser extends LitElement {
  @state() private _open = true;

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      width: 400px;
      min-width: 260px;
      border-left: 1px solid #e2e2e2;
      background: #fafafa;
      overflow-y: auto;
      transition: width 0.2s, min-width 0.2s;
      box-shadow: -4px 0 16px rgba(0,0,0,0.1);
    }

    :host([collapsed]) {
      width: 40px;
      min-width: 40px;
      overflow: hidden;
    }

    header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 8px 0 16px;
      height: 40px;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #888;
      border-bottom: 1px solid #e2e2e2;
      position: sticky;
      top: 0;
      background: #fafafa;
      white-space: nowrap;
    }

    :host([collapsed]) header {
      justify-content: center;
      padding: 0;
    }

    button {
      all: unset;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 6px;
      border-radius: 4px;
      flex-shrink: 0;
    }

    button:hover {
      background: #eee;
    }

    button span {
      display: block;
      width: 16px;
      height: 2px;
      background: #888;
      border-radius: 1px;
    }

    .list {
      display: flex;
      flex-direction: column;
      padding: 8px;
      gap: 4px;
    }
  `;

  private _toggle() {
    this._open = !this._open;
    this.toggleAttribute('collapsed', !this._open);
  }

  render() {
    return html`
      <header>
        ${this._open ? html`<span>Components list</span>` : ''}
        <button @click=${this._toggle} title=${this._open ? 'Hide' : 'Show'}>
          <span></span><span></span><span></span>
        </button>
      </header>
      ${this._open ? html`<div class="list"><slot></slot></div>` : ''}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'galleon-components-browser': GalleonComponentsBrowser;
  }
}
