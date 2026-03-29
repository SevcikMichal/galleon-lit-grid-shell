import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';

@customElement('galleon-components-browser')
export class GalleonComponentsBrowser extends LitElement {
  @state() private _open = true;

  private _mq: MediaQueryList | undefined;

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      width: clamp(200px, 22vw, 420px);
      min-width: 0;
      border-left: 1px solid #e2e2e2;
      background: #fafafa;
      overflow-y: auto;
      transition: width 0.2s, height 0.2s;
      box-shadow: -4px 0 16px rgba(0,0,0,0.1);
      container-type: inline-size;
      container-name: browser;
    }

    :host([collapsed]) {
      width: 40px;
      overflow: hidden;
    }

    /* portrait: bottom bar */
    :host([portrait]) {
      width: 100%;
      height: clamp(180px, 35vh, 280px);
      flex-direction: column;
      border-left: none;
      border-top: 1px solid #e2e2e2;
      box-shadow: 0 -4px 16px rgba(0,0,0,0.1);
      overflow-y: hidden;
    }

    :host([portrait][collapsed]) {
      width: 100%;
      height: 40px;
      overflow: hidden;
    }

    :host([portrait]) .list {
      flex-direction: row;
      overflow-x: auto;
      overflow-y: hidden;
      padding: clamp(6px, 2cqi, 10px);
      gap: clamp(6px, 2cqi, 10px);
      align-items: stretch;
    }

    :host([portrait]) ::slotted(*) {
      flex-shrink: 0;
      width: clamp(140px, 30vw, 200px);
    }

    header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 clamp(6px, 3cqi, 12px) 0 clamp(10px, 5cqi, 20px);
      height: clamp(36px, 6cqi, 48px);
      font-size: clamp(10px, 1.4cqi, 12px);
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #888;
      border-bottom: 1px solid #e2e2e2;
      position: sticky;
      top: 0;
      background: #fafafa;
      white-space: nowrap;
      flex-shrink: 0;
    }

    :host([collapsed]) header {
      justify-content: center;
      padding: 0;
    }

    :host([portrait]) header {
      height: 40px;
      font-size: 11px;
      padding: 0 8px 0 16px;
      border-bottom: 1px solid #e2e2e2;
      border-top: none;
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
      padding: clamp(4px, 2cqi, 10px);
      gap: clamp(3px, 1.5cqi, 6px);
      overflow-y: auto;
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    this._mq = window.matchMedia('(orientation: portrait)');
    this._onOrientationChange(this._mq);
    this._mq.addEventListener('change', this._onOrientationChange);
    this._updateVar();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._mq?.removeEventListener('change', this._onOrientationChange);
  }

  private _onOrientationChange = (e: MediaQueryList | MediaQueryListEvent) => {
    this.toggleAttribute('portrait', e.matches);
    this._open = !e.matches;
    this.toggleAttribute('collapsed', e.matches);
    this._updateVar();
  };

  private _toggle() {
    this._open = !this._open;
    this.toggleAttribute('collapsed', !this._open);
    this._updateVar();
  }

  private _updateVar() {
    const portrait = this.hasAttribute('portrait');
    const width = portrait ? '0px' : (this._open ? 'clamp(200px, 22vw, 420px)' : '40px');
    const height = portrait ? (this._open ? 'clamp(180px, 35vh, 280px)' : '40px') : '0px';
    this.dispatchEvent(new CustomEvent('galleon-browser-resize', {
      bubbles: true, composed: true,
      detail: { width, height },
    }));
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
