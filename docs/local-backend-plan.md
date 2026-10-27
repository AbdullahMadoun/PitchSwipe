# 🚀 PitchSwipe Local Backend Implementation Plan
## All Local Storage - Saudi Riyals (SAR) - Video Upload Ready

---

## 📋 Quick Overview

This plan creates a **100% local backend** that:
- ✅ Runs entirely on your machine
- ✅ Stores videos locally in a folder
- ✅ Uses JSON files instead of database
- ✅ All amounts in Saudi Riyals (SAR)
- ✅ Supports your YC video uploads
- ✅ Full investment flow with tickets

---

## 🎯 Step 1: Create Simple Local Backend

### 1.1 Backend Structure
```
pitchswipe-dev-guide/
├── backend_local/
│   ├── main.py           # Main FastAPI app
│   ├── storage/
│   │   ├── videos/        # Uploaded video files
│   │   ├── data.json      # All app data
│   │   └── uploads.json   # Upload metadata
│   └── requirements.txt
```

### 1.2 Create Backend File
Create `/Users/abdulrazzak/BYTE_COMP/pitchswipe-dev-guide/backend_local/main.py`:

```python
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, EmailStr
from typing import Optional, Literal, List, Dict, Any
import json
import uuid
import shutil
from pathlib import Path
from datetime import datetime
import hashlib

app = FastAPI(title="PitchSwipe Local API")

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8081", "http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create storage directories
STORAGE_DIR = Path("storage")
VIDEOS_DIR = STORAGE_DIR / "videos"
DATA_FILE = STORAGE_DIR / "data.json"

STORAGE_DIR.mkdir(exist_ok=True)
VIDEOS_DIR.mkdir(exist_ok=True)

# Initialize data file if not exists
if not DATA_FILE.exists():
    initial_data = {
        "users": {},
        "companies": {},
        "messages": [],
        "investments": [],
        "interactions": []
    }
    DATA_FILE.write_text(json.dumps(initial_data, indent=2))

# Serve videos statically
app.mount("/videos", StaticFiles(directory=str(VIDEOS_DIR)), name="videos")

# Helper functions
def load_data():
    """Load data from JSON file"""
    with open(DATA_FILE, 'r') as f:
        return json.load(f)

def save_data(data):
    """Save data to JSON file"""
    with open(DATA_FILE, 'w') as f:
        json.dump(data, f, indent=2)

def simple_hash(password: str) -> str:
    """Simple password hashing"""
    return hashlib.sha256(password.encode()).hexdigest()

def format_sar(amount: float) -> str:
    """Format amount in Saudi Riyals"""
    return f"SAR {amount:,.0f}"

# Pydantic Models
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    role: Literal['investor', 'founder']
    name: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class CompanyCreate(BaseModel):
    name: str
    tagline: str
    industry: str
    stage: str
    raise_amount: float  # In SAR
    valuation: float     # In SAR
    equity_percent: float
    min_ticket: float    # In SAR
    description: str
    founder_name: str

class SwipeInteraction(BaseModel):
    user_id: str
    company_id: str
    swipe_type: Literal['right', 'left', 'down']
    watch_time: float

class InvestmentCreate(BaseModel):
    investor_id: str
    company_id: str
    amount: float        # In SAR
    num_tickets: int
    is_bid: bool = False

class MessageSend(BaseModel):
    sender_id: str
    receiver_id: str
    content: str
    company_id: Optional[str] = None

# ============ AUTH ENDPOINTS ============

@app.post("/api/auth/register")
async def register(req: UserRegister):
    data = load_data()
    
    # Check if email exists
    for user in data["users"].values():
        if user["email"] == req.email:
            raise HTTPException(400, "Email already registered")
    
    user_id = str(uuid.uuid4())
    user = {
        "id": user_id,
        "email": req.email,
        "password_hash": simple_hash(req.password),
        "role": req.role,
        "name": req.name or req.email.split('@')[0],
        "created_at": datetime.now().isoformat()
    }
    
    data["users"][user_id] = user
    save_data(data)
    
    return {"user_id": user_id, "role": req.role, "name": user["name"]}

@app.post("/api/auth/login")
async def login(req: UserLogin):
    data = load_data()
    
    for user_id, user in data["users"].items():
        if user["email"] == req.email and user["password_hash"] == simple_hash(req.password):
            return {"user_id": user_id, "role": user["role"], "name": user["name"]}
    
    raise HTTPException(401, "Invalid credentials")

# ============ VIDEO UPLOAD ============

@app.post("/api/upload/video")
async def upload_video(
    file: UploadFile = File(...),
    company_id: str = Form(...),
    title: Optional[str] = Form(None)
):
    """Upload a video file and store it locally"""
    
    # Generate unique filename
    file_extension = file.filename.split('.')[-1]
    unique_filename = f"{uuid.uuid4()}.{file_extension}"
    file_path = VIDEOS_DIR / unique_filename
    
    # Save file
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Update company data with video URL
    data = load_data()
    if company_id in data["companies"]:
        data["companies"][company_id]["video_url"] = f"http://localhost:8000/videos/{unique_filename}"
        data["companies"][company_id]["video_filename"] = file.filename
        save_data(data)
    
    return {
        "url": f"http://localhost:8000/videos/{unique_filename}",
        "filename": file.filename,
        "title": title or file.filename
    }

# ============ COMPANY ENDPOINTS ============

@app.post("/api/company/create")
async def create_company(req: CompanyCreate, founder_id: str):
    data = load_data()
    
    company_id = str(uuid.uuid4())
    company = {
        "id": company_id,
        "founder_id": founder_id,
        "name": req.name,
        "tagline": req.tagline,
        "industry": req.industry,
        "stage": req.stage,
        "raise_amount": req.raise_amount,
        "valuation": req.valuation,
        "equity_percent": req.equity_percent,
        "min_ticket": req.min_ticket,
        "description": req.description,
        "founder_name": req.founder_name,
        "video_url": None,  # Will be updated when video uploaded
        "created_at": datetime.now().isoformat()
    }
    
    data["companies"][company_id] = company
    save_data(data)
    
    return {"company_id": company_id, "company": company}

@app.get("/api/companies")
async def get_companies():
    """Get all companies for the feed"""
    data = load_data()
    companies = list(data["companies"].values())
    
    # Only return companies with videos
    companies_with_videos = [c for c in companies if c.get("video_url")]
    
    return {"companies": companies_with_videos}

@app.get("/api/company/{company_id}")
async def get_company(company_id: str):
    data = load_data()
    company = data["companies"].get(company_id)
    
    if not company:
        raise HTTPException(404, "Company not found")
    
    return {"company": company}

# ============ INVESTOR FEED ============

@app.get("/api/investor/feed")
async def get_investor_feed(user_id: str):
    """Get next video for investor to swipe"""
    data = load_data()
    
    # Get user's previous interactions
    user_interactions = [i for i in data["interactions"] if i["user_id"] == user_id]
    seen_companies = {i["company_id"] for i in user_interactions}
    
    # Get unseen companies with videos
    companies = data["companies"].values()
    unseen = [c for c in companies if c["id"] not in seen_companies and c.get("video_url")]
    
    if not unseen:
        return {"video": None, "message": "No more startups to view"}
    
    # Return next company (in real app, would use vector similarity)
    next_company = unseen[0]
    
    return {
        "video": {
            "id": next_company["id"],
            "name": next_company["name"],
            "tagline": next_company["tagline"],
            "video_url": next_company["video_url"],
            "industry": next_company["industry"],
            "stage": next_company["stage"],
            "raise_amount": next_company["raise_amount"],
            "min_ticket": next_company["min_ticket"],
            "equity_percent": next_company["equity_percent"],
            "founder_name": next_company["founder_name"]
        }
    }

@app.post("/api/investor/swipe")
async def record_swipe(req: SwipeInteraction):
    """Record swipe interaction"""
    data = load_data()
    
    interaction = {
        "id": str(uuid.uuid4()),
        "user_id": req.user_id,
        "company_id": req.company_id,
        "swipe_type": req.swipe_type,
        "watch_time": req.watch_time,
        "timestamp": datetime.now().isoformat()
    }
    
    data["interactions"].append(interaction)
    
    # If swiped right, notify founder
    if req.swipe_type == "right":
        company = data["companies"].get(req.company_id)
        if company:
            # Create notification message
            message = {
                "id": str(uuid.uuid4()),
                "sender_id": "system",
                "receiver_id": company["founder_id"],
                "content": f"🎉 An investor is interested in {company['name']}!",
                "company_id": req.company_id,
                "timestamp": datetime.now().isoformat(),
                "is_notification": True
            }
            data["messages"].append(message)
    
    save_data(data)
    return {"success": True}

# ============ INVESTMENTS ============

@app.post("/api/investment/create")
async def create_investment(req: InvestmentCreate):
    """Create investment or bid request"""
    data = load_data()
    
    company = data["companies"].get(req.company_id)
    if not company:
        raise HTTPException(404, "Company not found")
    
    investment = {
        "id": str(uuid.uuid4()),
        "investor_id": req.investor_id,
        "company_id": req.company_id,
        "amount": req.amount,
        "num_tickets": req.num_tickets,
        "price_per_ticket": req.amount / req.num_tickets,
        "is_bid": req.is_bid,
        "status": "pending" if req.is_bid else "confirmed",
        "timestamp": datetime.now().isoformat()
    }
    
    data["investments"].append(investment)
    
    if req.is_bid:
        # Send bid request message to founder
        message = {
            "id": str(uuid.uuid4()),
            "sender_id": req.investor_id,
            "receiver_id": company["founder_id"],
            "content": f"💰 Investment Bid Request\n\nInvestor wants to invest in {company['name']}:\n• Tickets: {req.num_tickets}\n• Price per ticket: {format_sar(req.amount/req.num_tickets)}\n• Total: {format_sar(req.amount)}\n\nThis is below your minimum of {format_sar(company['min_ticket'])}",
            "company_id": req.company_id,
            "timestamp": datetime.now().isoformat(),
            "is_bid_request": True,
            "bid_id": investment["id"]
        }
        data["messages"].append(message)
    
    save_data(data)
    
    if req.is_bid:
        return {"success": True, "message": "Bid request sent to founder"}
    else:
        return {"success": True, "message": f"Investment of {format_sar(req.amount)} confirmed"}

@app.get("/api/investments/{user_id}")
async def get_user_investments(user_id: str):
    """Get user's investment portfolio"""
    data = load_data()
    
    user_investments = [i for i in data["investments"] if i["investor_id"] == user_id]
    
    # Add company details
    for inv in user_investments:
        company = data["companies"].get(inv["company_id"])
        if company:
            inv["company_name"] = company["name"]
            inv["company_industry"] = company["industry"]
    
    total = sum(i["amount"] for i in user_investments if i["status"] == "confirmed")
    
    return {
        "investments": user_investments,
        "total_invested": total,
        "total_formatted": format_sar(total)
    }

# ============ MESSAGES ============

@app.post("/api/messages/send")
async def send_message(req: MessageSend):
    """Send a message"""
    data = load_data()
    
    message = {
        "id": str(uuid.uuid4()),
        "sender_id": req.sender_id,
        "receiver_id": req.receiver_id,
        "content": req.content,
        "company_id": req.company_id,
        "timestamp": datetime.now().isoformat(),
        "read": False
    }
    
    data["messages"].append(message)
    save_data(data)
    
    return {"success": True, "message": message}

@app.get("/api/messages/{user_id}")
async def get_messages(user_id: str):
    """Get all messages for a user"""
    data = load_data()
    
    user_messages = [
        m for m in data["messages"] 
        if m["sender_id"] == user_id or m["receiver_id"] == user_id
    ]
    
    # Group by conversation
    conversations = {}
    for msg in user_messages:
        other_id = msg["receiver_id"] if msg["sender_id"] == user_id else msg["sender_id"]
        if other_id not in conversations:
            conversations[other_id] = []
        conversations[other_id].append(msg)
    
    return {"conversations": conversations, "messages": user_messages}

# ============ FOUNDER ENDPOINTS ============

@app.post("/api/bid/respond")
async def respond_to_bid(bid_id: str, response: Literal["accept", "reject", "counter"], counter_amount: Optional[float] = None):
    """Founder responds to bid request"""
    data = load_data()
    
    # Find the bid
    bid = next((i for i in data["investments"] if i["id"] == bid_id), None)
    if not bid:
        raise HTTPException(404, "Bid not found")
    
    if response == "accept":
        bid["status"] = "confirmed"
        message_text = f"✅ Your bid of {format_sar(bid['amount'])} has been accepted!"
    elif response == "reject":
        bid["status"] = "rejected"
        message_text = "❌ Your bid has been declined."
    else:  # counter
        bid["status"] = "countered"
        bid["counter_amount"] = counter_amount
        message_text = f"🔄 Counter offer: {format_sar(counter_amount)} for {bid['num_tickets']} tickets"
    
    # Send response message
    company = data["companies"].get(bid["company_id"])
    message = {
        "id": str(uuid.uuid4()),
        "sender_id": company["founder_id"],
        "receiver_id": bid["investor_id"],
        "content": message_text,
        "company_id": bid["company_id"],
        "timestamp": datetime.now().isoformat()
    }
    data["messages"].append(message)
    
    save_data(data)
    return {"success": True, "response": response}

# ============ HEALTH CHECK ============

@app.get("/health")
async def health_check():
    data = load_data()
    return {
        "status": "ok",
        "users": len(data["users"]),
        "companies": len(data["companies"]),
        "videos": len([c for c in data["companies"].values() if c.get("video_url")])
    }

@app.get("/")
async def root():
    return {"message": "PitchSwipe Local Backend Running", "currency": "SAR"}
```

