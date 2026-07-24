const MAX_CAPTURE_LENGTH = 16_000;
const difficultyValues = new Set(['easy', 'medium', 'hard', 'unknown']);

const encodeUtf8 = (value) => {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
};

const decodeUtf8 = (value) => {
  const binary = atob(value);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new TextDecoder().decode(bytes);
};

const cleanText = (value, maxLength) => {
  if (typeof value !== 'string') return '';
  return value.replace(/\s+/g, ' ').trim().slice(0, maxLength);
};

export function validateCapturePayload(value) {
  if (!value || typeof value !== 'object') throw new Error('Capture payload is missing');
  if (value.version !== 1 || value.provider !== 'leetcode') {
    throw new Error('Capture payload has an unsupported source');
  }

  let url;
  try {
    url = new URL(value.url);
  } catch {
    throw new Error('Capture URL is invalid');
  }

  if (url.protocol !== 'https:' || url.hostname !== 'leetcode.com') {
    throw new Error('Capture must come from leetcode.com');
  }

  const pathMatch = url.pathname.match(/^\/problems\/([a-z0-9-]+)\/?/);
  if (!pathMatch) throw new Error('Capture is not a LeetCode problem page');
  const suppliedSlug = cleanText(value.slug, 160).toLowerCase();
  if (!suppliedSlug || suppliedSlug !== pathMatch[1]) {
    throw new Error('Capture slug does not match its URL');
  }

  const title = cleanText(value.title, 140);
  if (!title) throw new Error('Capture title is missing');

  const difficulty = cleanText(value.difficulty, 12).toLowerCase();
  const capturedAt = new Date(value.capturedAt);
  if (Number.isNaN(capturedAt.valueOf())) throw new Error('Capture time is invalid');

  const tags = Array.isArray(value.tags)
    ? value.tags.map((tag) => cleanText(tag, 40)).filter(Boolean).slice(0, 12)
    : [];

  return {
    version: 1,
    provider: 'leetcode',
    slug: pathMatch[1],
    title,
    difficulty: difficultyValues.has(difficulty) ? difficulty : 'unknown',
    tags,
    url: `${url.origin}/problems/${pathMatch[1]}/`,
    capturedAt: capturedAt.toISOString(),
  };
}

export function encodeCapturePayload(payload) {
  const validated = validateCapturePayload(payload);
  return encodeUtf8(JSON.stringify(validated))
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replace(/=+$/g, '');
}

export function decodeCapturePayload(encoded) {
  if (typeof encoded !== 'string' || encoded.length === 0 || encoded.length > MAX_CAPTURE_LENGTH) {
    throw new Error('Capture payload is empty or too large');
  }
  if (!/^[A-Za-z0-9_-]+$/.test(encoded)) {
    throw new Error('Capture payload could not be read');
  }

  const base64 = encoded.replaceAll('-', '+').replaceAll('_', '/');
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');

  try {
    return validateCapturePayload(JSON.parse(decodeUtf8(padded)));
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Capture ')) throw error;
    throw new Error('Capture payload could not be read');
  }
}
