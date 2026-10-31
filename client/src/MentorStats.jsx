export function Stats({ items }) {
  return (
    <div className="mentor-metrics">
      {items.map(([value, label]) => (
        <div key={label}>
          <strong
            className={
              String(value).length > 20 ? "mentor-metric-detail" : undefined
            }
          >
            {value}
          </strong>
          <span>{label}</span>
        </div>
      ))}
    </div>
  )
}
