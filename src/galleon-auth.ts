import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';

const API_BASE = (import.meta as { env?: Record<string, string> }).env?.VITE_API_BASE ?? window.location.origin;

@customElement('galleon-auth')
export class GalleonAuth extends LitElement {
  @state() private _loading = false;
  @state() private _error = '';

  static styles = css`
    :host {
      position: fixed;
      inset: 0;
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(0, 0, 0, 0.45);
      backdrop-filter: blur(4px);
      -webkit-backdrop-filter: blur(4px);
    }

    .dialog {
      background: var(--galleon-surface-2, #fff);
      border-radius: 14px;
      box-shadow: 0 8px 40px rgba(0, 0, 0, 0.22);
      padding: 32px 28px 24px;
      width: min(340px, calc(100vw - 32px));
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .title {
      font-size: 16px;
      font-weight: 700;
      color: var(--galleon-text, #333);
      text-align: center;
      margin: 0;
    }

    .subtitle {
      font-size: 12px;
      color: var(--galleon-text-muted, #888);
      text-align: center;
      margin: -8px 0 0;
    }

    label {
      display: flex;
      flex-direction: column;
      gap: 6px;
      font-size: 12px;
      font-weight: 600;
      color: var(--galleon-text-muted, #888);
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }

    input[type="password"] {
      padding: 9px 12px;
      border: 1.5px solid var(--galleon-border, #ccc);
      border-radius: 7px;
      font-size: 14px;
      background: var(--galleon-surface, #fafafa);
      color: var(--galleon-text, #333);
      outline: none;
      transition: border-color 0.15s;
    }

    input[type="password"]:focus {
      border-color: #0284c7;
    }

    .error {
      font-size: 12px;
      color: #dc2626;
      text-align: center;
      min-height: 16px;
    }

    button[type="submit"] {
      all: unset;
      cursor: pointer;
      background: #0284c7;
      color: #fff;
      font-size: 14px;
      font-weight: 600;
      text-align: center;
      padding: 10px;
      border-radius: 8px;
      transition: background 0.15s, opacity 0.15s;
    }

    button[type="submit"]:hover:not(:disabled) {
      background: #0369a1;
    }

    button[type="submit"]:disabled {
      opacity: 0.6;
      cursor: default;
    }
  `;

  private async _submit(e: SubmitEvent) {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const password = (form.elements.namedItem('password') as HTMLInputElement).value;
    this._loading = true;
    this._error = '';
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        const data = await res.json();
        this.dispatchEvent(new CustomEvent('galleon-login', {
          bubbles: true,
          composed: true,
          detail: { token: data.token, expiresAt: data.expiresAt },
        }));
      } else {
        this._error = res.status === 401 ? 'Incorrect password' : 'Login failed — try again';
      }
    } catch {
      this._error = 'Network error — check connection';
    } finally {
      this._loading = false;
    }
  }

  render() {
    return html`
      <div class="dialog" role="dialog" aria-modal="true" aria-labelledby="auth-title">
        <p class="title" id="auth-title">Admin Sign In</p>
        <p class="subtitle">Enter the admin password to enable editing</p>
        <form @submit=${this._submit}>
          <label>
            Password
            <input type="password" name="password" autocomplete="current-password"
              ?disabled=${this._loading} autofocus />
          </label>
          <div class="error">${this._error}</div>
          <button type="submit" ?disabled=${this._loading}>
            ${this._loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'galleon-auth': GalleonAuth;
  }
}
