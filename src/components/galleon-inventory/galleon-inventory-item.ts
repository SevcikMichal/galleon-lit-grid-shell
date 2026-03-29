import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { InventoryItem } from '../../types/inventory-item.js';
import { DRAG_TYPE_INVENTORY } from '../../types/events.js';
import type { DragPayloadInventory } from '../../types/events.js';
import { inventoryItemStyles } from './styles.js';

/**
 * A single draggable card in the inventory sidebar.
 * Sets HTML5 DnD data on dragstart using the galleon-inventory MIME type.
 */
@customElement('galleon-inventory-item')
export class GalleonInventoryItem extends LitElement {
  static override styles = inventoryItemStyles;

  @property({ type: Object }) item!: InventoryItem;

  private _onDragStart(e: DragEvent): void {
    if (!e.dataTransfer || !this.item) return;
    e.dataTransfer.effectAllowed = 'copy';
    const payload: DragPayloadInventory = {
      tagName: this.item.tagName,
      microfrontend: this.item.microfrontend,
      moduleUrl: this.item.moduleUrl,
      defaultColSpan: this.item.defaultColSpan,
      defaultRowSpan: this.item.defaultRowSpan,
    };
    e.dataTransfer.setData(DRAG_TYPE_INVENTORY, JSON.stringify(payload));
  }

  override render() {
    if (!this.item) return html``;
    return html`
      ${this.item.iconUrl
        ? html`<img class="icon" src=${this.item.iconUrl} alt="" aria-hidden="true" />`
        : html`<div class="icon-placeholder" aria-hidden="true">⬡</div>`}
      <div class="text">
        <div class="label">${this.item.label}</div>
        ${this.item.description
          ? html`<div class="desc">${this.item.description}</div>`
          : ''}
      </div>
    `;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.setAttribute('draggable', 'true');
    this.addEventListener('dragstart', this._onDragStart);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener('dragstart', this._onDragStart);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'galleon-inventory-item': GalleonInventoryItem;
  }
}
