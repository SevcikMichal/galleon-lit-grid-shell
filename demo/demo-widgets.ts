import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';

const baseStyles = css`
  :host {
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 1;
    min-height: 0;
    font-family: system-ui, sans-serif;
    font-size: 14px;
    font-weight: 500;
    border-radius: 6px;
    gap: 8px;
  }
  .icon { font-size: 28px; }
`;

@customElement('demo-chart-widget')
export class DemoChartWidget extends LitElement {
  static styles = [baseStyles, css`:host { background: #eff6ff; color: #1d4ed8; }`];
  render() { return html`<span class="icon">📊</span> Chart`; }
}

@customElement('demo-table-widget')
export class DemoTableWidget extends LitElement {
  static styles = [baseStyles, css`:host { background: #f0fdf4; color: #15803d; }`];
  render() { return html`<span class="icon">📋</span> Table`; }
}

@customElement('demo-logs-widget')
export class DemoLogsWidget extends LitElement {
  static styles = [baseStyles, css`:host { background: #1e1e21; color: #a0a0b0; font-family: monospace; }`];
  render() { return html`<span class="icon">📜</span> Logs`; }
}

declare global {
  interface HTMLElementTagNameMap {
    'demo-chart-widget': DemoChartWidget;
    'demo-table-widget': DemoTableWidget;
    'demo-logs-widget': DemoLogsWidget;
  }
}
