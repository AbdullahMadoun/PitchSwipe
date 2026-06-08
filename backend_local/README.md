# PitchSwipe Backend - Local Setup

## ✅ Backend is Ready!

The backend is fully implemented with AI recommendation logic and is now running on port 8002.

## 🚀 Features Implemented

1. **AI-Powered Recommendations**
   - OpenAI embeddings for investor preferences and company descriptions
   - Dynamic learning from swipe interactions
   - Cosine similarity-based ranking

2. **Complete API Endpoints**
   - User registration/login (Investor & Founder)
   - Investor onboarding with preference embedding
   - Company creation with automatic embedding generation
   - Mock video upload activation
   - AI-powered feed recommendations
   - Swipe interaction recording
   - Investment tracking
   - Messaging system

3. **Local Storage**
   - All data stored in JSON files in `/storage` directory
   - No database or cloud dependencies
   - Saudi Riyals (SAR) currency

4. **Placeholder for Transcriptions**
   - Ready for YC video transcriptions (Apten, ClearSpace, DoorDash)
   - Located in `/storage/transcriptions.json`

## 📦 How to Use

### Option 1: With OpenAI API Key (Recommended)
```bash
# Set your OpenAI API key
export OPENAI_API_KEY="your-key-here"

# The backend is already running on port 8002
# Check health: http://localhost:8002/health
```

### Option 2: Without OpenAI (Demo Mode)
The backend works without an API key using random vectors for testing.

## 🧪 Test the Backend

Run the test suite:
```bash
cd /Users/abdulrazzak/BYTE_COMP/pitchswipe-dev-guide/backend_local
source venv/bin/activate
python test_api.py
```

## 📊 API Endpoints

- **Health Check**: `GET http://localhost:8002/health`
- **Register**: `POST http://localhost:8002/api/auth/register`
- **Login**: `POST http://localhost:8002/api/auth/login`
- **Investor Onboarding**: `POST http://localhost:8002/api/investor/onboard`
- **Create Company**: `POST http://localhost:8002/api/founder/company`
- **Upload Video (Mock)**: `POST http://localhost:8002/api/upload/video`
- **Get Next Video**: `GET http://localhost:8002/api/investor/next-video`
- **Record Interaction**: `POST http://localhost:8002/api/investor/interaction`
- **Make Investment**: `POST http://localhost:8002/api/investor/invest`

## 🎬 Adding YC Videos

When you have the transcriptions, add them to:
```json
/storage/transcriptions.json
```

Format:
```json
{
  "apten": {
    "company_name": "Apten",
    "video_file": "apten_pitch.mp4",
    "transcription": "Your transcription here",
    "description": "AI-powered platform for optimizing business operations"
  }
}
```

## 🔄 Reset Data

To clear all data and start fresh:
```bash
echo '[]' > storage/users.json
echo '[]' > storage/companies.json
echo '[]' > storage/interactions.json
echo '[]' > storage/messages.json
echo '[]' > storage/investments.json
```

Then restart the server.

## 🛠 Server Management

The server is running in the background. To check its status:
```bash
curl http://localhost:8002/health
```

## 🎯 Next Steps

1. **Add your OpenAI API key** for real embeddings (optional)
2. **Upload the YC videos** and add transcriptions
3. **Connect the frontend** to use the API endpoints
4. **Test the full flow** with the test script

The backend is fully functional and ready to use!