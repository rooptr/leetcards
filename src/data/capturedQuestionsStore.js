const DATABASE_NAME = 'leetcards-local';
const DATABASE_VERSION = 1;
const STORE_NAME = 'captured-questions';

const openDatabase = () => new Promise((resolve, reject) => {
  if (!globalThis.indexedDB) {
    reject(new Error('Local browser storage is unavailable'));
    return;
  }

  const request = globalThis.indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
  request.onerror = () => reject(request.error ?? new Error('Could not open local storage'));
  request.onupgradeneeded = () => {
    const database = request.result;
    if (!database.objectStoreNames.contains(STORE_NAME)) {
      database.createObjectStore(STORE_NAME, { keyPath: 'slug' });
    }
  };
  request.onsuccess = () => resolve(request.result);
});

const withStore = async (mode, run) => {
  const database = await openDatabase();
  try {
    return await new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, mode);
      const store = transaction.objectStore(STORE_NAME);
      const request = run(store);
      let result;
      request.onsuccess = () => {
        result = request.result;
      };
      transaction.oncomplete = () => resolve(result);
      transaction.onerror = () => reject(
        transaction.error ?? request.error ?? new Error('Local storage request failed'),
      );
      transaction.onabort = () => reject(
        transaction.error ?? new Error('Local storage transaction was cancelled'),
      );
    });
  } finally {
    database.close();
  }
};

export const loadCapturedQuestions = async () => {
  const records = await withStore('readonly', (store) => store.getAll());
  return records.sort((left, right) => right.capturedAt.localeCompare(left.capturedAt));
};

export const saveCapturedQuestion = async (record) => {
  await withStore('readwrite', (store) => store.put(record));
  return record;
};
