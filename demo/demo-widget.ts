import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

/**
 * Minimal demo widget for the dev harness.
 * Demonstrates that shadow DOM isolation is working:
 * galleon styles must not leak in here.
 */
@customElement('demo-chart-widget')
export class DemoChartWidget extends LitElement {
  static override styles = css`
    :host {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      background: linear-gradient(135deg, #1e3a5f 0%, #0f2044 100%);
      color: #93c5fd;
      font-family: system-ui, sans-serif;
      padding: 12px;
      box-sizing: border-box;
    }
    .title {
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      opacity: 0.7;
      margin-bottom: 8px;
    }
    .value {
      font-size: 32px;
      font-weight: 700;
      line-height: 1;
    }
    .bar-chart {
      display: flex;
      align-items: flex-end;
      gap: 4px;
      height: 48px;
      margin-top: 12px;
    }
    .bar {
      width: 10px;
      border-radius: 2px 2px 0 0;
      background: #3b82f6;
      opacity: 0.8;
    }
  `;

  @property({ type: String }) label = 'Metric';
  @property({ type: Number }) value = 42;

  private static _heights = [30, 50, 20, 80, 60, 40, 70, 45, 55, 35];

  override render() {
    return html`
      <div class="title">${this.label}</div>
      <div class="value">${this.value}</div>
      <div class="bar-chart">
        ${DemoChartWidget._heights.map(
          h => html`<div class="bar" style="height: ${h}%"></div>`,
        )}
      </div>
    `;
  }
}

@customElement('demo-status-widget')
export class DemoStatusWidget extends LitElement {
  static override styles = css`
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
      padding: 12px;
      box-sizing: border-box;
      font-family: system-ui, sans-serif;
      background: #0f172a;
      color: #e2e8f0;
    }
    .title {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #64748b;
      margin-bottom: 10px;
    }
    .row {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 5px 0;
      font-size: 13px;
      border-bottom: 1px solid #1e293b;
    }
    .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      flex-shrink: 0;
    }
    .dot.ok { background: #22c55e; }
    .dot.warn { background: #f59e0b; }
    .dot.err { background: #ef4444; }
    .name { flex: 1; }
    .badge {
      font-size: 11px;
      padding: 1px 6px;
      border-radius: 10px;
      background: #1e293b;
      color: #94a3b8;
    }
  `;

  private static _services = [
    { name: 'api-server', status: 'ok', version: 'v1.29' },
    { name: 'etcd', status: 'ok', version: 'v3.5.9' },
    { name: 'scheduler', status: 'warn', version: 'v1.29' },
    { name: 'controller-mgr', status: 'ok', version: 'v1.29' },
  ];

  override render() {
    return html`
      <div class="title">Cluster Status</div>
      ${DemoStatusWidget._services.map(
        s => html`
          <div class="row">
            <div class="dot ${s.status}"></div>
            <span class="name">${s.name}</span>
            <span class="badge">${s.version}</span>
          </div>
        `,
      )}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'demo-chart-widget': DemoChartWidget;
    'demo-status-widget': DemoStatusWidget;
  }
}
