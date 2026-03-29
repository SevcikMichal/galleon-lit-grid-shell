export interface TouchDragData {
  type: 'component' | 'cell';
  name: string;
  colspan: number;
  rowspan: number;
  movingCell?: Element | null;
}

export function startTouchDrag(e: TouchEvent, data: TouchDragData) {
  if (e.touches.length !== 1) return;
  const touch = e.touches[0];

  const ghost = document.createElement('div');
  ghost.textContent = data.name;
  Object.assign(ghost.style, {
    position: 'fixed',
    left: `${touch.clientX}px`,
    top: `${touch.clientY - 48}px`,
    transform: 'translate(-50%, -50%)',
    background: '#1e293b',
    color: '#fff',
    padding: '6px 14px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
    pointerEvents: 'none',
    zIndex: '9999',
    opacity: '0.9',
    whiteSpace: 'nowrap',
    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
  });
  document.body.appendChild(ghost);

  document.dispatchEvent(new CustomEvent<TouchDragData>('galleon-drag-start', { detail: data }));

  const onMove = (e: TouchEvent) => {
    e.preventDefault();
    const t = e.touches[0];
    ghost.style.left = `${t.clientX}px`;
    ghost.style.top = `${t.clientY - 48}px`;
    document.dispatchEvent(new CustomEvent('galleon-drag-move', { detail: { x: t.clientX, y: t.clientY } }));
  };

  const onEnd = (e: TouchEvent) => {
    const t = e.changedTouches[0];
    ghost.remove();
    document.dispatchEvent(new CustomEvent('galleon-drag-end', { detail: { x: t.clientX, y: t.clientY, ...data } }));
    document.removeEventListener('touchmove', onMove);
    document.removeEventListener('touchend', onEnd);
  };

  document.addEventListener('touchmove', onMove, { passive: false });
  document.addEventListener('touchend', onEnd);
}
