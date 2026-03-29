import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('galleon-canvas')
export class GalleonCanvas extends LitElement {
  @property({ type: Number }) columns = 12;
  @property({ type: Number }) rows = 8;

  private _ro: ResizeObserver | undefined;

  static styles = css`
    :host {
      display: grid;
      width: 100%;
      max-width: 100%;
      max-height: 100%;
      position: relative;
      isolation: isolate;
    }

    #grid {
      position: absolute;
      inset: 0;
      display: grid;
      pointer-events: none;
      z-index: -1;
    }

    .track {
      border: 1px solid #ddd;
    }

    slot {
      display: contents;
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    this.addEventListener('dragover', this._onDragOver);
    this.addEventListener('drop', this._onDrop);
    this._ro = new ResizeObserver(() => this._applyGridStyles());
    this._ro.observe(this);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._ro?.disconnect();
  }

  private _applyGridStyles() {
    this.style.gridTemplateColumns = `repeat(${this.columns}, 1fr)`;
    this.style.gridTemplateRows = `repeat(${this.rows}, 1fr)`;
    const portrait = this.offsetHeight > this.offsetWidth;
    this.style.aspectRatio = portrait ? '' : `${this.columns} / ${this.rows}`;
    this.style.height = portrait ? '100%' : '';
  }

  private _onDragOver(e: DragEvent) {
    if (!e.dataTransfer!.types.includes('galleon/component')) return;
    e.preventDefault();
    e.dataTransfer!.dropEffect = 'copy';
  }

  private _onDrop(e: DragEvent) {
    const raw = e.dataTransfer!.getData('galleon/component');
    if (!raw) return;
    e.preventDefault();

    const { name, colspan, rowspan } = JSON.parse(raw);
    const rect = this.getBoundingClientRect();
    const col = Math.floor((e.clientX - rect.left) / (rect.width / this.columns)) + 1;
    const row = Math.floor((e.clientY - rect.top) / (rect.height / this.rows)) + 1;

    const cell = document.createElement('galleon-cell');
    cell.setAttribute('col', String(col));
    cell.setAttribute('row', String(row));
    cell.setAttribute('colspan', String(colspan));
    cell.setAttribute('rowspan', String(rowspan));
    cell.textContent = name;
    this.appendChild(cell);
  }

  render() {
    const tracks = Array.from({ length: this.columns * this.rows });
    return html`
      <div id="grid" style="
        grid-template-columns: repeat(${this.columns}, 1fr);
        grid-template-rows: repeat(${this.rows}, 1fr);
      ">
        ${tracks.map(() => html`<div class="track"></div>`)}
      </div>
      <slot></slot>
    `;
  }

  updated() {
    this._applyGridStyles();
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'galleon-canvas': GalleonCanvas;
  }
}
