#!/bin/bash

# Heroku Setup Script
# This script helps set up your Heroku app for deployment

set -e

echo "🚀 Heroku Deployment Setup"
echo "=========================="
echo ""

# Check if Heroku CLI is installed
if ! command -v heroku &> /dev/null; then
    echo "❌ Heroku CLI is not installed. Please install it first:"
    echo "   https://devcenter.heroku.com/articles/heroku-cli"
    exit 1
fi

# Check if user is logged in
if ! heroku auth:whoami &> /dev/null; then
    echo "❌ Not logged in to Heroku. Please run: heroku login"
    exit 1
fi

# Get app name
read -p "Enter your Heroku app name (or press Enter to create a new one): " APP_NAME

if [ -z "$APP_NAME" ]; then
    echo "Creating new Heroku app..."
    APP_NAME=$(heroku create --json | jq -r '.name')
    echo "✅ Created app: $APP_NAME"
else
    # Check if app exists
    if heroku apps:info -a "$APP_NAME" &> /dev/null; then
        echo "✅ Using existing app: $APP_NAME"
    else
        echo "❌ App '$APP_NAME' does not exist. Creating it..."
        heroku create "$APP_NAME"
        echo "✅ Created app: $APP_NAME"
    fi
fi

# Add Heroku remote if it doesn't exist
if ! git remote | grep -q heroku; then
    echo "Adding Heroku remote..."
    heroku git:remote -a "$APP_NAME"
    echo "✅ Added Heroku remote"
fi

# Set environment variables
echo ""
echo "Setting environment variables..."
echo "Please provide the following values:"
echo ""

read -p "DATABASE_URL (PostgreSQL connection string): " DATABASE_URL
read -p "JWT_SECRET (secret key for authentication): " JWT_SECRET
read -p "BUILT_IN_FORGE_API_URL (OpenRouter API URL) [default: https://openrouter.ai/api/v1]: " FORGE_URL
read -p "BUILT_IN_FORGE_API_KEY (OpenRouter API key): " FORGE_KEY

FORGE_URL=${FORGE_URL:-"https://openrouter.ai/api/v1"}

echo ""
echo "Setting config vars..."

heroku config:set -a "$APP_NAME" \
    DATABASE_URL="$DATABASE_URL" \
    JWT_SECRET="$JWT_SECRET" \
    BUILT_IN_FORGE_API_URL="$FORGE_URL" \
    BUILT_IN_FORGE_API_KEY="$FORGE_KEY" \
    NODE_ENV=production

echo ""
echo "✅ Environment variables set!"
echo ""
echo "📦 Deploying to Heroku..."
echo ""

# Push to Heroku
git push heroku main || git push heroku master

echo ""
echo "✅ Deployment complete!"
echo ""
echo "Your app should be available at: https://$APP_NAME.herokuapp.com"
echo ""
echo "To view logs, run: heroku logs --tail -a $APP_NAME"
