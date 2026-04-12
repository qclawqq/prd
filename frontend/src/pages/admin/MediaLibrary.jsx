import { useEffect, useState } from 'react'
import { getMediaList, createMedia, replaceMedia, updateMedia, deleteMedia } from '../../api/media'

export default function MediaLibrary() {
  const [media, setMedia] = useState([])
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState('')
  const [view, setView] = useState('grid')
  const [search, setSearch] = useState('')

  // 上传弹窗
  const [showUpload, setShowUpload] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [fileName, setFileName] = useState('')
  const [fileType, setFileType] = useState('image')
  const [nameError, setNameError] = useState('')
  const [uploading, setUploading] = useState(false)

  // 替换弹窗
  const [showReplace, setShowReplace] = useState(false)
  const [replaceId, setReplaceId] = useState(null)
  const [replaceFile, setReplaceFile] = useState(null)
  const [replaceLoading, setReplaceLoading] = useState(false)

  // 编辑弹窗
  const [showEdit, setShowEdit] = useState(false)
  const [editId, setEditId] = useState(null)
  const [editName, setEditName] = useState('')
  const [editLoading, setEditLoading] = useState(false)

  const load = () => {
    setLoading(true)
    getMediaList({}).then(setMedia).catch(() => setMsg('加载失败')).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const filtered = search
    ? media.filter(m => (m.original_name || '').toLowerCase().includes(search.toLowerCase()))
    : media

  const checkNameDuplicate = (name, type) =>
    media.some(m => (m.original_name || '').toLowerCase() === name.toLowerCase() && m.file_type === type)

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setSelectedFile(file)
    const baseName = file.name.replace(/\.[^.]+$/, '')
    setFileName(baseName)
    setNameError('')
    if (file.type.startsWith('video/')) setFileType('video')
    else if (file.type.startsWith('audio/')) setFileType('audio')
    else setFileType('image')
  }

  const handleNameChange = (name) => {
    setFileName(name)
    if (name && checkNameDuplicate(name, fileType)) setNameError('该名称已存在（同一类型不可重复）')
    else setNameError('')
  }

  const uploadToCloudinary = async (file) => {
    const timestamp = Math.floor(Date.now() / 1000).toString()
    const params = { timestamp, folder: 'donation-platform' }
    const sorted = Object.keys(params).sort().map(k => `${k}=${params[k]}`).join('&')
    const sig = await crypto.subtle.digest('SHA-1',
      new TextEncoder().encode(sorted + 'omBny0Pe74fAwFW_1F7iWwPf2u8')
    ).then(buf => Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join(''))

    const fd = new FormData()
    fd.append('file', file)
    fd.append('timestamp', timestamp)
    fd.append('api_key', '511821373688648')
    fd.append('signature', sig)
    fd.append('folder', 'donation-platform')

    const res = await fetch('https://api.cloudinary.com/v1_1/dtultipb8/auto/upload', {
      method: 'POST', body: fd,
    }).then(r => r.json())

    if (res.error) throw new Error(res.error.message)
    return { url: res.secure_url, publicId: res.public_id }
  }

  const handleConfirmUpload = async () => {
    if (!selectedFile || !fileName.trim() || nameError) return
    setUploading(true)
    setMsg('')
    try {
      const { url, publicId } = await uploadToCloudinary(selectedFile)
      await createMedia({ file_url: url, original_name: fileName.trim(), file_type: fileType, public_id: publicId })
      setShowUpload(false)
      setSelectedFile(null); setFileName(''); setFileType('image'); setNameError('')
      load()
    } catch (err) {
      setMsg('上传失败: ' + (err.message || err?.response?.data?.error || '未知错误'))
    } finally {
      setUploading(false)
    }
  }

  const handleReplaceFileSelect = (e) => {
    const file = e.target.files[0]
    if (file) setReplaceFile(file)
  }

  const handleConfirmReplace = async () => {
    if (!replaceFile) return
    setReplaceLoading(true)
    setMsg('')
    try {
      const { url } = await uploadToCloudinary(replaceFile)
      await replaceMedia(replaceId, { new_file_url: url })
      setShowReplace(false); setReplaceFile(null); setReplaceId(null)
      load()
    } catch (err) {
      setMsg('替换失败: ' + (err.message || err?.response?.data?.error || '未知错误'))
    } finally {
      setReplaceLoading(false)
    }
  }

  const openEdit = (m) => {
    setEditId(m.id); setEditName(m.original_name || ''); setShowEdit(true); setMsg('')
  }

  const handleConfirmEdit = async () => {
    if (!editName.trim()) { setMsg('名称不能为空'); return }
    setEditLoading(true)
    try {
      await updateMedia(editId, { original_name: editName.trim() })
      setShowEdit(false); setEditId(null); setEditName('')
      load()
    } catch (err) {
      setMsg(err?.response?.data?.error || err.message || '保存失败')
    } finally {
      setEditLoading(false)
    }
  }

  const handleDelete = async (m) => {
    if (!confirm(`确认删除素材「${m.original_name}」？`)) return
    try {
      await deleteMedia(m.id)
      load()
    } catch (err) {
      alert(err?.response?.data?.error || '删除失败')
    }
  }

  return (
    <div className="admin-content">
      <div className="content-header">
        <h1>素材库</h1>
        <button className="btn-primary" onClick={() => { setShowUpload(true); setMsg(''); setNameError('') }}>+ 上传新素材</button>
      </div>

      <div style={{display:'flex', gap:12, marginBottom:16, alignItems:'center'}}>
        <input className="search-input" style={{flex:1, maxWidth:300}} placeholder="搜索素材名称..." value={search} onChange={e => setSearch(e.target.value)} />
        <div style={{display:'flex', gap:4}}>
          <button className={`btn-sm ${view==='grid'?'btn-primary':''}`} onClick={()=>setView('grid')}>网格</button>
          <button className={`btn-sm ${view==='list'?'btn-primary':''}`} onClick={()=>setView('list')}>列表</button>
        </div>
      </div>

      {msg && <div className="alert-msg" style={{marginBottom:12}}>{msg}</div>}

      {loading ? <p className="empty-msg">加载中...</p>
       : filtered.length === 0 ? <p className="empty-msg">{search?'未找到匹配素材':'暂无素材，点击上方按钮上传'}</p>
       : view === 'grid' ? (
        <div className="media-grid">
          {filtered.map(m => (
            <div key={m.id} className="media-item">
              {m.file_type==='video'?<video src={m.file_url} controls className="media-preview"/>
               :m.file_type==='audio'?<div className="media-preview audio-preview">🔊 {m.original_name}</div>
               :<img src={m.file_url} alt={m.original_name} className="media-preview"/>}
              <div className="media-info">
                <p className="media-name" title={m.original_name}>{m.original_name||'未命名'}</p>
                <p className="media-meta">{m.file_type} · {m.used_count||0}次引用</p>
                <div style={{display:'flex', gap:4, flexWrap:'wrap'}}>
                  <button className="btn-sm" onClick={() => openEdit(m)}>编辑</button>
                  <button className="btn-sm btn-warn" onClick={() => { setReplaceId(m.id); setShowReplace(true) }}>替换</button>
                  <button className="btn-sm btn-danger" onClick={() => handleDelete(m)}>删除</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <table className="data-table">
          <thead><tr><th style={{width:60}}>预览</th><th>素材名称</th><th>类型</th><th>URL</th><th>引用</th><th>上传时间</th><th style={{width:160}}>操作</th></tr></thead>
          <tbody>
            {filtered.map(m => (
              <tr key={m.id}>
                <td>{m.file_type==='video'?<video src={m.file_url} style={{width:50,height:38,objectFit:'cover'}}/>:<img src={m.file_url} style={{width:50,height:38,objectFit:'cover',borderRadius:4}}/>}</td>
                <td>{m.original_name||'未命名'}</td>
                <td>{m.file_type}</td>
                <td style={{maxWidth:200,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{m.file_url}</td>
                <td>{m.used_count||0}</td>
                <td>{m.upload_time?m.upload_time.slice(0,16):'-'}</td>
                <td>
                  <button className="btn-sm" onClick={() => openEdit(m)}>编辑</button>
                  <button className="btn-sm btn-warn" onClick={() => { setReplaceId(m.id); setShowReplace(true) }}>替换</button>
                  <button className="btn-sm btn-danger" onClick={() => handleDelete(m)}>删除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* 上传新素材弹窗 */}
      {showUpload && (
        <div className="modal-overlay" onClick={() => setShowUpload(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2>上传新素材</h2><button className="modal-close" onClick={() => setShowUpload(false)}>×</button></div>
            <div className="modal-form">
              <div className="form-group">
                <label>选择文件 *</label>
                <input type="file" accept="image/*,video/*,audio/*" onChange={handleFileSelect} />
                {selectedFile && <p style={{marginTop:6,fontSize:13,color:'#666'}}>已选择：{selectedFile.name}（{(selectedFile.size/1024).toFixed(1)} KB）</p>}
              </div>
              {selectedFile && (
                <>
                  <div className="form-group">
                    <label>素材名称 *</label>
                    <input value={fileName} onChange={e => handleNameChange(e.target.value)} placeholder="输入素材名称" />
                    {nameError && <span style={{color:'var(--danger)',fontSize:12,marginTop:4,display:'block'}}>{nameError}</span>}
                  </div>
                  <div className="form-group">
                    <label>文件类型</label>
                    <select value={fileType} onChange={e => { setFileType(e.target.value); if (fileName) handleNameChange(fileName) }}>
                      <option value="image">图片</option><option value="video">视频</option><option value="audio">音频</option>
                    </select>
                  </div>
                </>
              )}
              <div className="form-actions">
                <button className="btn-primary" disabled={!selectedFile||!fileName||!!nameError||uploading} onClick={handleConfirmUpload}>{uploading?'上传中...':'确认上传'}</button>
                <button className="btn-secondary" onClick={() => setShowUpload(false)}>取消</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 编辑弹窗 */}
      {showEdit && (
        <div className="modal-overlay" onClick={() => setShowEdit(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2>编辑素材名称</h2><button className="modal-close" onClick={() => setShowEdit(false)}>×</button></div>
            <div className="modal-form">
              <div className="form-group">
                <label>素材名称 *</label>
                <input value={editName} onChange={e => setEditName(e.target.value)} placeholder="输入素材名称" autoFocus />
              </div>
              <div className="form-actions">
                <button className="btn-primary" disabled={!editName.trim()||editLoading} onClick={handleConfirmEdit}>{editLoading?'保存中...':'保存'}</button>
                <button className="btn-secondary" onClick={() => setShowEdit(false)}>取消</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 替换弹窗 */}
      {showReplace && (
        <div className="modal-overlay" onClick={() => setShowReplace(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2>替换素材</h2><button className="modal-close" onClick={() => setShowReplace(false)}>×</button></div>
            <div className="modal-form">
              <div className="form-group">
                <label>选择新文件 *</label>
                <input type="file" accept="image/*,video/*,audio/*" onChange={handleReplaceFileSelect} />
                {replaceFile && <p style={{marginTop:6,fontSize:13,color:'#666'}}>已选择：{replaceFile.name}（{(replaceFile.size/1024).toFixed(1)} KB）</p>}
                <p style={{marginTop:6,fontSize:12,color:'#888'}}>替换后，所有引用该素材的页面将自动更新为新文件</p>
              </div>
              <div className="form-actions">
                <button className="btn-primary" disabled={!replaceFile||replaceLoading} onClick={handleConfirmReplace}>{replaceLoading?'替换中...':'确认替换'}</button>
                <button className="btn-secondary" onClick={() => setShowReplace(false)}>取消</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
