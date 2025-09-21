// components/Tracker/MetricInput.jsx
export default function MetricInput({
  type,
  label,
  value,
  options = [],
  onChange,
  min = 0,
  max = 10,
  colorMap = {},
}) {
  const getColor = () => {
    if (!colorMap || !Object.keys(colorMap).length) return ""
    const key = Math.floor(value)
    return colorMap[key] || colorMap[Object.keys(colorMap)[0]]
  }

  return (
    <div className="metric">
      <div className="metric-label">{label}</div>
      {type === "buttons" && (
        <div className="metric-buttons">
          {options.map((opt) => (
            <button
              key={String(opt.value)}
              className={`metric-btn ${value === opt.value ? "active" : ""}`}
              onClick={() => onChange(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
      {type === "number" && (
        <input
          className="metric-input"
          type="number"
          inputMode="numeric"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="0"
        />
      )}
      {type === "toggle" && (
        <button
          className={`toggle ${value ? "on" : "off"}`}
          onClick={() => onChange(!value)}
        >
          <span className="knob" />
        </button>
      )}
      {type === "slider" && (
        <div className="slider-wrap">
          <input
            className="slider"
            type="range"
            min={min}
            max={max}
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            style={{ accentColor: getColor() }} // ← цвет ползунка
          />
          <div className="slider-value">{value}</div>
        </div>
      )}
    </div>
  )
}
