import client from './client'

export const createStockOut = (data) => client.post('/admin/stock-out', data)
export const getStockOutList = (params) => client.get('/admin/stock-out', { params })
export const getProjectStock = (id) => client.get(`/admin/projects/${id}/stock`)
