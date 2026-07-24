export default function CaptureImportView({
  result,
  onOpenQuestion,
  onOpenQuestions,
}) {
  if (result.status === 'loading' || result.status === 'idle') {
    return (
      <main className="capture-result">
        <p className="eyebrow">Safe capture</p>
        <h1>Reading the problem metadata.</h1>
        <p>Only the title, URL, difficulty, tags, and capture time are being checked.</p>
      </main>
    );
  }

  if (result.status === 'saved') {
    return (
      <main className="capture-result">
        <p className="eyebrow">Saved locally</p>
        <h1>{result.capture.title}</h1>
        <p>
          Matched to {result.question.title}. Its solution path and recall cards
          are ready.
        </p>
        <div className="capture-actions">
          <button type="button" onClick={() => onOpenQuestion(result.question.id)}>
            Study solution
          </button>
          <button type="button" onClick={onOpenQuestions}>All questions</button>
        </div>
      </main>
    );
  }

  if (result.status === 'saved-unmatched') {
    return (
      <main className="capture-result">
        <p className="eyebrow">Saved locally</p>
        <h1>{result.capture.title}</h1>
        <p>
          The solved marker is saved. Leetcards does not yet have a reliable
          explanation for this question, so it will not invent one.
        </p>
        <div className="capture-actions">
          <button type="button" onClick={onOpenQuestions}>Browse supported questions</button>
        </div>
      </main>
    );
  }

  return (
    <main className="capture-result">
      <p className="eyebrow">Capture rejected</p>
      <h1>This capture could not be trusted.</h1>
      <p>{result.message}</p>
      <div className="capture-actions">
        <button type="button" onClick={onOpenQuestions}>Return to questions</button>
      </div>
    </main>
  );
}
