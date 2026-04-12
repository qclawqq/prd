import { useEffect, useState } from 'react'
import { getAdminDonations, updateDonationStatus, addDonationManual, generateCertificate, getDonation } from '../../api/donations'
import { getAdminProjects } from '../../api/projects'
import { formatMoney, donationStatusLabel } from '../../utils/formatters'
import { generateCertificatePDF } from '../../utils/certificateGenerator'

export default function DonationManage() {
  const [donations, setDonations] = useState([])
  const [projects, setProjects] = useState([])
  const [filter, setFilter] = useState({ project_id: '', type: '', status: '', search: '' })
  const [showManual, setShowManual] = useState(false)
  const [form, setForm] = useState({ projectId:'', donorName:'', donorContact:'', type:'money', amount:'', goodsQty:'', goodsName:'', volunteerSkill:'', message:'' })
  const [loading, setLoading] = useState(false)

  const load = () => {
    getAdminDonations(filter).then(setDonations).catch(() => {})
    getAdminProjects({}).then(setProjects).catch(() => {})
  }

  useEffect(() => { load() }, [filter])

  const handleStatusChange = async (d, newStatus) => {
    try { await updateDonationStatus(d.id, { status: newStatus }); load() }
    catch (err) { alert(err.response?.data?.error || '更新失败') }
  }

  const handleGenCert = async (d) => {
    try {
      await generateCertificate(d.id)
      const detail = await getDonation(d.id)
      await generateCertificatePDF({
        donorName: detail.donor_name,
        projectTitle: detail.project_title || '公益项目',
        content: detail.type === 'money' ? `${formatMoney(detail.amount)}元善款` : detail.type === 'goods' ? `${detail.goods_qty}件${detail.goods_name || '物资'}` : '志愿者服务',
        date: detail.created_at?.slice(0, 10),
        certificateCode: detail.certificate_code,
        orgName: '巴马瑶族自治县佳妮艺术支教教育服务中心',
      })
    } catch (err) { alert(err?.message || '证书生成失败，请重试') }
  }

  const handleManualSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await addDonationManual({ ...form, projectId: form.projectId || null, amount: form.amount ? Number(form.amount) : null, goodsQty: form.goodsQty ? Number(form.goodsQty) : null })
      setShowManual(false)
      load()
    } catch (err) { alert(err.response?.data?.error || '添加失败') }
    finally { setLoading(false) }
  }

  const typeLabel = t => ({ money: '善款', goods: '物资', volunteer: '志愿者' }[t] || t)

  return (
    <div className="admin-content">
      <div className="content-header">
        <h1>捐赠记录管理</h1>
        <button className="btn-primary" onClick={() => setShowManual(true)}>+ 手动添加</button>
      </div>

      <div className="filter-bar">
        <select value={filter.project_id} onChange={e => setFilter(f => ({...f, project_id: e.target.value}))}>
          <option value="">全部项目</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
        </select>
        <select value={filter.type} onChange={e => setFilter(f => ({...f, type: e.target.value}))}>
          <option value="">全部类型</option>
          <option value="money">善款</option>
          <option value="goods">物资</option>
          <option value="volunteer">志愿者</option>
        </select>
        <select value={filter.status} onChange={e => setFilter(f => ({...f, status: e.target.value}))}>
          <option value="">全部状态</option>
          <option value="pending">待确认</option>
          <option value="paid">已确认</option>
          <option value="fulfilled">已发放</option>
          <option value="contacted">已联系</option>
        </select>
        <input placeholder="搜索捐赠人" value={filter.search} onChange={e => setFilter(f => ({...f, search: e.target.value}))} className="search-input" />
      </div>

      <table className="data-table">
        <thead><tr><th>ID</th><th>捐赠人</th><th>类型</th><th>项目</th><th>金额/数量</th><th>状态</th><th>证书编号</th><th>时间</th><th>操作</th></tr></thead>
        <tbody>
          {donations.map(d => (
            <tr key={d.id}>
              <td>{d.id}</td>
              <td>{d.donor_name}</td>
              <td>{typeLabel(d.type)}</td>
              <td>{d.project_title || '-'}</td>
              <td>{d.type === 'money' ? formatMoney(d.amount) : d.goods_qty ? `${d.goods_qty}${d.goods_name || ''}` : '-'}</td>
              <td><span className={`status-badge status-${d.status}`}>{donationStatusLabel(d.status)}</span></td>
              <td>{d.certificate_code || '-'}</td>
              <td>{d.created_at?.slice(0, 10)}</td>
              <td>
                <select value={d.status} onChange={e => handleStatusChange(d, e.target.value)} className="status-select">
                  <option value="pending">待确认</option>
                  <option value="paid">已确认</option>
                  <option value="fulfilled">已发放</option>
                  <option value="contacted">已联系</option>
                </select>
                <button className="btn-sm btn-cert" onClick={() => handleGenCert(d)}>生成证书</button>
              </td>
            </tr>
          ))}
          {donations.length === 0 && <tr><td colSpan={9} className="text-center">暂无记录</td></tr>}
        </tbody>
      </table>

      {showManual && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>手动添加捐赠</h2>
              <button className="modal-close" onClick={() => setShowManual(false)}>×</button>
            </div>
            <form onSubmit={handleManualSubmit} className="modal-form">
              <div className="form-group">
                <label>关联项目</label>
                <select value={form.projectId} onChange={e => setForm(f => ({...f, projectId: e.target.value}))}>
                  <option value="">无</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                </select>
              </div>
              <div className="form-group"><label>捐赠人 *</label><input value={form.donorName} onChange={e => setForm(f => ({...f, donorName: e.target.value}))} required /></div>
              <div className="form-group"><label>联系方式</label><input value={form.donorContact} onChange={e => setForm(f => ({...f, donorContact: e.target.value}))} /></div>
              <div className="form-group">
                <label>类型 *</label>
                <select value={form.type} onChange={e => setForm(f => ({...f, type: e.target.value}))}>
                  <option value="money">善款</option>
                  <option value="goods">物资</option>
                  <option value="volunteer">志愿者</option>
                </select>
              </div>
              {form.type === 'money' && <div className="form-group"><label>金额（元）</label><input type="number" step="0.01" value={form.amount} onChange={e => setForm(f => ({...f, amount: e.target.value}))} /></div>}
              {form.type === 'goods' && (
                <div className="form-row">
                  <div className="form-group"><label>物资名称</label><input value={form.goodsName} onChange={e => setForm(f => ({...f, goodsName: e.target.value}))} /></div>
                  <div className="form-group"><label>数量</label><input type="number" step="0.01" value={form.goodsQty} onChange={e => setForm(f => ({...f, goodsQty: e.target.value}))} /></div>
                </div>
              )}
              {form.type === 'volunteer' && <div className="form-group"><label>技能</label><input value={form.volunteerSkill} onChange={e => setForm(f => ({...f, volunteerSkill: e.target.value}))} /></div>}
              <div className="form-group"><label>备注</label><textarea value={form.message} onChange={e => setForm(f => ({...f, message: e.target.value}))} rows={2} /></div>
              <div className="form-actions">
                <button type="submit" disabled={loading} className="btn-primary">{loading ? '添加中...' : '添加'}</button>
                <button type="button" onClick={() => setShowManual(false)} className="btn-secondary">取消</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
