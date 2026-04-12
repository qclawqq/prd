import { useEffect, useState } from 'react'
import { getAdminProjects, createProject, updateProject, deleteProject, endProject } from '../../api/projects'
import { formatMoney, projectTypeLabel, projectStatusLabel, calcGoalValue, calcCurrentValue, calcProgressPercent } from '../../utils/formatters'
import CloudinaryUpload from '../../components/upload/CloudinaryUpload'
import MediaPicker from '../../components/display/MediaPicker'

export default function ProjectManage() {
  const [projects, setProjects] = useState([])
  const [filter, setFilter] = useState({ status: '', type: '', search: '' })
  const [showModal, setShowModal] = useState(false)
  const [editData, setEditData] = useState(null)
  const [form, setForm] = useState({ title:'', background:'', project_type:'goods_only', goods_name:'', goods_unit:'件', goods_price:'', goods_target_qty:'', money_target:'', volunteer_target:0, deadline:'', status:'draft', media_urls:[], remarks:'', paymentQrUrl:'', goodsDeliveryAddress:'' })
  const [loading, setLoading] = useState(false)
  const [showPicker, setShowPicker] = useState(false)
  const [pickerFor, setPickerFor] = useState('media') // 'media' | 'qr'

  const load = () => getAdminProjects(filter).then(setProjects).catch(() => {})

  useEffect(() => { load() }, [filter])

  const openCreate = () => {
    setEditData(null)
    setForm({ title:'', background:'', project_type:'goods_only', goods_name:'', goods_unit:'件', goods_price:'', goods_target_qty:'', money_target:'', volunteer_target:0, deadline:'', status:'draft', media_urls:[], remarks:'', paymentQrUrl:'', goodsDeliveryAddress:'' })
    setShowModal(true)
  }

  const openEdit = (p) => {
    setEditData(p)
    setForm({
      title: p.title, background: p.background || '', project_type: p.project_type,
      goods_name: p.goods_name || '', goods_unit: p.goods_unit || '件', goods_price: p.goods_price || '',
      goods_target_qty: p.goods_target_qty || '', money_target: p.money_target || '',
      volunteer_target: p.volunteer_target || 0, deadline: p.deadline ? p.deadline.slice(0, 10) : '', status: p.status,
      media_urls: p.media_urls || [], remarks: p.remarks || '', paymentQrUrl: p.payment_qr_url || '', goodsDeliveryAddress: p.goods_delivery_address || '',
    })
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const data = {
        ...form,
        payment_qr_url: form.paymentQrUrl || null,
        goods_delivery_address: form.goodsDeliveryAddress || null,
        goods_price: Number(form.goods_price)||0,
        goods_target_qty: Number(form.goods_target_qty)||0,
        money_target: Number(form.money_target)||0,
        volunteer_target: Number(form.volunteer_target)||0,
      }
      if (editData) await updateProject(editData.id, data)
      else await createProject(data)
      setShowModal(false)
      load()
    } catch (err) { alert(err.response?.data?.error || '保存失败') }
    finally { setLoading(false) }
  }

  const handleDelete = async (p) => {
    if (!confirm('确认删除该项目？')) return
    try { await deleteProject(p.id); load() } catch (err) { alert(err.response?.data?.error || '删除失败') }
  }

  const handleEnd = async (p) => {
    if (!confirm('确认结束该项目？')) return
    try { await endProject(p.id); load() } catch (err) { alert(err.response?.data?.error || '操作失败') }
  }

  const addMedia = (url) => setForm(f => ({ ...f, media_urls: [...(f.media_urls || []), url] }))
  const removeMedia = (i) => setForm(f => ({ ...f, media_urls: f.media_urls.filter((_, idx) => idx !== i) }))

  return (
    <div className="admin-content">
      <div className="content-header">
        <h1>募捐项目管理</h1>
        <button className="btn-primary" onClick={openCreate}>+ 新建项目</button>
      </div>

      <div className="filter-bar">
        <select value={filter.status} onChange={e => setFilter(f => ({...f, status: e.target.value}))}>
          <option value="">全部状态</option>
          <option value="draft">草稿</option>
          <option value="reviewing">审核中</option>
          <option value="ongoing">进行中</option>
          <option value="ended">已结束</option>
        </select>
        <select value={filter.type} onChange={e => setFilter(f => ({...f, type: e.target.value}))}>
          <option value="">全部类型</option>
          <option value="goods_only">仅物资</option>
          <option value="money_only">仅善款</option>
          <option value="mixed">混合</option>
        </select>
        <input placeholder="搜索项目标题" value={filter.search} onChange={e => setFilter(f => ({...f, search: e.target.value}))} className="search-input" />
      </div>

      <table className="data-table">
        <thead><tr><th>ID</th><th>标题</th><th>类型</th><th>目标价值</th><th>当前价值</th><th>进度</th><th>状态</th><th>截止日期</th><th>操作</th></tr></thead>
        <tbody>
          {projects.map(p => {
            const goal = calcGoalValue(p)
            const cur = calcCurrentValue({ current_goods_qty: p.current_goods_qty, current_money: p.current_money }, p)
            const pct = calcProgressPercent(cur, goal)
            return (
              <tr key={p.id}>
                <td>{p.id}</td>
                <td>{p.title}</td>
                <td>{projectTypeLabel(p.project_type)}</td>
                <td>{formatMoney(goal)}</td>
                <td>{formatMoney(cur)}</td>
                <td><div style={{display:'flex',alignItems:'center',gap:'8px'}}><div className="progress-bar" style={{width:60}}><div className="progress-bar-fill" style={{width:pct+'%'}} /></div>{pct}%</div></td>
                <td><span className={`status-badge status-${p.status}`}>{projectStatusLabel(p.status)}</span></td>
                <td>{p.deadline ? p.deadline.slice(0, 10) : '-'}</td>
                <td>
                  <button className="btn-sm" onClick={() => openEdit(p)}>编辑</button>
                  {p.status === 'ongoing' && <button className="btn-sm btn-warn" onClick={() => handleEnd(p)}>结束</button>}
                  {p.status === 'draft' && <button className="btn-sm btn-danger" onClick={() => handleDelete(p)}>删除</button>}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>{editData ? '编辑项目' : '新建项目'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-row">
                <div className="form-group">
                  <label>项目标题 *</label>
                  <input value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} required />
                </div>
                <div className="form-group">
                  <label>项目类型 *</label>
                  <select value={form.project_type} onChange={e => setForm(f => ({...f, project_type: e.target.value}))}>
                    <option value="goods_only">仅物资</option>
                    <option value="money_only">仅善款</option>
                    <option value="mixed">混合模式</option>
                  </select>
                </div>
              </div>
              <div className="form-group"><label>项目背景</label><textarea value={form.background} onChange={e => setForm(f => ({...f, background: e.target.value}))} rows={3} /></div>
              {form.project_type !== 'money_only' && (
                <div className="form-row">
                  <div className="form-group"><label>物资名称</label><input value={form.goods_name} onChange={e => setForm(f => ({...f, goods_name: e.target.value}))} /></div>
                  <div className="form-group"><label>单位</label><input value={form.goods_unit} onChange={e => setForm(f => ({...f, goods_unit: e.target.value}))} /></div>
                  <div className="form-group"><label>单价（元）</label><input type="number" step="0.01" value={form.goods_price} onChange={e => setForm(f => ({...f, goods_price: e.target.value}))} /></div>
                  <div className="form-group"><label>目标数量</label><input type="number" step="0.01" value={form.goods_target_qty} onChange={e => setForm(f => ({...f, goods_target_qty: e.target.value}))} /></div>
                </div>
              )}
              {form.project_type !== 'goods_only' && (
                <div className="form-group"><label>资金目标（元）</label><input type="number" step="0.01" value={form.money_target} onChange={e => setForm(f => ({...f, money_target: e.target.value}))} /></div>
              )}
              <div className="form-row">
                <div className="form-group"><label>志愿者需求</label><input type="number" value={form.volunteer_target} onChange={e => setForm(f => ({...f, volunteer_target: e.target.value}))} /></div>
                <div className="form-group"><label>截止日期 *</label><input type="date" value={form.deadline} onChange={e => setForm(f => ({...f, deadline: e.target.value}))} required /></div>
                <div className="form-group"><label>状态</label><select value={form.status} onChange={e => setForm(f => ({...f, status: e.target.value}))}><option value="draft">草稿</option><option value="ongoing">进行中</option><option value="ended">已结束</option></select></div>
              </div>
              <div className="form-group">
                <label>媒体素材</label>
                <div className="media-preview">
                  {(form.media_urls || []).map((u, i) => <div key={i} className="media-thumb-wrap"><img src={u} alt="" /><button type="button" onClick={() => removeMedia(i)}>×</button></div>)}
                </div>
                <button type="button" className="btn-secondary" onClick={() => { setPickerFor('media'); setShowPicker(true) }}>+ 从素材库选择</button>
                {showPicker && (
                  <MediaPicker onSelect={(url) => {
                    if (pickerFor === 'qr') setForm(f => ({...f, paymentQrUrl: url}))
                    else if (url) addMedia(url)
                    setShowPicker(false)
                  }} />
                )}
              </div>
              <div className="form-group"><label>备注（仅后台可见）</label><textarea value={form.remarks} onChange={e => setForm(f => ({...f, remarks: e.target.value}))} rows={2} /></div>
              {form.project_type !== 'goods_only' && (
                <div className="form-group">
                  <label>收款二维码</label>
                  <div style={{display:'flex',alignItems:'center',gap:12}}>
                    {form.paymentQrUrl && <img src={form.paymentQrUrl} alt="qr" style={{height:60,objectFit:'contain'}} />}
                    <button type="button" className="btn-secondary" onClick={() => { setPickerFor('qr'); setShowPicker(true) }}>+ 选择二维码图片</button>
                  </div>
                </div>
              )}
              {form.project_type !== 'money_only' && (
                <div className="form-group"><label>捐物寄送地址</label><input value={form.goodsDeliveryAddress} onChange={e => setForm(f => ({...f, goodsDeliveryAddress: e.target.value}))} placeholder="请填写物资寄送地址" /></div>
              )}
              <div className="form-actions">
                <button type="submit" disabled={loading} className="btn-primary">{loading ? '保存中...' : '保存'}</button>
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">取消</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
