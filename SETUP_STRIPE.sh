#!/bin/bash

# Stripe Setup Script for Sessionably
# This script helps you set up Stripe payment integration

echo "🚀 Sessionably - Stripe Setup"
echo "===================================="
echo ""

# Check if running on macOS
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "✅ Detected macOS"
else
    echo "⚠️  This script is optimized for macOS"
fi

echo ""
echo "📋 Setup Checklist:"
echo ""

# Step 1: Stripe Keys
echo "1️⃣  Get your Stripe keys from:"
echo "   https://dashboard.stripe.com/apikeys"
echo ""
echo "   You need:"
echo "   - Publishable key (pk_test_... or pk_live_)"
echo "   - Secret key (sk_test_... or sk_live_)"
echo ""

read -p "Do you have your Stripe keys? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Please get your keys first, then run this script again."
    exit 1
fi

# Step 2: Update index.html
echo ""
echo "2️⃣  Update index.html with your publishable key"
echo ""
read -p "Enter your Stripe Publishable Key: " PUBLISHABLE_KEY

if [ -z "$PUBLISHABLE_KEY" ]; then
    echo "❌ Error: Publishable key cannot be empty"
    exit 1
fi

# Update the Stripe key in index.html
if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' "s/const stripe = Stripe('pk_test_51Qj1V6B3qZJ8x7QZ...');/const stripe = Stripe('${PUBLISHABLE_KEY}');/" index.html
else
    sed -i "s/const stripe = Stripe('pk_test_51Qj1V6B3qZJ8x7QZ...');/const stripe = Stripe('${PUBLISHABLE_KEY}');/" index.html
fi

echo "✅ Updated index.html with your publishable key"

# Step 3: Vercel Environment Variables
echo ""
echo "3️⃣  Add environment variables to Vercel"
echo ""
echo "Go to: https://vercel.com/dashboard"
echo "Select your project → Settings → Environment Variables"
echo ""
echo "Add these variables:"
echo "   STRIPE_SECRET_KEY = your_secret_key_here"
echo "   STRIPE_WEBHOOK_SECRET = your_webhook_secret_here (optional)"
echo ""

read -p "Have you added environment variables to Vercel? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "⚠️  Please add environment variables before deploying"
fi

# Step 4: Deploy
echo ""
echo "4️⃣  Deploy to Vercel"
echo ""
read -p "Deploy now? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🚀 Deploying to Vercel..."
    git add index.html
    git commit -m "Configure Stripe publishable key"
    git push origin main
    echo ""
    echo "✅ Deployment initiated!"
    echo ""
    echo "⏳ Wait a few minutes for Vercel to deploy"
    echo "   Check status at: https://vercel.com/dashboard"
else
    echo "📝 To deploy later, run:"
    echo "   git add index.html"
    echo "   git commit -m 'Configure Stripe publishable key'"
    echo "   git push origin main"
fi

# Step 5: Testing
echo ""
echo "5️⃣  Test the integration"
echo ""
echo "After deployment:"
echo "1. Go to your site"
echo "2. Create an invoice"
echo "3. Click '💳 Pay Now'"
echo "4. Use test card: 4242 4242 4242 4242"
echo "5. Enter any future expiry date and CVC"
echo "6. Verify payment succeeds"
echo ""

echo "📚 Full documentation: STRIPE_SETUP.md"
echo ""
echo "✅ Setup complete!"
echo ""

