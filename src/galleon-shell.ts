import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import './galleon-canvas.js';
import './galleon-components-browser.js';
import './galleon-component.js';

@customElement('galleon-shell')
export class GalleonShell extends LitElement {
  @property({ type: Number }) columns = 12;
  @property({ type: Number }) rows = 8;
  @property({ type: Number, attribute: 'portrait-columns' }) portraitColumns = 4;

  static styles = css`
    :host {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      position: relative;
      background: #f0f0f0;
    }

    galleon-canvas {
      flex: 1;
      max-width: calc(100% - var(--browser-width, 0px));
      margin-right: var(--browser-width, 40px);
      margin-bottom: var(--browser-width, 0px);
      max-height: 100%;
      transition: max-width 0.2s;
    }

    galleon-components-browser {
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
      }

      galleon-canvas {
        max-width: 100%;
        max-height: calc(100% - var(--browser-height, 0px));
        margin-bottom: var(--browser-height, 40px);
        margin-right: var(--browser-width, 0px);
        transition: max-height 0.2s;
      }

      galleon-components-browser {
        top: auto;
        bottom: 0;
        left: 0;
        height: auto;
        width: 100%;
      }
    }
  `;

  render() {
    return html`
      <galleon-canvas
        columns=${this.columns}
        rows=${this.rows}
        portrait-columns=${this.portraitColumns}
      ></galleon-canvas>
      <galleon-components-browser>
        <galleon-component name="Chart" description="Visualise time-series or aggregated metrics" colspan="4" rowspan="3"></galleon-component>
        <galleon-component name="Table" description="Browse and filter tabular data" colspan="6" rowspan="4"></galleon-component>
        <galleon-component name="Map" description="Geo-spatial data on an interactive map" colspan="4" rowspan="4"></galleon-component>
        <galleon-component name="Logs" description="Tail and search structured log streams" colspan="12" rowspan="2"></galleon-component>
        <slot name="components"></slot>
      </galleon-components-browser>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'galleon-shell': GalleonShell;
  }
}
