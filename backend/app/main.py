"""
PitchSwipe Backend API
Based on CLAUDE.md specification v2.1
"""

from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from typing import Optional, Literal, List, Dict, Any
import uuid
from datetime import datetime, timedelta
import numpy as np
import hashlib
import jwt
import os

# Import vector engine (we'll create this next)
from .vector_engine import UserVectorState

app = FastAPI(title="PitchSwipe API", version="2.1.0")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://localhost:5174", "http://localhost:8080"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Simple password hashing for demo - use bcrypt in production
def simple_hash(password: str) -> str:
    """Simple hashing for demo - use bcrypt in production"""
    return hashlib.sha256(password.encode()).hexdigest()

# JWT settings
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# In-memory storage (use PostgreSQL in production)
users_db: Dict[str, Dict] = {}
companies_db: Dict[str, Dict] = {}
messages_db: List[Dict] = []
investments_db: List[Dict] = []
user_states: Dict[str, UserVectorState] = {}

# ============= Pydantic Models =============

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    role: Literal['investor', 'founder']

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class InvestorOnboarding(BaseModel):
    user_id: str
    preference_text: str
    tags: Optional[List[str]] = []

class CompanyCreate(BaseModel):
    founder_id: str
    name: str
    tagline: str
    industry: str
    stage: str
    location: Dict[str, str]  # {city, country, region?}
    raise_amount: float
    valuation: float
    equity_percent: float
    min_ticket: float
    lead_investor: Optional[str] = None
    revenue: Optional[float] = None
    burn_rate: Optional[float] = None
    runway_months: Optional[int] = None
    growth_percent: Optional[float] = None
    description: str
    website: Optional[str] = None
    founded_year: Optional[int] = None
    team_size: Optional[int] = None
    main_video_url: str
    additional_videos: Optional[List[str]] = []

class InteractionRequest(BaseModel):
    user_id: str
    video_id: str
    swipe_type: Literal['right', 'left', 'down']
    watch_time: float
    video_length: float

class SendMessage(BaseModel):
    sender_id: str
    receiver_id: str
    company_id: str
    content: str

class CreateInvestment(BaseModel):
    investor_id: str
    company_id: str
    amount: float

# ============= Helper Functions =============

def verify_password(plain_password, hashed_password):
    return simple_hash(plain_password) == hashed_password

def get_password_hash(password):
    return simple_hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# ============= Demo Data =============

