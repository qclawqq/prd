import { useState } from 'react'

const CLOUD_NAME = 'dtultipb8'
const API_KEY = '511821373688648'
const API_SECRET = 'omBny0Pe74fAwFW_1F7iWwPf2u8'

export default function CloudinaryUpload({ onUpload, multiple = false, accept = "image/*,video/*" }) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const uploadToCloudinary = async (file) => {
    const timestamp = Math.floor(Date.now() / 1000).toString()
    const params = { timestamp, folder: 'donation-platform' }
    const sorted = Object.keys(params).sort().map(k => `${k}=${params[k]}`).join('&')
    const sig = await crypto.subtle.digest('SHA-1',
      new TextEncoder().encode(sorted + API_SECRET)
    ).then(buf => Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join(''))

    const fd = new FormData()
    fd.append('file', file)
    fd.append('timestamp', timestamp)
    fd.append('api_key', API_KEY)
    fd.append('signature', sig)
    fd.append('folder', 'donation-platform')

    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`, {
      method: 'POST', body: fd,
    }).then(r => r.json())

    if (res.error) throw new Error(res.error.message)
    return res
  }

  const handleFile = async (files) => {
    setUploading(true)
    setError('')
    try {
      const results = []
      for (const file of Array.from(files)) {
        const res = await uploadToCloudinary(file)
        results.push({
          url: res.secure_url,
          info: {
            original_filename: res.original_filename,
            resource_type: res.resource_type,
            public_id: res.public_id,
          }
        })
      }
      onUpload(multiple ? results.map(r => r.url) : results[0].url,
               multiple ? results.map(r => r.info) : results[0].info)
    } catch (err) {
      setError('上传失败: ' + err.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="cloudinary-upload">
      <input type="file" accept={accept} multiple={multiple} onChange={e => handleFile(e.target.files)} disabled={uploading} />
      {uploading && <span>上传中...</span>}
      {error && <span className="error">{error}</span>}
    </div>
  )
}