---

## 🎯 Step 2: Update Frontend for Saudi Riyals

### 2.1 Update Currency Formatting

Create `/src/lib/currency.ts`:

```typescript
export function formatSAR(amount: number): string {
  return `SAR ${amount.toLocaleString('ar-SA')}`;
}

export function parseSAR(value: string): number {
  return parseFloat(value.replace(/[^0-9.-]+/g, ''));
}

// Ticket size presets in SAR
export const TICKET_PRESETS = [
  5000,    // SAR 5,000
  10000,   // SAR 10,000
  25000,   // SAR 25,000
  50000,   // SAR 50,000
  100000,  // SAR 100,000
  250000,  // SAR 250,000
];
```

### 2.2 Update Mock Data to SAR

Update `/src/lib/mock-data.ts`:

```typescript
export const formatCurrency = (amount: number) => {
  return `SAR ${amount.toLocaleString('ar-SA')}`;
};

// Update all mock companies with SAR amounts
export const mockStartups: Startup[] = [
  {
    id: "1",
    name: "TechStartup SA",
    tagline: "AI solutions for Saudi businesses",
    industry: "FinTech",
    stage: "Seed",
    raiseAmount: 2000000,    // SAR 2 million
    valuation: 10000000,     // SAR 10 million
    equityPercent: 20,
    minTicket: 10000,        // SAR 10,000
    // ... rest of data
  },
  // ... more startups
];
```

