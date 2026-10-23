function parseAllowlist() {
  return (process.env.ALLOWLIST_EMAILS || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isAllowlisted(email) {
  return parseAllowlist().includes(email.trim().toLowerCase());
}

export function roleForEmail(email) {
  const mentorEmail = (process.env.MENTOR_EMAIL || '').trim().toLowerCase();
  return email.trim().toLowerCase() === mentorEmail ? 'mentor' : 'intern';
}
