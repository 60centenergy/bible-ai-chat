import axios, { AxiosInstance } from 'axios';
import { ChatRequest, ChatResponse, ApiResponse } from '../types';

class ApiService {
  private client: AxiosInstance;
  private apiKey: string;

  constructor() {
    // API URL configuration
    const hostname = window.location.hostname;
    let apiUrl: string;
    
    // Local development: use localhost
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168')) {
      apiUrl = 'http://localhost:5000/api';
    } else {
      // Production: call backend directly (has CORS headers configured)
      apiUrl = 'https://bible-ai-backend-3flg.onrender.com/api';
    }
    
    // Get API key from environment (set in Cloudflare Pages or .env)
    this.apiKey = import.meta.env.VITE_API_KEY || '';
    
    this.client = axios.create({
      baseURL: apiUrl,
      timeout: 60000,
      headers: {
        'Content-Type': 'application/json',
        ...(this.apiKey && { 'x-api-key': this.apiKey })
      }
    });
    
    console.log(`📡 API endpoint: ${apiUrl}`);
    if (this.apiKey) {
      console.log(`🔑 API key configured (${this.apiKey.substring(0, 8)}...)`);
    } else {
      console.warn('⚠️ No API key found - API calls may fail');
    }
  }

  async sendMessage(request: ChatRequest): Promise<ChatResponse> {
    try {
      const response = await this.client.post<ApiResponse<ChatResponse>>('/chat', request);
      
      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error || 'Failed to send message');
      }

      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.error || error.message || 'API request failed');
      }
      throw error;
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get<ApiResponse<{ status: string }>>('/health');
      return response.data.success;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }
}

export const apiService = new ApiService();
