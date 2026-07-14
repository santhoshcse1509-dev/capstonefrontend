import api from './api';
import authService from './authService';
import { TOKEN_KEY, REFRESH_TOKEN_KEY, USER_KEY } from '../utils/constants';

jest.mock('./api', () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
    get: jest.fn(),
    put: jest.fn(),
  },
}));

describe('authService login fallback', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  it('falls back to a local demo session when the login endpoint fails', async () => {
    api.post.mockRejectedValueOnce(new Error('Network Error'));

    const result = await authService.login({
      email: 'demo@insurance.com',
      password: 'demo123',
    });

    expect(result.user.email).toBe('demo@insurance.com');
    expect(localStorage.getItem(TOKEN_KEY)).toBeTruthy();
    expect(localStorage.getItem(REFRESH_TOKEN_KEY)).toBeTruthy();
    expect(localStorage.getItem(USER_KEY)).toContain('demo@insurance.com');
  });
});
