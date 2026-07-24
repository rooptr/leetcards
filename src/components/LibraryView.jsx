function SearchResults({ query, results, onOpenLesson }) {
  if (!results.length) {
    return (
      <div className="library-empty" role="status">
        <h2>No lesson found</h2>
        <p>Try a mechanism, tool, peripheral, or problem pattern.</p>
      </div>
    );
  }

  return (
    <section className="search-results" aria-labelledby="search-results-title">
      <div className="index-heading">
        <h2 id="search-results-title">Search results</h2>
        <span>{results.length} for “{query}”</span>
      </div>
      <div className="lesson-index">
        {results.map((topic) => (
          <button type="button" key={topic.id} onClick={() => onOpenLesson(topic.id)}>
            <span className="lesson-index-copy">
              <small>{topic.sectionTitle}</small>
              <strong>{topic.title}</strong>
            </span>
            <span className="lesson-depth">{topic.level}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

export default function LibraryView({
  curriculum,
  query,
  results,
  onQueryChange,
  onOpenCategory,
  onOpenLesson,
  searchRef,
}) {
  return (
    <main className="library-view">
      <header className="library-intro">
        <p className="eyebrow">Systems curriculum</p>
        <h1>Learn the machine from first principles.</h1>
        <p>
          Begin with C and hardware foundations. Move through Linux, electronics,
          embedded systems, STM32F446RE, RTOS, and the DSA patterns that matter.
        </p>
      </header>

      <label className="library-search">
        <span className="sr-only">Search every lesson</span>
        <input
          ref={searchRef}
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search lessons, tools, registers, patterns"
        />
        <kbd>/</kbd>
      </label>

      {query.trim() ? (
        <SearchResults query={query} results={results} onOpenLesson={onOpenLesson} />
      ) : (
        <section className="category-index" aria-labelledby="category-index-title">
          <div className="index-heading">
            <h2 id="category-index-title">Categories</h2>
            <span>{curriculum.reduce((total, item) => total + item.topics.length, 0)} lessons</span>
          </div>
          <div className="category-grid">
            {curriculum.map((category, index) => (
              <button
                className={`category-entry category-entry-${(index % 5) + 1}`}
                type="button"
                key={category.id}
                onClick={() => onOpenCategory(category.id)}
              >
                <span className="category-number">{String(index + 1).padStart(2, '0')}</span>
                <span className="category-copy">
                  <strong>{category.title}</strong>
                  <span>{category.description}</span>
                  <small>
                    {category.topics.length} lessons
                    <span aria-hidden="true"> / </span>
                    {category.topics.slice(0, 3).map((topic) => topic.title).join(', ')}
                  </small>
                </span>
                <span className="category-arrow" aria-hidden="true">→</span>
              </button>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

export { SearchResults };
