const BREAK_TAG_REGEX = /<br\s*\/?>/gi;
const WHITESPACE_REGEX = /\s+/g;

export function normalizeSentenceForSharing(text = ""): string {
  return text
    .replace(BREAK_TAG_REGEX, " ")
    .replace(WHITESPACE_REGEX, " ")
    .trim();
}

