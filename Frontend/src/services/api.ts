const API_BASE_URL = 'https://realitycheck-ai-v1.onrender.com/api';

class ApiService {
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

  async createTweet(tweetData: { 
    author: string; 
    content: string; 
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

  // Verification
  async verifyTweet(payload: { tweetId?: string; content: string }) {
    return this.request<any>('/verify', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }
}

export const apiService = new ApiService();
export default apiService;
