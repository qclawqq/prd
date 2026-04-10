import { useEffect, useState } from 'react'
import { getMediaList, replaceMedia } from '../../api/media'
import CloudinaryUpload from '../../components/upload/CloudinaryUpload'

export default function MediaLibrary() {
  const [media, setMedia] = useState([])
  const [showReplace, setShowReplace] = useState(false)
  const [selectedId, setSelectedId] = useState(null)
  const [newUrl, setNewUrl] = useState('')
  const [loading, setLoading] = useState(false)

  const load = () => getMediaList({}).then(setMedia).catch(() => {})
  useEffect(() => { load() }, [])

  const handleReplace = async (e) => {
    e.preventDefault()
    if (!newUrl) return
    setLoading(true)
    try {
      await replaceMedia(selectedId, { new_file_url: newUrl })
      setShowReplace(false); setNewUrl(''); setSelectedId(null); load()
    } catch (err) { alert(err.response?.data?.error || '替换失败') }
    finally { setLoading(false) }
  }

  return (
    <div className="admin-content">
      <div className="content-header">
        <h1>素材库</h1>
        <p style={{fontSize:'12px', color:'#888'}}>⚠️ 素材不可删除，如需更新请使用替换功能</p>
      </div>
      <div className="media-grid">
        {media.map(m => (
          <div key={m.id} className="media-item">
            {m.file_type === 'video' ? (
              <video src={m.file_url} controls className="media-preview" />
            ) : (
              <img src={m.file_url} alt={m.original_name} className="media-preview" />
            )}
            <div className="media-info">
              <p className="media-name" title={m.original_name}>{m.original_name || '未命名'}</p>
              <p className="media-meta">{m.file_type} · {m.used_count}次引用</p>
              <button className="btn-sm" onClick={() => { setSelectedId(m.id); setShowReplace(true) }}>替换</button>
            </div>
          </div>
        ))}
        {media.length === 0 && <p className="empty-msg">暂无素材</p>}
      </div>
      {showReplace && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header"><h2>替换素材</h2><button className="modal-close" onClick={() => setShowReplace(false)}>×</button></div>
            <form onSubmit={handleReplace} className="modal-form">
              <div className="form-group">
                <label>新文件 *</label>
                <CloudinaryUpload onUpload={setNewUrl} />
              </div>
              {newUrl && <p style={{color:'green'}}>已选择新文件</p>}
              <div className="form-actions">
                <button type="submit" disabled={loading || !newUrl} className="btn-primary">{loading ? '替换中...' : '确认替换'}</button>
                <button type="button" onClick={() => setShowReplace(false)} className="btn-secondary">取消</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
