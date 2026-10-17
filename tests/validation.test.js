import test from 'node:test';
import assert from 'node:assert/strict';
import { checkCopy, checkLanguages, checkImage } from '../assets/validation.js';
test('Chinese copy differs between UTF-8 bytes and code points', () => {
  assert.equal(checkCopy('你好', 2, 'characters').pass, true);
  assert.deepEqual(checkCopy('你好', 5, 'bytes'), { count: 6, limit: 5, pass: false, empty: false });
  assert.equal(checkCopy('你好', 6, 'bytes').pass, true);
});
test('empty text fails and emoji counts by code point', () => {
  assert.equal(checkCopy('   ', 30, 'characters').pass, false);
  assert.equal(checkCopy('🚀', 1, 'characters').count, 1);
  assert.equal(checkCopy('🚀', 3, 'bytes').pass, false);
});
test('language coverage normalizes case, separators, and duplicates', () => {
  assert.equal(checkLanguages('EN_us，zh_cn,ja-JP,en-US').pass, true);
  assert.deepEqual(checkLanguages('en-US').missing, ['zh-CN', 'ja-JP']);
});
test('image rules enforce dimensions, supported types, and file size', () => {
  const image = { type: 'image/png', width: 800, height: 450, size: 5 * 1024 * 1024 };
  assert.equal(checkImage(image).pass, true);
  for (const change of [{ width: 799 }, { height: 449 }, { type: 'image/gif' }, { size: image.size + 1 }]) assert.equal(checkImage({ ...image, ...change }).pass, false);
});
