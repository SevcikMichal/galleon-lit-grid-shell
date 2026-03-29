import { css } from 'lit';

export const viewportStyles = css`
  :host {
    display: block;
    overflow: auto;
    background: var(--galleon-viewport-bg, #0f172a);
    min-height: 200px;

    /* Layout tokens — overridden via this.style.setProperty() */
    --galleon-columns: 12;
    --galleon-row-height: minmax(80px, auto);
    --galleon-gap: 8px;
  }

  .grid-surface {
    display: grid;
    grid-template-columns: repeat(var(--galleon-columns), 1fr);
    grid-auto-rows: var(--galleon-row-height);
    gap: var(--galleon-gap);
    padding: var(--galleon-gap);
    position: relative;
    min-height: 100%;
  }

  /* Drop-active highlight */
  :host([drag-active]) .grid-surface {
    outline: 2px dashed var(--galleon-accent, #3b82f6);
    outline-offset: -2px;
    border-radius: 4px;
  }
`;

export const cellStyles = css`
  :host {
    display: flex;
    flex-direction: column;
    position: relative;
    background: var(--galleon-cell-bg, #1e293b);
    border: 1px solid var(--galleon-cell-border, #334155);
    border-radius: 6px;
    overflow: hidden;
    min-width: 0;
    min-height: 0;
    box-shadow: 0 1px 3px rgba(0,0,0,0.3);
    transition: box-shadow 120ms ease;
  }

  :host(:focus-within) {
    box-shadow: 0 0 0 2px var(--galleon-accent, #3b82f6);
  }

  .cell-header {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 8px;
    background: var(--galleon-cell-header-bg, #0f172a);
    border-bottom: 1px solid var(--galleon-cell-border, #334155);
    flex-shrink: 0;
    height: 32px;
    user-select: none;
  }

  :host([editable]) .cell-header {
    cursor: grab;
  }

  :host([editable]) .cell-header:active {
    cursor: grabbing;
  }

  .cell-tag {
    font-size: 11px;
    color: var(--galleon-cell-tag-color, #64748b);
    font-family: monospace;
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .btn-close {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    border: none;
    background: transparent;
    color: var(--galleon-cell-tag-color, #64748b);
    border-radius: 3px;
    cursor: pointer;
    padding: 0;
    font-size: 14px;
    line-height: 1;
    flex-shrink: 0;
  }

  .btn-close:hover {
    background: rgba(239,68,68,0.15);
    color: #ef4444;
  }

  /* Hide header in read-only mode */
  :host(:not([editable])) .cell-header {
    display: none;
  }

  .widget-host {
    flex: 1;
    overflow: auto;
    min-height: 0;
  }

  .widget-host > * {
    display: block;
    width: 100%;
    height: 100%;
  }
`;

export const ghostStyles = css`
  :host {
    display: block;
    position: absolute;
    background: var(--galleon-ghost-bg, rgba(59, 130, 246, 0.15));
    border: 2px dashed var(--galleon-accent, #3b82f6);
    border-radius: 6px;
    pointer-events: none;
    z-index: 5;
    transition: opacity 80ms ease;
  }
`;
