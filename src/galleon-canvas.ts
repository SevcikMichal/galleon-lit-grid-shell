import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

@customElement('galleon-canvas')
export class GalleonCanvas extends LitElement {
  @property({ type: Number }) columns = 12;
  @property({ type: Number }) rows = 8;
  @property({ type: Number, attribute: 'portrait-columns' }) portraitColumns = 4;

  @state() private _portrait = false;
  @state() private _dragging = false;
  @state() private _hoverCol = -1;
  @state() private _hoverRow = -1;

  private _dragColspan = 1;
  private _dragRowspan = 1;
  private _mq: MediaQueryList | undefined;

  private get _cols() { return this._portrait ? this.portraitColumns : this.columns; }
  private get _rowSize() { return this._portrait ? '25vw' : '1fr'; }

  static styles = css`
    :host {
      display: grid;
      width: 100%;
      position: relative;
      isolation: isolate;
    }

    #grid {
      position: absolute;
      inset: 0;
      display: grid;
      pointer-events: none;
      z-index: -1;
      opacity: 0;
      transition: opacity 0.15s;
    }

    :host([dragging]) #grid {
      opacity: 1;
    }

    .track {
      margin: 4px;
      border-radius: 8px;
      border: 1.5px dashed rgba(0,0,0,0.1);
      transition: background 0.12s, border-color 0.12s;
    }

    .track.will-fill {
      background: rgba(59, 130, 246, 0.1);
      border: 1.5px solid rgba(59, 130, 246, 0.35);
    }

    slot {
      display: contents;
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    this.addEventListener('dragover', this._onDragOver);
    this.addEventListener('dragleave', this._onDragLeave);
    this.addEventListener('drop', this._onDrop);
    this._mq = window.matchMedia('(orientation: portrait)');
    this._mq.addEventListener('change', this._onOrientationChange);
    this._onOrientationChange(this._mq);
    document.addEventListener('dragstart', this._onDocDragStart);
    document.addEventListener('dragend', this._onDocDragEnd);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._mq?.removeEventListener('change', this._onOrientationChange);
    document.removeEventListener('dragstart', this._onDocDragStart);
    document.removeEventListener('dragend', this._onDocDragEnd);
  }

  private _onOrientationChange = (e: MediaQueryList | MediaQueryListEvent) => {
    this._portrait = e.matches;
  };

  private _onDocDragStart = (e: DragEvent) => {
    const raw = e.dataTransfer?.getData('galleon/component');
    if (!raw) return;
    const { colspan, rowspan } = JSON.parse(raw);
    this._dragColspan = colspan;
    this._dragRowspan = rowspan;
    this._dragging = true;
    this.toggleAttribute('dragging', true);
  };

  private _onDocDragEnd = () => {
    this._dragging = false;
    this._hoverCol = -1;
    this._hoverRow = -1;
    this.toggleAttribute('dragging', false);
  };

  private _applyGridStyles() {
    this.style.gridTemplateColumns = `repeat(${this._cols}, 1fr)`;
    this.style.gridTemplateRows = `repeat(${this.rows}, ${this._rowSize})`;
    if (this._portrait) {
      this.style.aspectRatio = '';
      this.style.maxHeight = '';
      this.style.height = 'auto';
      this.style.minHeight = '100%';
    } else {
      this.style.aspectRatio = `${this.columns} / ${this.rows}`;
      this.style.maxHeight = '100%';
      this.style.height = '';
      this.style.minHeight = '';
    }
  }

  private _onDragOver(e: DragEvent) {
    if (!e.dataTransfer!.types.includes('galleon/component')) return;
    e.preventDefault();
    e.dataTransfer!.dropEffect = 'copy';
    const rect = this.getBoundingClientRect();
    this._hoverCol = Math.floor((e.clientX - rect.left) / (rect.width / this._cols)) + 1;
    this._hoverRow = Math.floor((e.clientY - rect.top) / (rect.height / this.rows)) + 1;
  }

  private _onDragLeave(e: DragEvent) {
    if (!this.contains(e.relatedTarget as Node)) {
      this._hoverCol = -1;
      this._hoverRow = -1;
    }
  }

  private _onDrop(e: DragEvent) {
    const raw = e.dataTransfer!.getData('galleon/component');
    if (!raw) return;
    e.preventDefault();

    const { name, colspan, rowspan } = JSON.parse(raw);
    const rect = this.getBoundingClientRect();
    const col = Math.floor((e.clientX - rect.left) / (rect.width / this._cols)) + 1;
    const row = Math.floor((e.clientY - rect.top) / (rect.height / this.rows)) + 1;

    const cell = document.createElement('galleon-cell');
    cell.setAttribute('col', String(col));
    cell.setAttribute('row', String(row));
    cell.setAttribute('colspan', String(colspan));
    cell.setAttribute('rowspan', String(rowspan));
    cell.setAttribute('name', name);
    this.appendChild(cell);
  }

  private _willFill(trackIndex: number) {
    if (this._hoverCol < 1 || this._hoverRow < 1) return false;
    const col = (trackIndex % this._cols) + 1;
    const row = Math.floor(trackIndex / this._cols) + 1;
    return col >= this._hoverCol && col < this._hoverCol + this._dragColspan
        && row >= this._hoverRow && row < this._hoverRow + this._dragRowspan;
  }

  render() {
    const tracks = Array.from({ length: this._cols * this.rows });
    return html`
      <div id="grid" style="
        grid-template-columns: repeat(${this._cols}, 1fr);
        grid-template-rows: repeat(${this.rows}, ${this._rowSize});
      ">
        ${tracks.map((_, i) => html`
          <div class="track ${this._willFill(i) ? 'will-fill' : ''}"></div>
        `)}
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
