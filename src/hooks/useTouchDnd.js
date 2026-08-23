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
  const pendingPosRef = useRef(null); // latest pointer pos to apply via RAF
  const moveRafRef = useRef(null);    // RAF handle for movement
  const listenersCleanupRef = useRef(null); // stores cleanup for global event listeners
  const rafRef = useRef(null);              // requestAnimationFrame handle for throttling
  const overColumnIdRef = useRef(null);     // tracks last column without triggering re-renders
  const mountedRef = useRef(true);

  // ──────────────────────────────────────────────────────────────────────
  // Helpers
  // ──────────────────────────────────────────────────────────────────────

  // Instead of creating a ghost clone, pick up the actual source element
  // and move it with the pointer. We store previous inline styles to
  // restore them on drop/cancel.
  const pickupElement = useCallback((sourceEl, clientX, clientY, opts = { useTransition: true }) => {
    try {
      const rect = sourceEl.getBoundingClientRect();

      // Create a placeholder to preserve layout where the card was
      const placeholder = document.createElement('div');
      placeholder.style.width = `${rect.width}px`;
      placeholder.style.height = `${rect.height}px`;
      placeholder.style.display = getComputedStyle(sourceEl).display || 'block';
      placeholder.style.margin = getComputedStyle(sourceEl).margin || '0';
      placeholder.className = 'tf-placeholder';
      sourceEl.__placeholder = placeholder;
      if (sourceEl.parentNode) sourceEl.parentNode.insertBefore(placeholder, sourceEl);

      // Hide element to avoid flicker while we move it in the DOM
      sourceEl.style.visibility = 'hidden';
      // Move the real element to document.body so it can float above everything
      document.body.appendChild(sourceEl);

      // Save previous inline styles for restoration
      sourceEl.__prevTouchDndStyles = {
        position: sourceEl.style.position || '',
        left: sourceEl.style.left || '',
        top: sourceEl.style.top || '',
        width: sourceEl.style.width || '',
        zIndex: sourceEl.style.zIndex || '',
        transition: sourceEl.style.transition || '',
        transform: sourceEl.style.transform || '',
        pointerEvents: sourceEl.style.pointerEvents || '',
        margin: sourceEl.style.margin || '',
      };

      sourceEl.style.position = 'fixed';
      sourceEl.style.left = `${rect.left}px`;
      sourceEl.style.top = `${rect.top}px`;
      // set base coords used to compute translate values
      sourceEl.__baseLeft = rect.left;
      sourceEl.__baseTop = rect.top;
      sourceEl.style.willChange = 'transform';
      sourceEl.style.width = `${rect.width}px`;
      sourceEl.style.zIndex = '9999';
      // Record whether we should use CSS transitions for this drag
      sourceEl.__useTransition = !!opts.useTransition;
      // Disable transition at pickup to avoid an initial animated jump/stutter.
      sourceEl.style.transition = 'none';
      sourceEl.style.transform = 'translate3d(0,0,0)';
      sourceEl.style.pointerEvents = 'none';
      sourceEl.style.margin = '0';

      offsetRef.current = {
        x: clientX - rect.left,
        y: clientY - rect.top,
      };

      // Immediately position the picked element under the pointer using transform
      // so we avoid layout thrashing. Apply without transition to prevent flicker.
      const initialTx = clientX - offsetRef.current.x - sourceEl.__baseLeft;
      const initialTy = clientY - offsetRef.current.y - sourceEl.__baseTop;
      sourceEl.style.transform = `translate3d(${initialTx}px, ${initialTy}px, 0)`;

      // Re-enable a very short transition on the next frame for touch/pen
      requestAnimationFrame(() => {
        if (sourceEl.__useTransition) sourceEl.style.transition = 'transform 0.08s ease';
        // Unhide after styles applied so the user doesn't see a flash at the old location
        sourceEl.style.visibility = '';
      });

      // Track current 'ghost' as the real element
      ghostRef.current = sourceEl;
    } catch (err) {
      console.warn('[useTouchDnd] Failed to pickup source element:', err);
    }
  }, []);

  const movePickedElement = useCallback((clientX, clientY) => {
    // Batch pointer moves via RAF to avoid applying style on every event.
    pendingPosRef.current = { x: clientX, y: clientY };
    if (moveRafRef.current) return;
    moveRafRef.current = requestAnimationFrame(() => {
      moveRafRef.current = null;
      const el = ghostRef.current;
      const pos = pendingPosRef.current;
      if (!el || !pos) return;
      const { x: offX, y: offY } = offsetRef.current;
      const tx = pos.x - offX - (el.__baseLeft || 0);
      const ty = pos.y - offY - (el.__baseTop || 0);
      el.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
    });
  }, []);

  const releasePickedElement = useCallback(() => {
    const el = ghostRef.current;
    if (!el) return;
    const prev = el.__prevTouchDndStyles || {};
    // Restore inline styles
    el.style.position = prev.position;
    el.style.left = prev.left;
    el.style.top = prev.top;
    el.style.width = prev.width;
    el.style.zIndex = prev.zIndex;
    el.style.transition = prev.transition;
    el.style.transform = prev.transform;
    el.style.pointerEvents = prev.pointerEvents;
    el.style.margin = prev.margin;

    // If we created a placeholder, put the element back into the DOM at its placeholder
    const placeholder = el.__placeholder;
    if (placeholder && placeholder.parentNode) {
      placeholder.parentNode.replaceChild(el, placeholder);
    }

    // cancel any pending movement RAF
    if (moveRafRef.current) {
      cancelAnimationFrame(moveRafRef.current);
      moveRafRef.current = null;
    }

    delete el.__prevTouchDndStyles;
    delete el.__placeholder;
    ghostRef.current = null;
  }, []);

  // Animate the picked element into its placeholder, then restore DOM
  const animateDropIntoPlaceholder = useCallback((el, placeholder, onComplete) => {
    if (!el || !placeholder) {
      if (onComplete) onComplete();
      return;
    }

    // Compute target position (placeholder's rect in viewport)
    const targetRect = placeholder.getBoundingClientRect();
    const baseLeft = el.__baseLeft || 0;
    const baseTop = el.__baseTop || 0;
    const tx = targetRect.left - baseLeft;
    const ty = targetRect.top - baseTop;

    let finished = false;

    const cleanupAfter = () => {
      if (finished) return;
      finished = true;
      // Remove the floating element and its original placeholder from the DOM.
      try {
        if (el.parentNode) el.parentNode.removeChild(el);
      } catch (err) {
        /* ignore */
      }
      try {
        if (placeholder && placeholder.parentNode) placeholder.parentNode.removeChild(placeholder);
      } catch (err) {
        /* ignore */
      }
      // Clean up saved metadata
      delete el.__prevTouchDndStyles;
      delete el.__placeholder;
      ghostRef.current = null;
      if (onComplete) onComplete();
    };

    const handleTransitionEnd = (ev) => {
      if (ev.propertyName !== 'transform') return;
      el.removeEventListener('transitionend', handleTransitionEnd);
      cleanupAfter();
    };

    // If the drag opted out of CSS transitions (desktop/mouse), animate via RAF
    if (!el.__useTransition) {
      const startRect = el.getBoundingClientRect();
      const startTx = startRect.left - baseLeft;
      const startTy = startRect.top - baseTop;
      const duration = 120; // ms
      const startTime = performance.now();

      const rafAnimate = (now) => {
        const t = Math.min(1, (now - startTime) / duration);
        // easeOutQuad
        const eased = 1 - (1 - t) * (1 - t);
        const curTx = startTx + (tx - startTx) * eased;
        const curTy = startTy + (ty - startTy) * eased;
        el.style.transform = `translate3d(${curTx}px, ${curTy}px, 0)`;
        if (t < 1) {
          requestAnimationFrame(rafAnimate);
        } else {
          cleanupAfter();
        }
      };

      requestAnimationFrame(rafAnimate);
      // Call onComplete after cleanupAfter executes
      if (onComplete) {
        const orig = onComplete;
        onComplete = () => {
          orig();
        };
      }
      return;
    }

    // Ensure transition is enabled and animate to target transform
    // Use a slightly longer duration for drop so it feels natural
    el.style.transition = 'transform 0.12s ease';
    // Force style flush then set target transform
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    el.getBoundingClientRect();
    el.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;

    el.addEventListener('transitionend', handleTransitionEnd);

    // Safety fallback if transitionend doesn't fire
    const fallback = setTimeout(() => {
      el.removeEventListener('transitionend', handleTransitionEnd);
      cleanupAfter();
    }, 250);

    // Ensure we clear fallback when complete
    const originalOnComplete = onComplete;
    onComplete = () => {
      clearTimeout(fallback);
      if (originalOnComplete) originalOnComplete();
    };
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
      if (dragging) return; // Prevent re-entrancy
      if (!e.isPrimary) return; // Only primary pointer

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

        // Mouse: start drag quickly on small movement so drags feel snappy,
        // but don't start on click (no movement) so click handlers still fire.
        if (moveEvt.pointerType === 'mouse') {
          if (dx > 3 || dy > 3) {
            clearTimeout(timerRef.current);
            cleanupTempListeners();
            const el = sourceRef.current?.element;
            if (el && !ghostRef.current) startDrag(el, moveEvt.clientX, moveEvt.clientY, moveEvt.pointerType);
          }
          return;
        }

        // Touch/pen: cancel long-press if user moves finger more than a small threshold
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

      const startDrag = (el, clientX, clientY, pointerType = 'touch') => {
        if (!mountedRef.current) return;
        if (navigator.vibrate) navigator.vibrate(30);
        console.debug('[useTouchDnd] startDrag for task', taskId);
        setDragging(true);
        setDragTaskId(taskId);
        const useTransition = pointerType !== 'mouse';
        pickupElement(el, clientX, clientY, { useTransition });

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
      };

      // 120 ms long-press threshold (faster response)
      timerRef.current = setTimeout(() => {
        if (!mountedRef.current) return;
        cleanupTempListeners();
        const el = sourceRef.current?.element;
        if (!el) return;
        console.debug('[useTouchDnd] long-press detected for task', taskId);
        startDrag(el, e.clientX, e.clientY, e.pointerType);
      }, 120);

      
    };

    function onPointerMove(e) {
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

      movePickedElement(e.clientX, e.clientY);

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
    }

    function onPointerUp(e) {
      if (!e.isPrimary) return;
      cleanup(e.clientX, e.clientY, /*drop=*/true);
    }

    function onPointerCancel() {
      cleanup(0, 0, /*drop=*/false);
    }

    const cleanup = (clientX, clientY, drop) => {
      clearTimeout(timerRef.current);

      // Cancel any in-flight animation frame from the move throttle
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }

      if (sourceRef.current?.element) {
        const el = sourceRef.current.element;
        const placeholder = el.__placeholder;
        const finishTaskId = sourceRef.current.taskId;

        if (drop && placeholder && placeholder.parentNode) {
          // Determine the column under pointer and move the placeholder into it
          const colId = getColumnAt(clientX, clientY);
          if (colId && colId !== '__none__') {
            const colEl = document.querySelector(`[data-column-id="${colId}"]`);
            if (colEl) {
              // Try to find the task-list container inside the column
              const list = colEl.querySelector('.space-y-3') || colEl;
              try {
                list.appendChild(placeholder);
              } catch (err) {
                // fallback: leave placeholder where it was
                console.debug('[useTouchDnd] failed to move placeholder into target column', err);
              }
            }
          }

          // Animate into (moved) placeholder, then finish drop handling
          animateDropIntoPlaceholder(el, placeholder, () => {
            const colId2 = getColumnAt(clientX, clientY);
            if (colId2 && colId2 !== '__none__') {
              onDrop(finishTaskId, colId2);
            }
          });
        } else {
          // No placeholder or not a drop: restore immediately
          releasePickedElement();
          if (drop) {
            const colId = getColumnAt(clientX, clientY);
            if (colId && colId !== '__none__') {
              onDrop(finishTaskId, colId);
            }
          }
        }
      }
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
  }, [enabled, pickupElement, movePickedElement, releasePickedElement, getColumnAt, onDrop]);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      clearTimeout(timerRef.current);
      releasePickedElement();
      if (listenersCleanupRef.current) {
        listenersCleanupRef.current();
      }
    };
  }, [releasePickedElement]);

  return {
    dragging,
    dragTaskId,
    overColumnId,
    getCardHandlers,
  };
}
