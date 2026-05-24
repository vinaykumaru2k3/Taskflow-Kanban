import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * useTouchDnd
 *
 * Implements touch-based drag and drop for the Kanban board.
 *
 * iOS Safari and Android Chrome do NOT fire HTML5 DnD events on touch,
 * so we build on the Pointer Events API which works universally.
 *
 * Strategy:
 *  1. On pointerdown, start a 300ms long-press timer.
 *  2. If the pointer moves or is released before 300ms, cancel (no drag).
 *  3. After 300ms, show a ghost clone of the dragged card.
 *  4. As the pointer moves, translate the ghost and detect which column is under it.
 *  5. On pointerup / pointercancel, fire the drop if over a column.
 *
 * Returns drag handlers to spread onto TaskCard and column wrappers,
 * plus the ghost element (rendered at root level).
 */
export function useTouchDnd({ onDrop, enabled = true }) {
  const [dragging, setDragging] = useState(false);
  const [dragTaskId, setDragTaskId] = useState(null);
  const [overColumnId, setOverColumnId] = useState(null);

  // Internal refs — no re-renders needed for these
  const timerRef = useRef(null);
  const ghostRef = useRef(null);
  const sourceRef = useRef(null);  // { taskId, element }
  const startPosRef = useRef(null); // { x, y }
  const offsetRef = useRef({ x: 0, y: 0 }); // pointer offset within card
  const listenersCleanupRef = useRef(null); // stores cleanup for global event listeners
  const rafRef = useRef(null);              // requestAnimationFrame handle for throttling
  const overColumnIdRef = useRef(null);     // tracks last column without triggering re-renders

  // ──────────────────────────────────────────────────────────────────────
  // Helpers
  // ──────────────────────────────────────────────────────────────────────

  const createGhost = useCallback((sourceEl, clientX, clientY) => {
    try {
      const rect = sourceEl.getBoundingClientRect();
      const clone = sourceEl.cloneNode(true);

      // Positioning
      clone.style.cssText = `
        position: fixed;
        left: ${rect.left}px;
        top: ${rect.top}px;
        width: ${rect.width}px;
        pointer-events: none;
        z-index: 9999;
        opacity: 0.85;
        transform: scale(1.04) rotate(-1.5deg);
        box-shadow: 0 24px 48px rgba(0,0,0,0.35);
        border-radius: 12px;
        transition: transform 0.1s ease;
        will-change: transform;
      `;
      clone.setAttribute('aria-hidden', 'true');
      document.body.appendChild(clone);

      offsetRef.current = {
        x: clientX - rect.left,
        y: clientY - rect.top,
      };

      ghostRef.current = clone;
    } catch (err) {
      console.warn('[useTouchDnd] Failed to create drag ghost element:', err);
    }
  }, []);

  const moveGhost = useCallback((clientX, clientY) => {
    const ghost = ghostRef.current;
    if (!ghost) return;
    const { x, y } = offsetRef.current;
    ghost.style.left = `${clientX - x}px`;
    ghost.style.top  = `${clientY - y}px`;
  }, []);

  const removeGhost = useCallback(() => {
    if (ghostRef.current) {
      ghostRef.current.remove();
      ghostRef.current = null;
    }
  }, []);

  const getColumnAt = useCallback((clientX, clientY) => {
    // Temporarily hide ghost so elementFromPoint works
    const ghost = ghostRef.current;
    if (ghost) ghost.style.display = 'none';
    const el = document.elementFromPoint(clientX, clientY);
    if (ghost) ghost.style.display = '';

    // Walk up the DOM to find a [data-column-id] attribute
    let node = el;
    while (node && node !== document.body) {
      if (node.dataset?.columnId) return node.dataset.columnId;
      node = node.parentElement;
    }
    return null;
  }, []);

  // ──────────────────────────────────────────────────────────────────────
  // Card pointer handlers (spread onto each task card)
  // ──────────────────────────────────────────────────────────────────────

  const getCardHandlers = useCallback((taskId) => {
    if (!enabled) return {};

    const onPointerDown = (e) => {
      // Only react to touch/pen — mouse has native DnD
      if (e.pointerType === 'mouse') return;
      // Only primary pointer
      if (!e.isPrimary) return;

      // Clean up any existing listeners/timer first to prevent memory leaks or multiple timers
      clearTimeout(timerRef.current);
      if (listenersCleanupRef.current) {
        listenersCleanupRef.current();
        listenersCleanupRef.current = null;
      }

      startPosRef.current = { x: e.clientX, y: e.clientY };
      sourceRef.current = { taskId, element: e.currentTarget };

      const handleStartMove = (moveEvt) => {
        if (!moveEvt.isPrimary) return;
        const dx = Math.abs(moveEvt.clientX - startPosRef.current.x);
        const dy = Math.abs(moveEvt.clientY - startPosRef.current.y);
        if (dx > 8 || dy > 8) {
          clearTimeout(timerRef.current);
          cleanupTempListeners();
        }
      };

      const handleStartUp = () => {
        clearTimeout(timerRef.current);
        cleanupTempListeners();
      };

      const cleanupTempListeners = () => {
        document.removeEventListener('pointermove', handleStartMove);
        document.removeEventListener('pointerup', handleStartUp);
        document.removeEventListener('pointercancel', handleStartUp);
        if (listenersCleanupRef.current === cleanupTempListeners) {
          listenersCleanupRef.current = null;
        }
      };

      document.addEventListener('pointermove', handleStartMove);
      document.addEventListener('pointerup', handleStartUp);
      document.addEventListener('pointercancel', handleStartUp);

      listenersCleanupRef.current = cleanupTempListeners;

      // 300 ms long-press threshold
      timerRef.current = setTimeout(() => {
        cleanupTempListeners();
        const el = sourceRef.current?.element;
        if (!el) return;

        // Haptic feedback (Android + iOS 13+)
        if (navigator.vibrate) navigator.vibrate(30);

        setDragging(true);
        setDragTaskId(taskId);
        createGhost(el, e.clientX, e.clientY);

        // Dim the source card
        el.style.opacity = '0.35';

        // Capture future pointer events globally
        document.addEventListener('pointermove', onPointerMove, { passive: false });
        document.addEventListener('pointerup', onPointerUp);
        document.addEventListener('pointercancel', onPointerCancel);

        // Store reference to cleanup function so unmount can remove these listeners
        listenersCleanupRef.current = () => {
          document.removeEventListener('pointermove', onPointerMove);
          document.removeEventListener('pointerup', onPointerUp);
          document.removeEventListener('pointercancel', onPointerCancel);
        };
      }, 300);
    };

    const onPointerMove = (e) => {
      if (!e.isPrimary) return;

      const { x, y } = startPosRef.current || {};
      const dx = Math.abs(e.clientX - x);
      const dy = Math.abs(e.clientY - y);

      // If not yet dragging and moved more than 8px, cancel timer
      if (!ghostRef.current) {
        if (dx > 8 || dy > 8) {
          clearTimeout(timerRef.current);
        }
        return;
      }

      e.preventDefault(); // Prevent page scroll while dragging

      moveGhost(e.clientX, e.clientY);

      // Throttle the column-hit detection + React state update to one frame
      // to avoid a full board re-render on every pointermove (60-120/s).
      if (rafRef.current) return;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        const colId = getColumnAt(e.clientX, e.clientY);
        if (colId !== overColumnIdRef.current) {
          overColumnIdRef.current = colId;
          setOverColumnId(colId);
        }
      });
    };

    const onPointerUp = (e) => {
      if (!e.isPrimary) return;
      cleanup(e.clientX, e.clientY, /*drop=*/true);
    };

    const onPointerCancel = () => {
      cleanup(0, 0, /*drop=*/false);
    };

    const cleanup = (clientX, clientY, drop) => {
      clearTimeout(timerRef.current);

      // Cancel any in-flight animation frame from the move throttle
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }

      if (sourceRef.current?.element) {
        sourceRef.current.element.style.opacity = '';
      }

      if (drop && ghostRef.current) {
        const colId = getColumnAt(clientX, clientY);
        if (colId && colId !== '__none__' && sourceRef.current) {
          onDrop(sourceRef.current.taskId, colId);
        }
      }

      removeGhost();
      setDragging(false);
      setDragTaskId(null);
      setOverColumnId(null);
      overColumnIdRef.current = null;
      sourceRef.current = null;
      startPosRef.current = null;

      if (listenersCleanupRef.current) {
        listenersCleanupRef.current();
        listenersCleanupRef.current = null;
      }
    };

    return {
      onPointerDown,
      // Prevent long-press context-menu on iOS
      onContextMenu: (e) => e.preventDefault(),
      // touch-action:none tells the browser we handle touch ourselves (prevents scroll interference)
      style: { touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none' },
    };
  }, [enabled, createGhost, moveGhost, removeGhost, getColumnAt, onDrop]);

  // Cleanup on unmount
  useEffect(() => () => {
    clearTimeout(timerRef.current);
    removeGhost();
    if (listenersCleanupRef.current) {
      listenersCleanupRef.current();
    }
  }, [removeGhost]);

  return {
    dragging,
    dragTaskId,
    overColumnId,
    getCardHandlers,
  };
}
