#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🐾 Pawcation Development Setup${NC}"
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python3 is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Python3 found${NC}"

# Check if Node is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Node.js found${NC}"

# Install backend dependencies
echo ""
echo -e "${BLUE}Installing backend dependencies...${NC}"
cd backend
python3 -m pip install -r requirements.txt
cd ..

echo -e "${GREEN}✓ Backend dependencies installed${NC}"

# Install frontend dependencies (if not already installed)
echo ""
echo -e "${BLUE}Checking frontend dependencies...${NC}"
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
else
    echo -e "${GREEN}✓ Frontend dependencies already installed${NC}"
fi

echo ""
echo -e "${GREEN}✓ Setup complete!${NC}"
echo ""
echo -e "${BLUE}To start development:${NC}"
echo "1. Backend: cd backend && python3 main.py"
echo "2. Frontend: npm run dev"
echo ""
echo -e "${BLUE}Or use: npm run dev:all (if configured)${NC}"
