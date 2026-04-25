#!/bin/bash
set -e

echo "Pulling latest code..."
git pull origin main

echo "Killing any stuck build processes..."
pkill -f "next build" 2>/dev/null || true
rm -f .next/BUILD_ID.lock 2>/dev/null || true
sleep 1

echo "Building..."
npm run build

echo "Restarting app..."
pm2 restart sport-app

echo "Done! Status:"
pm2 list
