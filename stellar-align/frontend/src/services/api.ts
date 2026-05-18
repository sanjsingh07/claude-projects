import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { User, AyanamsaType, DivisionalChartType } from '@types';
import { secureStorage } from '@utils/secureStorage';

// API URL configuration
const DEFAULT_API_URL = process.env.EXPO_PUBLIC_API_URL;

const getApiUrl = () => {
  // Check if we have a custom URL in app.json
  // const configUrl = Constants.expoConfig?.extra?.apiUrl;
  // if (configUrl) {
  //   return configUrl;
  // }

  return DEFAULT_API_URL;
};

const API_URL = getApiUrl();

console.log(`API URL: ${API_URL}`);

interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

class ApiService {
  private client: AxiosInstance;
  private refreshPromise: Promise<void> | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor - add auth token
    this.client.interceptors.request.use(
      async (config) => {
        const token = await secureStorage.getItem('accessToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - unwrap response.data
    this.client.interceptors.response.use(
      (response) => response.data,
      async (error: AxiosError<ApiError>) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

        // Don't try to refresh for auth endpoints or if it's already a retry
        const isAuthEndpoint = originalRequest.url?.includes('/auth/login') || 
                              originalRequest.url?.includes('/auth/register') ||
                              originalRequest.url?.includes('/auth/social');

        if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
          originalRequest._retry = true;

          try {
            await this.refreshAccessToken();
            const newToken = await secureStorage.getItem('accessToken');
            if (newToken) {
              originalRequest.headers = {
                ...originalRequest.headers,
                Authorization: `Bearer ${newToken}`,
              };
            }
            return this.client(originalRequest);
          } catch (refreshError) {
            // If refresh fails with 401, it means the refresh token is also invalid or user is gone
            // In this case we MUST force logout to clear the stuck state
            const { useAuthStore } = await import('@store/authStore');
            useAuthStore.getState().logout();
            return Promise.reject(refreshError);
          }
        }

        // If we get a 401 and it's either an auth endpoint or a second attempt
        // it means the session is completely dead
        if (error.response?.status === 401) {
          const { useAuthStore } = await import('@store/authStore');
          useAuthStore.getState().logout();
        }

        return Promise.reject(this.handleError(error));
      }
    );
  }

