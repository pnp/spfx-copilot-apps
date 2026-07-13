/**
 * Lead-in phrases Copilot's `message` argument commonly carries around a
 * person's name (e.g. "find me Dharati Patel"). Longest/most specific
 * phrases are listed first so they're stripped whole rather than piecemeal.
 */
const LEAD_IN_PHRASES: string[] = [
  'can you please',
  'could you please',
  'can you',
  'could you',
  'i am looking for',
  "i'm looking for",
  'looking for',
  'find me',
  'find',
  'search for',
  'search',
  'look up',
  'lookup',
  'show me',
  'get me',
  'pull up',
  'bring up',
  "who's",
  'who is',
  'please'
];

/**
 * Best-effort extraction of a name/search term from the freeform `message`
 * Copilot passes as a tool argument, by stripping known request-phrasing
 * lead-ins (e.g. "find me ", "who is "). Not full NLP — just enough to turn
 * "find me dharati patel" into "dharati patel" for the search box.
 */
export function extractSearchQuery(message: string | undefined): string {
  if (!message) {
    return '';
  }

  let query = message.trim();
  let strippedAnyPhrase = true;
  while (strippedAnyPhrase) {
    strippedAnyPhrase = false;
    for (const phrase of LEAD_IN_PHRASES) {
      const pattern = new RegExp(`^${phrase}\\b\\s*`, 'i');
      if (pattern.test(query)) {
        query = query.replace(pattern, '').trim();
        strippedAnyPhrase = true;
      }
    }
  }

  return query.replace(/^[:,-]+\s*/, '').replace(/[?.!]+$/, '').trim();
}
