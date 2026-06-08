"""
PitchSwipe Local Backend with AI Recommendation System
Complete implementation with OpenAI embeddings
"""

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
import numpy as np
import os
import asyncio
from vector_engine import VectorEngine, UserVectorState, generate_company_embedding
try:
    from vector_engine_advanced import AdvancedVectorEngine, EnhancedUserVectorState, WhisperTranscriber, process_saudi_startup_video
    USE_ADVANCED = True
except ImportError:
    USE_ADVANCED = False
    print("Advanced engine not available, using basic engine")

app = FastAPI(title="PitchSwipe AI Backend")

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8081", "http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize vector engine (will use OpenAI if key provided)
api_key = os.getenv("OPENAI_API_KEY")
vector_engine = VectorEngine(openai_api_key=api_key)

# Initialize advanced engine if available
if USE_ADVANCED:
    advanced_engine = AdvancedVectorEngine(openai_api_key=api_key)
    whisper_transcriber = WhisperTranscriber(api_key=api_key)
    print("Advanced engine with Whisper transcription enabled")
else:
    advanced_engine = None
    whisper_transcriber = None

# Create storage directories
STORAGE_DIR = Path("storage")
VIDEOS_DIR = STORAGE_DIR / "videos"
DATA_FILE = STORAGE_DIR / "data.json"
TRANSCRIPTIONS_FILE = STORAGE_DIR / "transcriptions.json"
EMBEDDINGS_FILE = STORAGE_DIR / "embeddings.json"

STORAGE_DIR.mkdir(exist_ok=True)
VIDEOS_DIR.mkdir(exist_ok=True)

# Initialize data files
if not DATA_FILE.exists():
    initial_data = {
        "users": {},
        "companies": {},
        "messages": [],
        "investments": [],
        "interactions": [],
        "user_preferences": {}  # Store preference text
    }
    DATA_FILE.write_text(json.dumps(initial_data, indent=2))

if not TRANSCRIPTIONS_FILE.exists():
    # Placeholder for video transcriptions
    transcriptions = {
        "placeholder": "You will provide transcriptions here",
        "videos": {
            "Apten - YC S24 Founder Video (Accepted).mp4": "Transcription will go here",
            "Clearspace (YC W23) Application Video (Accepted).mp4": "Transcription will go here",
            "DoorDash's Application Video for YC S13.mp4": "Transcription will go here"
        }
    }
    TRANSCRIPTIONS_FILE.write_text(json.dumps(transcriptions, indent=2))

if not EMBEDDINGS_FILE.exists():
    EMBEDDINGS_FILE.write_text(json.dumps({}, indent=2))

# Serve videos statically
app.mount("/videos", StaticFiles(directory=str(VIDEOS_DIR)), name="videos")

# In-memory storage for user vector states
user_states: Dict[str, Any] = {}  # Can be UserVectorState or EnhancedUserVectorState
user_insights: Dict[str, Dict] = {}  # Store advanced insights

# Helper functions
def load_data():
    with open(DATA_FILE, 'r') as f:
        data = json.load(f)
        # Fix data structure if needed (from populate script)
        if isinstance(data.get("users"), list):
            data["users"] = {}
        if "user_preferences" not in data:
            data["user_preferences"] = {}
        return data

def save_data(data):
    with open(DATA_FILE, 'w') as f:
        json.dump(data, f, indent=2)

def load_embeddings():
    with open(EMBEDDINGS_FILE, 'r') as f:
        return json.load(f)

def save_embeddings(embeddings):
    with open(EMBEDDINGS_FILE, 'w') as f:
        json.dump(embeddings, f, indent=2)

def load_transcriptions():
    with open(TRANSCRIPTIONS_FILE, 'r') as f:
        return json.load(f)

def format_sar(amount: float) -> str:
    return f"SAR {amount:,.0f}"

# Pydantic Models
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    role: Literal['investor', 'founder']
    name: Optional[str] = None

class InvestorOnboarding(BaseModel):
    user_id: str
    preference_text: str
    industries: List[str] = []
    stages: List[str] = []
    min_ticket: Optional[float] = 10000  # SAR
    max_ticket: Optional[float] = 1000000  # SAR