---

## 🎯 Step 3: API Client for Frontend

Create `/src/lib/api.ts`:

```typescript
const API_BASE = 'http://localhost:8000';

export class LocalAPI {
  private userId: string | null = null;

  constructor() {
    this.userId = localStorage.getItem('user_id');
  }

  // Auth
  async register(email: string, password: string, role: 'investor' | 'founder', name?: string) {
    const res = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, role, name })
    });
    const data = await res.json();
    localStorage.setItem('user_id', data.user_id);
    localStorage.setItem('user_role', data.role);
    this.userId = data.user_id;
    return data;
  }

  async login(email: string, password: string) {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    localStorage.setItem('user_id', data.user_id);
    localStorage.setItem('user_role', data.role);
    this.userId = data.user_id;
    return data;
  }

  // Video Upload
  async uploadVideo(file: File, companyId: string) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('company_id', companyId);
    formData.append('title', file.name);

    const res = await fetch(`${API_BASE}/api/upload/video`, {
      method: 'POST',
      body: formData
    });
    return res.json();
  }

  // Company
  async createCompany(data: any) {
    const res = await fetch(`${API_BASE}/api/company/create?founder_id=${this.userId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  }

  async getCompanies() {
    const res = await fetch(`${API_BASE}/api/companies`);
    return res.json();
  }

  // Investor Feed
  async getNextVideo() {
    const res = await fetch(`${API_BASE}/api/investor/feed?user_id=${this.userId}`);
    return res.json();
  }

  async recordSwipe(companyId: string, swipeType: 'left' | 'right' | 'down', watchTime: number) {
    const res = await fetch(`${API_BASE}/api/investor/swipe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: this.userId,
        company_id: companyId,
        swipe_type: swipeType,
        watch_time: watchTime
      })
    });
    return res.json();
  }

  // Investments
  async createInvestment(companyId: string, amount: number, numTickets: number, isBid: boolean) {
    const res = await fetch(`${API_BASE}/api/investment/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        investor_id: this.userId,
        company_id: companyId,
        amount,
        num_tickets: numTickets,
        is_bid: isBid
      })
    });
    return res.json();
  }

  async getPortfolio() {
    const res = await fetch(`${API_BASE}/api/investments/${this.userId}`);
    return res.json();
  }

  // Messages
  async sendMessage(receiverId: string, content: string, companyId?: string) {
    const res = await fetch(`${API_BASE}/api/messages/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sender_id: this.userId,
        receiver_id: receiverId,
        content,
        company_id: companyId
      })
    });
    return res.json();
  }

  async getMessages() {
    const res = await fetch(`${API_BASE}/api/messages/${this.userId}`);
    return res.json();
  }
}

export const api = new LocalAPI();
```

---

## 🎯 Step 4: Quick Start Commands

### 4.1 Install Backend Dependencies

```bash
cd /Users/abdulrazzak/BYTE_COMP/pitchswipe-dev-guide
mkdir backend_local
cd backend_local

# Create requirements.txt
cat > requirements.txt << EOF
fastapi==0.104.1
uvicorn==0.24.0
python-multipart==0.0.6
EOF

# Install
pip install -r requirements.txt
```

### 4.2 Start Backend

```bash
# Terminal 1: Backend
cd /Users/abdulrazzak/BYTE_COMP/pitchswipe-dev-guide/backend_local
uvicorn main:app --reload --port 8000

# Terminal 2: Frontend
cd /Users/abdulrazzak/BYTE_COMP/pitchswipe-dev-guide
npm run dev
```

---

## 🎬 Step 5: Upload Your Videos

### Via UI (After Setup):
1. Register as Founder
2. Create Company Profile
3. Click "Upload Video"
4. Select your YC video files:
   - Apten - YC S24 Founder Video (Accepted).mp4
   - Clearspace (YC W23) Application Video (Accepted).mp4
   - DoorDash's Application Video for YC S13.mp4

### Via API (Quick Test):
```bash
# Upload video
curl -X POST http://localhost:8000/api/upload/video \
  -F "file=@/path/to/Apten - YC S24 Founder Video (Accepted).mp4" \
  -F "company_id=test-company-1" \
  -F "title=Apten YC Video"
```

---

## 📊 Data Storage

All data stored in:
```
backend_local/
├── storage/
│   ├── videos/
│   │   ├── uuid1.mp4  # Your uploaded videos
│   │   ├── uuid2.mp4
│   │   └── uuid3.mp4
│   └── data.json      # All app data
```

The `data.json` contains:
```json
{
  "users": {},
  "companies": {},
  "messages": [],
  "investments": [],
  "interactions": []
}
```

---

## ✅ Testing Flow

1. **Start Backend:**
   ```bash
   cd backend_local && uvicorn main:app --reload
   ```

2. **Test Health:**
   ```bash
   curl http://localhost:8000/health
   ```

3. **Register Users:**
   - Investor: test@investor.com
   - Founder: test@founder.com

4. **Create Company & Upload Video:**
   - Login as founder
   - Create company (SAR amounts)
   - Upload YC video

5. **Test Investment Flow:**
   - Login as investor
   - Swipe through videos
   - Make investment (SAR)
   - Test bid system

---

## 🎯 Key Features

✅ **100% Local** - No cloud, no external DB
✅ **Saudi Riyals** - All amounts in SAR
✅ **Video Upload** - Store videos locally
✅ **Full Flow** - Swipe, invest, message
✅ **Bid System** - Below minimum offers
✅ **Portfolio** - Track investments

---

## 🚀 Next Steps

1. Copy the backend code above
2. Create `backend_local/main.py`
3. Install dependencies
4. Start backend
5. Upload your 3 YC videos
6. Test the full flow!

Everything runs locally on your machine with SAR currency!