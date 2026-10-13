export const fmtNum = (n) => (typeof n === 'number' ? n.toLocaleString('en-US') : '—');

export function fmtDate(iso, withTime = false) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('en-GB', {
      timeZone: 'Asia/Colombo',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      ...(withTime ? { hour: '2-digit', minute: '2-digit', hour12: false } : {})
    });
  } catch {
    return String(iso).slice(0, 10);
  }
}

export const isDate = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s);
export const prettyType = (t) =>
  String(t || 'other').replace(/[_-]/g, ' ').replace(/\b\w/g, (ch) => ch.toUpperCase());
export const shortId = (id) => String(id || '').slice(-6).toUpperCase();