class CompanyCreate(BaseModel):
    founder_id: str
    name: str
    tagline: str
    industry: str
    stage: str
    raise_amount: float  # SAR
    valuation: float  # SAR
    equity_percent: float
    min_ticket: float  # SAR
    description: str
    founder_name: str
    location: str = "Saudi Arabia"

class SwipeInteraction(BaseModel):
    user_id: str
    company_id: str
    swipe_type: Literal['right', 'left', 'down', 'skip']
    watch_time: float

# ============ AUTH & ONBOARDING ============

@app.post("/api/auth/register")
async def register(req: UserRegister):
    data = load_data()
    
    for user in data["users"].values():
        if user["email"] == req.email:
            raise HTTPException(400, "Email already registered")
    
    user_id = str(uuid.uuid4())
    user = {
        "id": user_id,
        "email": req.email,
        "password": req.password,  # In production, hash this!
        "role": req.role,
        "name": req.name or req.email.split('@')[0],
        "created_at": datetime.now().isoformat()
    }
    
    data["users"][user_id] = user
    save_data(data)
    
    return {"user_id": user_id, "role": req.role, "name": user["name"]}

@app.post("/api/investor/onboard")
async def investor_onboarding(req: InvestorOnboarding):
    """
    Investor onboarding with preference embedding
    This is where we create the initial preference vector u₀
    """
    data = load_data()
    embeddings = load_embeddings()
    
    # Build comprehensive preference text for embedding
    preference_parts = [req.preference_text]
    
    if req.industries:
        preference_parts.append(f"Industries: {', '.join(req.industries)}")
    if req.stages:
        preference_parts.append(f"Investment stages: {', '.join(req.stages)}")
    if req.min_ticket and req.max_ticket:
        preference_parts.append(f"Investment range: {format_sar(req.min_ticket)} to {format_sar(req.max_ticket)}")
    
    full_preference_text = "\n".join(preference_parts)
    
    # Generate embedding for investor preferences
    print(f"Generating embedding for investor {req.user_id} preferences...")
    preference_embedding = await vector_engine.get_embedding(full_preference_text)
    
    # Store preference and embedding
    data["user_preferences"][req.user_id] = {
        "preference_text": full_preference_text,
        "industries": req.industries,
        "stages": req.stages,
        "min_ticket": req.min_ticket,
        "max_ticket": req.max_ticket,
        "onboarded_at": datetime.now().isoformat()
    }
    
    # Store embedding
    embeddings[f"user_{req.user_id}"] = preference_embedding.tolist()
    
    # Initialize user vector state (use advanced if available)
    if USE_ADVANCED:
        user_state = EnhancedUserVectorState(full_preference_text, user_id=req.user_id)
        await user_state.initialize(advanced_engine)
        print(f"Initialized ADVANCED vector state for user {req.user_id}")
    else:
        user_state = UserVectorState(full_preference_text)
        await user_state.initialize(vector_engine)
    user_states[req.user_id] = user_state
    
    save_data(data)
    save_embeddings(embeddings)
    
    return {
        "success": True,
        "message": "Preferences saved and AI personalization initialized",
        "preference_summary": full_preference_text
    }

# ============ COMPANY MANAGEMENT ============

@app.post("/api/company/create")
async def create_company(req: CompanyCreate):
    """
    Create company with automatic embedding generation
    """
    data = load_data()
    embeddings = load_embeddings()
    
    company_id = str(uuid.uuid4())
    
    # Build comprehensive company description for embedding
    company_text = f"""
    Company: {req.name}
    Tagline: {req.tagline}
    Industry: {req.industry}
    Stage: {req.stage}
    Location: {req.location}
    Description: {req.description}
    Raising: {format_sar(req.raise_amount)}
    Valuation: {format_sar(req.valuation)}
    Equity: {req.equity_percent}%
    Minimum Investment: {format_sar(req.min_ticket)}
    Founder: {req.founder_name}
    """
    
    # Generate embedding
    print(f"Generating embedding for company {req.name}...")
    company_embedding = await vector_engine.get_embedding(company_text)
    
    company = {
        "id": company_id,
        "founder_id": req.founder_id,
        "name": req.name,
        "tagline": req.tagline,
        "industry": req.industry,
        "stage": req.stage,
        "location": req.location,
        "raise_amount": req.raise_amount,
        "valuation": req.valuation,
        "equity_percent": req.equity_percent,
        "min_ticket": req.min_ticket,
        "description": req.description,
        "founder_name": req.founder_name,
        "video_url": None,
        "video_activated": False,  # Will be activated on upload
        "created_at": datetime.now().isoformat()
    }
    
    data["companies"][company_id] = company
    embeddings[f"company_{company_id}"] = company_embedding.tolist()
    
    save_data(data)
    save_embeddings(embeddings)
    
    return {"company_id": company_id, "company": company}

