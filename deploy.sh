#!/bin/bash

# Pawcation Firebase Deployment Script
echo "🐾 Starting Pawcation Firebase Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo -e "${RED}❌ Firebase CLI is not installed${NC}"
    echo "Install it with: npm install -g firebase-tools"
    exit 1
fi

echo -e "${GREEN}✓ Firebase CLI found${NC}"

# Check if logged in to Firebase
if ! firebase projects:list &> /dev/null; then
    echo -e "${YELLOW}⚠️  Not logged in to Firebase${NC}"
    echo "Logging in..."
    firebase login
fi

echo -e "${GREEN}✓ Logged in to Firebase${NC}"

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  .env file not found${NC}"
    echo "Creating .env from .env.example..."
    cp .env.example .env
    echo -e "${RED}⚠️  Please update .env with your Firebase configuration${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Environment file found${NC}"

# Install dependencies
echo "📦 Installing frontend dependencies..."
npm install

echo "📦 Installing functions dependencies..."
cd functions
npm install
cd ..

echo -e "${GREEN}✓ Dependencies installed${NC}"

# Build functions
echo "🔨 Building Cloud Functions..."
cd functions
npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Functions build failed${NC}"
    exit 1
fi
cd ..

echo -e "${GREEN}✓ Functions built successfully${NC}"

# Build frontend
echo "🔨 Building frontend..."
npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Frontend build failed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Frontend built successfully${NC}"

# Deploy to Firebase
echo "🚀 Deploying to Firebase..."
firebase deploy

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Deployment successful!${NC}"
    echo ""
    echo "🎉 Your app is now live!"
    echo "Visit: https://$(firebase hosting:channel:list | grep live | awk '{print $2}')"
else
    echo -e "${RED}❌ Deployment failed${NC}"
    exit 1
fi
