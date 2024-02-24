/**
 * @returns {string} The date formatted like "29.01.24"
 */
export function formatDate(date) {
  return Utilities.formatDate(date, Session.getScriptTimeZone(), 'dd.MM.yy');
}
