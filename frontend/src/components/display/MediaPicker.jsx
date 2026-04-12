import { useState, useEffect } from 'react'
import { getMediaList, createMedia } from '../../api/media'

export default function MediaPicker({ onSelect, multiple = false }) {
  const [media, setMedia] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [msg, setMsg] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)
  const [fileName, setFileName] = useState('')
  const [fileType, setFileType] = useState('image')

  useEffect(() => {
    getMediaList({}).then(setMedia).catch(() => setMsg('加载失败')).finally(() => setLoading(false))
  }, [])

  const filtered = search
    ? media.filter(m => (m.original_name || '').toLowerCase().includes(search.toLowerCase()))
    : media

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

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setSelectedFile(file)
    setFileName(file.name.replace(/\.[^.]+$/, ''))
    if (file.type.startsWith('video/')) setFileType('video')
    else if (file.type.startsWith('audio/')) setFileType('audio')
    else setFileType('image')
  }

  const handleConfirmUpload = async () => {
    if (!selectedFile || !fileName.trim()) return
    setUploading(true)
    try {
      const { url } = await uploadToCloudinary(selectedFile)
      const saved = await createMedia({ file_url: url, original_name: fileName.trim(), file_type: fileType })
      setMedia(prev => [saved, ...prev])
      handlePick(saved)
      setSelectedFile(null)
      setFileName('')
      setFileType('image')
    } catch (err) {
      setMsg('上传失败: ' + err.message)
    } finally {
      setUploading(false)
    }
  }

  const handlePick = (m) => {
    const url = typeof m === 'string' ? m : m.file_url
    if (multiple) {
      onSelect(prev => [...prev, url])
    } else {
      onSelect(url)
    }
  }

  return (
    <div className="modal-overlay" onClick={() => onSelect(multiple ? [] : '')}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{maxWidth: 800}}>
        <div className="modal-header">
          <h2>选择素材</h2>
          <button className="modal-close" onClick={() => onSelect(multiple ? [] : '')}>×</button>
        </div>

        <div style={{padding: '16px 24px', borderBottom: '1px solid #eee'}}>
          <div style={{display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap'}}>
            <input className="search-input" style={{flex: 1}} placeholder="搜索素材名称..." value={search} onChange={e => setSearch(e.target.value)} />
            <label className="btn-secondary" style={{cursor: 'pointer', display: 'inline-flex', alignItems: 'center', padding: '7px 12px', borderRadius: 6, fontSize: 13}}>
              + 上传新素材
              <input type="file" accept="image/*,video/*,audio/*" onChange={handleFileSelect} style={{display: 'none'}} />
            </label>
          </div>
          {selectedFile && (
            <div style={{marginTop: 10, padding: 10, background: '#f0f9ff', borderRadius: 8, border: '1px solid #d0e8ff'}}>
              <p style={{fontSize: 13, color: '#666'}}>已选择：{selectedFile.name}</p>
              <input value={fileName} onChange={e => setFileName(e.target.value)} placeholder="素材名称" style={{marginTop:6,padding:'4px 8px',border:'1px solid #ddd',borderRadius:4,fontSize:13}} />
              <select value={fileType} onChange={e => setFileType(e.target.value)} style={{marginTop:6,padding:'4px 8px',border:'1px solid #ddd',borderRadius:4,fontSize:13}}>
                <option value="image">图片</option><option value="video">视频</option><option value="audio">音频</option>
              </select>
              <button className="btn-primary" style={{marginTop:6}} disabled={uploading || !fileName} onClick={handleConfirmUpload}>{uploading?'上传中...':'确认上传并选择'}</button>
            </div>
          )}
        </div>

        {msg && <div style={{padding: '8px 24px', color: 'var(--danger)', fontSize: 13}}>{msg}</div>}

        <div style={{padding: 16, maxHeight: 400, overflowY: 'auto'}}>
          {loading ? <p className="empty-msg">加载中...</p>
           : filtered.length === 0 ? <p className="empty-msg">{search?'未找到':'暂无素材，请先上传'}</p>
           : (
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 10}}>
              {filtered.map(m => (
                <div
                  key={m.id}
                  onClick={() => handlePick(m)}
                  style={{
                    cursor: 'pointer', borderRadius: 8, overflow: 'hidden',
                    border: '2px solid transparent', transition: 'border-color 0.2s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'transparent'}
                >
                  {m.file_type === 'video' ? (
                    <video src={m.file_url} style={{width:'100%',height:80,objectFit:'cover',display:'block'}} />
                  ) : m.file_type === 'audio' ? (
                    <div style={{width:'100%',height:80,background:'#f0f9ff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:24}}>🔊</div>
                  ) : (
                    <img src={m.file_url} alt={m.original_name} style={{width:'100%',height:80,objectFit:'cover',display:'block'}} />
                  )}
                  <p style={{padding:'4px 6px',fontSize:11,color:'#666',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                    {m.original_name || '未命名'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
