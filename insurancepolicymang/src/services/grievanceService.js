import api from './api';

const grievanceService = {
  createTicket: (data) =>
    api.post('/tickets', data).then((r) => r.data),

  getMyTickets: () =>
    api.get('/tickets/my-tickets').then((r) => r.data),

  getAdminTickets: () =>
    api.get('/tickets').then((r) => r.data),

  getTicketById: (id) =>
    api.get(`/tickets/${id}`).then((r) => r.data),

  getTicketHistory: (id) =>
    api.get(`/tickets/${id}/history`).then((r) => r.data),

  updateTicketStatus: (id, data) =>
    api.put(`/tickets/${id}/status`, data).then((r) => r.data),
};

export default grievanceService;