@app.post("/api/company/{company_id}/add-transcription")
async def add_company_transcription(company_id: str, transcription: str):
    """
    Add transcription to company and regenerate embedding
    This is where you'll paste the transcription JSON
    """
    data = load_data()
    embeddings = load_embeddings()
    transcriptions = load_transcriptions()
    
    company = data["companies"].get(company_id)
    if not company:
        raise HTTPException(404, "Company not found")
    
    # Store transcription
    transcriptions[company_id] = transcription
    
    # Regenerate embedding with transcription included
    company_text = f"""
    Company: {company['name']}
    Tagline: {company['tagline']}
    Industry: {company['industry']}
    Stage: {company['stage']}
    Description: {company['description']}
    Video Transcript: {transcription}
    Raising: {format_sar(company['raise_amount'])}
    Location: {company['location']}
    """
    
    print(f"Regenerating embedding for {company['name']} with transcription...")
    new_embedding = await vector_engine.get_embedding(company_text)
    embeddings[f"company_{company_id}"] = new_embedding.tolist()
    
    save_embeddings(embeddings)
    TRANSCRIPTIONS_FILE.write_text(json.dumps(transcriptions, indent=2))
    
    return {"success": True, "message": "Transcription added and embedding updated"}

# ============ COMPANY DETAILS ============

@app.get("/api/company/{company_id}")
async def get_company_details(company_id: str):
    """Get detailed company information including financials"""
    data = load_data()
    
    company = data["companies"].get(company_id)
    if not company:
        raise HTTPException(404, "Company not found")
    
    return company

# ============ VIDEO UPLOAD (MOCK) ============