def create_demo_companies():
    demo_companies = [
        {
            "id": str(uuid.uuid4()),
            "founder_id": "demo_founder_1",
            "name": "NeuralFlow AI",
            "tagline": "AI-powered workflow automation for enterprises",
            "industry": "AI/ML",
            "stage": "Series A",
            "location": {"city": "San Francisco", "country": "USA", "region": "CA"},
            "raise_amount": 5000000,
            "valuation": 25000000,
            "equity_percent": 20,
            "min_ticket": 25000,
            "revenue": 100000,
            "burn_rate": 150000,
            "runway_months": 18,
            "growth_percent": 30,
            "description": "We're building the future of enterprise automation using cutting-edge AI.",
            "main_video_url": "https://example.com/video1.mp4",
            "website": "https://neuralflow.ai",
            "founded_year": 2022,
            "team_size": 15,
            "embedding": np.random.randn(1536).tolist(),
            "interested_investors": []
        },
        {
            "id": str(uuid.uuid4()),
            "founder_id": "demo_founder_2", 
            "name": "HealthSync",
            "tagline": "Connected healthcare platform for remote patient monitoring",
            "industry": "Healthcare",
            "stage": "Seed",
            "location": {"city": "Boston", "country": "USA", "region": "MA"},
            "raise_amount": 2000000,
            "valuation": 10000000,
            "equity_percent": 20,
            "min_ticket": 10000,
            "revenue": 50000,
            "burn_rate": 100000,
            "runway_months": 12,
            "growth_percent": 25,
            "description": "Revolutionizing remote healthcare with real-time patient monitoring.",
            "main_video_url": "https://example.com/video2.mp4",
            "website": "https://healthsync.io",
            "founded_year": 2023,
            "team_size": 8,
            "embedding": np.random.randn(1536).tolist(),
            "interested_investors": []
        },
        {
            "id": str(uuid.uuid4()),
            "founder_id": "demo_founder_3",
            "name": "GreenEnergy Solutions",
            "tagline": "Smart grid optimization for renewable energy",
            "industry": "Climate Tech",
            "stage": "Series B",
            "location": {"city": "Austin", "country": "USA", "region": "TX"},
            "raise_amount": 10000000,
            "valuation": 50000000,
            "equity_percent": 20,
            "min_ticket": 50000,
            "revenue": 500000,
            "burn_rate": 300000,
            "runway_months": 24,
            "growth_percent": 40,
            "description": "Making renewable energy more efficient and accessible.",
            "main_video_url": "https://example.com/video3.mp4",
            "website": "https://greenenergysolutions.com",
            "founded_year": 2021,
            "team_size": 30,
            "embedding": np.random.randn(1536).tolist(),
            "interested_investors": []
        },
        {
            "id": str(uuid.uuid4()),
            "founder_id": "demo_founder_4",
            "name": "CryptoVault",
            "tagline": "Institutional-grade crypto custody solutions",
            "industry": "Fintech",
            "stage": "Series A",
            "location": {"city": "London", "country": "UK"},
            "raise_amount": 7000000,
            "valuation": 35000000,
            "equity_percent": 20,
            "min_ticket": 25000,
            "revenue": 200000,
            "burn_rate": 250000,
            "runway_months": 20,
            "growth_percent": 50,
            "description": "Secure, compliant cryptocurrency storage for institutions.",
            "main_video_url": "https://example.com/video4.mp4",
            "website": "https://cryptovault.io",
            "founded_year": 2022,
            "team_size": 20,
            "embedding": np.random.randn(1536).tolist(),
            "interested_investors": []
        },
        {
            "id": str(uuid.uuid4()),
            "founder_id": "demo_founder_5",
            "name": "EduTech Pro",
            "tagline": "Personalized learning powered by AI",
            "industry": "EdTech",
            "stage": "Seed",
            "location": {"city": "Singapore", "country": "Singapore"},
            "raise_amount": 1500000,
            "valuation": 7500000,
            "equity_percent": 20,
            "min_ticket": 5000,
            "revenue": 30000,
            "burn_rate": 80000,
            "runway_months": 15,
            "growth_percent": 20,
            "description": "Adaptive learning platform that personalizes education for every student.",
            "main_video_url": "https://example.com/video5.mp4",
            "website": "https://edutechpro.com",
            "founded_year": 2023,
            "team_size": 6,
            "embedding": np.random.randn(1536).tolist(),
            "interested_investors": []
        }
    ]
    
    for company in demo_companies:
        companies_db[company["id"]] = company

# Initialize demo data on startup
@app.on_event("startup")
async def startup_event():
    create_demo_companies()
    print(f"✅ PitchSwipe API started with {len(companies_db)} demo companies")

# ============= Auth Endpoints =============

@app.post("/api/auth/register", status_code=status.HTTP_201_CREATED)
async def register(req: UserRegister):
    # Check if email exists
    for user in users_db.values():
        if user['email'] == req.email:
            raise HTTPException(400, "Email already registered")
    
    user_id = str(uuid.uuid4())
    users_db[user_id] = {
        'id': user_id,
        'email': req.email,
        'password_hash': get_password_hash(req.password),
        'role': req.role,
        'created_at': datetime.utcnow().isoformat(),
        'onboarded': False
    }
    
    # Create access token
    access_token = create_access_token(data={"sub": user_id})
    
    return {'user_id': user_id, 'role': req.role, 'token': access_token}

@app.post("/api/auth/login")
async def login(req: UserLogin):
    for user_id, user in users_db.items():
        if user['email'] == req.email and verify_password(req.password, user['password_hash']):
            access_token = create_access_token(data={"sub": user_id})
            return {
                'user_id': user_id, 
                'role': user['role'], 
                'token': access_token,
                'onboarded': user.get('onboarded', False)
            }
    raise HTTPException(401, "Invalid credentials")

