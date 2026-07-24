import LessonBlock from './LessonBlock.jsx';

export default function LessonReader({
  topic,
  lesson,
  previous,
  next,
  onNavigate,
  onBack,
  onGlossary,
}) {
  return (
    <article className="lesson-reader">
      <button className="text-back lesson-back" type="button" onClick={onBack}>
        ← {topic.sectionTitle}
      </button>
      <header className="lesson-hero">
        <div className="lesson-meta">
          <span>{topic.sectionTitle}</span>
          <span aria-hidden="true">/</span>
          <span>{lesson.depth} lesson</span>
        </div>
        <h1>{lesson.title}</h1>
        <p>{lesson.summary}</p>
        <button className="glossary-trigger" type="button" onClick={onGlossary}>
          Open glossary
        </button>
      </header>

      <div className="lesson-flow lesson-content" id="lesson-content">
        {lesson.blocks.map((block, index) => (
          <LessonBlock key={`${block.type}-${block.heading ?? index}`} block={block} />
        ))}
      </div>

      <nav className="lesson-pagination" aria-label="Adjacent lessons">
        {previous ? (
          <button type="button" onClick={() => onNavigate(previous)}>
            <small>Previous</small>
            <span>{previous.title}</span>
          </button>
        ) : <span />}
        {next && (
          <button type="button" className="next-topic" onClick={() => onNavigate(next)}>
            <small>Next</small>
            <span>{next.title}</span>
          </button>
        )}
      </nav>
    </article>
  );
}
