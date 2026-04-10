import { calcProgressPercent } from '../../utils/formatters'

export default function ProgressBar({ current, goal, showPercent = true }) {
  const percent = calcProgressPercent(current, goal)
  return (
    <div className="progress-bar-wrap">
      <div className="progress-bar">
        <div className="progress-bar-fill" style={{ width: `${percent}%` }} />
      </div>
      {showPercent && <span className="progress-text">{percent}%</span>}
    </div>
  )
}
