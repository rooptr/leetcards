import { useEffect, useRef } from 'react';

export default function GlossaryDrawer({ topic, lesson, open, onClose, triggerRef }) {
  const drawerRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    drawerRef.current?.querySelector('button')?.focus();
    return () => triggerRef?.current?.focus();
  }, [open, triggerRef]);

  const trapFocus = (event) => {
    if (event.key !== 'Tab' || !open) return;
    const focusable = [...drawerRef.current.querySelectorAll('button:not([disabled])')];
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return (
    <>
      <button
        className={`glossary-scrim ${open ? 'is-visible' : ''}`}
        type="button"
        aria-label="Close glossary"
        aria-hidden={!open}
        disabled={!open}
        tabIndex={-1}
        onClick={onClose}
      />
      <aside
        ref={drawerRef}
        className={`glossary-drawer ${open ? 'is-open' : ''}`}
        role="dialog"
        aria-modal={open ? 'true' : undefined}
        aria-label="Lesson glossary"
        aria-hidden={!open}
        inert={!open ? true : undefined}
        onKeyDown={trapFocus}
      >
        <div className="drawer-heading">
          <div>
            <p className="eyebrow">Quick context</p>
            <h2>Glossary</h2>
          </div>
          <button type="button" onClick={onClose}>Close</button>
        </div>
        <p className="drawer-summary">{lesson?.summary}</p>
        <dl>
          {topic?.keywords.map((keyword) => (
            <div key={keyword}>
              <dt>{keyword}</dt>
              <dd>Read this term in the context of {topic.title.toLowerCase()}; follow where its state appears in the lesson trace.</dd>
            </div>
          ))}
        </dl>
      </aside>
    </>
  );
}
