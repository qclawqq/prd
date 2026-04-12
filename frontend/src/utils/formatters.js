import dayjs from 'dayjs'

export function formatMoney(val) {
  return val ? `¥${Number(val).toLocaleString('zh-CN', { minimumFractionDigits: 2 })}` : '¥0.00'
}

export function formatDate(date) {
  return date ? dayjs(date).format('YYYY-MM-DD') : ''
}

export function formatDateTime(date) {
  return date ? dayjs(date).format('YYYY-MM-DD HH:mm') : ''
}

export function calcGoalValue(project) {
  const goodsValue = Number(project.goods_target_qty || 0) * Number(project.goods_price || 0)
  const moneyValue = Number(project.money_target || 0)
  return goodsValue + moneyValue
}

export function calcCurrentValue(progress, project) {
  const goodsValue = Number(progress?.current_goods_qty || 0) * Number(project.goods_price || 0)
  const moneyValue = Number(progress?.current_money || 0)
  return goodsValue + moneyValue
}

export function calcProgressPercent(current, goal) {
  if (!goal || goal === 0) return 0
  return Math.min(100, Math.round((current / goal) * 100))
}

export function projectTypeLabel(type) {
  const map = { goods_only: '仅物�?, money_only: '仅善�?, mixed: '混合模式' }
  return map[type] || type
}

export function projectStatusLabel(status) {
  const map = { draft: '草稿', reviewing: '审核�?, ongoing: '进行�?, ended: '已结�? }
  return map[status] || status
}

export function donationStatusLabel(status) {
  const map = { pending: '待确�?, paid: '已确�?, fulfilled: '已发�?, contacted: '已联�? }
  return map[status] || status
}
