import { SearchResults } from './LibraryView.jsx';

export default function CategoryView({
  category,
  query,
  results,
  onQueryChange,
  onOpenLesson,
  onBack,
  searchRef,
}) {
  return (
    <main className="category-view">
      <button className="text-back" type="button" onClick={onBack}>← All categories</button>
      <header className="category-hero">
        <p className="eyebrow">Curriculum category</p>
        <h1>{category.title}</h1>
        <p>{category.description}</p>
      </header>

      <label className="library-search category-search">
        <span className="sr-only">Search lessons</span>
        <input
          ref={searchRef}
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder={`Search ${category.title} or the whole library`}
        />
        <kbd>/</kbd>
      </label>

      {query.trim() ? (
        <SearchResults query={query} results={results} onOpenLesson={onOpenLesson} />
      ) : (
        <section aria-labelledby="category-lessons-title">
          <div className="index-heading">
            <h2 id="category-lessons-title">Lessons in learning order</h2>
            <span>{category.topics.length} lessons</span>
          </div>
          <div className="lesson-index">
            {category.topics.map((topic, index) => (
              <button type="button" key={topic.id} onClick={() => onOpenLesson(topic.id)}>
                <span className="lesson-order">{String(index + 1).padStart(2, '0')}</span>
                <span className="lesson-index-copy">
                  {topic.group && <small>{topic.group}</small>}
                  <strong>{topic.title}</strong>
                  <span>{topic.keywords.slice(0, 4).join(', ')}</span>
                </span>
                <span className="lesson-depth">{topic.level}</span>
              </button>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
