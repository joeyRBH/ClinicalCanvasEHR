#!/bin/bash

# Test Email Notification Script
echo "======================================"
echo "Testing AWS SES Email Notification"
echo "======================================"
echo ""

# Prompt for email
read -p "Enter your email address: " EMAIL

if [ -z "$EMAIL" ]; then
    echo "Error: Email address is required"
    exit 1
fi

echo ""
echo "Sending test email to: $EMAIL"
echo ""

# Send test email
curl -X POST https://clinicalcanvas.vercel.app/api/test-notifications-aws \
  -H "Content-Type: application/json" \
  -d "{
    \"testType\": \"email\",
    \"email\": \"$EMAIL\"
  }" \
  | jq '.'

echo ""
echo "======================================"
echo "Check your email inbox (and spam folder)!"
echo "======================================"
