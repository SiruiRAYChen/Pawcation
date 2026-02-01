#!/bin/bash

echo "🚀 Pawcation Database Migration Helper"
echo "======================================"
echo ""

# Check if service account key exists
if [ ! -f "serviceAccountKey.json" ]; then
    echo "❌ Service account key not found!"
    echo ""
    echo "📋 Please follow these steps:"
    echo ""
    echo "1. Open Firebase Console:"
    echo "   https://console.firebase.google.com/project/pawcation-c45d6/settings/serviceaccounts/adminsdk"
    echo ""
    echo "2. Click 'Generate new private key'"
    echo "3. Save the downloaded file as 'serviceAccountKey.json' in this directory"
    echo "4. Run this script again"
    echo ""
    
    # Try to open the URL in the browser
    if command -v open &> /dev/null; then
        read -p "Would you like to open the Firebase Console now? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            open "https://console.firebase.google.com/project/pawcation-c45d6/settings/serviceaccounts/adminsdk"
        fi
    fi
    
    exit 1
fi

echo "✅ Service account key found!"
echo ""

# Check if firebase-admin is installed
if ! python3 -c "import firebase_admin" &> /dev/null; then
    echo "📦 Installing firebase-admin..."
    pip3 install firebase-admin
fi

# Set environment variable
export GOOGLE_APPLICATION_CREDENTIALS="$(pwd)/serviceAccountKey.json"

# Check if database exists
if [ ! -f "pawcation.db" ]; then
    echo "❌ SQLite database 'pawcation.db' not found!"
    exit 1
fi

echo "🔄 Starting migration..."
echo ""

# Run the migration script
python3 migrate_to_firestore.py

echo ""
echo "✅ Migration complete!"
echo ""
echo "📱 Next steps:"
echo "1. Visit your app: https://pawcation-c45d6.web.app"
echo "2. Test login and verify your data"
echo ""
