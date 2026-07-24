import MechanismVisual from './MechanismVisual.jsx';
import { CodePairBlock } from './LessonBlock.jsx';

function FlashcardDeck({ cards }) {
  return (
    <section className="question-flashcards" aria-labelledby="flashcards-title">
      <header>
        <h2 id="flashcards-title">Recall cards</h2>
        <p>Answer first, then reveal the compact check.</p>
      </header>
      <div>
        {cards.map((card) => (
          <details key={card.prompt}>
            <summary>{card.prompt}</summary>
            <p>{card.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

export default function QuestionReader({
  question,
  captures,
  onBack,
  onOpenLesson,
}) {
  const solvedCopies = captures.filter((capture) => capture.questionId === question.id);

  return (
    <main className="reader-main">
      <article className="question-reader">
        <button className="text-back lesson-back" type="button" onClick={onBack}>
          All questions
        </button>

        <header className="question-hero">
          <div className="lesson-meta">
            <span>{question.group}</span>
            <span aria-hidden="true">/</span>
            <span>{solvedCopies.length > 0 ? 'captured as solved' : 'practice question'}</span>
          </div>
          <h1>{question.title}</h1>
          <p>{question.summary}</p>
        </header>

        <section className="how-to-solve" aria-labelledby="how-to-solve-title">
          <header>
            <h2 id="how-to-solve-title">How to solve it</h2>
            <p>{question.prediction}</p>
          </header>

          <div className="solve-map">
            <article>
              <h3>Recognize</h3>
              <p>{question.recognition}</p>
            </article>
            <article>
              <h3>Carry the state</h3>
              <p>{question.invariant}</p>
            </article>
            <article>
              <h3>Make the move</h3>
              <p>{question.move}</p>
            </article>
            <article>
              <h3>Check the boundary</h3>
              <p>{question.boundary}</p>
            </article>
            <article>
              <h3>Defend the cost</h3>
              <p>{question.complexity}</p>
            </article>
          </div>
        </section>

        <section className="question-trace" aria-labelledby="question-trace-title">
          <h2 id="question-trace-title">Trace the reasoning</h2>
          <MechanismVisual block={{ ...question.visual, type: 'visual' }} />
        </section>

        <CodePairBlock
          className="question-code"
          block={{
            heading: 'Implementation shape',
            note: 'Read each update against the invariant above. The code is the final expression of the reasoning, not the starting point.',
            variants: [
              {
                id: 'c',
                label: 'C',
                standard: 'C17',
                code: question.cCode,
              },
              {
                id: 'cpp',
                label: 'C++',
                standard: 'C++20',
                code: question.cppCode,
              },
            ],
          }}
        />

        <FlashcardDeck cards={question.flashcards} />

        <footer className="question-concept-link">
          <p>Need the full mechanism, failure cases, and paired C and C++ implementation?</p>
          <button type="button" className="underlined-button" onClick={() => onOpenLesson(question.lessonTopicId)}>
            Open the concept lesson
          </button>
        </footer>
      </article>
    </main>
  );
}
