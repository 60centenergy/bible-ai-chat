import axios, { AxiosInstance } from 'axios';
import { ChatRequest, ChatResponse } from '../types';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    // Call Groq via secure Cloudflare Pages Function (same origin, no CORS)
    const apiUrl = '/api';
    
    this.client = axios.create({
      baseURL: apiUrl,
      timeout: 60000,
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    console.log(`📡 Groq proxy endpoint: ${apiUrl}/groq`);
    console.log('🔒 Using secure Cloudflare Pages function (API key server-side)');
  }

  async sendMessage(request: ChatRequest): Promise<ChatResponse> {
    try {
      // Send messages to Cloudflare Pages Groq proxy
      // The function will add the API key server-side
      const groqRequest = {
        messages: request.messages,
      };

      const response = await this.client.post<{
        success: boolean;
        message?: string;
        error?: string;
        usage?: { prompt_tokens: number; completion_tokens: number };
      }>('/groq', groqRequest);

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
      // Simple check - try to call groq endpoint
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