# ============= Investor Endpoints =============

@app.post("/api/investor/onboard")
async def investor_onboard(req: InvestorOnboarding):
    if req.user_id not in users_db:
        raise HTTPException(404, "User not found")
    
    # Initialize vector state (simplified - without OpenAI for demo)
    # In production, use OpenAI embeddings
    initial_embedding = np.random.randn(1536)  # Mock embedding
    user_states[req.user_id] = UserVectorState(initial_embedding)
    
    # Update user profile
    users_db[req.user_id]['preferences'] = req.preference_text
    users_db[req.user_id]['tags'] = req.tags
    users_db[req.user_id]['onboarded'] = True
    
    return {'success': True}

@app.get("/api/investor/next-video")
async def get_next_video(user_id: str):
    # Get user state or create default
    if user_id not in user_states:
        user_states[user_id] = UserVectorState(np.random.randn(1536))
    
    state = user_states[user_id]
    
    # Get all companies as videos
    videos = []
    for company_id, company in companies_db.items():
        if company_id not in state.seen_ids:
            videos.append({
                'id': company_id,
                'embedding': np.array(company.get('embedding', np.random.randn(1536).tolist())),
                **company
            })
    
    if not videos:
        return {'video': None, 'message': 'No more videos'}
    
    # Rank videos (simplified without real embeddings)
    ranked = state.rank_videos(videos)
    if not ranked:
        # If no ranked videos, return random
        import random
        video = random.choice(videos) if videos else None
    else:
        video = ranked[0]
    
    if not video:
        return {'video': None, 'message': 'No more videos'}
    
    # Return PUBLIC data only (no financials)
    return {
        'video': {
            'id': video['id'],
            'startup_name': video['name'],
            'tagline': video['tagline'],
            'video_url': video['main_video_url'],
            'stage': video['stage'],
            'industry': video['industry'],
            'raise_amount': video['raise_amount'],
            'min_ticket': video['min_ticket'],
            'valuation': video['valuation'],
            'equity_percent': video['equity_percent'],
            'logo_url': video.get('logo_url'),
            'location': video.get('location', {'city': 'San Francisco', 'country': 'USA'}),
        }
    }

@app.post("/api/investor/interaction")
async def record_interaction(req: InteractionRequest):
    if req.user_id not in user_states:
        user_states[req.user_id] = UserVectorState(np.random.randn(1536))
    
    state = user_states[req.user_id]
    company = companies_db.get(req.video_id)
    
    if not company:
        raise HTTPException(404, "Company not found")
    
    embedding = np.array(company.get('embedding', np.random.randn(1536).tolist()))
    
    state.record_interaction(
        video_id=req.video_id,
        video_embedding=embedding,
        swipe_type=req.swipe_type,
        watch_time=req.watch_time,
        video_length=req.video_length
    )
    
    # If swiped right, notify founder
    if req.swipe_type == 'right':
        if 'interested_investors' not in companies_db[req.video_id]:
            companies_db[req.video_id]['interested_investors'] = []
        companies_db[req.video_id]['interested_investors'].append({
            'investor_id': req.user_id,
            'timestamp': datetime.utcnow().isoformat()
        })
    
    return {'success': True}

@app.post("/api/investor/undo")
async def undo_swipe(user_id: str):
    if user_id not in user_states:
        raise HTTPException(404, "User not found")
    
    state = user_states[user_id]
    success = state.undo_last_interaction()
    
    if not success:
        raise HTTPException(400, "Nothing to undo")
    
    return {'success': True, 'message': 'Last swipe undone'}

@app.get("/api/investor/data-room/{company_id}")
async def get_data_room(company_id: str, user_id: str):
    if user_id not in user_states:
        raise HTTPException(404, "User not found")
    
    state = user_states[user_id]
    
    if company_id not in state.unlocked_ids:
        raise HTTPException(403, "Data room not unlocked - swipe right first")
    
    company = companies_db.get(company_id)
    if not company:
        raise HTTPException(404, "Company not found")
    
    # Return FULL data including financials
    return {
        'company': company,
        'financials': {
            'revenue': company.get('revenue'),
            'burn_rate': company.get('burn_rate'),
            'runway_months': company.get('runway_months'),
            'growth_percent': company.get('growth_percent'),
        }
    }

