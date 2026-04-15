const FALLBACK_COMMENTS = [
  'Great post 🔥',
  'Love this 🙌',
  'Amazing content ✨',
  'So good! 👏',
  'This is awesome 😍'
];

export function pickRandomComment(customComments = []) {
  const source = customComments.length > 0 ? customComments : FALLBACK_COMMENTS;
  const index = Math.floor(Math.random() * source.length);
  return source[index];
}

export function buildCommentPool({ baseComments = [], hashtags = [] } = {}) {
  const hashtagSuffix = hashtags.length > 0 ? ` ${hashtags.join(' ')}` : '';

  return baseComments.map((comment) => `${comment}${hashtagSuffix}`.trim());
}
