#!/usr/bin/env python3
import sys
import os

# Add the backend directory to Python path
backend_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, backend_dir)

# Change to backend directory
os.chdir(backend_dir)

# Import and run the FastAPI app
from main import app
import uvicorn

if __name__ == "__main__":
    print("Starting Pawcation API server...")
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)