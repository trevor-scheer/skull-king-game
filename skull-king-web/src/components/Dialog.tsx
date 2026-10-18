import { ReactNode, useLayoutEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import "./Dialog.scss";

export function Dialog({
  open,
  onClose,
  title,
  children,
  className = "",
  dismissible = true,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  className?: string;
  dismissible?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useLayoutEffect(() => {
    const dialog = ref.current!;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
    return () => {
      if (dialog.open) dialog.close();
    };
  }, [open]);

  return createPortal(
    <dialog
      ref={ref}
      className={`Dialog ${className}`}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        if (dismissible) onClose();
      }}
      onClick={(event) => {
        if (event.target !== event.currentTarget || !dismissible) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        if (
          event.clientX < bounds.left ||
          event.clientX > bounds.right ||
          event.clientY < bounds.top ||
          event.clientY > bounds.bottom
        )
          onClose();
      }}
    >
      <header className="Dialog-header">
        <h2 id={titleId}>{title}</h2>
        {dismissible && (
          <button onClick={onClose} aria-label={`Close ${title.toLowerCase()}`}>
            Close ×
          </button>
        )}
      </header>
      <div className="Dialog-content">{children}</div>
    </dialog>,
    document.body,
  );
}
