import { useMemo, useState } from 'react';
import {
  qualcommIndiaReportedQuestions,
  qualcommIndiaWebAudit,
  qualcommIndiaWebSourceById,
  qualcommIndiaWebSources,
} from '../data/qualcommIndiaWebQuestions.js';
import { topicById } from '../data/curriculum.js';

const areaDefinitions = [
  {
    id: 'c',
    label: 'C',
    matches: (topicId) => topicId.startsWith('qualcomm-c-'),
  },
  {
    id: 'cpp',
    label: 'C++',
    matches: (topicId) => topicId.startsWith('cpp-'),
  },
  {
    id: 'dsa',
    label: 'DSA',
    matches: (topicId) => topicId.includes('-dsa-') || topicId.includes('-problem-'),
  },
  {
    id: 'linux',
    label: 'Linux & OS',
    matches: (topicId) => topicId.includes('-linux-') || topicId.startsWith('os-'),
  },
  {
    id: 'architecture',
    label: 'Architecture & DSP',
    matches: (topicId) => topicId.includes('-arch-') || topicId.includes('multimedia-dsp'),
  },
  {
    id: 'embedded',
    label: 'MCU, embedded & RTOS',
    matches: (topicId) => topicId.includes('-embedded-'),
  },
  {
    id: 'networking',
    label: 'Networking',
    matches: (topicId) => topicId.startsWith('net-'),
  },
  {
    id: 'delivery',
    label: 'Debugging, projects & HR',
    matches: (topicId) => (
      topicId.includes('-testing-')
      || topicId.includes('-project-')
      || topicId.includes('-behavioral-')
    ),
  },
  {
    id: 'puzzles',
    label: 'Puzzles',
    matches: (topicId) => topicId.includes('-puzzles-'),
  },
];

const lessonFallbacks = {
  'qualcomm-c-memory-routines': 'c-tricks',
  'qualcomm-linux-kernel-memory-dma': 'arch-dma',
};

const areaForQuestion = (question) => (
  areaDefinitions.find((area) => area.matches(question.topicId)) ?? {
    id: 'other',
    label: 'Other reported questions',
  }
);

const lessonForQuestion = (question) => {
  const topicId = topicById.has(question.topicId)
    ? question.topicId
    : lessonFallbacks[question.topicId];
  return topicId ? topicById.get(topicId) : null;
};

const sourceLabel = (source) => (
  source.reportType === 'firsthand'
    ? 'First-person report'
    : source.reportType === 'firsthand-republication'
      ? 'Republished report'
      : 'Candidate aggregate'
);

