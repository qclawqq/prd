import client from './client'

export const submitDonation = (data) => client.post('/donations', data)

export const getAdminDonations = (params) => client.get('/admin/donations', { params })

export const updateDonationStatus = (id, data) =>
  client.put(`/admin/donations/${id}`, data)

export const addDonationManual = (data) =>
  client.post('/admin/donations/manual', data)

export const generateCertificate = (id) =>
  client.post(`/admin/donations/${id}/generate-certificate`)

export const getDonation = (id) =>
  client.get(`/admin/donations/${id}`)

export const queryCertificate = (name, contact) =>
  client.get('/public/certificates/query', { params: { name, contact } })
