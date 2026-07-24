import { allTopics, lessons } from './curriculum.js';

const normalize = (value = '') => value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

export function searchTopics(query) {
  const needle = normalize(query);
  if (!needle) return allTopics;

  return allTopics
    .map((entry) => {
      const title = normalize(entry.title);
      const keywords = normalize(entry.keywords.join(' '));
      const haystack = `${title} ${keywords}`;
      const score = title === needle
        ? 100
        : title.startsWith(needle)
          ? 80
          : title.includes(needle)
            ? 70
            : keywords.includes(needle)
              ? 50
              : haystack.includes(needle)
                ? 20
                : 0;
      return { ...entry, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score || left.title.localeCompare(right.title));
}

export function searchLessons(query) {
  const needle = normalize(query);
  if (!needle) return lessons;
  return lessons.filter((lesson) => {
    const blockText = lesson.blocks
      .map((block) => `${block.heading ?? ''} ${block.body ?? ''} ${block.prompt ?? ''} ${(block.items ?? []).join(' ')}`)
      .join(' ');
    return normalize(`${lesson.title} ${lesson.summary} ${blockText}`).includes(needle);
  });
}
