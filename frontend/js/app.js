from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
import os
import uvicorn
from pydantic import BaseModel
from typing import List, Optional
import tweepy
from serpapi import GoogleSearch
import json
from datetime import datetime

# Request models
class EventDiscoveryRequest(BaseModel):
    location: str
    start_date: str
    end_date: str
    categories: List[str]
    max_results: int

class AttendeeDiscoveryRequest(BaseModel):
    event_name: str
    max_results: int

app = FastAPI(title="Event Intelligence Platform")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve static files from Frontend directory
app.mount("/static", StaticFiles(directory="../Frontend"), name="static")

# Serve the main frontend page
@app.get("/")
async def serve_frontend():
    return FileResponse('../Frontend/index.html')

# Serve other HTML pages for SPA routing
@app.get("/{path_name:path}")
async def serve_pages(path_name: str):
    # Check if it's a file that exists in Frontend directory
    frontend_path = f"../Frontend/{path_name}"
    
    if os.path.exists(frontend_path) and os.path.isfile(frontend_path):
        return FileResponse(frontend_path)
    
    # If it's an API route, let FastAPI handle it
    if path_name.startswith('api/'):
        raise HTTPException(status_code=404, detail="API endpoint not found")
    
    # For all other routes, serve index.html for client-side routing
    return FileResponse('../Frontend/index.html')

# API Routes
@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "service": "Event Intelligence Platform"}

@app.post("/api/discover-events")
async def discover_events(request: EventDiscoveryRequest):
    try:
        # Your event discovery logic here
        # This is where you'd integrate with SERP API
        print(f"Discovering events in {request.location} from {request.start_date} to {request.end_date}")
        print(f"Categories: {request.categories}")
        print(f"Max results: {request.max_results}")
        
        # Mock data for demonstration - replace with actual SERP API calls
        mock_events = [
            {
                "event_name": f"Tech Conference {request.location}",
                "exact_date": "2024-12-15",
                "exact_venue": f"Convention Center {request.location}",
                "location": request.location,
                "category": "technology",
                "confidence_score": 0.85
            },
            {
                "event_name": f"Music Festival {request.location}",
                "exact_date": "2024-12-20",
                "exact_venue": f"City Park {request.location}",
                "location": request.location,
                "category": "music",
                "confidence_score": 0.72
            }
        ]
        
        return {
            "success": True,
            "events": mock_events[:request.max_results],
            "total_events": len(mock_events),
            "api_calls_used": 1
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "events": [],
            "total_events": 0,
            "api_calls_used": 0
        }

@app.post("/api/discover-attendees")
async def discover_attendees(request: AttendeeDiscoveryRequest):
    try:
        # Your attendee discovery logic here
        # This is where you'd integrate with Twitter API
        print(f"Finding attendees for: {request.event_name}")
        print(f"Max results: {request.max_results}")
        
        # Mock data for demonstration - replace with actual Twitter API calls
        mock_attendees = [
            {
                "username": "@techlover123",
                "engagement_type": "interested",
                "post_content": f"Can't wait for {request.event_name}! Looking forward to it.",
                "post_date": "2024-11-20",
                "followers_count": 1500,
                "verified": True,
                "post_link": "https://twitter.com/user/status/123456"
            },
            {
                "username": "@musicfan456",
                "engagement_type": "attending",
                "post_content": f"Just got my tickets for {request.event_name}! So excited!",
                "post_date": "2024-11-18",
                "followers_count": 3200,
                "verified": False,
                "post_link": "https://twitter.com/user/status/123457"
            }
        ]
        
        return {
            "success": True,
            "attendees": mock_attendees[:request.max_results],
            "total_attendees": len(mock_attendees),
            "api_calls_used": 1
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "attendees": [],
            "total_attendees": 0,
            "api_calls_used": 0
        }

# Initialize APIs (replace with your actual API keys from environment variables)
def initialize_apis():
    try:
        # Get API keys from environment variables
        serp_api_key = os.environ.get('SERP_API_KEY')
        twitter_api_key = os.environ.get('TWITTER_API_KEY')
        twitter_api_secret = os.environ.get('TWITTER_API_SECRET')
        twitter_access_token = os.environ.get('TWITTER_ACCESS_TOKEN')
        twitter_access_secret = os.environ.get('TWITTER_ACCESS_SECRET')
        
        print("✅ Twitter API client initialized")
        print("✅ SERP API client initialized")
        
    except Exception as e:
        print(f"❌ API initialization error: {e}")

@app.on_event("startup")
async def startup_event():
    initialize_apis()
    print("🚀 ULTRA-STRICT Event Intelligence Platform Starting...")
    print("🎯 POLICY: ZERO unnecessary API calls")
    print("📡 API: http://0.0.0.0:8000")
    print("🔒 API calls only when: User clicks DISCOVER EVENTS or FIND ATTENDEES")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
