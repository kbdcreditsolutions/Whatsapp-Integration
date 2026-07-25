#!/bin/bash
set -e
echo "Building frontend..."
cd frontend
npm install
npm run build
cd ..
echo "Copying to public..."
rm -rf public
cp -R frontend/dist public
echo "Done!"
