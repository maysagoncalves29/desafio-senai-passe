const CONTROL_CHARACTERS = /\p{Cc}/u;
const ACCENT_MARKS = /\p{Mn}/gu;
const LETTER = /\p{L}/u;

export function hasControlCharacters(text: string): boolean {
  return CONTROL_CHARACTERS.test(text);
}

// Remove espaços (U+0020) das pontas e reduz espaços repetidos a um só.
export function collapseSpaces(text: string): string {
  return text.replace(/ {2,}/g, ' ').replace(/^ +| +$/g, '');
}

export function stripAccents(text: string): string {
  return text.normalize('NFD').replace(ACCENT_MARKS, '');
}

export function normalizeForSearch(text: string): string {
  return stripAccents(text.toLowerCase());
}

export function countCharacters(text: string): number {
  return Array.from(text).length;
}

export function countWords(text: string): number {
  return text.split(' ').filter((token) => LETTER.test(token)).length;
}

export function compareNames(first: string, second: string): number {
  const firstPoints = Array.from(normalizeForSearch(first));
  const secondPoints = Array.from(normalizeForSearch(second));
  const shortest = Math.min(firstPoints.length, secondPoints.length);
  for (let index = 0; index < shortest; index += 1) {
    const difference = firstPoints[index]!.codePointAt(0)! - secondPoints[index]!.codePointAt(0)!;
    if (difference !== 0) return difference;
  }
  return firstPoints.length - secondPoints.length;
}

export function compareByNameThenId(
  first: { name: string; id: number },
  second: { name: string; id: number },
): number {
  return compareNames(first.name, second.name) || first.id - second.id;
}
