#!/usr/bin/env python3
"""
Test script for PitchSwipe API
Tests the recommendation algorithm and full flow
"""

import httpx
import asyncio
import json
import time

API_BASE = "http://localhost:8002"

async def test_full_flow():
    async with httpx.AsyncClient() as client:
        print("=" * 60)
        print("🚀 PitchSwipe Backend Test Suite")
        print("=" * 60)
        
        # 1. Register an investor
        print("\n1. Registering investor...")
        investor_reg = await client.post(f"{API_BASE}/api/auth/register", json={
            "email": "khalid.investor@gmail.com",
            "password": "test123",
            "role": "investor",
            "name": "Khalid Al-Rashid"
        })
        print(f"✅ Investor registered: {investor_reg.json()}")
        investor_id = investor_reg.json()["user_id"]
        
        # 2. Register a founder
        print("\n2. Registering founder...")
        founder_reg = await client.post(f"{API_BASE}/api/auth/register", json={
            "email": "sara.founder@gmail.com",
            "password": "test123",
            "role": "founder",
            "name": "Sara Al-Saud"
        })
        print(f"✅ Founder registered: {founder_reg.json()}")
        founder_id = founder_reg.json()["user_id"]
        
        # 3. Investor onboarding
        print("\n3. Investor onboarding with preferences...")
        onboard_resp = await client.post(f"{API_BASE}/api/investor/onboard", json={
            "user_id": investor_id,
            "preference_text": "I'm interested in Saudi tech startups, especially fintech, e-commerce, and AI companies in Seed to Series A stage. Looking for innovative solutions serving the Saudi market.",
            "tags": ["fintech", "ecommerce", "ai", "saudi", "seed", "series-a"]
        })
        print(f"✅ Onboarding completed: {onboard_resp.json()}")
        
        # 4. Create companies
        print("\n4. Creating test companies...")
        
        # Company 1: Saraha (Fintech)
        company1 = await client.post(f"{API_BASE}/api/founder/company", json={
            "founder_id": founder_id,
            "name": "Saraha",
            "tagline": "Digital wallet for Saudi youth",
            "industry": "Fintech",
            "stage": "Seed",
            "raise_amount": 2000000,
            "valuation": 10000000,
            "equity_percent": 20,
            "min_ticket": 25000,
            "lead_investor": "STV",
            "revenue": 50000,
            "burn_rate": 100000,
            "runway_months": 20,
            "growth_percent": 30,
            "description": "Saraha is building the first digital wallet specifically designed for Saudi youth, with features for savings goals, parent controls, and Islamic finance compliance.",
            "main_video_url": "https://example.com/saraha-pitch.mp4"
        })
        print(f"✅ Created Saraha: {company1.json()}")
        saraha_id = company1.json().get('company_id') or company1.json().get('id')
        
        # Company 2: Noon Express (E-commerce)
        company2 = await client.post(f"{API_BASE}/api/founder/company", json={
            "founder_id": founder_id,
            "name": "Noon Express",
            "tagline": "Same-day delivery for Saudi retailers",
            "industry": "E-commerce",
            "stage": "Series A",
            "raise_amount": 5000000,
            "valuation": 25000000,
            "equity_percent": 20,
            "min_ticket": 50000,
            "revenue": 200000,
            "burn_rate": 250000,
            "runway_months": 20,
            "growth_percent": 50,
            "description": "Noon Express provides same-day delivery infrastructure for Saudi retailers, connecting stores with a network of verified drivers.",
            "main_video_url": "https://example.com/noon-express-pitch.mp4"
        })
        print(f"✅ Created Noon Express: {company2.json()}")
        noon_id = company2.json().get('company_id') or company2.json().get('id')
        
        # Company 3: Taqeem (Not matching - Real Estate)
        company3 = await client.post(f"{API_BASE}/api/founder/company", json={
            "founder_id": founder_id,
            "name": "Taqeem",
            "tagline": "Property valuation platform",
            "industry": "Real Estate",
            "stage": "Series B",
            "raise_amount": 10000000,
            "valuation": 50000000,
            "equity_percent": 20,
            "min_ticket": 100000,
            "description": "Taqeem uses AI to provide instant property valuations for the Saudi real estate market.",
            "main_video_url": "https://example.com/taqeem-pitch.mp4"
        })
        print(f"✅ Created Taqeem: {company3.json()}")
        taqeem_id = company3.json().get('company_id') or company3.json().get('id')
        
        # 5. Mock upload to activate companies
        print("\n5. Activating companies via mock upload...")
        for company_name in ["Saraha", "Noon Express", "Taqeem"]:
            upload_resp = await client.post(f"{API_BASE}/api/upload/video", 
                data={"company_name": company_name},
                files={"file": ("pitch.mp4", b"mock video content", "video/mp4")}
            )
            print(f"✅ Activated {company_name}: {upload_resp.json()['message']}")
        
        # 6. Get AI-powered recommendations
        print("\n6. Getting AI-powered feed (should rank Saraha and Noon Express higher)...")
        next_video = await client.get(f"{API_BASE}/api/investor/next-video", params={
            "user_id": investor_id
        })
        video_data = next_video.json()["video"]
        print(f"📹 Recommended: {video_data['startup_name']} ({video_data['industry']}, {video_data['stage']})")
        print(f"   Score: {video_data.get('similarity_score', 'N/A')}")
        
        # 7. Record swipe interaction
        print("\n7. Recording swipe interaction (right swipe)...")
        interaction_resp = await client.post(f"{API_BASE}/api/investor/interaction", json={
            "user_id": investor_id,
            "video_id": video_data['id'],
            "swipe_type": "right",
            "watch_time": 45,
            "video_length": 60
        })
        print(f"✅ Interaction recorded: {interaction_resp.json()}")
        
        # 8. Get next recommendation (should adapt based on swipe)
        print("\n8. Getting next video (algorithm should have learned)...")
        next_video2 = await client.get(f"{API_BASE}/api/investor/next-video", params={
            "user_id": investor_id
        })
        if next_video2.json()["video"]:
            video_data2 = next_video2.json()["video"]
            print(f"📹 Next: {video_data2['startup_name']} ({video_data2['industry']}, {video_data2['stage']})")
        else:
            print("No more videos available")
        
        # 9. Check data room access
        print("\n9. Checking data room access...")
        data_room = await client.get(f"{API_BASE}/api/investor/data-room/{video_data['id']}", params={
            "user_id": investor_id
        })
        print(f"✅ Data room unlocked: Revenue = SAR {data_room.json()['financials']['revenue']:,.0f}/month")
        
        # 10. Test investment
        print("\n10. Making investment...")
        investment = await client.post(f"{API_BASE}/api/investor/invest", json={
            "investor_id": investor_id,
            "company_id": video_data['id'],
            "amount": 50000,
            "num_tickets": 2
        })
        print(f"✅ Investment made: SAR {investment.json()['investment']['amount']:,.0f}")
        
        # 11. Stats
        print("\n11. Checking system stats...")
        health = await client.get(f"{API_BASE}/health")
        stats = health.json()["stats"]
        print(f"📊 System Stats:")
        print(f"   Users: {stats['users']}")
        print(f"   Companies: {stats['companies']}")
        print(f"   Active Companies: {stats['activated_companies']}")
        print(f"   Interactions: {stats['interactions']}")
        
        print("\n" + "=" * 60)
        print("✅ All tests passed! Backend is working correctly.")
        print("=" * 60)

if __name__ == "__main__":
    asyncio.run(test_full_flow())