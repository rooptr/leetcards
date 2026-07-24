const LEETCARDS_CAPTURE_URL = 'https://rooptr.github.io/leetcards/#/capture/';

const captureButton = document.querySelector('#capture');
const statusOutput = document.querySelector('#status');

const setStatus = (message, kind = 'info') => {
  statusOutput.textContent = message;
  statusOutput.dataset.kind = kind;
};

const encodePayload = (payload) => {
  const bytes = new TextEncoder().encode(JSON.stringify(payload));
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replace(/=+$/g, '');
};

const readCurrentProblem = () => {
  if (location.origin !== 'https://leetcode.com') {
    return { error: 'Open a problem on leetcode.com first.' };
  }

  const pathMatch = location.pathname.match(/^\/problems\/([a-z0-9-]+)\/?/);
  if (!pathMatch) {
    return { error: 'This is not a LeetCode problem page.' };
  }

  const slug = pathMatch[1];
  const canonicalPath = `/problems/${slug}/`;
  const titleCandidates = [
    document.querySelector('[data-cy="question-title"]')?.textContent,
    document.querySelector(`a[href="${canonicalPath}"]`)?.textContent,
    document.querySelector('h1')?.textContent,
    document.title.replace(/\s*-\s*LeetCode.*$/i, ''),
  ];

  const title = titleCandidates
    .map((value) => value?.replace(/^\s*\d+\.\s*/, '').replace(/\s+/g, ' ').trim())
    .find((value) => value && value.length <= 140);

  if (!title) return { error: 'The problem title could not be read.' };

  const difficulty = [...document.querySelectorAll('span, div')]
    .map((element) => element.textContent?.trim())
    .find((text) => /^(Easy|Medium|Hard)$/.test(text)) ?? 'Unknown';

  const tags = [...document.querySelectorAll('a[href^="/tag/"]')]
    .map((element) => element.textContent?.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .filter((tag, index, all) => all.indexOf(tag) === index)
    .slice(0, 12);

  return {
    payload: {
      version: 1,
      provider: 'leetcode',
      slug,
      title,
      difficulty: difficulty.toLowerCase(),
      tags,
      url: `${location.origin}${canonicalPath}`,
      capturedAt: new Date().toISOString(),
    },
  };
};

captureButton.addEventListener('click', async () => {
  captureButton.disabled = true;
  setStatus('Checking the active tab.');

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) throw new Error('No active browser tab was found.');

    const [result] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      world: 'ISOLATED',
      func: readCurrentProblem,
    });

    if (result?.result?.error) throw new Error(result.result.error);
    if (!result?.result?.payload) throw new Error('The problem metadata was unavailable.');

    const encoded = encodePayload(result.result.payload);
    await chrome.tabs.create({ url: `${LEETCARDS_CAPTURE_URL}${encoded}` });
    setStatus('Captured. Opening Leetcards.');
  } catch (error) {
    setStatus(error instanceof Error ? error.message : 'Capture failed.', 'error');
    captureButton.disabled = false;
  }
});
