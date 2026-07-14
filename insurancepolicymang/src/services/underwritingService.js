import api from './api';

const underwritingService = {
  getApplicationQueue: () =>
    api.get('/underwriting/queue').then((r) => r.data),

  getApplicationById: (id) =>
    api.get(`/underwriting/applications/${id}`).then((r) => r.data),

  approveApplication: (id, data) =>
    api.post(`/underwriting/applications/${id}/approve`, data).then((r) => r.data),

  rejectApplication: (id, data) =>
    api.post(`/underwriting/applications/${id}/reject`, data).then((r) => r.data),

  escalateApplication: (id, data) =>
    api.post(`/underwriting/applications/${id}/escalate`, data).then((r) => r.data),

  updateDocumentCheck: (id, docType, checked) =>
    api
      .put(`/underwriting/applications/${id}/documents`, { docType, checked })
      .then((r) => r.data),
};

export default underwritingService;
