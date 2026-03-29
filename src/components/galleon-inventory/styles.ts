import { css } from 'lit';

export const inventoryStyles = css`
  :host {
    display: flex;
    flex-direction: column;
    background: var(--galleon-inventory-bg, #1e293b);
    border-right: 1px solid var(--galleon-inventory-border, #334155);
    overflow: hidden;
  }

  .inventory-header {
    padding: 12px 12px 8px;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--galleon-inventory-heading, #64748b);
    flex-shrink: 0;
  }

  .search {
    margin: 0 10px 8px;
    padding: 6px 10px;
    background: var(--galleon-input-bg, #0f172a);
    border: 1px solid var(--galleon-inventory-border, #334155);
    border-radius: 4px;
    color: inherit;
    font-size: 13px;
    outline: none;
    width: calc(100% - 20px);
    box-sizing: border-box;
    flex-shrink: 0;
  }

  .search:focus {
    border-color: var(--galleon-accent, #3b82f6);
  }

  .item-list {
    flex: 1;
    overflow-y: auto;
    padding: 4px 8px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .empty {
    padding: 16px;
    font-size: 12px;
    color: var(--galleon-inventory-heading, #64748b);
    text-align: center;
  }

  .loading {
    padding: 16px;
    font-size: 12px;
    color: var(--galleon-inventory-heading, #64748b);
    text-align: center;
  }
`;

export const inventoryItemStyles = css`
  :host {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 10px;
    background: var(--galleon-item-bg, #0f172a);
    border: 1px solid var(--galleon-inventory-border, #334155);
    border-radius: 5px;
    cursor: grab;
    user-select: none;
    transition: background 120ms ease, border-color 120ms ease;
  }

  :host(:hover) {
    background: var(--galleon-item-hover-bg, #1e293b);
    border-color: var(--galleon-accent, #3b82f6);
  }

  :host(:active) {
    cursor: grabbing;
    opacity: 0.7;
  }

  .icon {
    width: 28px;
    height: 28px;
    flex-shrink: 0;
    border-radius: 4px;
    object-fit: cover;
    background: var(--galleon-inventory-border, #334155);
  }

  .icon-placeholder {
    width: 28px;
    height: 28px;
    flex-shrink: 0;
    border-radius: 4px;
    background: var(--galleon-inventory-border, #334155);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
  }

  .text {
    flex: 1;
    min-width: 0;
  }

  .label {
    font-size: 13px;
    font-weight: 500;
    color: var(--galleon-text, #e2e8f0);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .desc {
    font-size: 11px;
    color: var(--galleon-inventory-heading, #64748b);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    margin-top: 1px;
  }
`;
