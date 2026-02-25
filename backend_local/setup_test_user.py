#!/usr/bin/env python3
"""
Quick setup script to create a test investor with proper onboarding
"""

import httpx
import asyncio
import json

BASE_URL = "http://localhost:8002"

async def setup_test_investor():
    async with httpx.AsyncClient() as client:
        print("🚀 Setting up test investor...")
        
        # 1. Register
        try:
            register_response = await client.post(
                f"{BASE_URL}/api/auth/register",
                json={
                    "email": "demo@investor.com",
                    "password": "demo123",
                    "role": "investor",
                    "name": "Demo Investor"
                }
            )
            
            if register_response.status_code == 200:
                print("✅ Registered successfully")
                user_data = register_response.json()
                user_id = user_data.get("user_id")
            elif register_response.status_code == 400:
                print("⚠️ User exists, using existing ID")
                # Read from data.json to get the user ID
                with open('storage/data.json', 'r') as f:
                    data = json.load(f)
                    for uid, user in data.get('users', {}).items():
                        if user.get('email') == 'demo@investor.com':
                            user_id = uid
                            break
                    else:
                        print("❌ Could not find user ID")
                        return None
            else:
                print(f"❌ Registration failed: {register_response.text}")
                return None
        except Exception as e:
            print(f"❌ Error: {e}")
            return None
        
        print(f"📝 User ID: {user_id}")
        
        # 2. Onboard with preferences
        print("\n🎯 Setting investment preferences...")
        try:
            onboard_response = await client.post(
                f"{BASE_URL}/api/investor/onboard",
                json={
                    "user_id": user_id,
                    "preference_text": """I'm interested in innovative technology startups, particularly:
                    - AI and Machine Learning companies
                    - Fintech and payment solutions
                    - Developer tools and DevOps
                    - B2B SaaS platforms
                    - Delivery and logistics
                    Looking for Series A and Seed stage companies with strong technical founders.
                    Investment range: SAR 10,000 to SAR 500,000""",
                    "tags": ["AI", "Fintech", "B2B", "SaaS", "Delivery", "DevTools", "Seed", "Series A"]
                }
            )
            
            if onboard_response.status_code == 200:
                print("✅ Onboarding completed successfully!")
            else:
                print(f"⚠️ Onboarding response: {onboard_response.status_code} - {onboard_response.text}")
        except Exception as e:
            print(f"❌ Onboarding error: {e}")
            
        return user_id

async def test_next_video(user_id):
    """Test that we can get the next video"""
    async with httpx.AsyncClient() as client:
        print(f"\n🎬 Testing next video for user {user_id}...")
        try:
            response = await client.get(
                f"{BASE_URL}/api/investor/next-video",
                params={"user_id": user_id}
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get("video"):
                    video = data["video"]
                    print(f"✅ Got video: {video['name']} - {video['tagline']}")
                    print(f"   Industry: {video['industry']}, Stage: {video['stage']}")
                    print(f"   Raising: SAR {video['raise_amount']:,}")
                    return True
                else:
                    print("❌ No video in response")
                    return False
            else:
                print(f"❌ Failed to get video: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            print(f"❌ Error getting video: {e}")
            return False

async def main():
    user_id = await setup_test_investor()
    if user_id:
        success = await test_next_video(user_id)
        if success:
            print(f"""
✨ Setup complete! Test user ready:

📧 Email: demo@investor.com
🔐 Password: demo123
🆔 User ID: {user_id}

You can now:
1. Go to http://localhost:8081/
2. Login with the credentials above
3. You should see the video feed with real YC startups!

Or use this user_id directly in API calls:
curl 'http://localhost:8002/api/investor/next-video?user_id={user_id}'
""")
        else:
            print("\n⚠️ Setup completed but couldn't verify video feed")
    else:
        print("\n❌ Setup failed")

if __name__ == "__main__":
    asyncio.run(main())