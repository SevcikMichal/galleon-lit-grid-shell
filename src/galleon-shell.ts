import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import './galleon-canvas.js';
import './galleon-sidebar.js';
import './galleon-components-browser.js';
import './galleon-component.js';

const API_BASE = (import.meta as { env?: Record<string, string> }).env?.VITE_API_BASE ?? window.location.origin;

@customElement('galleon-shell')
export class GalleonShell extends LitElement {
  @property({ type: Number }) columns = 12;
  @property({ type: Number }) rows = 8;
  @property({ type: Number, attribute: 'portrait-columns' }) portraitColumns = 4;
  @property({ attribute: 'mf-name' }) mfName = '';
  @property({ attribute: 'mf-namespace' }) mfNamespace = '';

  static styles = css`
    :host {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      position: relative;
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
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener('galleon-cell-save', this._onCellSave as EventListener);
  }

  private _onCellSave = async (e: Event) => {
    const cell = e.composedPath()[0] as HTMLElement;
    const detail = (e as CustomEvent).detail;
    const res = await fetch(`${API_BASE}/api/cells`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(detail),
    });
    if (res.ok) {
      // Only remove the cell if it is a manually-dropped element (direct child
      // of the canvas). Polyfea-managed cells have a polyfea-context in their
      // composed path — removing those would cause a visible gap until the
      // next polyfea reconcile.
      const isManagedByPolyfea = e.composedPath().some(
        el => (el as Element).tagName?.toLowerCase() === 'polyfea-context'
      );
      if (!isManagedByPolyfea) {
        cell.remove();
      }
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
      >
        <polyfea-context name="galleon-canvas"></polyfea-context>
      </galleon-canvas>
      <galleon-sidebar @galleon-sidebar-resize=${this._onSidebarResize}>
        <galleon-components-browser>
          <polyfea-context name="galleon-components">
          </polyfea-context>
        </galleon-components-browser>
      </galleon-sidebar>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'galleon-shell': GalleonShell;
  }
}
