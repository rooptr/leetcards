import { useMemo, useState } from 'react';
import { searchQuestionCards } from '../data/questionCards.js';

function CapturedQuestions({ records, loaded, error, onOpenQuestion }) {
  return (
    <section className="captured-questions" aria-labelledby="captured-questions-title">
      <div className="index-heading">
        <h2 id="captured-questions-title">Captured from LeetCode</h2>
        <span>{loaded ? `${records.length} solved` : 'Loading'}</span>
      </div>

      {error && (
        <div className="question-notice question-notice-error" role="status">
          <strong>Local capture is unavailable.</strong>
          <p>{error}</p>
        </div>
      )}

      {!error && loaded && records.length === 0 && (
        <div className="question-notice">
          <strong>Your solved list starts locally.</strong>
          <p>
            Open a solved problem on LeetCode and click the Leetcards Safe Capture
            extension. No notes or account access are required.
          </p>
        </div>
      )}

      {records.length > 0 && (
        <div className="captured-index">
          {records.map((record) => (
            <article key={record.slug}>
              {record.questionId ? (
                <button type="button" onClick={() => onOpenQuestion(record.questionId)}>
                  <span>
                    <small>{record.difficulty}</small>
                    <strong>{record.title}</strong>
                  </span>
                  <span className="captured-action">Study solution</span>
                </button>
              ) : (
                <div className="captured-copy">
                  <small>{record.difficulty}</small>
                  <strong>{record.title}</strong>
                  <span className="captured-action">Explanation not available</span>
                </div>
              )}
              <a href={record.url} target="_blank" rel="noreferrer">
                Open on LeetCode
              </a>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default function QuestionsView({
  capturedQuestions,
  capturedLoaded,
  captureError,
  onOpenQuestion,
  onBack,
}) {
  const [query, setQuery] = useState('');
  const results = useMemo(() => searchQuestionCards(query), [query]);
  const groups = useMemo(() => (
    results.reduce((entries, card) => {
      const existing = entries.find((entry) => entry.name === card.group);
      if (existing) existing.cards.push(card);
      else entries.push({ name: card.group, cards: [card] });
      return entries;
    }, [])
  ), [results]);

  return (
    <main className="questions-view">
      <button className="text-back" type="button" onClick={onBack}>All categories</button>

      <header className="questions-hero">
        <p className="eyebrow">Question practice</p>
        <h1>Learn how to reach the solution.</h1>
        <p>
          Read the signal, choose the state, trace the move, and recall the
          invariant before looking at code.
        </p>
      </header>

      <CapturedQuestions
        records={capturedQuestions}
        loaded={capturedLoaded}
        error={captureError}
        onOpenQuestion={onOpenQuestion}
      />

      <label className="library-search questions-search">
        <span className="sr-only">Search questions</span>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search a question, pattern, or constraint"
        />
      </label>

      <section className="question-library" aria-labelledby="question-library-title">
        <div className="index-heading">
          <h2 id="question-library-title">Question library</h2>
          <span>{results.length} explanations</span>
        </div>

        {groups.length === 0 ? (
          <div className="library-empty" role="status">
            <h2>No question found</h2>
            <p>Try a pattern such as sliding window, coin change, or backtracking.</p>
          </div>
        ) : (
          groups.map((group) => (
            <section className="question-group" key={group.name}>
              <h3>{group.name}</h3>
              <div className="question-index">
                {group.cards.map((card) => (
                  <button type="button" key={card.id} onClick={() => onOpenQuestion(card.id)}>
                    <span>
                      <strong>{card.title}</strong>
                      <small>{card.recognition}</small>
                    </span>
                    <span className="question-open">How to solve</span>
                  </button>
                ))}
              </div>
            </section>
          ))
        )}
      </section>
    </main>
  );
}