@app.get("/api/investor/saved")
async def get_saved(user_id: str):
    if user_id not in user_states:
        raise HTTPException(404, "User not found")
    
    state = user_states[user_id]
    saved = [companies_db[cid] for cid in state.saved_ids if cid in companies_db]
    
    return {'saved': saved}

@app.get("/api/investor/portfolio")
async def get_portfolio(user_id: str):
    investments = [inv for inv in investments_db if inv['investor_id'] == user_id]
    
    total = sum(inv['amount'] for inv in investments)
    
    return {
        'total_invested': total,
        'companies_count': len(investments),
        'investments': investments
    }

@app.post("/api/investor/invest")
async def create_investment(req: CreateInvestment):
    company = companies_db.get(req.company_id)
    if not company:
        raise HTTPException(404, "Company not found")
    
    # Check minimum ticket
    if req.amount < company['min_ticket']:
        raise HTTPException(400, f"Minimum investment is ${company['min_ticket']}")
    
    # Calculate equity
    equity = (req.amount / company['valuation']) * 100
    
    investment = {
        'id': str(uuid.uuid4()),
        'investor_id': req.investor_id,
        'company_id': req.company_id,
        'company_name': company['name'],
        'amount': req.amount,
        'equity_percent': equity,
        'created_at': datetime.utcnow().isoformat()
    }
    
    investments_db.append(investment)
    
    return {'investment': investment}

# ============= Search Endpoints =============

@app.get("/api/search")
async def search_companies(
    q: Optional[str] = None,
    industry: Optional[str] = None,
    stage: Optional[str] = None,
    min_raise: Optional[float] = None,
    max_raise: Optional[float] = None
):
    results = list(companies_db.values())
    
    if q:
        q_lower = q.lower()
        results = [c for c in results if 
                   q_lower in c['name'].lower() or 
                   q_lower in c.get('tagline', '').lower() or
                   q_lower in c.get('description', '').lower()]
    
    if industry:
        results = [c for c in results if c['industry'].lower() == industry.lower()]
    
    if stage:
        results = [c for c in results if c['stage'].lower() == stage.lower()]
    
    if min_raise:
        results = [c for c in results if c['raise_amount'] >= min_raise]
    
    if max_raise:
        results = [c for c in results if c['raise_amount'] <= max_raise]
    
    # Remove sensitive data
    public_results = [{
        'id': c['id'],
        'name': c['name'],
        'tagline': c['tagline'],
        'industry': c['industry'],
        'stage': c['stage'],
        'raise_amount': c['raise_amount'],
        'logo_url': c.get('logo_url'),
        'main_video_url': c['main_video_url']
    } for c in results]
    
    return {'results': public_results}

# ============= Founder Endpoints =============

@app.post("/api/founder/company")
async def create_company(req: CompanyCreate):
    if req.founder_id not in users_db:
        raise HTTPException(404, "User not found")
    
    company_id = str(uuid.uuid4())
    
    # Generate embedding from description (mock for demo)
    embedding = np.random.randn(1536).tolist()
    
    company = {
        'id': company_id,
        'founder_id': req.founder_id,
        'name': req.name,
        'tagline': req.tagline,
        'industry': req.industry,
        'stage': req.stage,
        'location': req.location,
        'raise_amount': req.raise_amount,
        'valuation': req.valuation,
        'equity_percent': req.equity_percent,
        'min_ticket': req.min_ticket,
        'lead_investor': req.lead_investor,
        'revenue': req.revenue,
        'burn_rate': req.burn_rate,
        'runway_months': req.runway_months,
        'growth_percent': req.growth_percent,
        'description': req.description,
        'main_video_url': req.main_video_url,
        'additional_videos': req.additional_videos,
        'website': req.website,
        'founded_year': req.founded_year,
        'team_size': req.team_size,
        'embedding': embedding,
        'interested_investors': [],
        'created_at': datetime.utcnow().isoformat()
    }
    
    companies_db[company_id] = company
    
    # Mark founder as onboarded
    users_db[req.founder_id]['onboarded'] = True
    users_db[req.founder_id]['company_id'] = company_id
    
    return {'company_id': company_id}

