#!/bin/bash

# Test SMS Notification Script
echo "======================================"
echo "Testing AWS SNS SMS Notification"
echo "======================================"
echo ""

# Prompt for phone
read -p "Enter your phone number (with +1): " PHONE

if [ -z "$PHONE" ]; then
    echo "Error: Phone number is required"
    exit 1
fi

# Check if starts with +
if [[ ! "$PHONE" =~ ^\+ ]]; then
    echo "Error: Phone number must start with + and country code (e.g., +15551234567)"
    exit 1
fi

echo ""
echo "Sending test SMS to: $PHONE"
echo ""

# Send test SMS
curl -X POST https://clinicalcanvas.vercel.app/api/test-notifications-aws \
  -H "Content-Type: application/json" \
  -d "{
    \"testType\": \"sms\",
    \"phone\": \"$PHONE\"
  }" \
  | jq '.'

echo ""
echo "======================================"
echo "Check your phone for the SMS!"
echo "======================================"
