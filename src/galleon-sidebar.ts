import { LitElement, html, css, svg } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

const THEME_STYLE_ID = 'galleon-theme-vars';

function injectThemeVars() {
  if (document.getElementById(THEME_STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = THEME_STYLE_ID;
  style.textContent = `
    :root {
      --galleon-bg: rgb(240, 240, 240);
      --galleon-surface: #fafafa;
      --galleon-surface-2: #fff;
      --galleon-border: #b7b7b7;
      --galleon-text: #333;
      --galleon-text-muted: #888;
      --galleon-hover: #eee;
      --galleon-shadow: rgba(0,0,0,0.1);
    }
    :root[dark] {
      --galleon-bg: #161618;
      --galleon-surface: #1e1e21;
      --galleon-surface-2: #28282c;
      --galleon-border: #38383d;
      --galleon-text: #e0e0e0;
      --galleon-text-muted: #777;
      --galleon-hover: #2e2e33;
      --galleon-shadow: rgba(0,0,0,0.4);
    }
  `;
  document.head.appendChild(style);
}

const moonIcon = svg`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
const sunIcon = svg`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`;
const lockIcon = svg`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`;
const unlockIcon = svg`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>`;

@customElement('galleon-sidebar')
export class GalleonSidebar extends LitElement {
  @property({ type: Boolean }) admin = false;
  @state() private _open = true;
  @state() private _dark = false;

  private _mq: MediaQueryList | undefined;

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      width: clamp(200px, 22vw, 420px);
      min-width: 0;
      border-left: 1px solid var(--galleon-border, #e2e2e2);
      background: var(--galleon-surface, #fafafa);
      transition: width 0.2s, height 0.2s, background 0.2s, border-color 0.2s;
      box-shadow: -4px 0 16px var(--galleon-shadow, rgba(0,0,0,0.1));
      container-type: inline-size;
    }

    :host([collapsed]) {
      width: 40px;
      overflow: hidden;
    }

    :host([portrait]) {
      width: 100%;
      height: clamp(180px, 35vh, 280px);
      border-left: none;
      border-top: 1px solid var(--galleon-border, #e2e2e2);
      box-shadow: 0 -4px 16px var(--galleon-shadow, rgba(0,0,0,0.1));
      overflow: hidden;
    }

    :host([portrait][collapsed]) {
      height: 40px;
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
      color: var(--galleon-text-muted, #888);
      border-bottom: 1px solid var(--galleon-border, #e2e2e2);
      background: var(--galleon-surface, #fafafa);
      white-space: nowrap;
      flex-shrink: 0;
      transition: background 0.2s, border-color 0.2s;
    }

    :host([collapsed]) header {
      justify-content: center;
      padding: 0;
    }

    :host([portrait]) header {
      height: 40px;
      font-size: 11px;
      padding: 0 8px 0 16px;
    }

    .content {
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;
      min-height: 0;
    }

    :host([portrait]) .content {
      overflow-y: hidden;
      overflow-x: auto;
    }

    footer {
      border-top: 1px solid var(--galleon-border, #e2e2e2);
      padding: 6px;
      display: flex;
      flex-direction: column;
      gap: 2px;
      flex-shrink: 0;
      transition: border-color 0.2s;
    }

    :host([portrait]) footer {
      display: none;
    }

    .hamburger {
      all: unset;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 6px;
      border-radius: 4px;
      flex-shrink: 0;
    }

    .hamburger:hover {
      background: var(--galleon-hover, #eee);
    }

    .hamburger span {
      display: block;
      width: 16px;
      height: 2px;
      background: var(--galleon-text-muted, #888);
      border-radius: 1px;
    }

    .icon-btn {
      all: unset;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 8px;
      border-radius: 6px;
      color: var(--galleon-text-muted, #888);
      font-size: 12px;
      white-space: nowrap;
      overflow: hidden;
      transition: background 0.1s, color 0.1s;
    }

    .icon-btn:hover {
      background: var(--galleon-hover, #eee);
      color: var(--galleon-text, #333);
    }

    .icon-btn svg {
      flex-shrink: 0;
      width: 15px;
      height: 15px;
    }
  `;

  private _themeMq: MediaQueryList | undefined;

  connectedCallback() {
    super.connectedCallback();
    injectThemeVars();
    this._applyStoredTheme();
    this._mq = window.matchMedia('(orientation: portrait)');
    this._onOrientationChange(this._mq);
    this._mq.addEventListener('change', this._onOrientationChange);
    this._themeMq = window.matchMedia('(prefers-color-scheme: dark)');
    this._themeMq.addEventListener('change', this._onSystemThemeChange);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._mq?.removeEventListener('change', this._onOrientationChange);
    this._themeMq?.removeEventListener('change', this._onSystemThemeChange);
  }

  private _applyStoredTheme() {
    const stored = localStorage.getItem('theme');
    const dark = stored === 'dark' || (stored === null && window.matchMedia('(prefers-color-scheme: dark)').matches);
    this._applyTheme(dark);
  }

  private _applyTheme(dark: boolean) {
    this._dark = dark;
    document.documentElement.toggleAttribute('dark', dark);
  }

  private _onSystemThemeChange = (e: MediaQueryListEvent) => {
    // Only follow system if the user hasn't made an explicit choice
    if (localStorage.getItem('theme') === null) {
      this._applyTheme(e.matches);
    }
  };

  private _onOrientationChange = (e: MediaQueryList | MediaQueryListEvent) => {
    this.toggleAttribute('portrait', e.matches);
    this._open = !e.matches;
    this.toggleAttribute('collapsed', e.matches);
    this._dispatchResize();
  };

  private _toggle() {
    this._open = !this._open;
    this.toggleAttribute('collapsed', !this._open);
    this._dispatchResize();
  }

  private _toggleTheme() {
    const dark = !this._dark;
    localStorage.setItem('theme', dark ? 'dark' : 'light');
    this._applyTheme(dark);
  }

  private _dispatchResize() {
    const portrait = this.hasAttribute('portrait');
    const width = portrait ? '0px' : (this._open ? 'clamp(200px, 22vw, 420px)' : '40px');
    const height = portrait ? (this._open ? 'clamp(180px, 35vh, 280px)' : '40px') : '0px';
    this.dispatchEvent(new CustomEvent('galleon-sidebar-resize', {
      bubbles: true, composed: true,
      detail: { width, height },
    }));
  }

  private _onAuthClick() {
    if (this.admin) {
      this.dispatchEvent(new CustomEvent('galleon-logout', { bubbles: true, composed: true }));
    } else {
      this.dispatchEvent(new CustomEvent('galleon-login-request', { bubbles: true, composed: true }));
    }
  }

  render() {
    return html`
      <header>
        ${this._open && this.admin ? html`<span>Components</span>` : ''}
        <button class="hamburger" @click=${this._toggle} title=${this._open ? 'Hide' : 'Show'}>
          <span></span><span></span><span></span>
        </button>
      </header>
      ${this._open && this.admin ? html`<div class="content"><slot></slot></div>` : ''}
      <footer>
        <button class="icon-btn" @click=${this._toggleTheme} title="Toggle theme">
          ${this._dark ? sunIcon : moonIcon}
          ${this._open ? (this._dark ? 'Light mode' : 'Dark mode') : ''}
        </button>
        <button class="icon-btn" @click=${this._onAuthClick}
          title=${this.admin ? 'Sign out' : 'Admin sign in'}>
          ${this.admin ? unlockIcon : lockIcon}
          ${this._open ? (this.admin ? 'Sign out' : 'Sign in') : ''}
        </button>
      </footer>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'galleon-sidebar': GalleonSidebar;
  }
}
