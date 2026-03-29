import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { ReactiveControllerHost } from 'lit';
import { GridStore } from '../../src/state/grid-store.js';
import { defaultManifest } from '../../src/types/cell-entry.js';
import { bus } from '../../src/state/event-bus.js';

function makeHost(): ReactiveControllerHost {
  return {
    addController: vi.fn(),
    removeController: vi.fn(),
    requestUpdate: vi.fn(),
    updateComplete: Promise.resolve(true),
  };
}

describe('GridStore', () => {
  let host: ReturnType<typeof makeHost>;
  let store: GridStore;

  beforeEach(() => {
    host = makeHost();
    store = new GridStore(host);
    store.hostConnected();
  });

  afterEach(() => {
    store.hostDisconnected();
    vi.clearAllMocks();
  });

  it('starts with the default manifest', () => {
    expect(store.manifest).toEqual(defaultManifest());
    expect(store.cells).toHaveLength(0);
  });

  describe('addCell', () => {
    it('appends a cell with a generated id', () => {
      const entry = store.addCell({
        tagName: 'x-widget',
        microfrontend: 'mfe',
        colStart: 1, colSpan: 3,
        rowStart: 1, rowSpan: 2,
      });
      expect(entry.id).toBeTruthy();
      expect(store.cells).toHaveLength(1);
      expect(store.cells[0]).toEqual(entry);
    });

    it('calls host.requestUpdate()', () => {
      store.addCell({ tagName: 'x', microfrontend: 'mfe', colStart: 1, colSpan: 1, rowStart: 1, rowSpan: 1 });
      expect(host.requestUpdate).toHaveBeenCalled();
    });

    it('uses immutable updates — original cells array is not mutated', () => {
      const before = store.cells;
      store.addCell({ tagName: 'x', microfrontend: 'mfe', colStart: 1, colSpan: 1, rowStart: 1, rowSpan: 1 });
      expect(store.cells).not.toBe(before);
    });
  });

  describe('updateCell', () => {
    it('replaces only the matching cell', () => {
      const a = store.addCell({ tagName: 'a', microfrontend: 'mfe', colStart: 1, colSpan: 1, rowStart: 1, rowSpan: 1 });
      const b = store.addCell({ tagName: 'b', microfrontend: 'mfe', colStart: 2, colSpan: 1, rowStart: 1, rowSpan: 1 });

      store.updateCell({ ...a, colSpan: 3 });

      expect(store.cells.find(c => c.id === a.id)?.colSpan).toBe(3);
      expect(store.cells.find(c => c.id === b.id)?.tagName).toBe('b');
      expect(store.cells).toHaveLength(2);
    });
  });

  describe('removeCell', () => {
    it('removes the cell with the given id', () => {
      const c = store.addCell({ tagName: 'x', microfrontend: 'mfe', colStart: 1, colSpan: 1, rowStart: 1, rowSpan: 1 });
      store.removeCell(c.id);
      expect(store.cells).toHaveLength(0);
    });

    it('is a no-op for unknown ids', () => {
      store.addCell({ tagName: 'x', microfrontend: 'mfe', colStart: 1, colSpan: 1, rowStart: 1, rowSpan: 1 });
      store.removeCell('does-not-exist');
      expect(store.cells).toHaveLength(1);
    });
  });

  describe('load', () => {
    it('replaces the entire manifest', () => {
      const m = { ...defaultManifest(), columns: 6 };
      store.load(m);
      expect(store.manifest.columns).toBe(6);
      expect(store.cells).toHaveLength(0);
    });
  });

  describe('galleon:grid-changed event (debounced)', () => {
    it('emits the event after mutations', async () => {
      vi.useFakeTimers();
      const spy = vi.fn();
      const off = bus.on('galleon:grid-changed', spy);

      store.addCell({ tagName: 'x', microfrontend: 'mfe', colStart: 1, colSpan: 1, rowStart: 1, rowSpan: 1 });
      store.addCell({ tagName: 'y', microfrontend: 'mfe', colStart: 2, colSpan: 1, rowStart: 1, rowSpan: 1 });

      // Not yet emitted — debounced.
      expect(spy).not.toHaveBeenCalled();

      vi.advanceTimersByTime(250);
      // Should fire exactly once (debounced).
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy.mock.calls[0][0].manifest.cells).toHaveLength(2);

      off();
      vi.useRealTimers();
    });
  });
});
