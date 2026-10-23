const COOKIE_NAME = 'session';

export function setSessionCookie(res, email) {
  res.cookie(COOKIE_NAME, email, {
    httpOnly: true,
    signed: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
}

export function clearSessionCookie(res) {
  res.clearCookie(COOKIE_NAME);
}

export function readSessionEmail(req) {
  return req.signedCookies[COOKIE_NAME];
}
