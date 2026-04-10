import client from './client'

export const getMediaList = (params) => client.get('/admin/media', { params })
export const replaceMedia = (id, data) => client.put(`/admin/media/${id}/replace`, data)
