/**
 * One discoverable component as surfaced in the inventory sidebar.
 * Sourced from the polyfea contextArea named "galleon.inventory".
 */
export interface InventoryItem {
  /** Display label. */
  label: string;
  /** Subtitle or description. */
  description?: string;
  /** URL to a preview thumbnail or icon. */
  iconUrl?: string;
  /** The custom element tag name for this widget. */
  tagName: string;
  /** Polyfea microfrontend identifier. */
  microfrontend: string;
  /** Module URL to load when not using polyfea's defineLazy. */
  moduleUrl?: string;
  /** Default col span when dropped onto the grid. */
  defaultColSpan: number;
  /** Default row span when dropped onto the grid. */
  defaultRowSpan: number;
}