function QuestionItem({ question, onOpenLesson }) {
  const lessonTopic = lessonForQuestion(question);
  const sources = question.sources
    .map((sourceId) => qualcommIndiaWebSourceById.get(sourceId))
    .filter(Boolean);

  return (
    <details className="internet-question">
      <summary>
        <span>{question.prompt}</span>
        <span className="internet-question-source-count">
          {sources.length} {sources.length === 1 ? 'report' : 'reports'}
        </span>
      </summary>
      <div className="internet-answer">
        <p className="eyebrow">Answer map</p>
        <p>{question.answerFocus}</p>
        <div className="internet-answer-actions">
          {lessonTopic && (
            <button type="button" onClick={() => onOpenLesson(lessonTopic.id)}>
              Study the full explanation
            </button>
          )}
          <div className="internet-source-links" aria-label="Question sources">
            {sources.map((source) => (
              <a
                key={source.id}
                href={source.url}
                target="_blank"
                rel="noreferrer"
                title={`${source.title} — ${sourceLabel(source)}`}
              >
                {source.publisher}
                <span aria-hidden="true"> ↗</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </details>
  );
}

export default function InternetPrepView({ onBack, onOpenLesson }) {
  const [query, setQuery] = useState('');
  const [activeArea, setActiveArea] = useState('all');
  const normalizedQuery = query.trim().toLowerCase();

  const visibleQuestions = useMemo(() => qualcommIndiaReportedQuestions.filter((question) => {
    const area = areaForQuestion(question);
    const matchesArea = activeArea === 'all' || area.id === activeArea;
    if (!matchesArea) return false;
    if (!normalizedQuery) return true;
    const sources = question.sources
      .map((sourceId) => qualcommIndiaWebSourceById.get(sourceId))
      .filter(Boolean);
    return [
      question.prompt,
      question.answerFocus,
      area.label,
      ...sources.flatMap((source) => [source.publisher, source.location, source.role]),
    ].join(' ').toLowerCase().includes(normalizedQuery);
  }), [activeArea, normalizedQuery]);

  const groupedQuestions = useMemo(() => {
    const groups = new Map();
    for (const question of visibleQuestions) {
      const area = areaForQuestion(question);
      if (!groups.has(area.id)) groups.set(area.id, { ...area, questions: [] });
      groups.get(area.id).questions.push(question);
    }
    return [...groups.values()];
  }, [visibleQuestions]);

  return (
    <main className="internet-prep-view">
      <button className="text-back" type="button" onClick={onBack}>← All categories</button>

      <header className="internet-prep-hero">
        <div>
          <p className="eyebrow">India · public candidate reports</p>
          <h1>Questions reported from Qualcomm interviews.</h1>
          <p>
            A source-linked archive for embedded and systems roles in India. Wording is
            normalized for clarity; every question remains tied to the report that
            mentioned it.
          </p>
        </div>
        <dl className="internet-audit">
          <div>
            <dt>{qualcommIndiaWebAudit.questionCount}</dt>
            <dd>reported questions</dd>
          </div>
          <div>
            <dt>{qualcommIndiaWebAudit.sourceCount}</dt>
            <dd>reviewed sources</dd>
          </div>
          <div>
            <dt>{qualcommIndiaWebAudit.highConfidenceSourceCount}</dt>
            <dd>first-person reports</dd>
          </div>
        </dl>
      </header>

      <aside className="internet-provenance">
        <strong>What this collection is</strong>
        <p>
          Publicly indexed reports from established interview platforms, reviewed
          through 29 July 2026. These are candidate recollections, not official
          Qualcomm questions, and no report can guarantee what a future team will ask.
          Community speculation and unknown question-dump sites are excluded.
        </p>
      </aside>

      <div className="internet-tools">
        <label className="library-search internet-search">
          <span className="sr-only">Search reported interview questions</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search pointers, DMA, paging, RTOS, TCP…"
          />
          <span>{visibleQuestions.length}</span>
        </label>
        <div className="internet-filters" aria-label="Question area">
          <button
            type="button"
            className={activeArea === 'all' ? 'is-active' : ''}
            aria-pressed={activeArea === 'all'}
            onClick={() => setActiveArea('all')}
          >
            All
          </button>
          {areaDefinitions.map((area) => (
            <button
              type="button"
              key={area.id}
              className={activeArea === area.id ? 'is-active' : ''}
              aria-pressed={activeArea === area.id}
              onClick={() => setActiveArea(area.id)}
            >
              {area.label}
            </button>
          ))}
        </div>
      </div>

      {groupedQuestions.length ? (
        <div className="internet-question-groups">
          {groupedQuestions.map((group) => (
            <section className="internet-question-group" key={group.id}>
              <div className="index-heading">
                <h2>{group.label}</h2>
                <span>{group.questions.length} questions</span>
              </div>
              <div className="internet-question-list">
                {group.questions.map((question) => (
                  <QuestionItem
                    key={question.id}
                    question={question}
                    onOpenLesson={onOpenLesson}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="library-empty" role="status">
          <h2>No reported question matches that search.</h2>
          <p>Try a mechanism, language rule, peripheral, or coding pattern.</p>
        </div>
      )}

      <details className="internet-source-ledger">
        <summary>View all {qualcommIndiaWebSources.length} reviewed sources</summary>
        <div>
          {qualcommIndiaWebSources.map((source) => (
            <a key={source.id} href={source.url} target="_blank" rel="noreferrer">
              <span>
                <strong>{source.title}</strong>
                <small>{source.publisher} · {source.location} · {source.role}</small>
              </span>
              <span>{sourceLabel(source)} ↗</span>
            </a>
          ))}
        </div>
      </details>
    </main>
  );
}
