"""
Quick script to create a test investor and show available companies
"""

import httpx
import asyncio
import json

BASE_URL = "http://localhost:8002"

async def test_investor_flow():
    async with httpx.AsyncClient() as client:
        print("🚀 Creating test investor...")
        
        # 1. Register
        register_response = await client.post(
            f"{BASE_URL}/api/auth/register",
            json={
                "email": "test@investor.com",
                "password": "test123",
                "role": "investor",
                "name": "Test Investor"
            }
        )
        
        if register_response.status_code == 200:
            print("✅ Registered successfully")
            user_data = register_response.json()
            user_id = user_data.get("user_id")
        elif register_response.status_code == 400:
            print("⚠️ User already exists, trying login...")
            # Try login
            login_response = await client.post(
                f"{BASE_URL}/api/auth/login",
                json={
                    "email": "test@investor.com",
                    "password": "test123"
                }
            )
            if login_response.status_code == 200:
                print("✅ Logged in successfully")
                user_data = login_response.json()
                user_id = user_data.get("user_id")
            else:
                print(f"❌ Login failed: {login_response.text}")
                return
        else:
            print(f"❌ Registration failed: {register_response.text}")
            return
        
        print(f"📝 User ID: {user_id}")
        
        # 2. Onboard with preferences
        print("\n🎯 Setting investment preferences...")
        onboard_response = await client.post(
            f"{BASE_URL}/api/investor/onboard",
            json={
                "user_id": user_id,
                "preference_text": "I'm interested in AI, Fintech, and Delivery startups. Looking for Series A and Seed companies with strong technical founders. Particularly interested in B2B SaaS, marketplaces, and developer tools.",
                "tags": ["AI", "Fintech", "B2B", "SaaS", "Delivery", "DevTools"]
            }
        )
        
        if onboard_response.status_code == 200:
            print("✅ Onboarding completed")
        else:
            print(f"⚠️ Onboarding status: {onboard_response.status_code}")
        
        # 3. Get next video
        print("\n🎬 Fetching recommended videos...")
        for i in range(5):  # Get first 5 recommendations
            video_response = await client.get(
                f"{BASE_URL}/api/investor/next-video",
                params={"user_id": user_id}
            )
            
            if video_response.status_code == 200:
                video_data = video_response.json()
                if video_data.get("video"):
                    video = video_data["video"]
                    print(f"\n#{i+1}. {video['name']}")
                    print(f"   📱 {video['tagline']}")
                    print(f"   🏢 {video['industry']} | {video['stage']}")
                    print(f"   💰 Raising: SAR {video['raise_amount']:,}")
                    print(f"   🎫 Min ticket: SAR {video['min_ticket']:,}")
                    print(f"   📊 Equity: {video['equity_percent']}%")
                    
                    # Simulate a swipe to get next video
                    await client.post(
                        f"{BASE_URL}/api/investor/swipe",
                        json={
                            "user_id": user_id,
                            "company_id": video["id"],
                            "swipe_type": "down",  # Skip to see more
                            "watch_time": 5.0
                        }
                    )
                else:
                    print("No more videos available")
                    break
            else:
                print(f"❌ Error getting video: {video_response.text}")
                break
        
        print("\n✨ Test complete! You can now:")
        print(f"   1. Go to the UI and login with:")
        print(f"      Email: test@investor.com")
        print(f"      Password: test123")
        print(f"   2. You'll see the video feed with all 16 startups!")

if __name__ == "__main__":
    asyncio.run(test_investor_flow())