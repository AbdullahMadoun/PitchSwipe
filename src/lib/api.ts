const API_BASE_URL = 'http://localhost:8002/api';

class ApiClient {
  private token: string | null = null;
  private userId: string | null = null;

  constructor() {
    this.token = localStorage.getItem('token');
    this.userId = localStorage.getItem('userId');
    
    // Temporary: If no userId, use demo user
    if (!this.userId) {
      this.userId = '4a3f2c1c-f590-4084-9181-51f6afa79a5a';
      localStorage.setItem('userId', this.userId);
    }
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('token', token);
  }

  setUserId(userId: string) {
    this.userId = userId;
    localStorage.setItem('userId', userId);
  }

  clearToken() {
    this.token = null;
    this.userId = null;
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const headers: HeadersInit = {
      ...options.headers,
    };

    // Only add Content-Type for non-FormData bodies
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Request failed' }));
      throw new Error(error.detail || 'Request failed');
    }

    return response.json();
  }

  // Auth endpoints
  async register(email: string, password: string, role: 'investor' | 'founder', name?: string) {
    const response = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, role, name }),
    });
    if (response.token) {
      this.setToken(response.token);
    }
    if (response.user_id) {
      this.setUserId(response.user_id);
    }
    return response;
  }

  async login(email: string, password: string) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (response.token) {
      this.setToken(response.token);
    }
    if (response.user_id) {
      this.setUserId(response.user_id);
    }
    return response;
  }

  // Investor endpoints
  async investorOnboard(preferenceText: string, tags: string[] = []) {
    if (!this.userId) {
      throw new Error('User ID not found. Please login again.');
    }
    return this.request('/investor/onboard', {
      method: 'POST',
      body: JSON.stringify({ user_id: this.userId, preference_text: preferenceText, tags }),
    });
  }

  async getNextVideo() {
    if (!this.userId) {
      throw new Error('User ID not found. Please login again.');
    }
    return this.request(`/investor/next-video?user_id=${this.userId}`);
  }

  async getCompanyDetails(companyId: string) {
    return this.request(`/company/${companyId}`);
  }

  async recordInteraction(
    videoId: string,
    swipeType: 'right' | 'left' | 'down',
    watchTime: number,
    videoLength: number
  ) {
    if (!this.userId) {
      throw new Error('User ID not found. Please login again.');
    }
    return this.request('/investor/interaction', {
      method: 'POST',
      body: JSON.stringify({
        user_id: this.userId,
        video_id: videoId,
        swipe_type: swipeType,
        watch_time: watchTime,
        video_length: videoLength,
      }),
    });
  }

  async undoSwipe() {
    return this.request('/investor/undo', {
      method: 'POST',
    });
  }

  async getDataRoom(companyId: string) {
    if (!this.userId) {
      throw new Error('User ID not found. Please login again.');
    }
    return this.request(`/investor/data-room/${companyId}?user_id=${this.userId}`);
  }

  async getSaved() {
    if (!this.userId) {
      throw new Error('User ID not found. Please login again.');
    }
    return this.request(`/investor/saved?user_id=${this.userId}`);
  }

  async getPortfolio() {
    if (!this.userId) {
      throw new Error('User ID not found. Please login again.');
    }
    return this.request(`/investor/portfolio?user_id=${this.userId}`);
  }

  async createInvestment(companyId: string, amount: number, numTickets: number) {
    if (!this.userId) {
      throw new Error('User ID not found. Please login again.');
    }
    return this.request('/investor/invest', {
      method: 'POST',
      body: JSON.stringify({ 
        investor_id: this.userId,
        company_id: companyId, 
        amount,
        num_tickets: numTickets 
      }),
    });
  }

  // Search endpoints
  async search(params: {
    q?: string;
    industry?: string;
    stage?: string;
    min_raise?: number;
    max_raise?: number;
  }) {
    const queryString = new URLSearchParams(
      Object.entries(params)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [k, String(v)])
    ).toString();
    return this.request(`/search${queryString ? `?${queryString}` : ''}`);
  }

  // Upload video to activate company
  async uploadVideo(file: File, companyName: string) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('company_name', companyName);

    return this.request('/upload/video', {
      method: 'POST',
      body: formData,
    });
  }

  // Founder endpoints
  async createCompany(data: {
    name: string;
    tagline: string;
    industry: string;
    stage: string;
    raise_amount: number;
    valuation: number;
    equity_percent: number;
    min_ticket: number;
    lead_investor?: string;
    revenue?: number;
    burn_rate?: number;
    runway_months?: number;
    growth_percent?: number;
    description: string;
    main_video_url: string;
    additional_videos?: string[];
  }) {
    if (!this.userId) {
      throw new Error('User ID not found. Please login again.');
    }
    return this.request('/founder/company', {
      method: 'POST',
      body: JSON.stringify({ ...data, founder_id: this.userId }),
    });
  }

  async getFounderCompany() {
    if (!this.userId) {
      throw new Error('User ID not found. Please login again.');
    }
    return this.request(`/founder/company/${this.userId}`);
  }

  async getInterestedInvestors(companyId: string) {
    return this.request(`/founder/interested/${companyId}`);
  }

  // Messages endpoints
  async sendMessage(receiverId: string, companyId: string, content: string) {
    if (!this.userId) {
      throw new Error('User ID not found. Please login again.');
    }
    return this.request('/messages/send', {
      method: 'POST',
      body: JSON.stringify({
        sender_id: this.userId,
        receiver_id: receiverId,
        company_id: companyId,
        content,
      }),
    });
  }

  async getMessageThreads() {
    if (!this.userId) {
      throw new Error('User ID not found. Please login again.');
    }
    return this.request(`/messages/threads/${this.userId}`);
  }

  async getThreadMessages(otherUserId: string, companyId: string) {
    if (!this.userId) {
      throw new Error('User ID not found. Please login again.');
    }
    return this.request(`/messages/thread/${this.userId}/${otherUserId}/${companyId}`);
  }

  // User endpoints
  async getCurrentUser() {
    return this.request('/user/me');
  }
}

export const apiClient = new ApiClient();