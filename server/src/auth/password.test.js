import { describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword } from './password.js';

describe('password hashing', () => {
  it('verifies the correct password', () => {
    const hash = hashPassword('correct-horse');
    expect(verifyPassword('correct-horse', hash)).toBe(true);
  });

  it('rejects an incorrect password', () => {
    const hash = hashPassword('correct-horse');
    expect(verifyPassword('wrong-password', hash)).toBe(false);
  });

  it('salts each hash differently', () => {
    expect(hashPassword('same-password')).not.toBe(hashPassword('same-password'));
  });
});
