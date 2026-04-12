import { useEffect, useState } from 'react'
import { getAdminLoveWall, createLoveWall, updateLoveWall, deleteLoveWall } from '../../api/loveWall'
import { getAdminDonations } from '../../api/donations'
import CloudinaryUpload from '../../components/upload/CloudinaryUpload'
import MediaPicker from '../../components/display/MediaPicker'

export default function LoveWallManage() {
  const [list, setList] = useState([])
  const [donations, setDonations] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editData, setEditData] = useState(null)
  const [form, setForm] = useState({ type:'image', media_url:'', title:'', description:'', donation_id:'', sort_order:0, is_active:true })
  const [loading, setLoading] = useState(false)
  const [showPicker, setShowPicker] = useState(false)

  const load = () => {
    getAdminLoveWall({}).then(setList).catch(() => {})
    getAdminDonations({}).then(setDonations).catch(() => {})
  }
  useEffect(() => { load() }, [])

  const openCreate = () => { setEditData(null); setForm({ type:'image', media_url:'', title:'', description:'', donation_id:'', sort_order:0, is_active:true }); setShowModal(true) }
  const openEdit = (s) => { setEditData(s); setForm({ type: s.type, media_url: s.media_url, title: s.title||'', description: s.description||'', donation_id: s.donation_id||'', sort_order: s.sort_order||0, is_active: s.is_active }); setShowModal(true) }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const data = { ...form, donation_id: form.donation_id || null }
      if (editData) await updateLoveWall(editData.id, data)
      else await createLoveWall(data)
      setShowModal(false); load()
    } catch (err) { alert(err.response?.data?.error || '保存失败') }
    finally { setLoading(false) }
  }

  const handleDelete = async (s) => { if (confirm('确认删除？')) { await deleteLoveWall(s.id).catch(e => alert('删除失败')); load() } }

  return (
    <div className="admin-content">
      <div className="content-header">
        <h1>爱心宣传墙管理</h1>
        <button className="btn-primary" onClick={openCreate}>+ 新建轮播项</button>
      </div>
      <table className="data-table">
        <thead><tr><th>排序</th><th>媒体</th><th>标题</th><th>关联捐赠</th><th>类型</th><th>状态</th><th>操作</th></tr></thead>
        <tbody>
          {list.map(s => (
            <tr key={s.id}>
              <td>{s.sort_order}</td>
              <td>{s.media_url && (s.type === 'video' ? <video src={s.media_url} style={{width:80, height:50, objectFit:'cover'}} /> : <img src={s.media_url} alt="" style={{width:80, height:50, objectFit:'cover', borderRadius:4}} />)}</td>
              <td>{s.title || '-'}</td>
              <td>{s.donor_name || '-'}</td>
              <td>{s.type === 'video' ? '视频' : '图片'}</td>
              <td><span className={`status-badge ${s.is_active ? 'status-ongoing' : 'status-ended'}`}>{s.is_active ? '启用' : '禁用'}</span></td>
              <td><button className="btn-sm" onClick={() => openEdit(s)}>编辑</button><button className="btn-sm btn-danger" onClick={() => handleDelete(s)}>删除</button></td>
            </tr>
          ))}
          {list.length === 0 && <tr><td colSpan={7} className="text-center">暂无数据</td></tr>}
        </tbody>
      </table>
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header"><h2>{editData ? '编辑' : '新建'}轮播项</h2><button className="modal-close" onClick={() => setShowModal(false)}>×</button></div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group"><label>标题</label><input value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} /></div>
              <div className="form-group"><label>类型</label><select value={form.type} onChange={e => setForm(f => ({...f, type: e.target.value}))}><option value="image">图片</option><option value="video">视频</option></select></div>
              <div className="form-group"><label>媒体文件 *</label>{form.media_url && <img src={form.media_url} alt="" style={{maxWidth:200, marginBottom:8}} />}<button type="button" className="btn-secondary" onClick={() => setShowPicker(true)}>+ 从素材库选择</button>{showPicker && <MediaPicker onSelect={(url) => { setForm(f => ({...f, media_url: url})); setShowPicker(false) }} />}</div>
              <div className="form-group"><label>描述</label><textarea value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} rows={2} /></div>
              <div className="form-group"><label>关联捐赠记录</label><select value={form.donation_id} onChange={e => setForm(f => ({...f, donation_id: e.target.value}))}><option value="">无</option>{donations.map(d => <option key={d.id} value={d.id}>{d.donor_name} - {d.project_title}</option>)}</select></div>
              <div className="form-row">
                <div className="form-group"><label>排序</label><input type="number" value={form.sort_order} onChange={e => setForm(f => ({...f, sort_order: Number(e.target.value)}))} /></div>
                <div className="form-group"><label><input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({...f, is_active: e.target.checked}))} /> 启用</label></div>
              </div>
              <div className="form-actions"><button type="submit" disabled={loading} className="btn-primary">{loading ? '保存中...' : '保存'}</button><button type="button" onClick={() => setShowModal(false)} className="btn-secondary">取消</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
