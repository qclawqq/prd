import client from './client'

export const getPublicStories = (params) => client.get('/love-stories', { params })
export const getAdminStories = (params) => client.get('/admin/love-stories', { params })
export const createStory = (data) => client.post('/admin/love-stories', data)
export const updateStory = (id, data) => client.put(`/admin/love-stories/${id}`, data)
export const deleteStory = (id) => client.delete(`/admin/love-stories/${id}`)
export const reorderStories = (data) => client.put('/admin/love-stories/reorder', data)
