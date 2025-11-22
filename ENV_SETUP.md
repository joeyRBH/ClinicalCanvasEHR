# Environment Variables Setup

## ⚠️ IMPORTANT: The .env file should NEVER be committed to git!

## Required Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Backblaze B2 Storage
B2_APPLICATION_KEY_ID=your_application_key_id
B2_APPLICATION_KEY=your_application_key
B2_BUCKET_NAME=sessionably-documents
B2_ENDPOINT=https://s3.us-west-002.backblazeb2.com
B2_REGION=us-west-002

# Stripe (Payment Processing)
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# Twilio (SMS Notifications)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number
TWILIO_MESSAGING_SERVICE_SID=your_messaging_service_sid

# Authentication - Generate a secure secret
JWT_SECRET=your_secure_jwt_secret_here

# Server
PORT=3000
NODE_ENV=development
```

## For Vercel Deployment

Add these environment variables in your Vercel project settings:
1. Go to your project in Vercel Dashboard
2. Settings → Environment Variables
3. Add the following:
   - `B2_APPLICATION_KEY_ID` - Backblaze B2 Application Key ID
   - `B2_APPLICATION_KEY` - Backblaze B2 Application Key (secret)
   - `B2_BUCKET_NAME` - Backblaze B2 bucket name
   - `B2_ENDPOINT` - Backblaze B2 endpoint URL
   - `B2_REGION` - Backblaze B2 region
   - `STRIPE_SECRET_KEY` - Stripe secret key
   - `STRIPE_WEBHOOK_SECRET` - Stripe webhook secret
   - `TWILIO_ACCOUNT_SID` - Twilio account SID
   - `TWILIO_AUTH_TOKEN` - Twilio auth token
   - `TWILIO_PHONE_NUMBER` - Twilio phone number
   - `TWILIO_MESSAGING_SERVICE_SID` - Twilio messaging service SID
   - `JWT_SECRET` - A secure random string

## Demo Mode

The app will automatically run in demo mode if environment variables are not set:
- No external services required
- All data stored in browser localStorage
- Perfect for testing and demonstration
- Login: admin / admin123
- Client code: DEMO-123456

## Security Notes

- ✅ `.env` is in `.gitignore` - never commit it!
- ✅ Use environment variables in Vercel for production
- ✅ Rotate JWT_SECRET regularly
- ✅ Use strong, unique secrets in production
- ✅ Keep Backblaze Application Key secret
- ✅ Never share or commit API keys

