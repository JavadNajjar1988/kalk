export function htmlTagEscape(text: string) {
  return text.replace(/&/g, " ").replace(/</g, " ").replace(/>/g, " ");
}

interface FuzzyHighlightResult {
  highlight<T>(callback: (match: string, index: number) => T): (string | T)[];
}

export function fuzzyHighlight(result: FuzzyHighlightResult): string {
  const parts = result.highlight((match) => ({ match }));
  return parts
    .map((part) =>
      typeof part === "string"
        ? htmlTagEscape(part)
        : `<b>${htmlTagEscape(part.match)}</b>`,
    )
    .join("");
}

export function isUrl(str: string) {
  try {
    new URL(str);
  } catch (_) {
    return false;
  }

  return true;
}
