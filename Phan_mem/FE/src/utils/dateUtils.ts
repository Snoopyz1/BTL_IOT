/**
 * Utility functions for formatting and searching dates in format: yyyy/MM/dd HH:mm:ss
 */

/**
 * Format a Date object, ISO string, or timestamp into "yyyy/MM/dd HH:mm:ss"
 * Example: 2026/08/22 11:03:59
 */
export function formatDateTime(val?: string | Date | null): string {
  if (!val) return '—';
  const d = typeof val === 'string' ? new Date(val) : val;
  if (isNaN(d.getTime())) return String(val);

  const yyyy = d.getFullYear();
  const MM = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');

  return `${yyyy}/${MM}/${dd} ${hh}:${mm}:${ss}`;
}

/**
 * Check if a timestamp matches a user-entered time search string.
 * Supports matching against:
 * - "yyyy/MM/dd HH:mm:ss" (e.g. "2026/08/22 11:03:59")
 * - "yyyy/MM/dd" (e.g. "2026/08/22")
 * - "yyyy/MM" (e.g. "2026/08")
 * - "yyyy" (e.g. "2026")
 * - "HH:mm:ss" or "HH:mm" (e.g. "11:03:59", "11:03")
 * - Also supports hyphen format: "2026-08-22", "2026-08"
 * - Also supports Vietnamese DD/MM/YYYY format: "22/08/2026"
 */
export function matchTimeQuery(isoOrDate: string | Date, query: string): boolean {
  if (!query || !query.trim()) return true;
  const q = query.trim().toLowerCase();

  const formattedSlash = formatDateTime(isoOrDate).toLowerCase(); // "2026/08/22 11:03:59"
  const formattedHyphen = formattedSlash.replace(/\//g, '-'); // "2026-08-22 11:03:59"
  
  // Direct substring check on standard formatted versions
  if (formattedSlash.includes(q) || formattedHyphen.includes(q)) {
    return true;
  }

  // Normalized search query replacing hyphens with slashes or vice versa
  const qNormalizedSlash = q.replace(/-/g, '/');
  const qNormalizedHyphen = q.replace(/\//g, '-');
  if (formattedSlash.includes(qNormalizedSlash) || formattedHyphen.includes(qNormalizedHyphen)) {
    return true;
  }

  // Also check raw ISO string
  const rawIso = (typeof isoOrDate === 'string' ? isoOrDate : isoOrDate.toISOString()).toLowerCase();
  if (rawIso.includes(q)) {
    return true;
  }

  // Check DD/MM/YYYY format
  const d = typeof isoOrDate === 'string' ? new Date(isoOrDate) : isoOrDate;
  if (!isNaN(d.getTime())) {
    const dd = String(d.getDate()).padStart(2, '0');
    const MM = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    const vnSlash = `${dd}/${MM}/${yyyy}`;
    const vnHyphen = `${dd}-${MM}-${yyyy}`;
    if (vnSlash.includes(q) || vnHyphen.includes(q)) {
      return true;
    }
  }

  return false;
}
