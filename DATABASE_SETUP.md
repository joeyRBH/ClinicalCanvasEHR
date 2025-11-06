# Database Setup for Client Portal

This guide will help you connect your Crunchy Bridge database and set up the client portal tables.

## Step 1: Get Your Crunchy Bridge Connection String

1. Log in to [Crunchy Bridge Dashboard](https://www.crunchybridge.com/)
2. Select your cluster
3. Click **"Connection"** tab
4. Copy your connection string - it should look like:
   ```
   postgresql://username:password@p.abcd1234.db.postgresbridge.com:5432/postgres
   ```

## Step 2: Set Up Environment Variables

### For Local Development:

1. Open the `.env.local` file in the project root
2. Replace the `DATABASE_URL` with your actual Crunchy Bridge connection string
3. **Important:** Add `?sslmode=require` to the end:
   ```
   DATABASE_URL=postgresql://u1a2b3c:your_password@p.abcd1234.db.postgresbridge.com:5432/postgres?sslmode=require
   ```

4. Set a secure JWT secret (32+ random characters):
   ```
   JWT_SECRET=generate-a-long-random-string-here-minimum-32-chars
   ```

### For Vercel Production:

1. Go to [Vercel Dashboard](https://vercel.com/)
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add these variables:

   | Name | Value | Environment |
   |------|-------|-------------|
   | `DATABASE_URL` | Your Crunchy Bridge connection string with `?sslmode=require` | Production, Preview, Development |
   | `JWT_SECRET` | Your secure random string (32+ chars) | Production, Preview, Development |
   | `APP_URL` | `https://your-domain.vercel.app` | Production, Preview |

5. Click **Save**
6. Redeploy your application

## Step 3: Test Database Connection

Run the test script to verify your connection:

```bash
node test-db-connection.js
```

You should see:
```
✅ Connected successfully!
PostgreSQL version: 16.x
```

## Step 4: Create Client Portal Tables

### Option A: Using psql (Recommended)

If you have `psql` installed:

```bash
psql "$DATABASE_URL" -f setup-client-portal.sql
```

### Option B: Using Crunchy Bridge Web Console

1. Go to your Crunchy Bridge Dashboard
2. Click **"SQL"** or **"Query"** tab
3. Open `setup-client-portal.sql`
4. Copy all the SQL content
5. Paste into the query editor
6. Click **"Execute"** or **"Run"**

### Option C: Using Full Schema

If you're setting up the entire database from scratch:

```bash
psql "$DATABASE_URL" -f schema.sql
```

## Step 5: Verify Tables Were Created

Run the test script again:

```bash
node test-db-connection.js
```

You should see:
```
✅ All client portal tables exist!
   ✓ client_messages
   ✓ client_notification_settings
   ✓ client_sessions
   ✓ client_users
   ✓ notification_log
```

## Step 6: Test the Client Portal

1. **Deploy your latest code** to Vercel (if not already deployed)

2. **Create a test client** in your admin portal:
   - Name: Test Client
   - Email: test@example.com
   - Phone: (optional)

3. **Assign a document** to the test client:
   - This generates an access code (e.g., `A3TN-PYPTNVQE`)

4. **Open the client portal**: `https://your-domain.vercel.app/client-portal.html`

5. **Register using the access code**:
   - Click "Create Account" tab
   - Enter access code: `A3TN-PYPTNVQE`
   - Create password (8+ characters)
   - Click "Create Account"

6. **Login**:
   - Email: `test@example.com`
   - Password: (what you just created)
   - Click "Sign In"

7. **Check F12 Console** for any errors

## Troubleshooting

### Connection Failed

**Error:** `ENOTFOUND` or DNS lookup failed
- Check your hostname is correct
- Make sure you're connected to the internet

**Error:** `password authentication failed`
- Double-check username and password
- Copy connection string again from Crunchy Bridge
- Make sure there are no extra spaces

**Error:** `SSL connection issue`
- Add `?sslmode=require` to the end of your connection string
- Example: `...postgres?sslmode=require`

### Tables Not Creating

**Error:** Permission denied
- Make sure your database user has CREATE TABLE permissions
- Contact Crunchy Bridge support if needed

**Error:** Table already exists
- Tables were created successfully! You're good to go

### Client Portal Not Loading

1. **Check console logs** (F12 Developer Tools)
2. **Common issues**:
   - Database tables don't exist → Run setup-client-portal.sql
   - API endpoints returning 500 → Check DATABASE_URL is set in Vercel
   - Login fails → Make sure you registered first using access code

## Environment Variables Checklist

Make sure these are set in **both** `.env.local` and Vercel:

- ✅ `DATABASE_URL` - Your Crunchy Bridge connection string
- ✅ `JWT_SECRET` - Random 32+ character string
- ✅ `APP_URL` - Your application URL
- ⚠️ Optional: AWS SES/SNS credentials (for email/SMS notifications)
- ⚠️ Optional: Stripe keys (for payment processing)

## Need Help?

1. Check the console logs (F12 in browser)
2. Check Vercel function logs (Vercel Dashboard → Your Project → Functions)
3. Run `node test-db-connection.js` to test database connectivity
4. Review the `setup-client-portal.sql` file to see what tables are being created

## Security Notes

- ⚠️ **Never commit** `.env.local` to git
- ✅ `.env.local` is already in `.gitignore`
- 🔒 Use a strong JWT_SECRET (generate with `openssl rand -hex 32`)
- 🔒 In production, use environment variables (never hardcode credentials)
