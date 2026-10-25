// The lesson text subset with its markers removed, for places that need a plain string.
export function plainText(text) {
  return (text || "")
    .replace(/^### /gm, "")
    .replace(/^- /gm, "")
    .replace(/^\d+\. /gm, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
}
