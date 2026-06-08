/**
 * Input sanitization utilities
 * Prevent XSS by stripping HTML/JS from user inputs
 */

/**
 * Strip HTML tags and encode special characters
 */
export function sanitizeText(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Validate and sanitize a URL
 */
export function sanitizeUrl(input: string): string {
  const trimmed = input.trim();
  // Only allow http/https URLs
  if (trimmed && !/^https?:\/\//i.test(trimmed)) {
    return '';
  }
  return trimmed;
}

/**
 * Validate a hex color
 */
export function sanitizeColor(input: string): string {
  if (/^#[0-9a-fA-F]{6}$/.test(input)) return input;
  return '#008060'; // default
}

/**
 * Validate widget position
 */
export function sanitizePosition(input: string): string {
  return input === 'bottom-left' ? 'bottom-left' : 'bottom-right';
}

/**
 * Sanitize FAQ items - strip HTML from questions and answers
 */
export function sanitizeFaqItem(question: string, answer: string): { question: string; answer: string } {
  return {
    question: question.replace(/<[^>]*>/g, '').trim(),
    answer: answer.replace(/<[^>]*>/g, '').trim(),
  };
}
