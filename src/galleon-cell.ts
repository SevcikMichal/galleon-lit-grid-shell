import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('galleon-cell')
export class GalleonCell extends LitElement {
  @property({ type: Number }) col = 1;
  @property({ type: Number }) row = 1;
  @property({ type: Number }) colspan = 1;
  @property({ type: Number }) rowspan = 1;
  @property() name = '';

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      background: #fff;
      border-radius: 10px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.06);
      margin: 4px;
      overflow: hidden;
    }

    header {
      display: flex;
      align-items: center;
      padding: 0 8px 0 12px;
      height: 36px;
      flex-shrink: 0;
      border-bottom: 1px solid #f0f0f0;
      cursor: grab;
    }

    header:active {
      cursor: grabbing;
    }

    .title {
      flex: 1;
      text-align: center;
      font-size: 12px;
      font-weight: 600;
      color: #444;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    button {
      all: unset;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 22px;
      height: 22px;
      border-radius: 5px;
      color: #aaa;
      font-size: 14px;
      flex-shrink: 0;
      transition: background 0.1s, color 0.1s;
    }

    button:hover {
      background: #fee2e2;
      color: #ef4444;
    }

    .content {
      flex: 1;
    }
  `;

  private _remove() {
    this.remove();
  }

  private _onDragStart(e: DragEvent) {
    e.dataTransfer!.setData('galleon/cell', JSON.stringify({
      colspan: this.colspan,
      rowspan: this.rowspan,
    }));
    e.dataTransfer!.effectAllowed = 'move';
  }

  render() {
    return html`
      <header draggable="true" @dragstart=${this._onDragStart}>
        <span class="title">${this.name}</span>
        <button @click=${this._remove} title="Remove">✕</button>
      </header>
      <div class="content"><slot></slot></div>
    `;
  }

  updated() {
    this.style.gridColumn = `${this.col} / span ${this.colspan}`;
    this.style.gridRow = `${this.row} / span ${this.rowspan}`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'galleon-cell': GalleonCell;
  }
}
