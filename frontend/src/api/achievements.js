import client from './client'

export const getPublicAchievements = (params) => client.get('/achievements', { params })
export const getAdminAchievements = (params) => client.get('/admin/achievements', { params })
export const createAchievement = (data) => client.post('/admin/achievements', data)
export const updateAchievement = (id, data) => client.put(`/admin/achievements/${id}`, data)
export const deleteAchievement = (id) => client.delete(`/admin/achievements/${id}`)
