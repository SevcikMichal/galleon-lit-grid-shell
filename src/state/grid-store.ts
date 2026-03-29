import type { ReactiveController, ReactiveControllerHost } from 'lit';
import type { CellEntry, GridManifest } from '../types/cell-entry.js';
import { defaultManifest } from '../types/cell-entry.js';
import { bus } from './event-bus.js';

/**
 * ReactiveController that owns the authoritative GridManifest.
 * Must be instantiated by galleon-viewport — it is the sole owner.
 *
 * All mutations are immutable (spread-based) so Lit's change-detection
 * catches every update without deep comparison.
 */
export class GridStore implements ReactiveController {
  private _manifest: GridManifest;
  private _debounceTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(private readonly host: ReactiveControllerHost) {
    this._manifest = defaultManifest();
    host.addController(this);
  }

  hostConnected(): void {}
  hostDisconnected(): void {
    if (this._debounceTimer !== null) clearTimeout(this._debounceTimer);
  }

  get manifest(): GridManifest {
    return this._manifest;
  }

  get cells(): CellEntry[] {
    return this._manifest.cells;
  }

  /** Replace the entire manifest (e.g. loaded from ConfigMap). */
  load(manifest: GridManifest): void {
    this._manifest = { ...manifest };
    this.host.requestUpdate();
    this._scheduleChanged();
  }

  addCell(entry: Omit<CellEntry, 'id'>): CellEntry {
    const newCell: CellEntry = { ...entry, id: crypto.randomUUID() };
    this._manifest = {
      ...this._manifest,
      cells: [...this._manifest.cells, newCell],
    };
    this.host.requestUpdate();
    this._scheduleChanged();
    return newCell;
  }

  updateCell(updated: CellEntry): void {
    this._manifest = {
      ...this._manifest,
      cells: this._manifest.cells.map(c => (c.id === updated.id ? updated : c)),
    };
    this.host.requestUpdate();
    this._scheduleChanged();
  }

  removeCell(id: string): void {
    this._manifest = {
      ...this._manifest,
      cells: this._manifest.cells.filter(c => c.id !== id),
    };
    this.host.requestUpdate();
    this._scheduleChanged();
  }

  updateMeta(patch: Partial<Pick<GridManifest, 'columns' | 'rowHeight' | 'gap'>>): void {
    this._manifest = { ...this._manifest, ...patch };
    this.host.requestUpdate();
    this._scheduleChanged();
  }

  private _scheduleChanged(): void {
    if (this._debounceTimer !== null) clearTimeout(this._debounceTimer);
    this._debounceTimer = setTimeout(() => {
      this._debounceTimer = null;
      bus.emit('galleon:grid-changed', { manifest: this._manifest });
    }, 200);
  }
}
