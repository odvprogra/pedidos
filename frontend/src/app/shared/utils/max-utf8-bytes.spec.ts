import { FormControl } from '@angular/forms';
import { maxUtf8Bytes } from './max-utf8-bytes';

describe('maxUtf8Bytes', () => {
  const validate = (value: string) => maxUtf8Bytes(72)(new FormControl(value));

  it('accepts a value that fits the limit exactly', () => {
    expect(validate('a'.repeat(72))).toBeNull();
    expect(validate('ñ'.repeat(36))).toBeNull();
  });

  it('rejects a value with more bytes than the limit', () => {
    expect(validate('a'.repeat(73))).toEqual({ maxbytes: { max: 72, actual: 73 } });
  });

  it('counts the bytes of accented letters, not the characters', () => {
    expect(validate('ñ'.repeat(37))).toEqual({ maxbytes: { max: 72, actual: 74 } });
  });
});
