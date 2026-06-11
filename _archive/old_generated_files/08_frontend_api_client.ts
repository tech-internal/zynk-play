// frontend/src/api/client.ts
// API client for backend communication

import axios, { AxiosInstance, AxiosError } from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

interface TokenResponse {
  access: string;
  refresh: string;
  user: {
    id: string;
    phone_number: string;
    status: string;
    free_trial_used: boolean;
    last_login_at: string | null;
    has_active_subscription: boolean;
    can_use_free_trial: boolean;
  };
}

interface OTPResponse {
  message: string;
  expires_in_seconds: number;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  duration_hours: number;
  price_afn: number;
  currency: string;
  features: Record<string, any>;
}

interface StreamingContent {
  id: string;
  title: string;
  description: string;
  category: string;
  is_live: boolean;
  thumbnail_url: string;
  duration_seconds: number | null;
  status: string;
}

interface Game {
  id: string;
  title: string;
  description: string;
  category: string;
  thumbnail_url: string;
  status: string;
}

class APIClient {
  private client: AxiosInstance;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Load tokens from localStorage
    this.loadTokens();

    // Add token to requests
    this.client.interceptors.request.use((config) => {
      if (this.accessToken) {
        config.headers.Authorization = `Bearer ${this.accessToken}`;
      }
      return config;
    });

    // Handle token expiry
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && this.refreshToken) {
          try {
            const response = await this.refreshAccessToken();
            this.setTokens(response.access, response.refresh);
            // Retry original request
            if (originalRequest) {
              originalRequest.headers.Authorization = `Bearer ${response.access}`;
              return this.client(originalRequest);
            }
          } catch (refreshError) {
            this.logout();
            throw refreshError;
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private loadTokens() {
    this.accessToken = localStorage.getItem('access_token');
    this.refreshToken = localStorage.getItem('refresh_token');
  }

  private setTokens(access: string, refresh: string) {
    this.accessToken = access;
    this.refreshToken = refresh;
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
  }

  // =====================================================================
  // AUTH ENDPOINTS
  // =====================================================================

  async sendOTP(phoneNumber: string): Promise<OTPResponse> {
    const response = await this.client.post<OTPResponse>('/api/v1/auth/send-otp', {
      phone_number: phoneNumber,
    });
    return response.data;
  }

  async verifyOTP(phoneNumber: string, otpCode: string): Promise<TokenResponse> {
    const response = await this.client.post<TokenResponse>('/api/v1/auth/verify-otp', {
      phone_number: phoneNumber,
      otp_code: otpCode,
    });
    const data = response.data;
    this.setTokens(data.access, data.refresh);
    return data;
  }

  async refreshAccessToken() {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await this.client.post('/api/v1/auth/refresh', {
      refresh: this.refreshToken,
    });

    return response.data;
  }

  // =====================================================================
  // USER ENDPOINTS
  // =====================================================================

  async getUserProfile() {
    const response = await this.client.get('/api/v1/users/me');
    return response.data;
  }

  async updateUserProfile(data: Partial<{ phone_number: string }>) {
    const response = await this.client.put('/api/v1/users/me', data);
    return response.data;
  }

  // =====================================================================
  // SUBSCRIPTION ENDPOINTS
  // =====================================================================

  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    const response = await this.client.get<SubscriptionPlan[]>('/api/v1/subscriptions/plans');
    return response.data;
  }

  async purchaseSubscription(planId: string): Promise<{
    transaction_ref: string;
    amount: string;
    currency: string;
    redirect_url: string;
  }> {
    const response = await this.client.post('/api/v1/subscriptions/purchase', {
      plan_id: planId,
    });
    return response.data;
  }

  async getSubscriptionStatus() {
    const response = await this.client.get('/api/v1/subscriptions/status');
    return response.data;
  }

  // =====================================================================
  // STREAMING ENDPOINTS
  // =====================================================================

  async listStreams(filters?: { category?: string; is_live?: boolean }): Promise<StreamingContent[]> {
    const response = await this.client.get<StreamingContent[]>('/api/v1/streams', {
      params: filters,
    });
    return response.data;
  }

  async getStream(streamId: string): Promise<StreamingContent> {
    const response = await this.client.get<StreamingContent>(`/api/v1/streams/${streamId}`);
    return response.data;
  }

  async accessStream(streamId: string): Promise<{
    signed_url: string;
    expires_in_seconds: number;
    session_id: string;
  }> {
    const response = await this.client.post(`/api/v1/streams/${streamId}/access`);
    return response.data;
  }

  // =====================================================================
  // TRIAL ENDPOINTS
  // =====================================================================

  async startTrial(contentId: string) {
    const response = await this.client.post('/api/v1/trial/start', {
      content_id: contentId,
    });
    return response.data;
  }

  // =====================================================================
  // GAMES ENDPOINTS
  // =====================================================================

  async listGames(): Promise<Game[]> {
    const response = await this.client.get<Game[]>('/api/v1/games');
    return response.data;
  }

  async getGame(gameId: string): Promise<Game> {
    const response = await this.client.get<Game>(`/api/v1/games/${gameId}`);
    return response.data;
  }

  async launchGame(gameId: string): Promise<{
    session_token: string;
    game_source: string;
  }> {
    const response = await this.client.post(`/api/v1/games/${gameId}/launch`);
    return response.data;
  }

  // =====================================================================
  // PAYMENT ENDPOINTS
  // =====================================================================

  async getPaymentHistory() {
    const response = await this.client.get('/api/v1/payments/history');
    return response.data;
  }

  // =====================================================================
  // AUTH STATE
  // =====================================================================

  isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  logout() {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }
}

export const apiClient = new APIClient();
export type { TokenResponse, OTPResponse, SubscriptionPlan, StreamingContent, Game };
