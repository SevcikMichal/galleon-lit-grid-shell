import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import './galleon-canvas.js';
import './galleon-sidebar.js';
import './galleon-components-browser.js';
import './galleon-component.js';
import './galleon-auth.js';

const API_BASE = (import.meta as { env?: Record<string, string> }).env?.VITE_API_BASE ?? window.location.origin;
const TOKEN_KEY = 'galleon-admin-token';

type Toast = { id: number; message: string; ok: boolean };

@customElement('galleon-shell')
export class GalleonShell extends LitElement {
  @property({ type: Number }) columns = 12;
  @property({ type: Number }) rows = 8;
  @property({ type: Number, attribute: 'portrait-columns' }) portraitColumns = 4;
  @property({ attribute: 'mf-name' }) mfName = '';
  @property({ attribute: 'mf-namespace' }) mfNamespace = '';

  @state() private _toasts: Toast[] = [];
  @state() private _isAdmin = false;
  @state() private _showLogin = false;
  private _toastSeq = 0;

  static styles = css`
    :host {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100dvw;
      height: 100dvh;
      position: fixed;
      top: 0;
      left: 0;
      background: var(--galleon-bg, #f0f0f0);
      transition: background 0.2s;
    }

    galleon-canvas {
      flex: 1;
      max-width: calc(100% - var(--sidebar-width, 0px));
      margin-right: var(--sidebar-width, 40px);
      max-height: 100%;
      transition: max-width 0.2s, margin-right 0.2s;
    }

    galleon-sidebar {
      position: absolute;
      top: 0;
      right: 0;
      height: 100%;
      z-index: 10;
    }

    .toasts {
      position: absolute;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      flex-direction: column;
      gap: 8px;
      align-items: center;
      pointer-events: none;
      z-index: 100;
    }

    .toast {
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 500;
      color: #fff;
      box-shadow: 0 2px 8px rgba(0,0,0,0.18);
      animation: toast-in 0.15s ease;
    }

    .toast--ok  { background: #16a34a; }
    .toast--err { background: #dc2626; }

    @keyframes toast-in {
      from { opacity: 0; transform: translateY(8px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    @media (orientation: portrait) {
      :host {
        align-items: flex-start;
        overflow-y: auto;
        padding-bottom: var(--sidebar-height, 40px);
      }

      galleon-canvas {
        max-width: 100%;
        max-height: 100%;
        margin-right: 0;
        transition: max-height 0.2s;
      }

      galleon-sidebar {
        position: fixed;
        top: auto;
        right: 0;
        bottom: 0;
        left: 0;
        height: auto;
        width: 100%;
      }
    }
  `;

  override connectedCallback() {
    super.connectedCallback();
    this.addEventListener('galleon-cell-save', this._onCellSave as EventListener);
    this.addEventListener('galleon-cell-delete', this._onCellDelete as EventListener);
    this.addEventListener('galleon-login', this._onLogin as EventListener);
    this.addEventListener('galleon-logout', this._onLogout as EventListener);
    this.addEventListener('galleon-login-request', this._onLoginRequest as EventListener);
    this.addEventListener('galleon-auth-close', this._onAuthClose as EventListener);
    document.addEventListener('visibilitychange', this._onVisibilityChange);
    this._checkAuth();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener('galleon-cell-save', this._onCellSave as EventListener);
    this.removeEventListener('galleon-cell-delete', this._onCellDelete as EventListener);
    this.removeEventListener('galleon-login', this._onLogin as EventListener);
    this.removeEventListener('galleon-logout', this._onLogout as EventListener);
    this.removeEventListener('galleon-login-request', this._onLoginRequest as EventListener);
    this.removeEventListener('galleon-auth-close', this._onAuthClose as EventListener);
    document.removeEventListener('visibilitychange', this._onVisibilityChange);
  }

  private async _checkAuth() {
    const token = sessionStorage.getItem(TOKEN_KEY);
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/auth/check`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        this._isAdmin = true;
      } else {
        sessionStorage.removeItem(TOKEN_KEY);
        this._isAdmin = false;
      }
    } catch {
      // Network error: keep cached token; stay in current state.
    }
  }

  private _onVisibilityChange = () => {
    if (document.visibilityState === 'visible' && this._isAdmin) {
      this._checkAuth();
    }
  };

  private _onLogin = (e: Event) => {
    const { token } = (e as CustomEvent).detail;
    if (token) sessionStorage.setItem(TOKEN_KEY, token);
    this._isAdmin = true;
    this._showLogin = false;
  };

  private _onLogout = () => {
    sessionStorage.removeItem(TOKEN_KEY);
    this._isAdmin = false;
  };

  private _onLoginRequest = () => {
    this._showLogin = true;
  };

  private _onAuthClose = () => {
    this._showLogin = false;
  };

  private _authHeader(): HeadersInit {
    const token = sessionStorage.getItem(TOKEN_KEY);
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }

  private _handleUnauthorized() {
    sessionStorage.removeItem(TOKEN_KEY);
    this._isAdmin = false;
    this._showToast('Session expired — please sign in again', false);
  }

  private _showToast(message: string, ok: boolean) {
    const id = ++this._toastSeq;
    this._toasts = [...this._toasts, { id, message, ok }];
    setTimeout(() => {
      this._toasts = this._toasts.filter(t => t.id !== id);
    }, 3000);
  }

  private _onCellSave = async (e: Event) => {
    const detail = (e as CustomEvent).detail;
    const { onResult, ...payload } = detail;
    const res = await fetch(`${API_BASE}/api/cells`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...this._authHeader() },
      body: JSON.stringify(payload),
    });
    if (res.status === 401) this._handleUnauthorized();
    onResult?.(res.ok);
  };

  private _onCellDelete = async (e: Event) => {
    const { cellId } = (e as CustomEvent).detail;
    const cell = e.composedPath().find(
      el => (el as Element).tagName?.toLowerCase() === 'galleon-cell'
    ) as HTMLElement | undefined;
    const res = await fetch(`${API_BASE}/api/cells/${encodeURIComponent(cellId)}`, {
      method: 'DELETE',
      headers: this._authHeader(),
    });
    if (res.status === 401) {
      this._handleUnauthorized();
      return;
    }
    if (res.ok) {
      cell?.remove();
      this._showToast('Cell deleted', true);
    } else {
      this._showToast('Delete failed', false);
    }
  };

  private _onSidebarResize(e: CustomEvent<{ width: string; height: string }>) {
    this.style.setProperty('--sidebar-width', e.detail.width);
    this.style.setProperty('--sidebar-height', e.detail.height);
  }

  render() {
    return html`
      <galleon-canvas
        columns=${this.columns}
        rows=${this.rows}
        portrait-columns=${this.portraitColumns}
        mf-name=${this.mfName}
        mf-namespace=${this.mfNamespace}
        ?admin=${this._isAdmin}
      >
        <polyfea-context name="galleon-canvas"></polyfea-context>
      </galleon-canvas>
      <galleon-sidebar
        ?admin=${this._isAdmin}
        @galleon-sidebar-resize=${this._onSidebarResize}
      >
        <galleon-components-browser>
          <polyfea-context name="galleon-components">
          </polyfea-context>
        </galleon-components-browser>
      </galleon-sidebar>
      ${this._showLogin ? html`<galleon-auth></galleon-auth>` : ''}
      <div class="toasts">
        ${this._toasts.map(t => html`
          <div class="toast ${t.ok ? 'toast--ok' : 'toast--err'}">${t.message}</div>
        `)}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'galleon-shell': GalleonShell;
  }
}
