#!/usr/bin/env bash
# Exit on error
set -o errexit

# Install dependencies
npm install

# Ensure Puppeteer's cache directory exists
PUPPETEER_CACHE_DIR=/opt/render/.cache/puppeteer
PROJECT_CACHE_DIR=/opt/render/project/src/.cache/puppeteer

# Create directories if they don't exist
mkdir -p $PUPPETEER_CACHE_DIR
mkdir -p $PROJECT_CACHE_DIR

# Install Puppeteer and download Chromium
npx puppeteer install

# Store/pull Puppeteer cache with build cache
if [[ -d $PUPPETEER_CACHE_DIR ]]; then
  echo "Storing Puppeteer Cache in Build Cache"
  cp -R $PUPPETEER_CACHE_DIR/* $PROJECT_CACHE_DIR/
else
  echo "Copying Puppeteer Cache from Build Cache"
  cp -R $PROJECT_CACHE_DIR/* $PUPPETEER_CACHE_DIR/
fi
