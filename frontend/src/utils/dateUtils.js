/**
 * Date utility for KK Brothers Management System
 * Standard project date format: DD/MM/YYYY (e.g. 19/11/2026)
 */

export const formatDate = (dateValue) => {
  if (!dateValue) return '—';

  // If string in YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss format, extract directly to avoid timezone shift
  if (typeof dateValue === 'string') {
    const trimmed = dateValue.trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
      const [year, month, day] = trimmed.slice(0, 10).split('-');
      return `${day}/${month}/${year}`;
    }
  }

  const d = new Date(dateValue);
  if (isNaN(d.getTime())) return '—';

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();

  return `${day}/${month}/${year}`;
};

export const formatDateTime = (dateValue) => {
  if (!dateValue) return '—';
  const d = new Date(dateValue);
  if (isNaN(d.getTime())) return '—';

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();

  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const formattedHours = String(hours).padStart(2, '0');

  return `${day}/${month}/${year}, ${formattedHours}:${minutes} ${ampm}`;
};

// Convert ISO string (YYYY-MM-DD) to DD/MM/YYYY
export const toDisplayDate = (isoStr) => {
  if (!isoStr) return '';
  if (typeof isoStr === 'string' && /^\d{4}-\d{2}-\d{2}/.test(isoStr)) {
    const [y, m, d] = isoStr.slice(0, 10).split('-');
    return `${d}/${m}/${y}`;
  }
  return formatDate(isoStr);
};

// Convert DD/MM/YYYY to ISO string (YYYY-MM-DD)
export const toIsoDate = (displayStr) => {
  if (!displayStr) return '';
  const parts = displayStr.trim().split(/[\/\-.]/);
  if (parts.length === 3) {
    const [d, m, y] = parts;
    if (d.length <= 2 && m.length <= 2 && y.length === 4) {
      return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }
  }
  return displayStr;
};

export default formatDate;
