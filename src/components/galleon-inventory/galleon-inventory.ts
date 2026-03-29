import { LitElement, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { InventoryItem } from '../../types/inventory-item.js';
import { loadInventoryItems } from '../../polyfea/manifest-loader.js';
import { registerModuleUrls } from '../../polyfea/polyfea-bridge.js';
import { inventoryStyles } from './styles.js';
import './galleon-inventory-item.js';

/**
 * Sidebar listing discoverable Web Components sourced from a polyfea manifest.
 * Each item is represented as a draggable galleon-inventory-item card.
 */
@customElement('galleon-inventory')
export class GalleonInventory extends LitElement {
  static override styles = inventoryStyles;

  /** URL to the polyfea static manifest JSON. */
  @property({ type: String, attribute: 'manifest-url' }) manifestUrl = '';

  /** The polyfea context area name to read items from. */
  @property({ type: String, attribute: 'context-area' }) contextArea = 'galleon.inventory';

  @state() private _items: InventoryItem[] = [];
  @state() private _loading = false;
  @state() private _error: string | null = null;
  @state() private _filter = '';

  override connectedCallback(): void {
    super.connectedCallback();
    if (this.manifestUrl) this._load();
  }

  override updated(changed: Map<string, unknown>): void {
    if (changed.has('manifestUrl') && this.manifestUrl) {
      this._load();
    }
  }

  async refresh(): Promise<void> {
    await this._load();
  }

  private async _load(): Promise<void> {
    if (!this.manifestUrl) return;
    this._loading = true;
    this._error = null;
    try {
      const items = await loadInventoryItems(this.manifestUrl, this.contextArea);
      this._items = items;

      const urlMap = new Map<string, string>();
      for (const item of items) {
        if (item.moduleUrl) urlMap.set(item.microfrontend, item.moduleUrl);
      }
      registerModuleUrls(urlMap);
    } catch (err) {
      this._error = String(err);
      console.error('[galleon-inventory]', err);
    } finally {
      this._loading = false;
    }
  }

  private _onFilterInput(e: InputEvent): void {
    this._filter = (e.target as HTMLInputElement).value.toLowerCase();
  }

  private get _filtered(): InventoryItem[] {
    if (!this._filter) return this._items;
    return this._items.filter(
      i =>
        i.label.toLowerCase().includes(this._filter) ||
        i.tagName.toLowerCase().includes(this._filter) ||
        (i.description ?? '').toLowerCase().includes(this._filter),
    );
  }

  override render() {
    return html`
      <div class="inventory-header">Components</div>
      <input
        class="search"
        type="search"
        placeholder="Filter…"
        .value=${this._filter}
        @input=${this._onFilterInput}
        aria-label="Filter components"
      />
      <div class="item-list" role="list">
        ${this._loading
          ? html`<div class="loading">Loading…</div>`
          : this._error
          ? html`<div class="empty">Error: ${this._error}</div>`
          : this._filtered.length === 0
          ? html`<div class="empty">${this._filter ? 'No matches.' : 'No components available.'}</div>`
          : this._filtered.map(
              item => html`
                <galleon-inventory-item
                  .item=${item}
                  role="listitem"
                ></galleon-inventory-item>
              `,
            )}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'galleon-inventory': GalleonInventory;
  }
}
