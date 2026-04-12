import { Link } from 'react-router-dom'
import { formatMoney, calcGoalValue, calcCurrentValue, calcProgressPercent } from '../../utils/formatters'

export default function ProjectCard({ project }) {
  const goalValue = calcGoalValue(project)
  const currentValue = calcCurrentValue(project, project)
  const percent = calcProgressPercent(currentValue, goalValue)

  return (
    <div className="project-card">
      {project.media_urls?.[0] && (
        <img src={project.media_urls[0]} alt={project.title} className="project-card-img" />
      )}
      <div className="project-card-body">
        <h3>{project.title}</h3>
        <div className="progress-bar-wrap">
          <div className="progress-bar">
            <div className="progress-bar-fill" style={{ width: `${percent}%` }} />
          </div>
          <span className="progress-text">{percent}%</span>
        </div>
        <p className="progress-desc">
          已筹 {formatMoney(currentValue)} / 目标 {formatMoney(goalValue)}
        </p>
        <Link to={`/projects/${project.id}`} className="donate-btn">立即捐赠</Link>
      </div>
    </div>
  )
}
