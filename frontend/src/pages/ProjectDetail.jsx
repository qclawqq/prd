import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getPublicProject } from '../api/projects'
import { getPublicAchievements } from '../api/achievements'
import DonationForm from '../components/display/DonationForm'
import ProgressBar from '../components/display/ProgressBar'
import { formatMoney, calcGoalValue, calcCurrentValue, calcProgressPercent, projectTypeLabel } from '../utils/formatters'

export default function ProjectDetail() {
  const { id } = useParams()
  const [project, setProject] = useState(null)
  const [achievements, setAchievements] = useState([])

  useEffect(() => {
    if (!id) return
    getPublicProject(id).then(setProject).catch(() => setProject(null))
    getPublicAchievements({ project_id: id }).then(setAchievements).catch(() => {})
  }, [id])

  if (!project) return <div className="page"><div className="container"><p className="empty-msg">加载中...</p></div></div>

  const goalValue = calcGoalValue(project)
  const currentValue = calcCurrentValue({ current_goods_qty: project.current_goods_qty, current_money: project.current_money }, project)
  const percent = calcProgressPercent(currentValue, goalValue)

  return (
    <div className="page project-detail-page">
      <div className="container">
        <div className="breadcrumb"><a href="/">首页</a> / <a href="/projects">项目</a> / {project.title}</div>

        {project.media_urls?.[0] && (
          <img src={project.media_urls[0]} alt={project.title} className="project-cover" />
        )}

        <div className="project-detail-header">
          <h1>{project.title}</h1>
          <span className="project-type-badge">{projectTypeLabel(project.project_type)}</span>
        </div>

        <div className="project-detail-body">
          <div className="project-info-col">
            {project.background && (
              <div className="project-section">
                <h2>项目背景</h2>
                <div className="project-background" dangerouslySetInnerHTML={{ __html: project.background }} />
              </div>
            )}

            <div className="project-section">
              <h2>目标与进展</h2>
              <div className="progress-info">
                <div className="progress-item">
                  <label>总目标价值</label>
                  <strong>{formatMoney(goalValue)}</strong>
                </div>
                <div className="progress-item">
                  <label>当前已筹</label>
                  <strong className="highlight">{formatMoney(currentValue)}</strong>
                </div>
              </div>
              <ProgressBar current={currentValue} goal={goalValue} />
              <p className="deadline">截止日期：{project.deadline}</p>

              {project.project_type !== 'money_only' && (
                <div className="sub-progress">
                  <p>📦 物资进度：{project.current_goods_qty || 0} / {project.goods_target_qty || 0} {project.goods_unit || ''}</p>
                </div>
              )}
              {project.project_type !== 'goods_only' && (
                <div className="sub-progress">
                  <p>💰 资金进度：{formatMoney(project.current_money)} / {formatMoney(project.money_target)}</p>
                </div>
              )}
              {project.volunteer_target > 0 && (
                <div className="sub-progress">
                  <p>🤝 志愿者：{project.current_volunteer || 0} / {project.volunteer_target} 人</p>
                </div>
              )}
            </div>

            {achievements.length > 0 && (
              <div className="project-section">
                <h2>项目成果</h2>
                <div className="achievement-list">
                  {achievements.map(a => (
                    <div key={a.id} className="achievement-item">
                      {a.media_urls?.[0] && <img src={a.media_urls[0]} alt={a.title} className="achievement-mini" />}
                      <div>
                        <strong>{a.title}</strong>
                        <p>{a.paragraph1?.slice(0, 60)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="project-donate-col">
            {project.status === 'ongoing' ? (
              <div className="donate-card">
                <h3>奉献爱心</h3>
                <DonationForm project={project} />
              </div>
            ) : (
              <div className="donate-card ended">
                <h3>项目已结束</h3>
                <p>感谢您的关注！</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
