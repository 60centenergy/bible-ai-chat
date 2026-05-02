import axios, { AxiosInstance } from 'axios';
import { ChatRequest, ChatResponse, ApiResponse } from '../types';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    // Use absolute domain URL for production tunnel routing
    const apiUrl = `https://60centenergy.com/bibleai/api`;
    
    this.client = axios.create({
      baseURL: apiUrl,
      timeout: 60000,
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    console.log(`📡 API endpoint: ${apiUrl}`);
  }

  async sendMessage(request: ChatRequest, token?: string): Promise<ChatResponse> {
    try {
      const headers: any = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await this.client.post<ApiResponse<ChatResponse>>('/chat', request, { headers });
      
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
