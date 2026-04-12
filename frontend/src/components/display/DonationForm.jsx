import { useState } from 'react'
import { submitDonation } from '../../api/donations'
import { formatMoney } from '../../utils/formatters'

export default function DonationForm({ project }) {
  const [form, setForm] = useState({ donorName: '', donorContact: '', amount: '', goodsQty: '', message: '', isAnonymous: false })
  const [volunteerForm, setVolunteerForm] = useState({ donorName: '', donorContact: '', volunteerSkill: '', message: '' })
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)
  const [qrResult, setQrResult] = useState(null) // { donationId, paymentQrUrl, amount, type }

  const handleGoodsSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMsg('')
    try {
      const res = await submitDonation({ ...form, type: 'goods', projectId: project.id })
      setQrResult({
        type: 'goods',
        donationId: res.donationId,
        deliveryAddress: res.goodsDeliveryAddress,
        projectTitle: project.title,
      })
      setShowSuccess(true)
      setForm({ donorName: '', donorContact: '', amount: '', goodsQty: '', message: '', isAnonymous: false })
    } catch (err) {
      setMsg(err?.response?.data?.error || err?.message || '提交失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const handleMoneySubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMsg('')
    try {
      const res = await submitDonation({ ...form, type: 'money', projectId: project.id })
      setQrResult({
        type: 'money',
        donationId: res.donationId,
        paymentQrUrl: res.paymentQrUrl,
        amount: res.amount,
        projectTitle: project.title,
      })
      setShowSuccess(true)
      setForm({ donorName: '', donorContact: '', amount: '', goodsQty: '', message: '', isAnonymous: false })
    } catch (err) {
      setMsg(err?.response?.data?.error || err?.message || '提交失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const handleVolunteerSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMsg('')
    try {
      await submitDonation({ ...volunteerForm, type: 'volunteer', projectId: project.id })
      setShowSuccess(true)
      setVolunteerForm({ donorName: '', donorContact: '', volunteerSkill: '', message: '' })
    } catch (err) {
      setMsg(err?.response?.data?.error || err?.message || '提交失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="donation-form-wrap">
      {msg && <div className="alert-msg">{msg}</div>}

      {project.project_type !== 'money_only' && (
        <form className="donation-form" onSubmit={handleGoodsSubmit}>
          <h3>捐物捐赠</h3>
          <input placeholder="您的姓名 *" value={form.donorName} onChange={e => setForm({...form, donorName: e.target.value})} required />
          <input placeholder="联系方式（选填）" value={form.donorContact} onChange={e => setForm({...form, donorContact: e.target.value})} />
          <input type="number" placeholder={`${project.goods_name || '物资'}数量 *`} min="1" value={form.goodsQty} onChange={e => setForm({...form, goodsQty: e.target.value})} required />
          <textarea placeholder="留言（选填）" value={form.message} onChange={e => setForm({...form, message: e.target.value})} />
          <label><input type="checkbox" checked={form.isAnonymous} onChange={e => setForm({...form, isAnonymous: e.target.checked})} /> 匿名捐赠</label>
          <button type="submit" disabled={loading}>{loading ? '提交中...' : '提交捐物'}</button>
        </form>
      )}

      {project.project_type !== 'goods_only' && (
        <form className="donation-form" onSubmit={handleMoneySubmit}>
          <h3>善款捐赠</h3>
          <input placeholder="您的姓名 *" value={form.donorName} onChange={e => setForm({...form, donorName: e.target.value})} required />
          <input placeholder="联系方式（选填）" value={form.donorContact} onChange={e => setForm({...form, donorContact: e.target.value})} />
          <input type="number" placeholder="捐赠金额（元）*" min="1" step="0.01" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} required />
          <textarea placeholder="留言（选填）" value={form.message} onChange={e => setForm({...form, message: e.target.value})} />
          <label><input type="checkbox" checked={form.isAnonymous} onChange={e => setForm({...form, isAnonymous: e.target.checked})} /> 匿名捐赠</label>
          <button type="submit" disabled={loading}>{loading ? '提交中...' : '提交善款'}</button>
        </form>
      )}

      {project.volunteer_target > 0 && (
        <form className="donation-form volunteer-form" onSubmit={handleVolunteerSubmit}>
          <h3>志愿者报名</h3>
          <input placeholder="您的姓名 *" value={volunteerForm.donorName} onChange={e => setVolunteerForm({...volunteerForm, donorName: e.target.value})} required />
          <input placeholder="联系方式 *" value={volunteerForm.donorContact} onChange={e => setVolunteerForm({...volunteerForm, donorContact: e.target.value})} required />
          <textarea placeholder="您的技能或特长" value={volunteerForm.volunteerSkill} onChange={e => setVolunteerForm({...volunteerForm, volunteerSkill: e.target.value})} />
          <button type="submit" disabled={loading}>{loading ? '提交中...' : '报名志愿者'}</button>
        </form>
      )}

      {showSuccess && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>🎉 感谢您的爱心！</h2>
              <button className="modal-close" onClick={() => { setShowSuccess(false); setQrResult(null) }}>×</button>
            </div>
            <div style={{padding: '20px', textAlign: 'center'}}>

              {/* 捐款弹窗 */}
              {qrResult?.type === 'money' && (
                <>
                  {qrResult.paymentQrUrl ? (
                    <>
                      <p style={{marginBottom: 12}}>请使用微信/支付宝扫码完成支付</p>
                      <img src={qrResult.paymentQrUrl} alt="支付二维码" style={{maxWidth: 220, border: '1px solid #eee', borderRadius: 8}} />
                      {qrResult.amount && <p style={{marginTop: 12, fontSize: 18, color: '#e74c3c'}}>¥{qrResult.amount}</p>}
                      <p style={{marginTop: 8, fontSize: 13, color: '#888'}}>支付完成后，请点击下方按钮确认</p>
                      <ConfirmPaymentBtn donationId={qrResult.donationId} projectTitle={qrResult.projectTitle} onClose={() => { setShowSuccess(false); setQrResult(null) }} />
                    </>
                  ) : (
                    <>
                      <p style={{fontSize: 15, color: '#c00', marginBottom: 12}}>⚠️ 该项目尚未配置收款二维码</p>
                      <p style={{fontSize: 14, color: '#666'}}>请联系机构负责人获取捐款方式</p>
                    </>
                  )}
                </>
              )}

              {/* 捐物弹窗 */}
              {qrResult?.type === 'goods' && (
                <>
                  <p style={{marginBottom: 12}}>感谢您的捐赠意向！请将物资寄送至以下地址：</p>
                  <div style={{background: '#f5f5f5', padding: '12px 16px', borderRadius: 8, fontSize: 14, marginBottom: 12, textAlign: 'left'}}>
                    {qrResult.deliveryAddress || '请联系机构负责人获取寄送地址'}
                  </div>
                  <p style={{fontSize: 13, color: '#666', lineHeight: 1.7}}>
                    我们收到物资后会为您生成电子捐赠证书。<br/>
                    可在本网站通过姓名/电话查询证书生成进度。
                  </p>
                </>
              )}

              {/* 志愿者弹窗 */}
              {!qrResult && (
                <p style={{fontSize: 16, lineHeight: 1.8, color: '#333'}}>
                  感谢您的参与！<br/>
                  工作人员将在 <strong>1-3 个工作日</strong> 内与您联系。
                </p>
              )}

              <button className="btn-primary" style={{marginTop: 20}} onClick={() => { setShowSuccess(false); setQrResult(null) }}>
                我知道了
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// 确认支付按钮（捐款专用）
function ConfirmPaymentBtn({ donationId, projectTitle, onClose }) {
  const [loading, setLoading] = useState(false)
  const [confirmed, setConfirmed] = useState(false)

  const handleConfirm = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/donations/${donationId}/confirm-payment`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || '确认失败')
      setConfirmed(true)
    } catch (err) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (confirmed) {
    return (
      <div style={{marginTop: 16, padding: '12px', background: '#d4edda', borderRadius: 8, color: '#155724', fontSize: 14}}>
        ✅ 支付确认成功！<br/>
        感谢您的爱心！电子证书将在 <strong>1-3 个工作日</strong> 内生成，<br/>
        请通过姓名/电话在首页查询证书。
      </div>
    )
  }

  return (
    <button className="btn-primary" style={{marginTop: 12}} onClick={handleConfirm} disabled={loading}>
      {loading ? '确认中...' : '我已支付完成'}
    </button>
  )
}
