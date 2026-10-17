export const REQUIRED_LANGUAGES = ['en-US', 'zh-CN', 'ja-JP'];
export function normalizeLanguage(value) {
  return value.trim().replaceAll('_', '-').toLowerCase();
}
export function checkCopy(text, limit, unit) {
  if (!Number.isInteger(limit) || limit < 1 || limit > 100000) throw new Error('Invalid limit');
  if (!['characters', 'bytes'].includes(unit)) throw new Error('Invalid unit');
  const count = unit === 'bytes' ? new TextEncoder().encode(text).length : [...text].length;
  return { count, limit, pass: text.trim().length > 0 && count <= limit, empty: !text.trim() };
}
export function checkLanguages(input) {
  const provided = new Set(input.split(/[,，\n]/).map(normalizeLanguage).filter(Boolean));
  const missing = REQUIRED_LANGUAGES.filter(item => !provided.has(normalizeLanguage(item)));
  return { missing, pass: missing.length === 0 };
}
export function checkImage({ type, size, width, height }) {
  return { pass: ['image/png', 'image/jpeg', 'image/webp'].includes(type) && size <= 5 * 1024 * 1024 && width >= 800 && height >= 450 };
}
