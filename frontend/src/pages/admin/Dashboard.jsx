import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import client from '../../api/client'
import { formatMoney, donationStatusLabel } from '../../utils/formatters'

export default function Dashboard() {
  const [data, setData] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    client.get('/admin/dashboard').then(setData).catch(() => navigate('/admin/login'))
  }, [])

  if (!data) return <div className="admin-content">加载中...</div>

  return (
    <div className="admin-content">
      <h1>仪表盘</h1>
      <div className="stat-cards">
        <div className="stat-card">
          <div className="stat-num">{data.ongoingProjects}</div>
          <div className="stat-label">进行中项目</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">{formatMoney(data.monthDonationMoney)}</div>
          <div className="stat-label">本月捐赠金额</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">{data.monthDonationCount}</div>
          <div className="stat-label">本月捐赠笔数</div>
        </div>
        <div className="stat-card warning">
          <div className="stat-num">{data.pendingVolunteers}</div>
          <div className="stat-label">待联系志愿者</div>
        </div>
      </div>

      {data.stockWarnings?.length > 0 && (
        <div className="warning-box">
          <h3>⚠️ 库存预警</h3>
          <ul>
            {data.stockWarnings.map(w => (
              <li key={w.id}>{w.title} — {w.goods_name || '物资'} 当前 {w.current_goods_qty}，低于目标 10%</li>
            ))}
          </ul>
        </div>
      )}

      <h2>最近捐赠</h2>
      <table className="data-table">
        <thead><tr><th>捐赠人</th><th>类型</th><th>项目</th><th>金额/数量</th><th>状态</th><th>时间</th></tr></thead>
        <tbody>
          {data.recentDonations?.map(d => (
            <tr key={d.id}>
              <td>{d.donor_name}</td>
              <td>{d.type === 'money' ? '善款' : d.type === 'goods' ? '物资' : '志愿者'}</td>
              <td>{d.project_title || '-'}</td>
              <td>{d.amount || d.goods_qty || '-'}</td>
              <td>{donationStatusLabel(d.status)}</td>
              <td>{d.created_at?.slice(0, 16)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
