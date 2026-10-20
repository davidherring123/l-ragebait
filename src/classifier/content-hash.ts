export async function hashContent(text: string): Promise<string> {
  const normalized = text.normalize('NFKC').replaceAll(/\s+/gu, ' ').trim();
  const bytes = new TextEncoder().encode(normalized);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)]
    .map((value) => value.toString(16).padStart(2, '0'))
    .join('');
}
