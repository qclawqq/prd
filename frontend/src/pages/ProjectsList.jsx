import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getPublicProjects } from '../api/projects'
import ProjectCard from '../components/display/ProjectCard'

export default function ProjectsList() {
  const [projects, setProjects] = useState([])

  useEffect(() => {
    getPublicProjects().then(setProjects).catch(() => {})
  }, [])

  return (
    <div className="page projects-page">
      <div className="container">
        <h1 className="page-title">所有项目</h1>
        {projects.length === 0 ? (
          <p className="empty-msg">暂无项目</p>
        ) : (
          <div className="project-grid">
            {projects.map(p => <ProjectCard key={p.id} project={p} />)}
          </div>
        )}
      </div>
    </div>
  )
}
