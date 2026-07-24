import { useCallback, useEffect, useState } from 'react';
import { decodeCapturePayload } from '../data/capture.js';
import {
  loadCapturedQuestions,
  saveCapturedQuestion,
} from '../data/capturedQuestionsStore.js';
import { matchCapturedQuestion } from '../data/questionCards.js';

export default function useCapturedQuestions() {
  const [capturedQuestions, setCapturedQuestions] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [storageError, setStorageError] = useState('');
  const [importResult, setImportResult] = useState({ status: 'idle' });

  useEffect(() => {
    let active = true;

    loadCapturedQuestions()
      .then((records) => {
        if (active) setCapturedQuestions(records);
      })
      .catch((error) => {
        if (active) setStorageError(error.message);
      })
      .finally(() => {
        if (active) setLoaded(true);
      });

    return () => {
      active = false;
    };
  }, []);

  const importCapture = useCallback(async (encodedPayload) => {
    setImportResult({ status: 'loading' });

    try {
      const capture = decodeCapturePayload(encodedPayload);
      const match = matchCapturedQuestion(capture);

      const record = {
        slug: capture.slug,
        title: capture.title,
        difficulty: capture.difficulty,
        tags: capture.tags,
        url: capture.url,
        capturedAt: capture.capturedAt,
        questionId: match?.id ?? null,
      };

      await saveCapturedQuestion(record);
      setCapturedQuestions((current) => [
        record,
        ...current.filter((item) => item.slug !== record.slug),
      ]);

      const result = match
        ? { status: 'saved', capture, question: match }
        : { status: 'saved-unmatched', capture };
      setImportResult(result);
      return result;
    } catch (error) {
      const result = {
        status: 'error',
        message: error instanceof Error ? error.message : 'Capture failed',
      };
      setImportResult(result);
      return result;
    }
  }, []);

  return {
    capturedQuestions,
    importCapture,
    importResult,
    loaded,
    storageError,
  };
}
