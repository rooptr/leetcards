const clean = (value) => {
  try {
    return decodeURIComponent(value ?? '');
  } catch {
    return '';
  }
};

export function parseRoute(hash = '') {
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  if (parts.length === 0) return { view: 'library' };
  if (parts[0] === 'category' && parts.length === 2) {
    return { view: 'category', sectionId: clean(parts[1]) };
  }
  if (parts[0] === 'lesson' && parts.length === 2) {
    return { view: 'lesson', topicId: clean(parts[1]) };
  }
  return { view: 'library' };
}

export const routeForLibrary = () => '#/';
export const routeForCategory = (sectionId) => `#/category/${encodeURIComponent(sectionId)}`;
export const routeForLesson = (topicId) => `#/lesson/${encodeURIComponent(topicId)}`;
