export function normalizedText(parts: readonly (string | null | undefined)[]): string {
  return parts
    .filter((part): part is string => part !== null && part !== undefined)
    .map((part) => part.replaceAll(/\s+/gu, ' ').trim())
    .filter((part) => part.length > 0)
    .join('\n')
    .slice(0, 12_000);
}

export function matchingElements(root: ParentNode, selector: string): HTMLElement[] {
  const matches = [...root.querySelectorAll<HTMLElement>(selector)];
  if (root instanceof HTMLElement && root.matches(selector)) {
    matches.unshift(root);
  }
  return matches;
}
