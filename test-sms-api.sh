#!/bin/bash

echo "Testing Twilio SMS API..."
echo "Enter your phone number (E.164 format, e.g., +12345678901):"
read PHONE

curl -X POST https://clinicalcanvas.app/api/send-sms \
  -H "Content-Type: application/json" \
  -d "{
    \"to\": \"$PHONE\",
    \"message\": \"Hello from ClinicalCanvas! This is a test SMS message. 🎉\"
  }"

echo ""
echo ""
echo "✅ Check your phone for the SMS!"
