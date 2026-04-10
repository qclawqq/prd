import { useState, useEffect } from 'react'
import { adminLogin } from '../api/auth'

export function useAuth() {
  const [token, setToken] = useState(() => localStorage.getItem('adminToken'))
  const [loading, setLoading] = useState(false)

  const login = async (username, password) => {
    setLoading(true)
    try {
      const res = await adminLogin({ username, password })
      localStorage.setItem('adminToken', res.token)
      setToken(res.token)
      return res
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem('adminToken')
    setToken(null)
  }

  return { token, login, logout, loading }
}
