import { useState } from 'react'
import { Link } from 'react-router-dom'
import { queryCertificate } from '../api/donations'
import { generateCertificatePDF } from '../utils/certificateGenerator'
import { formatMoney } from '../utils/formatters'

export default function Certificates() {
  const [form, setForm] = useState({ name: '', contact: '' })
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!form.name && !form.contact) {
      setMsg('请输入姓名或联系电话')
      return
    }
    setLoading(true)
    setMsg('')
    setResults([])
    try {
      const data = await queryCertificate(form.name, form.contact)
      setResults(data)
      if (data.length === 0) setMsg('未查到相关捐赠记录')
    } catch (err) {
      setMsg(err?.response?.data?.error || err?.message || '查询失败')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async (item) => {
    const content =
      item.type === 'money'
        ? `${formatMoney(item.amount)}元善款`
        : item.type === 'goods'
        ? `${item.goods_qty || 0}件${item.goods_name || '物资'}`
        : '志愿者服务'

    await generateCertificatePDF({
      donorName: item.donor_name,
      projectTitle: item.project_title || '爱心公益项目',
      content,
      date: item.created_at?.slice(0, 10),
      certificateCode: item.certificate_code,
      orgName: '巴马瑶族自治县佳妮艺术支教教育服务中心',
    })
  }

  return (
    <div className="page cert-query-page">
      <div className="container">
        <h1 className="page-title">电子捐赠证书查询</h1>
        <p className="page-desc">输入您捐赠时预留的姓名或联系电话，查询证书生成进度并下载。</p>

        <form onSubmit={handleSearch} className="filter-bar" style={{maxWidth: 600, margin: '0 auto 24px'}}>
          <input
            className="search-input"
            style={{flex: 1}}
            placeholder="请输入姓名"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
          />
          <input
            className="search-input"
            style={{flex: 1}}
            placeholder="请输入联系电话"
            value={form.contact}
            onChange={e => setForm({ ...form, contact: e.target.value })}
          />
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? '查询中...' : '查询'}
          </button>
        </form>

        {msg && <div className="alert-msg" style={{textAlign: 'center', maxWidth: 600, margin: '0 auto 20px'}}>{msg}</div>}

        {results.length > 0 && (
          <div className="cert-results" style={{maxWidth: 800, margin: '0 auto'}}>
            <h2 style={{fontSize: 18, marginBottom: 16}}>查询结果（共 {results.length} 条）</h2>
            {results.map(item => (
              <div key={item.id} className="cert-item" style={{background: 'white', padding: 20, borderRadius: 8, boxShadow: '0 2px 12px rgba(0,0,0,0.08)', marginBottom: 16}}>
                <div className="cert-item-info" style={{marginBottom: 12}}>
                  <p><strong>捐赠人：</strong>{item.donor_name}</p>
                  <p><strong>项目：</strong>{item.project_title || '—'}</p>
                  <p><strong>类型：</strong>{item.type === 'money' ? '善款' : item.type === 'goods' ? '物资' : '志愿者'}</p>
                  <p><strong>捐赠时间：</strong>{item.created_at?.slice(0, 10)}</p>
                  <p>
                    <strong>证书状态：</strong>
                    {item.certificate_code ? (
                      <span className="status-badge status-ongoing">已生成</span>
                    ) : (
                      <span className="status-badge status-reviewing">生成中</span>
                    )}
                  </p>
                  {item.certificate_code && (
                    <p><strong>证书编号：</strong><code>{item.certificate_code}</code></p>
                  )}
                </div>
                <div className="cert-item-action">
                  {item.certificate_code ? (
                    <button className="btn-primary" onClick={() => handleDownload(item)}>
                      📄 下载证书
                    </button>
                  ) : (
                    <span style={{color: '#999', fontSize: 14}}>证书生成中，请稍后再查询</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{textAlign: 'center', marginTop: 32}}>
          <Link to="/" className="back-home" style={{color: '#888', textDecoration: 'underline'}}>← 返回首页</Link>
        </div>
      </div>
    </div>
  )
}
