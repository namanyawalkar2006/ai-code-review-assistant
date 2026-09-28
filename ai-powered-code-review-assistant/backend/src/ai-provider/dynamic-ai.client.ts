import axios, { AxiosInstance } from 'axios';

export interface ChatCompletionMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface DynamicAIRequest {
  baseUrl: string;
  apiKey?: string;
  modelName: string;
  messages: ChatCompletionMessage[];
  temperature?: number;
  responseFormatJson?: boolean;
}

export class DynamicAIClient {
  private axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      timeout: 90000, // 90s timeout for deep code reviews
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  async executeChatCompletion(req: DynamicAIRequest): Promise<string> {
    const cleanBaseUrl = req.baseUrl.replace(/\/+$/, '');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (req.apiKey) {
      headers['Authorization'] = `Bearer ${req.apiKey}`;
    }

    // Determine target URL for OpenAI-compatible completions
    const url = cleanBaseUrl.endsWith('/chat/completions')
      ? cleanBaseUrl
      : `${cleanBaseUrl}/chat/completions`;

    const payload: Record<string, any> = {
      model: req.modelName,
      messages: req.messages,
      temperature: req.temperature ?? 0.2,
    };

    if (req.responseFormatJson) {
      payload.response_format = { type: 'json_object' };
    }

    try {
      const response = await this.axiosInstance.post(url, payload, { headers });
      const messageContent = response.data?.choices?.[0]?.message?.content;
      if (!messageContent) {
        throw new Error('AI provider returned empty response choices');
      }
      return messageContent;
    } catch (error: any) {
      const msg = error.response?.data?.error?.message || error.message;
      throw new Error(`Dynamic AI Provider Error (${url}): ${msg}`);
    }
  }

  async testConnection(baseUrl: string, apiKey?: string, modelName?: string): Promise<{ success: boolean; latencyMs: number; message: string }> {
    const start = Date.now();
    try {
      const cleanBaseUrl = baseUrl.replace(/\/+$/, '');
      const testUrl = cleanBaseUrl.endsWith('/models')
        ? cleanBaseUrl
        : `${cleanBaseUrl}/models`;

      const headers: Record<string, string> = {};
      if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
      }

      await this.axiosInstance.get(testUrl, { headers, timeout: 10000 });
      const latencyMs = Date.now() - start;
      return {
        success: true,
        latencyMs,
        message: `Successfully connected to provider model endpoint (${latencyMs}ms)`,
      };
    } catch (err: any) {
      // Fallback: try pinging chat/completions with minimal payload
      try {
        await this.executeChatCompletion({
          baseUrl,
          apiKey,
          modelName: modelName || 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: 'ping' }],
        });
        const latencyMs = Date.now() - start;
        return {
          success: true,
          latencyMs,
          message: `Endpoint verified via completion ping (${latencyMs}ms)`,
        };
      } catch (fallbackErr: any) {
        return {
          success: false,
          latencyMs: Date.now() - start,
          message: fallbackErr.message || 'Unable to connect to AI provider endpoint',
        };
      }
    }
  }
}
