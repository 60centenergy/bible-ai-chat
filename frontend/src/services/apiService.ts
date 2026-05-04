import axios, { AxiosInstance } from 'axios';
import { ChatRequest, ChatResponse } from '../types';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    // Call Groq via backend (Render) - secure, API key server-side
    const hostname = window.location.hostname;
    let apiUrl: string;
    
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      apiUrl = 'http://localhost:5000/api';
    } else {
      // Production: backend on Render
      apiUrl = 'https://bible-ai-backend-3flg.onrender.com/api';
    }
    
    this.client = axios.create({
      baseURL: apiUrl,
      timeout: 60000,
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    console.log(`📡 API endpoint: ${apiUrl}`);
    console.log('🔒 Using backend proxy (Groq API key server-side on Render)');
  }

  async sendMessage(request: ChatRequest): Promise<ChatResponse> {
    try {
      // Send to backend /api/groq endpoint
      const response = await this.client.post<{
        success: boolean;
        message?: string;
        error?: string;
      }>('/groq', {
        messages: request.messages,
      });

      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to get response from Groq');
      }

      if (!response.data.message) {
        throw new Error('No message in response');
      }

      return {
        content: response.data.message,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorMsg = error.response?.data?.error || error.message || 'API request failed';
        throw new Error(errorMsg);
      }
      throw error;
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.post<{
        success: boolean;
      }>('/groq', {
        messages: [{ role: 'user', content: 'ping' }],
      });
      return response.data.success;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }
}

export const apiService = new ApiService();
