# 🚀 PitchSwipe Backend Integration Plan

## Executive Summary
This plan outlines how to connect the PitchSwipe frontend with a fully functional backend that supports file uploads, vector-based recommendations, real-time messaging, and investment management.

---

## 📋 Current State Analysis

### What We Have:
1. **Frontend (Working):**
   - Complete UI/UX flow with mock data
   - Investment modal with ticket system
   - Bid management system
   - Message threads
   - Local storage for data persistence

2. **Backend (Partially Working):**
   - Basic FastAPI structure exists in `/pitchswipe/backend/`
   - Vector recommendation engine implemented
   - Authentication endpoints (with issues)
   - In-memory storage (needs database)

### What's Missing:
- ✅ File upload functionality
- ✅ Cloud storage integration
- ✅ Database persistence
- ✅ Frontend-backend API connection
- ✅ Real-time messaging
- ✅ Video processing

---

## 🎯 Implementation Plan

### Phase 1: Fix Backend Foundation (Day 1)

#### 1.1 Fix Authentication
```python
# Replace bcrypt with simple hashing temporarily
# Location: /backend/app/main.py
- Remove passlib/bcrypt dependencies
- Use JWT with simple hash (already partially done)
- Add CORS for port 8081
```

#### 1.2 Add Missing Endpoints
```python
# Essential endpoints needed:
POST /api/upload/video         # Video upload
GET  /api/companies            # List all companies
GET  /api/company/{id}         # Get company details
POST /api/messages/send        # Send message
GET  /api/messages/threads     # Get message threads
GET  /api/messages/thread/{id} # Get thread messages
POST /api/investment/create    # Create investment
POST /api/investment/bid       # Create bid request
```

#### 1.3 Start Backend Server
```bash
cd /Users/abdulrazzak/BYTE_COMP/pitchswipe-dev-guide/backend
python -m venv venv
source venv/bin/activate
pip install fastapi uvicorn python-multipart numpy python-jose
uvicorn app.main:app --reload --port 8000
```

---

### Phase 2: Implement File Upload (Day 1-2)

#### 2.1 Local File Storage (Quick Start)
```python
# Add to backend/app/main.py
import shutil
from pathlib import Path

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

@app.post("/api/upload/video")
async def upload_video(
    file: UploadFile = File(...),
    company_id: Optional[str] = None
):
    # Save file locally
    file_path = UPLOAD_DIR / f"{uuid.uuid4()}_{file.filename}"
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Return URL for frontend
    return {
        "url": f"http://localhost:8000/static/{file_path.name}",
        "filename": file.filename
    }

# Serve static files
from fastapi.staticfiles import StaticFiles
app.mount("/static", StaticFiles(directory="uploads"), name="static")
```

#### 2.2 Cloud Storage (Production - Optional)
```python
# For AWS S3 or Cloudflare R2
# pip install boto3
import boto3

s3_client = boto3.client('s3',
    endpoint_url='YOUR_R2_ENDPOINT',  # For Cloudflare R2
    aws_access_key_id='YOUR_KEY',
    aws_secret_access_key='YOUR_SECRET'
)

def upload_to_cloud(file_content, filename):
    bucket_name = 'pitchswipe-videos'
    key = f"videos/{uuid.uuid4()}_{filename}"
    
    s3_client.put_object(
        Bucket=bucket_name,
        Key=key,
        Body=file_content,
        ContentType='video/mp4'
    )
    
    return f"https://your-cdn.com/{key}"
```

---

### Phase 3: Connect Frontend to Backend (Day 2)

