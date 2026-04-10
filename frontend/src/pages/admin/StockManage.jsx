import { useEffect, useState } from 'react'
import { getStockOutList, createStockOut } from '../../api/stock'
import { getAdminProjects } from '../../api/projects'
import { formatMoney } from '../../utils/formatters'

export default function StockManage() {
  const [records, setRecords] = useState([])
  const [projects, setProjects] = useState([])
  const [projectStock, setProjectStock] = useState({})
  const [filter, setFilter] = useState({ project_id: '' })
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ projectId:'', outType:'goods', goodsName:'', quantity:'', recipient:'', purpose:'', orderDate:'' })
  const [loading, setLoading] = useState(false)

  const load = () => {
    getStockOutList(filter).then(setRecords).catch(() => {})
    getAdminProjects({ status: 'ongoing' }).then(ps => {
      setProjects(ps)
      // load stock for each
      ps.forEach(p => {
        import('../../api/projects').then(m => m.getProjectStock(p.id)).then(s => setProjectStock(prev => ({...prev, [p.id]: s}))).catch(() => {})
      })
    }).catch(() => {})
  }

  useEffect(() => { load() }, [filter])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await createStockOut({ ...form, projectId: form.projectId || null, quantity: Number(form.quantity), orderDate: form.orderDate || undefined })
      setShowModal(false)
      setForm({ projectId:'', outType:'goods', goodsName:'', quantity:'', recipient:'', purpose:'', orderDate:'' })
      load()
    } catch (err) { alert(err.response?.data?.error || '创建失败') }
    finally { setLoading(false) }
  }

  return (
    <div className="admin-content">
      <div className="content-header">
        <h1>库存与领用管理</h1>
        <button className="btn-primary" onClick={() => setShowModal(true)}>+ 新建领用单</button>
      </div>

      {/* 库存概览 */}
      {projects.length > 0 && (
        <div className="stock-overview">
          <h2>库存概览</h2>
          <div className="stock-cards">
            {projects.map(p => (
              <div key={p.id} className="stock-card">
                <h3>{p.title}</h3>
                {projectStock[p.id] && (
                  <>
                    {projectStock[p.id].goods_stock > 0 && <p>📦 物资库存：{projectStock[p.id].goods_stock} {p.goods_unit || '件'}</p>}
                    {projectStock[p.id].money_balance > 0 && <p>💰 资金余额：{formatMoney(projectStock[p.id].money_balance)}</p>}
                  </>
                )}
                {!projectStock[p.id] && <p>加载中...</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="filter-bar">
        <select value={filter.project_id} onChange={e => setFilter(f => ({...f, project_id: e.target.value}))}>
          <option value="">全部项目</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
        </select>
      </div>

      <table className="data-table">
        <thead><tr><th>ID</th><th>项目</th><th>类型</th><th>物资名称</th><th>数量/金额</th><th>领用方</th><th>用途</th><th>日期</th><th>时间</th></tr></thead>
        <tbody>
          {records.map(r => (
            <tr key={r.id}>
              <td>{r.id}</td>
              <td>{r.project_title || '-'}</td>
              <td>{r.out_type === 'goods' ? '物资' : '资金'}</td>
              <td>{r.goods_name || '-'}</td>
              <td>{r.out_type === 'goods' ? r.quantity : formatMoney(r.quantity)}</td>
              <td>{r.recipient || '-'}</td>
              <td>{r.purpose || '-'}</td>
              <td>{r.order_date}</td>
              <td>{r.created_at?.slice(0, 16)}</td>
            </tr>
          ))}
          {records.length === 0 && <tr><td colSpan={9} className="text-center">暂无记录</td></tr>}
        </tbody>
      </table>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>新建领用单</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label>所属项目</label>
                <select value={form.projectId} onChange={e => setForm(f => ({...f, projectId: e.target.value}))}>
                  <option value="">无关联项目</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>领用类型 *</label>
                <select value={form.outType} onChange={e => setForm(f => ({...f, outType: e.target.value}))}>
                  <option value="goods">物资</option>
                  <option value="money">资金</option>
                </select>
              </div>
              <div className="form-row">
                {form.outType === 'goods' && <div className="form-group"><label>物资名称</label><input value={form.goodsName} onChange={e => setForm(f => ({...f, goodsName: e.target.value}))} /></div>}
                <div className="form-group"><label>数量/金额 *</label><input type="number" step="0.01" value={form.quantity} onChange={e => setForm(f => ({...f, quantity: e.target.value}))} required /></div>
              </div>
              <div className="form-group"><label>领用方</label><input value={form.recipient} onChange={e => setForm(f => ({...f, recipient: e.target.value}))} /></div>
              <div className="form-group"><label>用途</label><textarea value={form.purpose} onChange={e => setForm(f => ({...f, purpose: e.target.value}))} rows={2} /></div>
              <div className="form-group"><label>日期</label><input type="date" value={form.orderDate} onChange={e => setForm(f => ({...f, orderDate: e.target.value}))} /></div>
              <div className="form-actions">
                <button type="submit" disabled={loading} className="btn-primary">{loading ? '创建中...' : '创建'}</button>
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">取消</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
