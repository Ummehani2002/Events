from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
import os
import uvicorn

app = FastAPI(title="Event Intelligence Platform")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve static files (CSS, JS, images) from Frontend directory
app.mount("/static", StaticFiles(directory="../Frontend"), name="static")

# Serve the main frontend page
@app.get("/")
async def serve_frontend():
    return FileResponse('../Frontend/index.html')

# Serve other HTML pages
@app.get("/{path_name:path}")
async def serve_pages(path_name: str):
    # Check if it's a file that exists in Frontend directory
    frontend_path = f"../Frontend/{path_name}"
    
    if os.path.exists(frontend_path) and os.path.isfile(frontend_path):
        return FileResponse(frontend_path)
    
    # If it's an API route that doesn't start with /api/, serve index.html for SPA routing
    if not path_name.startswith('api/'):
        return FileResponse('../Frontend/index.html')
    
    raise HTTPException(status_code=404, detail="Not found")

# Your existing API routes - keep all your current backend functionality
@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "service": "Event Intelligence Platform"}

# Your existing Twitter API routes
@app.get("/api/discover-events")
async def discover_events():
    # Your existing event discovery logic here
    return {"events": []}

@app.get("/api/find-attendees")
async def find_attendees():
    # Your existing attendee finding logic here
    return {"attendees": []}

# Add all your existing API endpoints here...
# Keep all your current backend code for Twitter, SERP API, etc.

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
