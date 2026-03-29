import type { InventoryItem } from '../types/inventory-item.js';

/**
 * Fetch a polyfea static manifest JSON and extract inventory items
 * from the context area named `contextAreaName` (default: "galleon.inventory").
 *
 * Widget authors annotate their contextArea element entries with galleon-specific
 * attributes to describe display metadata and default placement:
 *   - galleon-label       → display name in the inventory sidebar
 *   - galleon-description → subtitle text
 *   - galleon-icon        → URL to a preview icon
 *   - galleon-col-span    → default colSpan when dropped (default: 3)
 *   - galleon-row-span    → default rowSpan when dropped (default: 2)
 */
export async function loadInventoryItems(
  manifestUrl: string,
  contextAreaName = 'galleon.inventory',
): Promise<InventoryItem[]> {
  const resp = await fetch(manifestUrl);
  if (!resp.ok) {
    throw new Error(`Failed to load polyfea manifest from ${manifestUrl}: ${resp.status} ${resp.statusText}`);
  }

  const config: PolyfeaStaticConfig = await resp.json();
  const area = config.contextAreas?.find(a => a.name === contextAreaName);
  if (!area) return [];

  const microfrontends = config.microfrontends ?? {};

  return area.contextArea.elements.map((el): InventoryItem => {
    const attrs = el.attributes ?? {};
    const mfe = microfrontends[el.microfrontend];
    return {
      label: attrs['galleon-label'] ?? el.tagName,
      description: attrs['galleon-description'],
      iconUrl: attrs['galleon-icon'],
      tagName: el.tagName,
      microfrontend: el.microfrontend,
      moduleUrl: mfe?.module,
      defaultColSpan: Number(attrs['galleon-col-span'] ?? 3),
      defaultRowSpan: Number(attrs['galleon-row-span'] ?? 2),
    };
  });
}
