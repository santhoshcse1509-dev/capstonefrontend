import api from './api';

const userService = {
  getProfile: async () => {
    const response = await api.get('/users/profile');
    return response.data;
  },

  updateProfile: async (profileData) => {
    const response = await api.put('/users/profile', profileData);
    return response.data;
  },

  changePassword: async (passwordData) => {
    const response = await api.post('/users/change-password', passwordData);
    return response.data;
  },

  getNominees: async () => {
    const response = await api.get('/users/nominees');
    return response.data;
  },

  uploadProfileImage: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/users/profile/upload-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Submit KYC document for verification.
   * @param {string} proofType    One of the valid POI types (e.g. "Aadhaar Card")
   * @param {string} documentUrl  A publicly accessible URL to the document
   */
  submitKyc: async (proofType, documentUrl) => {
    const response = await api.post('/users/kyc/submit', { proofType, documentUrl });
    return response.data;
  },
};

export default userService;
