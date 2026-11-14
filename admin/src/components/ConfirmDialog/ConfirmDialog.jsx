import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import './ConfirmDialog.css';
import { TrashIcon } from '../Icons';

// Replaces window.confirm: centered modal on desktop, bottom sheet on mobile.
const ConfirmDialog = ({ open, title, message, confirmLabel = "Confirm", busy = false, onConfirm, onCancel }) => {

  const cancelRef = useRef(null);
  const onCancelRef = useRef(onCancel);
  onCancelRef.current = onCancel;

  useEffect(()=>{
    if (!open) return;
    const previouslyFocused = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    cancelRef.current?.focus();

    const onKey = (event) => {
      if (event.key === "Escape" && !busy) onCancelRef.current();
    };
    document.addEventListener("keydown",onKey);

    return ()=>{
      document.removeEventListener("keydown",onKey);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
  },[open,busy]);

  if (!open) return null;

  return createPortal(
    <div
      className="dialog-backdrop"
      onMouseDown={(event)=>{ if (event.target === event.currentTarget && !busy) onCancel(); }}
    >
      <div className="dialog" role="alertdialog" aria-modal="true" aria-labelledby="dialog-title" aria-describedby="dialog-message">
        <span className="dialog-icon"><TrashIcon size={26} /></span>
        <h2 id="dialog-title">{title}</h2>
        <p id="dialog-message">{message}</p>
        <div className="dialog-actions">
          <button type="button" ref={cancelRef} className="btn btn-ghost" onClick={onCancel} disabled={busy}>Cancel</button>
          <button type="button" className="btn btn-danger" onClick={onConfirm} disabled={busy}>
            {busy && <span className="spinner" aria-hidden="true" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default ConfirmDialog;
