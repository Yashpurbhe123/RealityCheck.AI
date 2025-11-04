// Use environment variable or fallback to localhost for development
// Port 3001: User data, tweets, notifications, auth
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://googlegenaiexchange-backend-132180526643.us-central1.run.app/api';
// Port 3000: Verifications and chatbots
const VERIFICATION_API_BASE_URL = 'https://reality-check-ai-agent-132180526643.us-central1.run.app/api';

class ApiService {
  // Request method for main API (port 3001)
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      if (!response.ok) {
        // Try to extract server error message
        let message = `HTTP error! status: ${response.status}`;
        try {
          const text = await response.text();
          console.log('Error response text:', text);
          if (text) {
            try {
              const json = JSON.parse(text);
              message = json.error || json.message || message;
              console.log('Parsed error:', message);
            } catch {
              message = text;
              console.log('Raw error text:', message);
            }
          }
        } catch (e) {
          console.log('Error parsing response:', e);
        }
        throw new Error(message);
      }
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      // Check if it's a network error (connection issue)
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error(`Cannot connect to server at ${url}. Make sure the backend server is running on ${API_BASE_URL}`);
      }
      // Convert error to a proper string message
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(errorMessage);
    }
  }

  // Request method for verification/chatbot API (port 3000)
  private async verificationRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${VERIFICATION_API_BASE_URL}${endpoint}`;
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      if (!response.ok) {
        // Try to extract server error message
        let message = `HTTP error! status: ${response.status}`;
        try {
          const text = await response.text();
          console.log('Error response text:', text);
          if (text) {
            try {
              const json = JSON.parse(text);
              message = json.error || json.message || message;
              console.log('Parsed error:', message);
            } catch {
              message = text;
              console.log('Raw error text:', message);
            }
          }
        } catch (e) {
          console.log('Error parsing response:', e);
        }
        throw new Error(message);
      }
      return await response.json();
    } catch (error) {
      console.error('Verification API request failed:', error);
      // Check if it's a network error (connection issue)
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error(`Cannot connect to server at ${url}. Make sure the verification backend server is running on ${VERIFICATION_API_BASE_URL}`);
      }
      // Convert error to a proper string message
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(errorMessage);
    }
  }

  // User endpoints
  async getUsers() {
    return this.request<any[]>('/users');
  }

  async getUser(userId: string) {
    return this.request<any>(`/users/${userId}`);
  }

  async createUser(userData: { handle: string; name: string; bio?: string }) {
    return this.request<any>('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async followUser(userId: string, currentUserId: string) {
    return this.request<any>(`/users/${userId}/follow`, {
      method: 'POST',
      body: JSON.stringify({ currentUserId }),
    });
  }

  async getUserTweets(userId: string) {
    return this.request<any[]>(`/users/${userId}/tweets`);
  }

  async searchUsers(query: string) {
    return this.request<any[]>(`/users/search/${encodeURIComponent(query)}`);
  }

  // Tweet endpoints
  async getTweets(userId?: string) {
    const url = userId ? `/tweets?userId=${userId}` : '/tweets';
    const result = await this.request<any[]>(url);
    return Array.isArray(result) ? result : [];
  }

  async getTweet(tweetId: string) {
    return this.request<any>(`/tweets/${tweetId}`);
  }

  async uploadImage(imageFile: File): Promise<string> {
    const formData = new FormData();
    formData.append('image', imageFile);
    
    const response = await fetch(`${API_BASE_URL}/upload/image`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to upload image' }));
      throw new Error(error.error || 'Failed to upload image');
    }
    
    const result = await response.json();
    
    // Validate that we got a proper URL, not base64 data
    if (!result.imageUrl || result.imageUrl.startsWith('data:')) {
      throw new Error('Invalid image URL received from server');
    }
    
    // If backend returned a relative URL, convert to full URL using API_BASE_URL
    // Otherwise, use the full URL as-is
    let imageUrl = result.imageUrl;
    if (imageUrl.startsWith('/api/image/')) {
      // Extract base URL from API_BASE_URL (remove /api suffix if present)
      const baseUrl = API_BASE_URL.replace('/api', '');
      imageUrl = `${baseUrl}${imageUrl}`;
    }
    
    // Ensure we have a valid full URL
    if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
      throw new Error('Invalid image URL format');
    }
    
    return imageUrl;
  }

  async createTweet(tweetData: { 
    author: string; 
    content: string; 
    imageUrl?: string;
    parentTweet?: string;
  }) {
    return this.request<any>('/tweets', {
      method: 'POST',
      body: JSON.stringify(tweetData),
    });
  }

  async likeTweet(tweetId: string, userId: string, userName: string) {
    return this.request<any>(`/tweets/${tweetId}/like`, {
      method: 'POST',
      body: JSON.stringify({ userId, userName }),
    });
  }

  async retweet(tweetId: string, userId: string, userName: string) {
    return this.request<any>(`/tweets/${tweetId}/retweet`, {
      method: 'POST',
      body: JSON.stringify({ userId, userName }),
    });
  }

  async replyToTweet(tweetId: string, replyData: { 
    author: string; 
    content: string; 
    userName: string;
  }) {
    return this.request<any>(`/tweets/${tweetId}/reply`, {
      method: 'POST',
      body: JSON.stringify(replyData),
    });
  }

  async searchTweets(query: string) {
    return this.request<any[]>(`/tweets/search/${encodeURIComponent(query)}`);
  }

  async deleteTweet(tweetId: string, userId: string) {
    return this.request<any>(`/tweets/${tweetId}`, {
      method: 'DELETE',
      body: JSON.stringify({ userId }),
    });
  }

  // Notification endpoints
  async getNotifications(userId: string) {
    try {
      return await this.request<any[]>(`/notifications/${userId}`);
    } catch (error) {
      console.warn('Failed to load notifications:', error);
      return []; // Return empty array if notifications fail to load
    }
  }

  async markNotificationAsRead(notificationId: string) {
    return this.request<any>(`/notifications/${notificationId}/read`, {
      method: 'PUT',
    });
  }

  async markAllNotificationsAsRead(userId: string) {
    return this.request<any>(`/notifications/${userId}/read-all`, {
      method: 'PUT',
    });
  }

  async getUnreadNotificationCount(userId: string) {
    return this.request<{ count: number }>(`/notifications/${userId}/unread-count`);
  }

  // Auth endpoints
  async register(data: { handle: string; name: string; email: string; password: string; bio?: string }) {
    const result = await this.request<{ token: string; user: any }>(`/auth/register`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    console.log('[REGISTER RESPONSE]', result);
    return result;
  }

  async login(data: { handle: string; password: string }) {
    const result = await this.request<{ token: string; user: any }>(`/auth/login`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    console.log('[LOGIN RESPONSE]', result);
    return result;
  }

  // Health check
  async healthCheck() {
    return this.request<any>('/health');
  }

  // Verification (port 3000)
  async verifyTweet(payload: { tweetId?: string; content: string; username: string; socialMediaType: string; imageUrl?: string }) {
    return this.verificationRequest<any>('/verify', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // Chatbot (port 3000)
  async chatbotQuery(query: string) {
    return this.verificationRequest<{ response: string }>('/chatbot', {
      method: 'POST',
      body: JSON.stringify({ query }),
    });
  }

  // Tweet-specific Chatbot (port 3000)
  async tweetChatbotQuery(payload: {
    query: string
    tweetContent: string
    verificationResult: any
    tweetId?: string
    imageUrl?: string
  }) {
    return this.verificationRequest<{ response: string }>('/chatbot/tweet', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // Chat session endpoints (port 3000)
  async createChatSession(userName: string, platformId: number) {
    return this.verificationRequest<{ message: string; chatId: string }>('/chat/session', {
      method: 'POST',
      body: JSON.stringify({ userName, platformId }),
    });
  }

  async sendChatMessage(chatId: string, userName: string, platformId: number, query: string) {
    return this.verificationRequest<{ response: string }>('/chat/send', {
      method: 'POST',
      body: JSON.stringify({ chatId, userName, platformId, query }),
    });
  }

  async getChatHistory(chatId: string) {
    return this.verificationRequest<{ message: string; chatId: string; data: any[] }>(`/chat/history/${chatId}`, {
      method: 'GET',
    });
  }
}

export const apiService = new ApiService();
export default apiService;
