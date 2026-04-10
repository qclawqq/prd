import { Link, Outlet, useNavigate } from 'react-router-dom'

const navItems = [
  { to: '/admin', label: '仪表盘', exact: true },
  { to: '/admin/projects', label: '项目' },
  { to: '/admin/stock', label: '库存领用' },
  { to: '/admin/donations', label: '捐赠记录' },
  { to: '/admin/achievements', label: '成果展示' },
  { to: '/admin/love-stories', label: '爱心故事' },
  { to: '/admin/love-wall', label: '宣传墙' },
  { to: '/admin/media-library', label: '素材库' },
]

export default function AdminLayout() {
  const navigate = useNavigate()
  const token = localStorage.getItem('adminToken')

  const handleLogout = () => {
    localStorage.removeItem('adminToken')
    navigate('/admin/login')
  }

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="sidebar-header">管理后台</div>
        <nav className="sidebar-nav">
          {navItems.map(item => (
            <Link key={item.to} to={item.to} className="sidebar-link">{item.label}</Link>
          ))}
        </nav>
        <div className="sidebar-footer">
          <button onClick={handleLogout} className="logout-btn">退出登录</button>
        </div>
      </aside>
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  )
}
