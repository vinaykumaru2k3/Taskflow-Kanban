import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children, maxWidth = 'max-w-3xl' }) => {
  const closeButtonRef = useRef(null);
  const modalRef = useRef(null);

  // [a11y] Focus the close button when the modal opens for keyboard/screen-reader accessibility
  useEffect(() => {
    if (!isOpen) return;
    // [fix] Return a cleanup so the timeout is cancelled if the modal unmounts
    // before the 50ms fires (e.g., rapid open/close).
    const timer = setTimeout(() => closeButtonRef.current?.focus(), 50);
    return () => clearTimeout(timer);
  }, [isOpen]);

  // [cross-browser] Close on Escape key and Trap Focus — works in all browsers
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key === 'Tab') {
        const modalEl = modalRef.current;
        if (!modalEl) return;
        const focusableElements = modalEl.querySelectorAll(
          'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, [tabindex="0"], [contenteditable]'
        );
        if (focusableElements.length === 0) return;
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          // If Shift + Tab and focus is on the first element, wrap to last
          if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
          }
        } else {
          // If Tab and focus is on the last element, wrap to first
          if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    // Overlay covers the full viewport (inset-0) so the header and its
    // scrollbar are also hidden behind the backdrop.
    <div
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-[50] flex items-center justify-center p-4 md:p-6 bg-slate-900/50 dark:bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200"
      // [cross-browser] Clicking backdrop closes modal
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className={`bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full ${maxWidth} max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 border border-slate-100 dark:border-slate-800`}
        // [safari] Stop propagation so inner clicks don't close the modal
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
          <h3 id="modal-title" className="text-lg font-bold text-slate-800 dark:text-slate-100">{title}</h3>
          <button
            id="btn-close-modal"
            ref={closeButtonRef}
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-400 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        {/* [safari] -webkit-overflow-scrolling: touch enables momentum scrolling on iOS */}
        <div
          className="p-5 overflow-y-auto flex-1"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
