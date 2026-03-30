import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

const baseStyles = css`
  :host {
    display: flex;
    flex-direction: column;
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
  .title { font-size: 12px; font-weight: 600; opacity: 0.8; }
`;

@customElement('demo-chart-widget')
export class DemoChartWidget extends LitElement {
  @property() title = 'Time series';
  @property() color = '#3b82f6';

  static styles = [baseStyles, css`:host { background: #eff6ff; color: #1d4ed8; }`];
  render() { return html`<span class="icon">📊</span><span class="title">${this.title}</span>`; }
}

@customElement('demo-table-widget')
export class DemoTableWidget extends LitElement {
  @property() title = 'Data table';
  @property({ attribute: 'page-size' }) pageSize = '10';

  static styles = [baseStyles, css`:host { background: #f0fdf4; color: #15803d; }`];
  render() { return html`<span class="icon">📋</span><span class="title">${this.title}</span>`; }
}

@customElement('demo-logs-widget')
export class DemoLogsWidget extends LitElement {
  @property() title = 'Log stream';
  @property() filter = '';

  static styles = [baseStyles, css`:host { background: #1e1e21; color: #a0a0b0; font-family: monospace; }`];
  render() { return html`<span class="icon">📜</span><span class="title">${this.title}</span>`; }
}

declare global {
  interface HTMLElementTagNameMap {
    'demo-chart-widget': DemoChartWidget;
    'demo-table-widget': DemoTableWidget;
    'demo-logs-widget': DemoLogsWidget;
  }
}
