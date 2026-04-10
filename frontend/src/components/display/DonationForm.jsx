import { useState } from 'react'
import { submitDonation } from '../../api/donations'
import { projectTypeLabel } from '../../utils/formatters'

export default function DonationForm({ project }) {
  const [form, setForm] = useState({ donorName: '', donorContact: '', amount: '', goodsQty: '', message: '', isAnonymous: false })
  const [volunteerForm, setVolunteerForm] = useState({ donorName: '', donorContact: '', volunteerSkill: '', message: '' })
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMsg('')
    try {
      await submitDonation({ ...form, projectId: project.id })
      setMsg('捐赠提交成功！感谢您的爱心！')
      setForm({ donorName: '', donorContact: '', amount: '', goodsQty: '', message: '', isAnonymous: false })
    } catch (err) {
      setMsg(err.response?.data?.error || '提交失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const handleVolunteerSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMsg('')
    try {
      await submitDonation({ ...volunteerForm, projectId: project.id, type: 'volunteer' })
      setMsg('志愿者报名成功！')
      setVolunteerForm({ donorName: '', donorContact: '', volunteerSkill: '', message: '' })
    } catch (err) {
      setMsg(err.response?.data?.error || '提交失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="donation-form-wrap">
      {msg && <div className="alert-msg">{msg}</div>}
      
      {project.project_type !== 'money_only' && (
        <form className="donation-form" onSubmit={handleSubmit}>
          <h3>捐物捐赠</h3>
          <input placeholder="您的姓名" value={form.donorName} onChange={e => setForm({...form, donorName: e.target.value})} required />
          <input placeholder="联系方式（选填）" value={form.donorContact} onChange={e => setForm({...form, donorContact: e.target.value})} />
          <input type="number" placeholder={`${project.goods_name || '物资'}数量`} min="1" value={form.goodsQty} onChange={e => setForm({...form, goodsQty: e.target.value})} required />
          <textarea placeholder="留言（选填）" value={form.message} onChange={e => setForm({...form, message: e.target.value})} />
          <label><input type="checkbox" checked={form.isAnonymous} onChange={e => setForm({...form, isAnonymous: e.target.checked})} /> 匿名捐赠</label>
          <button type="submit" disabled={loading}>{loading ? '提交中...' : '提交捐物'}</button>
        </form>
      )}

      {project.project_type !== 'goods_only' && (
        <form className="donation-form" onSubmit={handleSubmit}>
          <h3>善款捐赠</h3>
          <input placeholder="您的姓名" value={form.donorName} onChange={e => setForm({...form, donorName: e.target.value})} required />
          <input placeholder="联系方式（选填）" value={form.donorContact} onChange={e => setForm({...form, donorContact: e.target.value})} />
          <input type="number" placeholder="捐赠金额（元）" min="1" step="0.01" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} required />
          <textarea placeholder="留言（选填）" value={form.message} onChange={e => setForm({...form, message: e.target.value})} />
          <label><input type="checkbox" checked={form.isAnonymous} onChange={e => setForm({...form, isAnonymous: e.target.checked})} /> 匿名捐赠</label>
          <button type="submit" disabled={loading}>{loading ? '提交中...' : '提交善款'}</button>
        </form>
      )}

      {project.volunteer_target > 0 && (
        <form className="donation-form volunteer-form" onSubmit={handleVolunteerSubmit}>
          <h3>志愿者报名</h3>
          <input placeholder="您的姓名" value={volunteerForm.donorName} onChange={e => setVolunteerForm({...volunteerForm, donorName: e.target.value})} required />
          <input placeholder="联系方式" value={volunteerForm.donorContact} onChange={e => setVolunteerForm({...volunteerForm, donorContact: e.target.value})} required />
          <textarea placeholder="您的技能或特长" value={volunteerForm.volunteerSkill} onChange={e => setVolunteerForm({...volunteerForm, volunteerSkill: e.target.value})} />
          <button type="submit" disabled={loading}>{loading ? '提交中...' : '报名志愿者'}</button>
        </form>
      )}
    </div>
  )
}
