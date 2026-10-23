import { scryptSync, randomBytes, timingSafeEqual } from 'node:crypto';

const KEY_LENGTH = 64;

export function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, KEY_LENGTH).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password, storedHash) {
  const [salt, hash] = storedHash.split(':');
  const hashBuffer = Buffer.from(hash, 'hex');
  const candidate = scryptSync(password, salt, KEY_LENGTH);
  return timingSafeEqual(hashBuffer, candidate);
}
