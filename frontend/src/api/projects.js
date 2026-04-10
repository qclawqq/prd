import client from './client'

export const getPublicProjects = () => client.get('/projects')
export const getPublicProject = (id) => client.get(`/projects/${id}`)
export const getAdminProjects = (params) => client.get('/admin/projects', { params })
export const createProject = (data) => client.post('/admin/projects', data)
export const updateProject = (id, data) => client.put(`/admin/projects/${id}`, data)
export const deleteProject = (id) => client.delete(`/admin/projects/${id}`)
export const endProject = (id) => client.post(`/admin/projects/${id}/end`)
export const getProjectStock = (id) => client.get(`/admin/projects/${id}/stock`)
