const prefix = "syntree:draft:"
export function draftKey(user, lesson) {
  return `${prefix}${user}:${lesson}`
}
export function readDraft(key) {
  try {
    return key ? localStorage.getItem(key) || "" : ""
  } catch {
    return ""
  }
}
export function saveDraft(key, value) {
  try {
    if (key) localStorage.setItem(key, value)
    return Boolean(key)
  } catch {
    return false
  }
}
export function removeDraft(key) {
  try {
    if (key) localStorage.removeItem(key)
  } catch {
    /* Storage can be disabled. */
  }
}
export function clearDrafts(user) {
  try {
    Object.keys(localStorage)
      .filter((key) => key.startsWith(`${prefix}${user}:`))
      .forEach((key) => localStorage.removeItem(key))
  } catch {
    /* Logout still works without storage. */
  }
}
