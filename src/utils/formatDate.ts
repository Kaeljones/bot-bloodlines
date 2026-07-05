/**
 * Formats a Date object to Brazilian Portuguese standard format (DD/MM/YYYY HH:mm).
 */
export function formatDate(date: Date = new Date()): string {
  const pad = (num: number): string => num.toString().padStart(2, '0');
  
  const day = pad(date.getDate());
  const month = pad(date.getMonth() + 1); // Months are 0-based
  const year = date.getFullYear();
  
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}
