import { describe, it, expect, afterEach } from 'vitest';
import '../../src/galleon-cell';

type GalleonCell = HTMLElement & {
  updateComplete: Promise<boolean>;
  markPositionDirty(): void;
  unsaved: boolean;
  col: number;
  row: number;
  colspan: number;
  rowspan: number;
  name: string;
  cellId: string;
};

function make(attrs: Record<string, string> = {}): GalleonCell {
  const el = document.createElement('galleon-cell') as GalleonCell;
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  document.body.appendChild(el);
  return el;
}

// Drain pending Lit update cycles. Setting @state inside updated() schedules
// an extra cycle that a single await updateComplete doesn't cover.
async function settled(el: GalleonCell) {
  await el.updateComplete;
  if ((el as any).isUpdatePending) {
    await el.updateComplete;
  }
}

function saveButton(el: GalleonCell): HTMLButtonElement {
  return el.shadowRoot!.querySelector('button.btn-save') as HTMLButtonElement;
}

afterEach(() => { document.body.innerHTML = ''; });

describe('dirty state', () => {
  it('starts clean without unsaved attribute', async () => {
    const el = make({ 'cell-id': 'abc' });
    await settled(el);
    expect(saveButton(el).textContent).toBe('⬆');
    expect(saveButton(el).classList.contains('btn-save--dirty')).toBe(false);
  });

  it('starts dirty when unsaved attribute is present', async () => {
    const el = make({ 'cell-id': 'abc', 'unsaved': '' });
    await settled(el);
    expect(saveButton(el).classList.contains('btn-save--dirty')).toBe(true);
    expect(saveButton(el).textContent).toBe('●');
  });

  it('markPositionDirty marks dirty', async () => {
    const el = make({ 'cell-id': 'abc' });
    await settled(el);
    el.markPositionDirty();
    await settled(el);
    expect(saveButton(el).classList.contains('btn-save--dirty')).toBe(true);
  });

  it('save callback with ok=true clears dirty', async () => {
    const el = make({ 'cell-id': 'abc', 'unsaved': '' });
    await settled(el);

    let onResult!: (ok: boolean) => void;
    el.addEventListener('galleon-cell-save', (e) => {
      onResult = (e as CustomEvent).detail.onResult;
    });
    saveButton(el).click();
    await settled(el);

    onResult(true);
    await settled(el);
    expect(saveButton(el).classList.contains('btn-save--dirty')).toBe(false);
  });

  it('save callback with ok=false keeps dirty', async () => {
    const el = make({ 'cell-id': 'abc', 'unsaved': '' });
    await settled(el);

    let onResult!: (ok: boolean) => void;
    el.addEventListener('galleon-cell-save', (e) => {
      onResult = (e as CustomEvent).detail.onResult;
    });
    saveButton(el).click();
    await settled(el);

    onResult(false);
    await settled(el);
    expect(saveButton(el).classList.contains('btn-save--dirty')).toBe(true);
  });
});

describe('galleon-cell-save event', () => {
  it('dispatches with full cell payload', async () => {
    const el = make({
      'cell-id': 'test-id',
      'col': '2',
      'row': '3',
      'colspan': '4',
      'rowspan': '2',
      'name': 'My Cell',
    });
    await settled(el);

    let detail: Record<string, unknown> | null = null;
    el.addEventListener('galleon-cell-save', (e) => {
      detail = (e as CustomEvent).detail;
    });
    saveButton(el).click();

    expect(detail).toMatchObject({
      cellId: 'test-id',
      col: 2,
      row: 3,
      colspan: 4,
      rowspan: 2,
      name: 'My Cell',
    });
    expect(typeof (detail as any).onResult).toBe('function');
  });

  it('shows saving state while in flight', async () => {
    const el = make({ 'cell-id': 'abc', 'unsaved': '' });
    await settled(el);

    el.addEventListener('galleon-cell-save', () => { /* hold */ });
    saveButton(el).click();
    await settled(el);

    expect(saveButton(el).textContent).toBe('…');
  });
});

describe('galleon-cell-delete event', () => {
  it('dispatches with cellId when cellId is set', async () => {
    const el = make({ 'cell-id': 'del-123' });
    await settled(el);

    let detail: Record<string, unknown> | null = null;
    el.addEventListener('galleon-cell-delete', (e) => {
      detail = (e as CustomEvent).detail;
    });

    const removeBtn = el.shadowRoot!.querySelector('button.btn-remove') as HTMLButtonElement;
    removeBtn.click();

    expect(detail).toEqual({ cellId: 'del-123' });
  });

  it('removes itself when cellId is not set', async () => {
    const el = make({}); // no cell-id
    await settled(el);

    const removeBtn = el.shadowRoot!.querySelector('button.btn-remove') as HTMLButtonElement;
    removeBtn.click();

    expect(document.body.contains(el)).toBe(false);
  });
});
