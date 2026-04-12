import client from './client'

export const getMediaList = (params) => client.get('/admin/media', { params })
export const createMedia = (data) => client.post('/admin/media/upload', data)
export const replaceMedia = (id, data) => client.put(`/admin/media/${id}/replace`, data)
export const updateMedia = (id, data) => client.patch(`/admin/media/${id}`, data)
export const deleteMedia = (id) => client.delete(`/admin/media/${id}`)