@app.get("/api/founder/company/{founder_id}")
async def get_founder_company(founder_id: str):
    for company in companies_db.values():
        if company['founder_id'] == founder_id:
            return {'company': company}
    raise HTTPException(404, "No company found for this founder")

@app.get("/api/founder/interested/{company_id}")
async def get_interested_investors(company_id: str):
    company = companies_db.get(company_id)
    if not company:
        raise HTTPException(404, "Company not found")
    
    interested = []
    for inv in company.get('interested_investors', []):
        investor = users_db.get(inv['investor_id'])
        if investor:
            interested.append({
                'investor_id': inv['investor_id'],
                'email': investor['email'],  # Or name if we add it
                'timestamp': inv['timestamp']
            })
    
    return {'interested': interested, 'count': len(interested)}

# ============= Messaging Endpoints =============

@app.post("/api/messages/send")
async def send_message(req: SendMessage):
    # Verify sender exists
    if req.sender_id not in users_db:
        raise HTTPException(404, "Sender not found")
    
    # Verify receiver exists
    if req.receiver_id not in users_db:
        raise HTTPException(404, "Receiver not found")
    
    message = {
        'id': str(uuid.uuid4()),
        'sender_id': req.sender_id,
        'receiver_id': req.receiver_id,
        'company_id': req.company_id,
        'content': req.content,
        'read': False,
        'created_at': datetime.utcnow().isoformat()
    }
    
    messages_db.append(message)
    
    return {'message': message}

@app.get("/api/messages/threads/{user_id}")
async def get_message_threads(user_id: str):
    # Get all messages involving this user
    user_messages = [m for m in messages_db if m['sender_id'] == user_id or m['receiver_id'] == user_id]
    
    # Group by conversation partner + company
    threads = {}
    for msg in user_messages:
        other_id = msg['receiver_id'] if msg['sender_id'] == user_id else msg['sender_id']
        key = f"{other_id}_{msg['company_id']}"
        
        if key not in threads:
            other_user = users_db.get(other_id, {})
            company = companies_db.get(msg['company_id'], {})
            threads[key] = {
                'other_user_id': other_id,
                'other_user_email': other_user.get('email'),
                'company_id': msg['company_id'],
                'company_name': company.get('name'),
                'last_message': msg,
                'unread_count': 0
            }
        
        # Update with latest message
        if msg['created_at'] > threads[key]['last_message']['created_at']:
            threads[key]['last_message'] = msg
        
        # Count unread
        if msg['receiver_id'] == user_id and not msg['read']:
            threads[key]['unread_count'] += 1
    
    return {'threads': list(threads.values())}

@app.get("/api/messages/thread/{user_id}/{other_user_id}/{company_id}")
async def get_thread_messages(user_id: str, other_user_id: str, company_id: str):
    thread_messages = [
        m for m in messages_db 
        if m['company_id'] == company_id and
        ((m['sender_id'] == user_id and m['receiver_id'] == other_user_id) or
         (m['sender_id'] == other_user_id and m['receiver_id'] == user_id))
    ]
    
    # Sort by time
    thread_messages.sort(key=lambda x: x['created_at'])
    
    # Mark as read
    for msg in thread_messages:
        if msg['receiver_id'] == user_id:
            msg['read'] = True
    
    return {'messages': thread_messages}

# ============= Health Check =============

@app.get("/")
async def root():
    return {"message": "PitchSwipe API v2.1 is running"}

@app.get("/health")
async def health_check():
    return {
        'status': 'healthy',
        'companies_count': len(companies_db),
        'users_count': len(users_db),
        'version': '2.1.0'
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)