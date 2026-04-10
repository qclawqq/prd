import client from './client'

export const getPublicLoveWall = () => client.get('/love-wall')
export const getAdminLoveWall = (params) => client.get('/admin/love-wall', { params })
export const createLoveWall = (data) => client.post('/admin/love-wall', data)
export const updateLoveWall = (id, data) => client.put(`/admin/love-wall/${id}`, data)
export const deleteLoveWall = (id) => client.delete(`/admin/love-wall/${id}`)
