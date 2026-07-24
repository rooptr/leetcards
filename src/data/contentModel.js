import { lessonByTopicId } from './lessonCatalog.js';

export const LESSON_DEPTHS = Object.freeze(['brief', 'standard', 'deep']);

const requiredDeepBlocks = ['prediction', 'visual', 'failure', 'practice', 'recall'];

export function validateLesson(lesson) {
  const errors = [];
  if (!lesson?.topicId) errors.push('topicId');
  if (!LESSON_DEPTHS.includes(lesson?.depth)) errors.push('depth');
  if (!lesson?.summary || lesson.summary.length < 45) errors.push('summary');
  if (!Array.isArray(lesson?.blocks) || lesson.blocks.length < 3) errors.push('blocks');

  if (lesson?.depth === 'deep') {
    const types = new Set(lesson.blocks?.map((block) => block.type));
    for (const type of requiredDeepBlocks) {
      if (!types.has(type)) errors.push(`block:${type}`);
    }
    const visual = lesson.blocks?.find((block) => block.type === 'visual');
    const hasTrace = types.has('steps') || visual?.frames?.length >= 2;
    if (!hasTrace) errors.push('trace');
  }

  return { valid: errors.length === 0, errors };
}

export const getLessonForTopic = (topicId) => lessonByTopicId.get(topicId) ?? null;
