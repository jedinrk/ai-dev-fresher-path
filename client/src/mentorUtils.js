export function formatDate(value) {
  if (!value) return "Not recorded"
  const date = new Date(
    /Z$|[+-]\d\d:\d\d$/.test(value) ? value : `${value.replace(" ", "T")}Z`,
  )
  return Number.isNaN(date.getTime())
    ? "Not recorded"
    : date.toLocaleString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZoneName: "short",
      })
}

export function focusWeek(person) {
  return (
    person.weeks.find((w) =>
      ["submitted", "changes_requested"].includes(w.review?.status),
    ) ||
    person.weeks.find((w) => w.completed < w.total) ||
    person.weeks.at(-1)
  )
}
