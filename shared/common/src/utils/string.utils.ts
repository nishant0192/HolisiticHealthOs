/**
 * Convert "hello world" → "Hello World"
 */
export const titleCase = (str: string): string =>
    str.replace(/\w\S*/g, w => w[0].toUpperCase() + w.slice(1).toLowerCase());
  
  /**
   * Convert "Some Thing!" → "some-thing"  (URL‑friendly)
   */
  export const slugify = (str: string): string =>
    str
      .normalize('NFKD')                  // remove diacritics
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')        // replace non‑alphanum with dashes
      .replace(/^-+|-+$/g, '');           // trim dashes
  
  /**
   * Truncate a string and append "…" if it exceeds max length.
   */
  export const truncate = (str: string, max = 80): string =>
    str.length <= max ? str : `${str.slice(0, max)}…`;
  