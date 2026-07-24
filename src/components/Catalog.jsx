import { useEffect, useRef } from 'react';

export default function Catalog({
  curriculum,
  results,
  query,
  onQueryChange,
  selectedId,
  onSelect,
  open,
  onClose,
  searchRef,
  compact,
  triggerRef,
}) {
  const panelRef = useRef(null);
  const hidden = compact && !open;

  useEffect(() => {
    if (!compact || !open) return undefined;
    searchRef.current?.focus();
    return () => triggerRef?.current?.focus();
  }, [compact, open, searchRef, triggerRef]);

  const trapFocus = (event) => {
    if (event.key !== 'Tab' || !compact || !open) return;
    const focusable = [...panelRef.current.querySelectorAll('button:not([disabled]), input:not([disabled])')];
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
        className={`catalog-scrim ${open ? 'is-visible' : ''}`}
        type="button"
        aria-label="Close topic catalog"
        aria-hidden={!open}
        disabled={!open}
        tabIndex={-1}
        onClick={onClose}
      />
      <aside
        ref={panelRef}
        className={`catalog ${open ? 'is-open' : ''}`}
        role={compact ? 'dialog' : 'complementary'}
        aria-modal={compact && open ? 'true' : undefined}
        aria-label="Topic catalog"
        aria-hidden={hidden}
        inert={hidden ? true : undefined}
        onKeyDown={trapFocus}
      >
        <div className="catalog-title-row">
          <div>
            <p className="eyebrow">Curriculum</p>
            <h2>Browse topics</h2>
          </div>
          <button className="catalog-close" type="button" onClick={onClose}>Close</button>
        </div>

        <label className="catalog-search">
          <span className="sr-only">Search topics</span>
          <input
            ref={searchRef}
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search the curriculum"
          />
          <kbd>/</kbd>
        </label>

        <nav className="catalog-scroll">
          {query ? (
            results.length ? results.map((topic) => (
              <button
                type="button"
                className={`catalog-topic search-result ${selectedId === topic.id ? 'is-current' : ''}`}
                key={topic.id}
                onClick={() => onSelect(topic)}
              >
                <span>{topic.title}</span>
                <small>{topic.sectionTitle}</small>
              </button>
            )) : <p className="catalog-empty">No topic matches “{query}”.</p>
          ) : curriculum.map((section) => {
            let previousGroup = null;
            return (
              <section className="catalog-section" key={section.id}>
                <h3>{section.title}</h3>
                {section.topics.map((topic) => {
                  const showGroup = topic.group && topic.group !== previousGroup;
                  previousGroup = topic.group;
                  return (
                    <div key={topic.id}>
                      {showGroup && <p className="catalog-subgroup">{topic.group}</p>}
                      <button
                        type="button"
                        className={`catalog-topic ${selectedId === topic.id ? 'is-current' : ''}`}
                        onClick={() => onSelect(topic)}
                      >
                        <span>{topic.title}</span>
                        <small>{topic.level}</small>
                      </button>
                    </div>
                  );
                })}
              </section>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
