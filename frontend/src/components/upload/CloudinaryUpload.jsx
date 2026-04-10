import { useState } from 'react'

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dtultipb8'
const UPLOAD_PRESET = import.meta.env.VITE_UPLOAD_PRESET || 'donation_unsigned'

export default function CloudinaryUpload({ onUpload, multiple = false, accept = "image/*,video/*" }) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const handleFile = async (files) => {
    setUploading(true)
    setError('')
    try {
      const results = []
      for (const file of Array.from(files)) {
        const fd = new FormData()
        fd.append('file', file)
        fd.append('upload_preset', UPLOAD_PRESET)
        const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`, {
          method: 'POST',
          body: fd,
        }).then(r => r.json())
        results.push(res.secure_url)
      }
      onUpload(multiple ? results : results[0])
    } catch (err) {
      setError('上传失败，请重试')
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
