import { LitElement, html } from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import type { PropertyValues } from 'lit';
import type { CellEntry, GridManifest } from '../../types/cell-entry.js';
import { defaultManifest } from '../../types/cell-entry.js';
import { GridStore } from '../../state/grid-store.js';
import { DragDropController } from '../../controllers/drag-drop-controller.js';
import { clampCell } from '../../utils/grid-math.js';
import { manifestToConfigMapJson } from '../../utils/configmap-serializer.js';
import { viewportStyles } from './styles.js';
import './galleon-cell.js';
import './galleon-cell-ghost.js';

interface GhostState {
  colStart: number;
  rowStart: number;
  colSpan: number;
  rowSpan: number;
}

/**
 * The main grid canvas.
 *
 * Owns GridStore (all cell state). Hosts galleon-cell elements.
 * Handles responsive column adjustment via ResizeObserver.
 * Delegates DnD targeting to DragDropController.
 */
@customElement('galleon-viewport')
export class GalleonViewport extends LitElement {
  static override styles = viewportStyles;

  // ── Public API ──────────────────────────────────────────────────────────────

  /** Full layout manifest. Setting this replaces all cells. */
  @property({ type: Object })
  set manifest(value: GridManifest) {
    this._store.load(value);
  }
  get manifest(): GridManifest {
    return this._store.manifest;
  }

  /** Column count override. Default comes from the manifest (12). */
  @property({ type: Number }) columns = 12;

  /** When true, drag handles, resize handles, and close buttons are shown. */
  @property({ type: Boolean, reflect: true }) editable = false;

  // ── Internal state ──────────────────────────────────────────────────────────

  @state() private _ghost: GhostState | null = null;
  @state() private _dragActive = false;

  @query('.grid-surface') private _surface!: HTMLElement;

  private readonly _store = new GridStore(this);
  private readonly _dnd = new DragDropController(
    this,
    this._store,
    () => this._effectiveColumns,
    () => this._surface ?? null,
    (col, row, colSpan, rowSpan) => {
      this._ghost = { colStart: col, rowStart: row, colSpan, rowSpan };
    },
    () => { this._ghost = null; },
  );

  private _resizeObserver: ResizeObserver | null = null;
  private _effectiveColumns = 12;

  // ── Lifecycle ───────────────────────────────────────────────────────────────

  override connectedCallback(): void {
    super.connectedCallback();
    this._resizeObserver = new ResizeObserver(this._onSizeChange);
  }

  override firstUpdated(): void {
    if (this._surface && this._resizeObserver) {
      this._resizeObserver.observe(this._surface);
    }
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this._resizeObserver?.disconnect();
    this._resizeObserver = null;
  }

  private _onColumnsChanged(changed: PropertyValues): void {
    if (changed.has('columns')) {
      this._effectiveColumns = this.columns;
    }
  }

  // ── Public methods ──────────────────────────────────────────────────────────

  loadManifest(manifest: GridManifest): void {
    this._store.load(manifest);
    this._effectiveColumns = manifest.columns;
    this._applyGridVars();
  }

  exportManifest(): GridManifest {
    return this._store.manifest;
  }

  exportConfigMap(name: string, namespace?: string): string {
    return manifestToConfigMapJson(this._store.manifest, name, namespace);
  }

  addCell(entry: Omit<CellEntry, 'id'>): CellEntry {
    return this._store.addCell(entry);
  }

  removeCell(id: string): void {
    this._store.removeCell(id);
  }

  // ── Private helpers ─────────────────────────────────────────────────────────

  private _applyGridVars(): void {
    const m = this._store.manifest;
    this.style.setProperty('--galleon-columns', String(this._effectiveColumns));
    this.style.setProperty('--galleon-row-height', m.rowHeight);
    this.style.setProperty('--galleon-gap', m.gap);
  }

  private readonly _onSizeChange = ([entry]: ResizeObserverEntry[]): void => {
    const w = entry.contentBoxSize[0].inlineSize;
    const base = this.columns;
    let cols = base;
    if (w < 480) cols = Math.min(4, base);
    else if (w < 768) cols = Math.min(8, base);

    if (cols !== this._effectiveColumns) {
      this._effectiveColumns = cols;
      this._applyGridVars();
    }
  };

  // ── Event handlers ──────────────────────────────────────────────────────────

  private _onCellRemoved(e: CustomEvent<{ id: string }>): void {
    this._store.removeCell(e.detail.id);
  }

  private _onDragEnter(e: DragEvent): void {
    this._dnd.onDragEnter(e);
    this._dragActive = true;
    this.setAttribute('drag-active', '');
  }

  private _onDragOver(e: DragEvent): void {
    this._dnd.onDragOver(e);
  }

  private _onDragLeave(e: DragEvent): void {
    this._dnd.onDragLeave(e);
    if (!this._surface?.contains(e.relatedTarget as Node)) {
      this._dragActive = false;
      this.removeAttribute('drag-active');
    }
  }

  private _onDrop(e: DragEvent): void {
    this._dnd.onDrop(e);
    this._dragActive = false;
    this.removeAttribute('drag-active');
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  override render() {
    const cells = this._store.cells.map(c =>
      clampCell(c, this._effectiveColumns),
    );

    return html`
      <div
        class="grid-surface"
        @dragenter=${this._onDragEnter}
        @dragover=${this._onDragOver}
        @dragleave=${this._onDragLeave}
        @drop=${this._onDrop}
        @galleon:cell-removed=${this._onCellRemoved}
      >
        ${repeat(
          cells,
          c => c.id,
          c => html`
            <galleon-cell
              .entry=${c}
              .store=${this._store}
              ?editable=${this.editable}
            ></galleon-cell>
          `,
        )}
        ${this._ghost ? html`
          <galleon-cell-ghost
            .colStart=${this._ghost.colStart}
            .rowStart=${this._ghost.rowStart}
            .colSpan=${this._ghost.colSpan}
            .rowSpan=${this._ghost.rowSpan}
          ></galleon-cell-ghost>
        ` : ''}
      </div>
    `;
  }

  override updated(changed: PropertyValues): void {
    this._onColumnsChanged(changed);
    this._applyGridVars();
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'galleon-viewport': GalleonViewport;
  }
}