#### 3.1 Create API Client
```typescript
// Create: /src/lib/api.ts
const API_BASE = 'http://localhost:8000';

export class ApiClient {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  async request(endpoint: string, options: RequestInit = {}) {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
  }

  // Auth methods
  async register(email: string, password: string, role: 'investor' | 'founder') {
    const data = await this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, role }),
    });
    this.setToken(data.access_token);
    return data;
  }

  async login(email: string, password: string) {
    const data = await this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(data.access_token);
    return data;
  }

  // Video upload
  async uploadVideo(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE}/api/upload/video`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
      },
      body: formData,
    });

    return response.json();
  }

  // Get next video for swiping
  async getNextVideo(userId: string) {
    return this.request(`/api/investor/next-video?user_id=${userId}`);
  }

  // Record swipe interaction
  async recordInteraction(data: {
    user_id: string;
    video_id: string;
    swipe_type: 'left' | 'right' | 'down';
    watch_time: number;
    video_length: number;
  }) {
    return this.request('/api/investor/interaction', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Messages
  async sendMessage(data: {
    sender_id: string;
    receiver_id: string;
    company_id: string;
    content: string;
  }) {
    return this.request('/api/messages/send', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getMessageThreads(userId: string) {
    return this.request(`/api/messages/threads/${userId}`);
  }

  // Investments
  async createInvestment(data: {
    investor_id: string;
    company_id: string;
    amount: number;
    num_tickets: number;
  }) {
    return this.request('/api/investment/create', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async createBidRequest(data: {
    investor_id: string;
    company_id: string;
    amount: number;
    num_tickets: number;
    price_per_ticket: number;
  }) {
    return this.request('/api/investment/bid', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

export const apiClient = new ApiClient();
```

#### 3.2 Update React Components
```typescript
// Update InvestorFeed.tsx to use real API
import { apiClient } from '@/lib/api';

const InvestorFeed = () => {
  const [currentVideo, setCurrentVideo] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch next video from API
  const fetchNextVideo = async () => {
    setLoading(true);
    try {
      const userId = localStorage.getItem('user_id');
      const video = await apiClient.getNextVideo(userId);
      setCurrentVideo(video);
    } catch (error) {
      console.error('Failed to fetch video:', error);
    } finally {
      setLoading(false);
    }
  };

  // Record swipe interaction
  const handleSwipe = async (direction: 'left' | 'right' | 'down') => {
    if (!currentVideo) return;

    await apiClient.recordInteraction({
      user_id: localStorage.getItem('user_id')!,
      video_id: currentVideo.id,
      swipe_type: direction,
      watch_time: watchTime,
      video_length: currentVideo.duration
    });

    // Fetch next video
    fetchNextVideo();
  };

  useEffect(() => {
    fetchNextVideo();
  }, []);

  // ... rest of component
};
```

---

### Phase 4: Add Real-Time Messaging (Day 3)

#### 4.1 WebSocket Backend
```python
# Add to backend/app/main.py
from fastapi import WebSocket, WebSocketDisconnect
from typing import Dict, Set

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}

    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        self.active_connections[user_id] = websocket

    def disconnect(self, user_id: str):
        if user_id in self.active_connections:
            del self.active_connections[user_id]

    async def send_message(self, message: str, user_id: str):
        if user_id in self.active_connections:
            await self.active_connections[user_id].send_text(message)

manager = ConnectionManager()

@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    await manager.connect(websocket, user_id)
    try:
        while True:
            data = await websocket.receive_text()
            # Handle incoming messages
            message_data = json.loads(data)
            
            # Send to recipient
            recipient_id = message_data.get('recipient_id')
            if recipient_id:
                await manager.send_message(data, recipient_id)
    except WebSocketDisconnect:
        manager.disconnect(user_id)
```

#### 4.2 Frontend WebSocket
```typescript
// Create: /src/lib/websocket.ts
export class WebSocketClient {
  private ws: WebSocket | null = null;
  private messageHandlers: Set<(message: any) => void> = new Set();

  connect(userId: string) {
    this.ws = new WebSocket(`ws://localhost:8000/ws/${userId}`);

    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      this.messageHandlers.forEach(handler => handler(message));
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  sendMessage(data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  onMessage(handler: (message: any) => void) {
    this.messageHandlers.add(handler);
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
    }
  }
}
```

---

### Phase 5: Database Integration (Day 3-4)

#### 5.1 SQLite for Quick Start
```python
# Add to backend/app/database.py
import sqlite3
from contextlib import contextmanager

DB_PATH = "pitchswipe.db"

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Create tables
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS companies (
            id TEXT PRIMARY KEY,
            founder_id TEXT NOT NULL,
            name TEXT NOT NULL,
            tagline TEXT,
            industry TEXT,
            stage TEXT,
            raise_amount REAL,
            valuation REAL,
            min_ticket REAL,
            video_url TEXT,
            embedding TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (founder_id) REFERENCES users(id)
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS messages (
            id TEXT PRIMARY KEY,
            sender_id TEXT NOT NULL,
            receiver_id TEXT NOT NULL,
            company_id TEXT,
            content TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (sender_id) REFERENCES users(id),
            FOREIGN KEY (receiver_id) REFERENCES users(id)
        )
    ''')
    
    conn.commit()
    conn.close()

@contextmanager
def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()
```

#### 5.2 PostgreSQL for Production
```python
# Using SQLAlchemy
# pip install sqlalchemy psycopg2-binary
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

DATABASE_URL = "postgresql://user:password@localhost/pitchswipe"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Models
from sqlalchemy import Column, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship

class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True)
    email = Column(String, unique=True, index=True)
    password_hash = Column(String)
    role = Column(String)
    companies = relationship("Company", back_populates="founder")

class Company(Base):
    __tablename__ = "companies"
    id = Column(String, primary_key=True)
    founder_id = Column(String, ForeignKey("users.id"))
    name = Column(String)
    video_url = Column(String)
    embedding = Column(String)  # Store as JSON string
    founder = relationship("User", back_populates="companies")
```

---

## 📊 Testing Plan

### Day 4: Integration Testing

1. **Auth Flow:**
   - Register as investor
   - Login and get JWT token
   - Register as founder
   - Create company profile

2. **Upload Flow:**
   - Upload video as founder
   - Verify video URL works
   - Check video appears in feed

3. **Swipe Flow:**
   - Get next video from API
   - Record swipe interactions
   - Verify recommendations improve

4. **Investment Flow:**
   - Make investment at standard price
   - Create bid request below minimum
   - Founder receives bid in messages
   - Founder accepts/rejects bid

5. **Message Flow:**
   - Send message between users
   - Verify real-time delivery
   - Check message persistence

---

## 🚀 Quick Start Commands

```bash
# Terminal 1: Start Backend
cd /Users/abdulrazzak/BYTE_COMP/pitchswipe-dev-guide/backend
source venv/bin/activate
uvicorn app.main:app --reload --port 8000

# Terminal 2: Start Frontend
cd /Users/abdulrazzak/BYTE_COMP/pitchswipe-dev-guide
npm run dev

# Test the API
curl http://localhost:8000/health
```

---

## 📈 Performance Optimizations

1. **Caching:**
   - Redis for session management
   - Cache video embeddings
   - Cache user preferences

2. **CDN for Videos:**
   - Use Cloudflare for video delivery
   - Implement adaptive bitrate streaming
   - Thumbnail generation

3. **Database Indexing:**
   - Index on user_id for fast lookups
   - Index on company stage/industry
   - Full-text search on company names

---

## 🔒 Security Considerations

1. **Authentication:**
   - Use proper bcrypt for passwords
   - JWT token expiration
   - Refresh token mechanism

2. **File Upload:**
   - Validate file types (mp4, mov only)
   - Size limits (100MB max)
   - Virus scanning

3. **API Security:**
   - Rate limiting
   - Input validation
   - SQL injection prevention

---

## 📝 Next Steps

1. **Immediate (Today):**
   - Fix backend authentication
   - Add file upload endpoint
   - Create API client in frontend

2. **Tomorrow:**
   - Connect all frontend components to API
   - Test full flow end-to-end
   - Add WebSocket for real-time chat

3. **This Week:**
   - Deploy to cloud (Railway/Vercel)
   - Add monitoring and logging
   - Performance testing

---

## 🎯 Success Metrics

- ✅ Users can register and login
- ✅ Founders can upload videos
- ✅ Videos appear in investor feed
- ✅ Swipe interactions update recommendations
- ✅ Investments and bids work through API
- ✅ Messages deliver in real-time
- ✅ Data persists between sessions

---

This plan provides a clear path to fully integrate your backend with the frontend, enabling all features including file uploads, recommendations, and real-time messaging.