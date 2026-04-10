import client from './client'

export const adminLogin = (data) => client.post('/admin/login', data)
