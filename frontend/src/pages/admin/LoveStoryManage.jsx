import { useEffect, useState, useRef } from 'react'
import { getAdminStories, createStory, updateStory, deleteStory, reorderStories } from '../../api/loveStories'
import CloudinaryUpload from '../../components/upload/CloudinaryUpload'

export default function LoveStoryManage() {
  const [list, setList] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editData, setEditData] = useState(null)
  const [form, setForm] = useState({ title:'', type:'image', media_url:'', donor_name:'', sort_order:0, is_active:true })
  const [loading, setLoading] = useState(false)
  const [dragging, setDragging] = useState(null)
  const dragOver = useRef(null)

  const load = () => getAdminStories({}).then(setList).catch(() => {})
  useEffect(() => { load() }, [])

  const openCreate = () => { setEditData(null); setForm({ title:'', type:'image', media_url:'', donor_name:'', sort_order: list.length, is_active:true }); setShowModal(true) }
  const openEdit = (s) => { setEditData(s); setForm({ title: s.title, type: s.type, media_url: s.media_url, donor_name: s.donor_name||'', sort_order: s.sort_order||0, is_active: s.is_active }); setShowModal(true) }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (editData) await updateStory(editData.id, form)
      else await createStory(form)
      setShowModal(false); load()
    } catch (err) { alert(err.response?.data?.error || '保存失败') }
    finally { setLoading(false) }
  }

  const handleDelete = async (s) => { if (confirm('确认删除？')) { await deleteStory(s.id).catch(e => alert('删除失败')); load() } }

  const handleDragStart = (e, idx) => { setDragging(idx); e.dataTransfer.effectAllowed = 'move' }
  const handleDragOver = (e, idx) => { e.preventDefault(); dragOver.current = idx }
  const handleDrop = async (e, idx) => {
    e.preventDefault()
    if (dragging === null || dragging === idx) return
    const newList = [...list]; const [item] = newList.splice(dragging, 1); newList.splice(idx, 0, item)
    setList(newList)
    await reorderStories(newList.map((s, i) => ({ id: s.id, sort_order: i }))).catch(() => {})
    setDragging(null)
  }

  return (
    <div className="admin-content">
      <div className="content-header">
        <h1>爱心故事墙管理</h1>
        <button className="btn-primary" onClick={openCreate}>+ 新建故事</button>
      </div>
      <p style={{color:'#888', fontSize:'12px'}}>💡 拖拽行可调整顺序</p>
      <table className="data-table">
        <thead><tr><th style={{width:40}}>#</th><th>缩略图</th><th>标题</th><th>捐赠者</th><th>类型</th><th>排序</th><th>状态</th><th>操作</th></tr></thead>
        <tbody>
          {list.map((s, idx) => (
            <tr key={s.id} draggable onDragStart={e => handleDragStart(e, idx)} onDragOver={e => handleDragOver(e, idx)} onDrop={e => handleDrop(e, idx)} style={{ cursor: 'grab', opacity: dragging === idx ? 0.5 : 1 }}>
              <td>{idx + 1}</td>
              <td>{s.media_url && <img src={s.media_url} alt="" style={{width:60, height:40, objectFit:'cover', borderRadius:4}} />}</td>
              <td>{s.title}</td>
              <td>{s.donor_name || '-'}</td>
              <td>{s.type === 'video' ? '视频' : '图片'}</td>
              <td>{s.sort_order}</td>
              <td><span className={`status-badge ${s.is_active ? 'status-ongoing' : 'status-ended'}`}>{s.is_active ? '启用' : '禁用'}</span></td>
              <td><button className="btn-sm" onClick={() => openEdit(s)}>编辑</button><button className="btn-sm btn-danger" onClick={() => handleDelete(s)}>删除</button></td>
            </tr>
          ))}
        </tbody>
      </table>
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header"><h2>{editData ? '编辑故事' : '新建故事'}</h2><button className="modal-close" onClick={() => setShowModal(false)}>×</button></div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group"><label>标题 *</label><input value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} required /></div>
              <div className="form-group"><label>类型</label><select value={form.type} onChange={e => setForm(f => ({...f, type: e.target.value}))}><option value="image">图片</option><option value="video">视频</option></select></div>
              <div className="form-group"><label>媒体文件 *</label>{form.media_url && <img src={form.media_url} alt="" style={{maxWidth:200, marginBottom:8}} />}<CloudinaryUpload onUpload={url => setForm(f => ({...f, media_url: url}))} /></div>
              <div className="form-group"><label>捐赠者（选填）</label><input value={form.donor_name} onChange={e => setForm(f => ({...f, donor_name: e.target.value}))} /></div>
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
