import { useState } from 'react';
import MechanismVisual from './MechanismVisual.jsx';

function RecallBlock({ block }) {
  const [revealed, setRevealed] = useState(false);

  return (
    <section className="recall-block">
      <p className="eyebrow">Explain it back</p>
      <h2>{block.prompt}</h2>
      <button type="button" className="underlined-button" onClick={() => setRevealed((value) => !value)}>
        {revealed ? 'Hide the structure' : 'Show a speaking structure'}
      </button>
      {revealed && (
        <p className="recall-guide">
          Begin with the initial state. Name the operation, follow each changed value or signal, then finish with the first observable failure.
        </p>
      )}
    </section>
  );
}

export function CodePairBlock({ block, className = '' }) {
  const [activeId, setActiveId] = useState(block.variants[0].id);
  const [copied, setCopied] = useState(false);
  const active = block.variants.find((variant) => variant.id === activeId) ?? block.variants[0];
  const panelId = `code-panel-${block.heading.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

  const copyCode = async () => {
    await navigator.clipboard.writeText(active.code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  };

  return (
    <section className={`lesson-block code-block code-pair-block ${className}`.trim()}>
      <p className="eyebrow">Implementation comparison</p>
      <h2>{block.heading}</h2>
      {block.note && <p className="code-pair-note">{block.note}</p>}
      <div className="code-pair-toolbar">
        <div className="code-language-tabs" role="tablist" aria-label="Implementation language">
          {block.variants.map((variant) => (
            <button
              type="button"
              role="tab"
              aria-selected={variant.id === active.id}
              aria-controls={panelId}
              className={variant.id === active.id ? 'is-active' : ''}
              key={variant.id}
              onClick={() => {
                setActiveId(variant.id);
                setCopied(false);
              }}
            >
              <span>{variant.label}</span>
              <small>{variant.standard}</small>
            </button>
          ))}
        </div>
        <button className="code-copy-button" type="button" onClick={copyCode}>
          {copied ? 'Copied' : 'Copy code'}
        </button>
      </div>
      <pre
        id={panelId}
        role="tabpanel"
        aria-label={`${active.label} implementation`}
      >
        <code>{active.code}</code>
      </pre>
    </section>
  );
}

export default function LessonBlock({ block }) {
  if (block.type === 'recall') return <RecallBlock block={block} />;

  if (block.type === 'code-pair') return <CodePairBlock block={block} />;

  if (block.type === 'visual') {
    return (
      <section className="lesson-block visual-block">
        <h2>{block.heading}</h2>
        <MechanismVisual block={block} />
      </section>
    );
  }

  if (block.type === 'code') {
    return (
      <section className="lesson-block code-block">
        <p className="eyebrow">{block.language ?? 'code'}</p>
        <h2>{block.heading}</h2>
        <pre><code>{block.code}</code></pre>
      </section>
    );
  }

  if (block.type === 'steps') {
    return (
      <section className="lesson-block">
        <h2>{block.heading}</h2>
        <ol className="state-steps">
          {block.items.map((item, index) => (
            <li key={item}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <p>{item}</p>
            </li>
          ))}
        </ol>
      </section>
    );
  }

  if (block.type === 'concepts') {
    return (
      <section className="lesson-block concept-block">
        <p className="eyebrow">Concept dictionary</p>
        <h2>{block.heading}</h2>
        <dl className="concept-list">
          {block.items.map((item) => (
            <div className="concept-entry" key={item.term}>
              <dt>{item.term}</dt>
              <dd>
                <p>{item.definition}</p>
                <small><span>Concrete check</span> {item.example}</small>
              </dd>
            </div>
          ))}
        </dl>
      </section>
    );
  }

  if (block.type === 'source-prompts') {
    return (
      <section className="lesson-block source-prompts-block">
        <p className="eyebrow">Coverage ledger</p>
        <h2>{block.heading}</h2>
        <ul className="source-prompt-list">
          {block.items.map((item) => <li key={item}>{item}</li>)}
        </ul>
      </section>
    );
  }

  if (block.type === 'prediction') {
    return (
      <aside className="prediction-block">
        <p className="eyebrow">Pause and predict</p>
        <p>{block.prompt}</p>
      </aside>
    );
  }

  return (
    <section className={`lesson-block lesson-block-${block.type}`}>
      {block.type === 'definition' && <p className="eyebrow">Definition</p>}
      {block.type === 'failure' && <p className="eyebrow">Failure mode</p>}
      {block.type === 'practice' && <p className="eyebrow">Try it yourself</p>}
      {block.type === 'application' && <p className="eyebrow">Real system</p>}
      <h2>{block.heading}</h2>
      <p>{block.body}</p>
    </section>
  );
}