  private async refreshAccessToken(): Promise<void> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = new Promise(async (resolve, reject) => {
      try {
        const refreshToken = await secureStorage.getItem('refreshToken');
        if (!refreshToken) {
          // No refresh token stored, clear any existing tokens and reject
          await this.clearTokens();
          throw new Error('No refresh token');
        }

        const response = await fetch(`${API_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });

        if (!response.ok) {
          // Refresh failed, clear tokens
          await this.clearTokens();
          throw new Error('Refresh failed');
        }

        const result = await response.json();
        // Backend returns: { success: true, data: { tokens: { accessToken, refreshToken } } }
        // or { success: true, data: { accessToken, refreshToken } }
        let tokens = result.data?.tokens;
        
        if (!tokens && result.data?.accessToken) {
          tokens = result.data;
        }

        if (!tokens && result.tokens) {
          tokens = result.tokens;
        }

        if (!tokens) {
          throw new Error('No tokens in refresh response');
        }
        await this.setTokens(tokens.accessToken, tokens.refreshToken);
        resolve();
      } catch (error) {
        await this.clearTokens();
        reject(error);
      } finally {
        this.refreshPromise = null;
      }
    });

    return this.refreshPromise;
  }

  private handleError(error: AxiosError<ApiError>): ApiError {
    console.log('API Error:', error.message, error.code);

    if (error.response?.data) {
      return error.response.data;
    }

    if (error.message === 'Network Error') {
      return {
        code: 'NETWORK_ERROR',
        message: `Cannot connect to server at ${API_URL}. Make sure the backend is running and the API URL is correct.`
      };
    }

    return { code: 'UNKNOWN_ERROR', message: 'An unexpected error occurred' };
  }

  async setTokens(accessToken: string, refreshToken: string): Promise<void> {
    await secureStorage.setItem('accessToken', accessToken);
    await secureStorage.setItem('refreshToken', refreshToken);
  }

  async clearTokens(): Promise<void> {
    await secureStorage.deleteItem('accessToken');
    await secureStorage.deleteItem('refreshToken');
  }

  // ==================== AUTH ====================

  async login(email: string, password: string) {
    const response: any = await this.client.post('/auth/login', { email, password });
    // Response is already unwrapped by interceptor, so response is { success, data, meta }
    const tokens = response.data?.tokens || response.tokens;
    if (!tokens) {
      throw new Error('No tokens in response');
    }
    await this.setTokens(tokens.accessToken, tokens.refreshToken);
    return response;
  }

  async register(data: {
    email: string;
    password: string;
    birthDate: string;
    birthTime?: string;
    birthTimezone: string;
    birthLatitude?: number;
    birthLongitude?: number;
    birthLocationName?: string;
    displayName?: string;
    gender?: string;
  }) {
    const response: any = await this.client.post('/auth/register', data);
    // Response is already unwrapped by interceptor, so response is { success, data, meta }
    const tokens = response.data?.tokens || response.tokens;
    if (!tokens) {
      throw new Error('No tokens in response');
    }
    await this.setTokens(tokens.accessToken, tokens.refreshToken);
    return response;
  }

  async logout(): Promise<void> {
    const refreshToken = await secureStorage.getItem('refreshToken');
    if (refreshToken) {
      await this.client.post('/auth/logout', { refreshToken });
    }
    await this.clearTokens();
  }

  async socialLogin(provider: 'google' | 'apple', idToken: string) {
    const response = await this.client.post('/auth/social', { provider, idToken });
    const tokens = response.data?.tokens;
    if (!tokens) {
      throw new Error('No tokens in response');
    }
    await this.setTokens(tokens.accessToken, tokens.refreshToken);
    return response;
  }

  async forgotPassword(email: string) {
    return this.client.post('/auth/forgot-password', { email });
  }

  async resetPassword(token: string, password: string) {
    return this.client.post('/auth/reset-password', { token, password });
  }

  async changePassword(currentPassword: string, newPassword: string) {
    return this.client.post('/auth/change-password', { currentPassword, newPassword });
  }

  // ==================== USER ====================

  async getCurrentUser() {
    return this.client.get('/users/me');
  }

  async updateUser(data: Partial<User>) {
    return this.client.patch('/users/me', data);
  }

  async updateProfile(data: any) {
    return this.client.patch('/users/profile', data);
  }

  async getSettings() {
    return this.client.get('/users/settings');
  }

  async updateSettings(data: any) {
    return this.client.patch('/users/settings', data);
  }

  async getUserProfile(userId: string) {
    return this.client.get(`/users/${userId}/profile`);
  }

  // ==================== CHART ====================

  async getNatalChart() {
    return this.client.get('/chart');
  }

  async recalculateChart(houseSystem?: string) {
    return this.client.post('/chart/recalculate', { houseSystem });
  }

  async getTransits(period?: 'week' | 'month' | 'year', startDate?: string) {
    return this.client.get('/transits', { params: { period, startDate } });
  }

  // ==================== VEDIC CHART ====================

  async calculateVedicChart(ayanamsa?: AyanamsaType) {
    return this.client.post('/vedic/calculate', { ayanamsa: ayanamsa || 'lahiri' });
  }

  async getVedicChart() {
    return this.client.get('/vedic');
  }

  async getDivisionalChart(chartType: DivisionalChartType) {
    return this.client.get(`/vedic/divisional/${chartType}`);
  }

  async getNakshatra() {
    return this.client.get('/vedic/nakshatra');
  }

  async recalculateVedicChart(ayanamsa: AyanamsaType) {
    return this.client.post('/vedic/recalculate', { ayanamsa });
  }

  // ==================== HOROSCOPE ====================

  async getTodayHoroscope() {
    return this.client.get('/horoscope/today');
  }

  async getHoroscopeByDate(date: string) {
    return this.client.get(`/horoscope/${date}`);
  }

  async getHoroscopeHistory(page = 1, limit = 30) {
    return this.client.get('/horoscope/history', { params: { page, limit } });
  }

  async bookmarkHoroscope(id: string, bookmarked: boolean) {
    return this.client.post(`/horoscope/${id}/bookmark`, { bookmarked });
  }

  async shareHoroscope(id: string) {
    return this.client.post(`/horoscope/${id}/share`);
  }

  // ==================== FRIENDS ====================

  async getFriends() {
    return this.client.get('/friends');
  }

  async getFriendRequests() {
    return this.client.get('/friends/requests');
  }

  async sendFriendRequest(userId: string) {
    return this.client.post('/friends/request', { userId });
  }

  async acceptFriendRequest(requestId: string) {
    return this.client.post('/friends/accept', { requestId });
  }

  async rejectFriendRequest(requestId: string) {
    return this.client.post('/friends/reject', { requestId });
  }

  async removeFriend(friendshipId: string) {
    return this.client.delete(`/friends/${friendshipId}`);
  }

  // ==================== COMPATIBILITY ====================

  async getCompatibility(userId: string) {
    return this.client.get(`/compatibility/${userId}`);
  }

  // ==================== UTILS ====================

  async getTimezone(lat: string | number, lon: string | number) {
    return this.client.get('/utils/timezone', { params: { lat, lon } });
  }

  async getTimezones() {
    return this.client.get('/utils/timezones');
  }

  // ==================== NOTIFICATIONS ====================

  async registerPushToken(token: string, platform: string, deviceId?: string) {
    return this.client.post('/notifications/tokens', { token, platform, deviceId });
  }

  async getNotificationHistory(page = 1, limit = 20) {
    return this.client.get('/notifications', { params: { page, limit } });
  }

  async markNotificationAsRead(id: string) {
    return this.client.patch(`/notifications/${id}/read`);
  }
}

export const api = new ApiService();
