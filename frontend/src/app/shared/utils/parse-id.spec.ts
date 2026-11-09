import { parseId } from './parse-id';

describe('parseId', () => {
  it.each([
    ['4', 4],
    ['120', 120],
    ['999999999999999', 999999999999999],
  ])('reads the id %s', (text, id) => {
    expect(parseId(text)).toBe(id);
  });

  it.each([
    ['a word', 'abc'],
    ['zero', '0'],
    ['a leading zero', '04'],
    ['a negative number', '-4'],
    ['a decimal', '4.5'],
    ['spaces', ' 4 '],
    ['an empty text', ''],
    ['a number too long to be exact', '9999999999999999'],
  ])('rejects %s', (_case, text) => {
    expect(parseId(text)).toBeNull();
  });
});
