# Environment Variables Setup

## ⚠️ IMPORTANT: The .env file should NEVER be committed to git!

## Required Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Database - Your Neon PostgreSQL Database (OPTIONAL - app works in demo mode without this)
DATABASE_URL=postgresql://username:password@host/database?sslmode=require

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
3. Add the following (if you want to use a database):
   - `DATABASE_URL` - Your Neon PostgreSQL connection string
   - `JWT_SECRET` - A secure random string

## Demo Mode

The app will automatically run in demo mode if `DATABASE_URL` is not set:
- No database required
- All data stored in memory
- Perfect for testing and demonstration
- Login: admin / admin123
- Client code: DEMO-123456

## Security Notes

- ✅ `.env` is in `.gitignore` - never commit it!
- ✅ Use environment variables in Vercel for production
- ✅ Rotate JWT_SECRET regularly
- ✅ Use strong, unique secrets in production

