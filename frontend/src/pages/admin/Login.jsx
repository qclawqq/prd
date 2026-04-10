import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { login, loading } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await login(username, password)
      navigate('/admin')
    } catch (err) {
      setError(err.response?.data?.error || '登录失败')
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <h2>管理登录</h2>
        <form onSubmit={handleSubmit}>
          <input type="text" placeholder="用户名" value={username} onChange={e => setUsername(e.target.value)} required autoFocus />
          <input type="password" placeholder="密码" value={password} onChange={e => setPassword(e.target.value)} required />
          {error && <div className="error-msg">{error}</div>}
          <button type="submit" disabled={loading} className="login-btn">
            {loading ? '登录中...' : '登录'}
          </button>
        </form>
        <a href="/" className="back-home">← 返回首页</a>
      </div>
    </div>
  )
}
