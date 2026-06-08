#!/usr/bin/env python3
"""
Update companies with real video URLs and profile images
"""

import json
import os

# Real working video URLs from public sources
VIDEO_URLS = [
    "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
    "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4", 
    "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
    "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
    "https://storage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4",
    "https://storage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4"
]

# Profile images for companies (using placeholder service)
COMPANY_LOGOS = {
    "company_doordash": "https://logo.clearbit.com/doordash.com",
    "company_stripe": "https://logo.clearbit.com/stripe.com",
    "company_reddit": "https://logo.clearbit.com/reddit.com",
    "company_airbnb": "https://logo.clearbit.com/airbnb.com",
    "company_coinbase": "https://logo.clearbit.com/coinbase.com",
    "company_dropbox": "https://logo.clearbit.com/dropbox.com",
    "company_instacart": "https://logo.clearbit.com/instacart.com",
    "company_mixpanel": "https://logo.clearbit.com/mixpanel.com",
    "company_twitch": "https://logo.clearbit.com/twitch.tv",
    "company_weebly": "https://logo.clearbit.com/weebly.com",
    "company_optimizely": "https://logo.clearbit.com/optimizely.com",
    "company_rappi": "https://logo.clearbit.com/rappi.com",
    "company_pagerduty": "https://logo.clearbit.com/pagerduty.com",
    "company_docker": "https://logo.clearbit.com/docker.com",
    "company_cruise": "https://logo.clearbit.com/cruise.com",
    "company_flexport": "https://logo.clearbit.com/flexport.com"
}

# Founder profile images (using UI Avatars service)
FOUNDER_IMAGES = {
    "company_doordash": "https://ui-avatars.com/api/?name=Tony+Xu&background=0D8ABC&color=fff&size=200",
    "company_stripe": "https://ui-avatars.com/api/?name=Patrick+Collison&background=0D8ABC&color=fff&size=200",
    "company_reddit": "https://ui-avatars.com/api/?name=Steve+Huffman&background=FF4500&color=fff&size=200",
    "company_airbnb": "https://ui-avatars.com/api/?name=Brian+Chesky&background=FF5A5F&color=fff&size=200",
    "company_coinbase": "https://ui-avatars.com/api/?name=Brian+Armstrong&background=0052FF&color=fff&size=200",
    "company_dropbox": "https://ui-avatars.com/api/?name=Drew+Houston&background=0061FF&color=fff&size=200",
    "company_instacart": "https://ui-avatars.com/api/?name=Apoorva+Mehta&background=43B02A&color=fff&size=200",
    "company_mixpanel": "https://ui-avatars.com/api/?name=Suhail+Doshi&background=7856FF&color=fff&size=200",
    "company_twitch": "https://ui-avatars.com/api/?name=Justin+Kan&background=9146FF&color=fff&size=200",
    "company_weebly": "https://ui-avatars.com/api/?name=David+Rusenko&background=4A90E2&color=fff&size=200",
    "company_optimizely": "https://ui-avatars.com/api/?name=Dan+Siroker&background=1E88E5&color=fff&size=200",
    "company_rappi": "https://ui-avatars.com/api/?name=Simón+Borrero&background=FF6B35&color=fff&size=200",
    "company_pagerduty": "https://ui-avatars.com/api/?name=Alex+Solomon&background=06AC38&color=fff&size=200",
    "company_docker": "https://ui-avatars.com/api/?name=Solomon+Hykes&background=2496ED&color=fff&size=200",
    "company_cruise": "https://ui-avatars.com/api/?name=Kyle+Vogt&background=FF8C00&color=fff&size=200",
    "company_flexport": "https://ui-avatars.com/api/?name=Ryan+Petersen&background=E01E5A&color=fff&size=200"
}

def update_companies():
    data_file = 'storage/data.json'
    
    # Load existing data
    with open(data_file, 'r') as f:
        data = json.load(f)
    
    # Update each company with video and images
    companies = data.get("companies", {})
    video_index = 0
    
    for company_id, company in companies.items():
        # Add video URL (cycle through available videos)
        company["video_url"] = VIDEO_URLS[video_index % len(VIDEO_URLS)]
        video_index += 1
        
        # Add logo URL
        if company_id in COMPANY_LOGOS:
            company["logo_url"] = COMPANY_LOGOS[company_id]
        
        # Add founder image
        if company_id in FOUNDER_IMAGES:
            company["founder_image"] = FOUNDER_IMAGES[company_id]
        
        # Ensure all companies have proper media fields
        company["video_activated"] = True
        company["has_media"] = True
        
        print(f"Updated {company['name']} with video and images")
    
    # Save updated data
    with open(data_file, 'w') as f:
        json.dump(data, f, indent=2)
    
    print(f"\n✅ Successfully updated {len(companies)} companies with media!")
    print("Videos added from Google's sample video library")
    print("Logos added from Clearbit")
    print("Founder images added from UI Avatars")

if __name__ == "__main__":
    update_companies()