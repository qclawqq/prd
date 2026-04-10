import { Link } from 'react-router-dom'

export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand">
          <span className="brand-icon">❤️</span>
          <span>爱心公益平台</span>
        </Link>
        <div className="navbar-links">
          <Link to="/">首页</Link>
          <Link to="/projects">项目</Link>
          <Link to="/stories">爱心故事</Link>
          <Link to="/admin/login" className="admin-link">管理登录</Link>
        </div>
      </div>
    </nav>
  )
}
