/**
 * Sanitizes input text to remove Discord markdown formatting, mentions,
 * and dangerous or unprintable characters.
 */
export function sanitizeName(name: string): string {
  if (!name) return '';
  
  // Remove Discord mentions (<@123>, <@!123>, <@&123>, <#123>)
  let clean = name.replace(/<@&?\d+>|<#\d+>|<@!\d+>/g, '');
  
  // Remove Markdown formatting characters (*, _, `, ~, |, >, #, @)
  clean = clean.replace(/[`*_~|>#@\\]/g, '');
  
  // Replace any tabs, newlines or carriage returns with spaces
  clean = clean.replace(/[\r\n\t]+/g, ' ');
  
  // Remove multiple consecutive spaces
  clean = clean.replace(/\s+/g, ' ');
  
  return clean.trim();
}