@app.post("/api/upload/video")
async def upload_video(
    file: UploadFile = File(...),
    company_id: str = Form(...),
):
    """
    Video upload with optional Whisper transcription
    """
    data = load_data()
    embeddings = load_embeddings()
    
    company = data["companies"].get(company_id)
    if not company:
        raise HTTPException(404, "Company not found")
    
    # Save video to disk
    video_filename = file.filename
    video_path = VIDEOS_DIR / video_filename
    
    with open(video_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    video_url = f"http://localhost:8002/videos/{video_filename}"
    
    company["video_url"] = video_url
    company["video_filename"] = video_filename
    company["video_activated"] = True  # Now it will appear in feed!
    
    # Try Whisper transcription if available
    transcription_data = None
    if USE_ADVANCED and whisper_transcriber:
        print(f"Transcribing video {video_filename} with Whisper...")
        try:
            transcription_data = await whisper_transcriber.transcribe_video(str(video_path))
            
            # Update company with transcription insights
            company["transcription"] = transcription_data["transcription"][:500]  # Store first 500 chars
            company["video_categories"] = transcription_data.get("categories", [])
            company["video_keywords"] = transcription_data.get("keywords", [])
            company["market_focus"] = transcription_data.get("market_focus", "general")
            
            # Regenerate embedding with transcription
            enhanced_text = f"""
            {company.get('description', '')}
            
            Video Transcript:
            {transcription_data['transcription'][:1500]}
            
            Keywords: {', '.join(transcription_data.get('keywords', []))}
            Categories: {', '.join(transcription_data.get('categories', []))}
            """
            
            print(f"Generating enhanced embedding with transcription...")
            enhanced_embedding = await advanced_engine.get_embedding_with_transcription(
                company.get('description', ''),
                transcription_data['transcription']
            )
            
            # Update embedding
            embeddings[f"company_{company_id}"] = enhanced_embedding.tolist()
            save_embeddings(embeddings)
            
            print(f"Video transcribed and embedding enhanced for {company['name']}")
        except Exception as e:
            print(f"Transcription failed: {e}")
    
    # Check for pre-loaded transcription as fallback
    transcriptions = load_transcriptions()
    if not transcription_data and video_filename in transcriptions.get("videos", {}):
        # Use pre-loaded transcription
        transcription_text = transcriptions["videos"][video_filename]
        await add_company_transcription(company_id, transcription_text)
    
    save_data(data)
    
    return {
        "success": True,
        "message": f"Video uploaded and activated for {company['name']}",
        "company_id": company_id,
        "video_url": video_url,
        "transcribed": transcription_data is not None,
        "categories": company.get("video_categories", []),
        "keywords": company.get("video_keywords", [])
    }

# ============ AI-POWERED FEED ============

@app.get("/api/investor/next-video")
async def get_next_video_ai(user_id: str):
    """
    Get next video using AI recommendation algorithm
    """
    data = load_data()
    embeddings = load_embeddings()
    
    # Get or initialize user state
    if user_id not in user_states:
        # Try to load from stored preference
        user_pref = data.get("user_preferences", {}).get(user_id)
        if user_pref:
            user_state = UserVectorState(user_pref["preference_text"])
            await user_state.initialize(vector_engine)
            user_states[user_id] = user_state
        else:
            return {"error": "Please complete onboarding first"}
    
    user_state = user_states[user_id]
    
    # Get all activated companies with embeddings
    companies_with_embeddings = []
    for company in data["companies"].values():
        if company.get("video_activated"):
            company_embedding_key = f"company_{company['id']}"
            if company_embedding_key in embeddings:
                companies_with_embeddings.append({
                    "id": company["id"],
                    "embedding": embeddings[company_embedding_key],
                    **company
                })
    
    if not companies_with_embeddings:
        return {"video": None, "message": "No videos available"}
    
    # Use AI to rank companies (advanced if available)
    if USE_ADVANCED and isinstance(user_state, EnhancedUserVectorState):
        ranked_companies = user_state.rank_videos_advanced(
            companies_with_embeddings, 
            use_diversity_boost=True,
            temperature=1.2  # Add some randomness
        )
    else:
        ranked_companies = user_state.rank_videos(companies_with_embeddings)
    
    if not ranked_companies:
        return {"video": None, "message": "You've seen all available startups!"}
    
    # Get the best match
    best_match = ranked_companies[0]
    
    return {
        "video": {
            "id": best_match["id"],
            "name": best_match["name"],
            "tagline": best_match["tagline"],
            "video_url": best_match["video_url"],
            "industry": best_match["industry"],
            "stage": best_match["stage"],
            "raise_amount": best_match["raise_amount"],
            "min_ticket": best_match["min_ticket"],
            "equity_percent": best_match["equity_percent"],
            "founder_name": best_match["founder_name"],
            "score": best_match["score"],  # AI similarity score
            "location": best_match.get("location", "Saudi Arabia")
        },
        "recommendation_reason": f"Match score: {best_match['score']:.2%}"
    }

@app.post("/api/investor/swipe")
async def record_swipe_ai(req: SwipeInteraction):
    """
    Record swipe and update AI model
    """
    data = load_data()
    embeddings = load_embeddings()
    
    # Get user state
    if req.user_id not in user_states:
        raise HTTPException(400, "User state not initialized")
    
    user_state = user_states[req.user_id]
    
    # Get company embedding
    company_embedding_key = f"company_{req.company_id}"
    if company_embedding_key not in embeddings:
        raise HTTPException(400, "Company embedding not found")
    
    company_embedding = np.array(embeddings[company_embedding_key])
    
    # Get company for category
    company = data["companies"].get(req.company_id, {})
    category = company.get("industry", "unknown")
    
    # Update AI model with interaction (enhanced if available)
    if USE_ADVANCED and isinstance(user_state, EnhancedUserVectorState):
        analytics = user_state.record_interaction(
            video_id=req.company_id,
            video_embedding=company_embedding,
            swipe_type=req.swipe_type,
            watch_time=req.watch_time,
            video_length=60.0,  # Assume 60 second videos
            category=category,
            video_info=company  # Pass company info for CSV logging
        )
        # Store insights
        user_insights[req.user_id] = user_state.get_insights()
        print(f"Advanced interaction recorded: {analytics}")
    else:
        user_state.record_interaction(
            video_id=req.company_id,
            video_embedding=company_embedding,
            swipe_type=req.swipe_type,
            watch_time=req.watch_time,
            video_length=60.0
        )
    
    # Store interaction
    interaction = {
        "id": str(uuid.uuid4()),
        "user_id": req.user_id,
        "company_id": req.company_id,
        "swipe_type": req.swipe_type,
        "watch_time": req.watch_time,
        "timestamp": datetime.now().isoformat()
    }
    
    data["interactions"].append(interaction)
    
    # Send notification if right swipe
    if req.swipe_type == "right":
        company = data["companies"].get(req.company_id)
        if company:
            message = {
                "id": str(uuid.uuid4()),
                "sender_id": "system",
                "receiver_id": company["founder_id"],
                "content": f"🎉 An investor is interested in {company['name']}!",
                "company_id": req.company_id,
                "timestamp": datetime.now().isoformat()
            }
            data["messages"].append(message)
    
    save_data(data)
    
    # Get AI stats
    stats = user_state.get_stats()
    
    return {
        "success": True,
        "ai_stats": stats,
        "message": f"AI model updated with {req.swipe_type} swipe"
    }

@app.post("/api/investor/undo-swipe")
async def undo_last_swipe(user_id: str):
    """
    Undo last swipe in AI model
    """
    if user_id not in user_states:
        raise HTTPException(400, "User state not initialized")
    
    user_state = user_states[user_id]
    success = user_state.undo_last_interaction()
    
    if success:
        return {"success": True, "message": "Last swipe undone"}
    else:
        return {"success": False, "message": "Nothing to undo"}

# ============ AI ANALYTICS ============

@app.get("/api/analytics/user/{user_id}")
async def get_user_analytics(user_id: str):
    """
    Get AI analytics for user
    """
    data = load_data()
    
    if user_id not in user_states:
        return {"error": "User not onboarded"}
    
    user_state = user_states[user_id]
    stats = user_state.get_stats()
    
    # Get interaction history
    interactions = [i for i in data["interactions"] if i["user_id"] == user_id]
    
    # Calculate stats
    swipe_counts = {
        "right": len([i for i in interactions if i["swipe_type"] == "right"]),
        "left": len([i for i in interactions if i["swipe_type"] == "left"]),
        "down": len([i for i in interactions if i["swipe_type"] == "down"]),
        "skip": len([i for i in interactions if i["swipe_type"] == "skip"])
    }
    
    return {
        "ai_model_stats": stats,
        "interaction_stats": swipe_counts,
        "total_interactions": len(interactions),
        "preference": data["user_preferences"].get(user_id, {})
    }

# ============ MOCK DATA ENDPOINTS ============

@app.post("/api/mock/create-sample-companies")
async def create_sample_companies():
    """
    Create sample Saudi companies with embeddings
    """
    sample_companies = [
        {
            "name": "Tamara",
            "tagline": "Buy now, pay later for Saudi Arabia",
            "industry": "FinTech",
            "stage": "Series A",
            "description": "Leading BNPL platform in Saudi Arabia enabling seamless shopping experiences",
            "raise_amount": 10000000,  # SAR 10M
            "valuation": 100000000,  # SAR 100M
            "min_ticket": 50000,
            "equity_percent": 10,
            "founder_name": "Abdullah Al-Rashid"
        },
        {
            "name": "Noon Academy",
            "tagline": "Social learning platform for MENA students",
            "industry": "EdTech",
            "stage": "Seed",
            "description": "Gamified learning platform helping students across Saudi Arabia and MENA",
            "raise_amount": 3000000,  # SAR 3M
            "valuation": 15000000,  # SAR 15M
            "min_ticket": 25000,
            "equity_percent": 20,
            "founder_name": "Sarah Al-Zahrani"
        },
        {
            "name": "Sary",
            "tagline": "B2B marketplace for small businesses",
            "industry": "E-commerce",
            "stage": "Series B",
            "description": "Digital procurement platform connecting retailers with suppliers",
            "raise_amount": 30000000,  # SAR 30M
            "valuation": 300000000,  # SAR 300M
            "min_ticket": 100000,
            "equity_percent": 10,
            "founder_name": "Mohammed Aldossary"
        }
    ]
    
    created = []
    for company_data in sample_companies:
        req = CompanyCreate(
            founder_id="sample_founder",
            **company_data
        )
        result = await create_company(req)
        
        # Auto-activate for demo
        data = load_data()
        company = data["companies"][result["company_id"]]
        company["video_activated"] = True
        company["video_url"] = f"http://localhost:8000/videos/sample_{company['name']}.mp4"
        save_data(data)
        
        created.append(result["company_id"])
    
    return {
        "success": True,
        "message": f"Created {len(created)} sample companies with AI embeddings",
        "company_ids": created
    }

# ============ INSIGHTS & ANALYTICS ============

@app.get("/api/investor/{user_id}/insights")
async def get_investor_insights(user_id: str):
    """
    Get advanced insights about investor behavior and preferences
    """
    if user_id not in user_states:
        raise HTTPException(404, "User not found or not onboarded")
    
    # Get basic stats
    data = load_data()
    interactions = [i for i in data["interactions"] if i["user_id"] == user_id]
    
    basic_stats = {
        "total_interactions": len(interactions),
        "right_swipes": len([i for i in interactions if i["swipe_type"] == "right"]),
        "left_swipes": len([i for i in interactions if i["swipe_type"] == "left"]),
        "saved": len([i for i in interactions if i["swipe_type"] == "down"])
    }
    
    # Get advanced insights if available
    advanced_insights = {}
    if USE_ADVANCED and user_id in user_insights:
        advanced_insights = user_insights[user_id]
    
    return {
        "user_id": user_id,
        "basic_stats": basic_stats,
        "advanced_insights": advanced_insights,
        "recommendation_engine": "advanced" if USE_ADVANCED else "basic"
    }

# ============ HEALTH & STATUS ============

@app.get("/health")
async def health_check():
    data = load_data()
    embeddings = load_embeddings()
    
    return {
        "status": "ok",
        "openai_configured": vector_engine.api_key is not None,
        "stats": {
            "users": len(data["users"]),
            "companies": len(data["companies"]),
            "activated_companies": len([c for c in data["companies"].values() if c.get("video_activated")]),
            "embeddings": len(embeddings),
            "user_states": len(user_states),
            "interactions": len(data["interactions"])
        }
    }

@app.get("/api/investor/export-vectors")
async def export_investor_vectors(user_id: str):
    """Export investor vector state for visibility"""
    if user_id not in user_states:
        raise HTTPException(404, "User not found")
    
    user_state = user_states[user_id]
    
    if USE_ADVANCED and isinstance(user_state, EnhancedUserVectorState):
        # Get state summary
        if user_state.logger:
            summary = user_state.logger.export_state_summary(user_id, user_state)
        else:
            summary = {
                "error": "Logger not initialized for this user"
            }
        
        # Get insights
        insights = user_state.get_insights()
        
        return {
            "user_id": user_id,
            "state_summary": summary,
            "insights": insights,
            "csv_file": f"storage/investor_vectors.csv"
        }
    else:
        return {
            "error": "Advanced vector engine not enabled or user state not advanced"
        }

@app.get("/api/investor/vector-csv")
async def get_vector_csv():
    """Download the CSV file with all investor vector calculations"""
    from fastapi.responses import FileResponse
    import os
    
    csv_path = os.path.join("storage", "investor_vectors.csv")
    
    if not os.path.exists(csv_path):
        return {
            "error": "No CSV file found. Interactions will be logged once investors start swiping."
        }
    
    return FileResponse(
        path=csv_path,
        filename="investor_vectors.csv",
        media_type="text/csv"
    )

@app.get("/")
async def root():
    return {
        "message": "PitchSwipe AI Backend Running",
        "currency": "SAR",
        "ai_enabled": vector_engine.api_key is not None,
        "endpoints": {
            "onboarding": "/api/investor/onboard",
            "next_video": "/api/investor/next-video",
            "swipe": "/api/investor/swipe",
            "create_samples": "/api/mock/create-sample-companies",
            "export_vectors": "/api/investor/export-vectors?user_id=<user_id>",
            "vector_csv": "/api/investor/vector-csv"
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)