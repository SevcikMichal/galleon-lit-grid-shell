import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('galleon-component')
export class GalleonComponent extends LitElement {
  @property() name = '';

  static styles = css`
    :host {
      display: block;
      padding: 8px 12px;
      border: 1px solid #ccc;
      cursor: grab;
      user-select: none;
    }

    :host(:active) {
      cursor: grabbing;
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    this.draggable = true;
    this.addEventListener('dragstart', this._onDragStart);
  }

  private _onDragStart(e: DragEvent) {
    e.dataTransfer!.setData('galleon/component', this.name);
    e.dataTransfer!.effectAllowed = 'copy';
  }

  render() {
    return html`${this.name}`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'galleon-component': GalleonComponent;
  }
}
