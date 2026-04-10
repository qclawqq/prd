import { useEffect, useState } from 'react'
import { getAdminAchievements, createAchievement, updateAchievement, deleteAchievement } from '../../api/achievements'
import { getAdminProjects } from '../../api/projects'
import CloudinaryUpload from '../../components/upload/CloudinaryUpload'

export default function AchievementManage() {
  const [list, setList] = useState([])
  const [projects, setProjects] = useState([])
  const [filter, setFilter] = useState({ project_id: '' })
  const [showModal, setShowModal] = useState(false)
  const [editData, setEditData] = useState(null)
  const [form, setForm] = useState({ projectId:'', title:'', subtitle:'', paragraph1:'', media_urls:[], conclusion:'', writeDate:'' })
  const [loading, setLoading] = useState(false)

  const load = () => {
    getAdminAchievements(filter).then(setList).catch(() => {})
    getAdminProjects({}).then(setProjects).catch(() => {})
  }
  useEffect(() => { load() }, [filter])

  const openCreate = () => { setEditData(null); setForm({ projectId:'', title:'', subtitle:'', paragraph1:'', media_urls:[], conclusion:'', writeDate: new Date().toISOString().slice(0,10) }); setShowModal(true) }
  const openEdit = (a) => { setEditData(a); setForm({ projectId: a.project_id||'', title: a.title, subtitle: a.subtitle||'', paragraph1: a.paragraph1||'', media_urls: a.media_urls||[], conclusion: a.conclusion||'', writeDate: a.write_date||'' }); setShowModal(true) }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const data = { ...form, projectId: form.projectId || null }
      if (editData) await updateAchievement(editData.id, data)
      else await createAchievement(data)
      setShowModal(false); load()
    } catch (err) { alert(err.response?.data?.error || '保存失败') }
    finally { setLoading(false) }
  }

  const handleDelete = async (a) => { if (confirm('确认删除？')) { await deleteAchievement(a.id).catch(e => alert('删除失败')); load() } }
  const addMedia = (url) => setForm(f => ({...f, media_urls: [...f.media_urls, url]}))
  const removeMedia = (i) => setForm(f => ({...f, media_urls: f.media_urls.filter((_, idx) => idx !== i)}))

  return (
    <div className="admin-content">
      <div className="content-header">
        <h1>成果展示管理</h1>
        <button className="btn-primary" onClick={openCreate}>+ 新建成果</button>
      </div>
      <div className="filter-bar">
        <select value={filter.project_id} onChange={e => setFilter(f => ({...f, project_id: e.target.value}))}>
          <option value="">全部项目</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
        </select>
      </div>
      <table className="data-table">
        <thead><tr><th>ID</th><th>标题</th><th>关联项目</th><th>撰稿日期</th><th>操作</th></tr></thead>
        <tbody>
          {list.map(a => <tr key={a.id}><td>{a.id}</td><td>{a.title}</td><td>{a.project_title || '-'}</td><td>{a.write_date}</td><td><button className="btn-sm" onClick={() => openEdit(a)}>编辑</button><button className="btn-sm btn-danger" onClick={() => handleDelete(a)}>删除</button></td></tr>)}
          {list.length === 0 && <tr><td colSpan={5} className="text-center">暂无成果</td></tr>}
        </tbody>
      </table>
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header"><h2>{editData ? '编辑成果' : '新建成果'}</h2><button className="modal-close" onClick={() => setShowModal(false)}>×</button></div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group"><label>标题 *</label><input value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} required /></div>
              <div className="form-group"><label>副标题</label><input value={form.subtitle} onChange={e => setForm(f => ({...f, subtitle: e.target.value}))} /></div>
              <div className="form-group"><label>关联项目</label><select value={form.projectId} onChange={e => setForm(f => ({...f, projectId: e.target.value}))}><option value="">无</option>{projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}</select></div>
              <div className="form-group"><label>正文内容</label><textarea value={form.paragraph1} onChange={e => setForm(f => ({...f, paragraph1: e.target.value}))} rows={4} /></div>
              <div className="form-group"><label>结束语</label><textarea value={form.conclusion} onChange={e => setForm(f => ({...f, conclusion: e.target.value}))} rows={2} /></div>
              <div className="form-group"><label>撰稿日期 *</label><input type="date" value={form.writeDate} onChange={e => setForm(f => ({...f, writeDate: e.target.value}))} required /></div>
              <div className="form-group"><label>媒体素材</label><div className="media-preview">{form.media_urls.map((u,i) => <div key={i} className="media-thumb-wrap"><img src={u} alt="" /><button type="button" onClick={() => removeMedia(i)}>×</button></div>)}</div><CloudinaryUpload onUpload={addMedia} /></div>
              <div className="form-actions"><button type="submit" disabled={loading} className="btn-primary">{loading ? '保存中...' : '保存'}</button><button type="button" onClick={() => setShowModal(false)} className="btn-secondary">取消</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
