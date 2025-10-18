# Database Verification Checklist

## Current Status

✅ **Database Connection Module**: `api/utils/database-connection.js` is implemented
✅ **Health Check Endpoint**: `/api/health` available for testing
✅ **Schema File**: `schema.sql` ready for deployment
✅ **Setup Documentation**: `DATABASE_SETUP.md` and `ENV_SETUP.md` available

---

## Verification Steps

### 1. Check Vercel Environment Variables

**Required Variables:**
- [ ] `DATABASE_URL` - Your Neon PostgreSQL connection string
- [ ] `JWT_SECRET` - Secure random string for authentication
- [ ] `JWT_REFRESH_SECRET` - Optional, for refresh tokens

**To Check:**
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select `clinicalspeak` project
3. Go to **Settings** → **Environment Variables**
4. Verify `DATABASE_URL` is set
5. If not set, add it with your Neon connection string

---

### 2. Test Database Connection

**Option A: Via Health Check API**

Visit: `https://clinicalspeak.vercel.app/api/health`

**Expected Response (Connected):**
```json
{
  "status": "healthy",
  "database": {
    "connected": true,
    "type": "postgresql",
    "last_checked": "2025-01-15T10:30:00.000Z"
  },
  "services": {
    "email": false,
    "sms": true,
    "stripe": true
  }
}
```

**Expected Response (Demo Mode):**
```json
{
  "status": "demo",
  "database": {
    "connected": false,
    "type": "demo_mode"
  }
}
```

**Option B: Via Vercel Function Logs**

1. Go to Vercel Dashboard → Deployments
2. Click on latest deployment
3. View **Function Logs**
4. Look for:
   - ✅ `Database connected successfully` (connected)
   - 📦 `Running in demo mode` (not connected)

---

### 3. Initialize Database Schema

If database is connected but tables don't exist:

**Using Neon Console:**
1. Go to [console.neon.tech](https://console.neon.tech)
2. Select your project
3. Click **SQL Editor**
4. Copy contents of `schema.sql`
5. Paste and click **Run**
6. Verify all tables created successfully

**Tables Created:**
- ✅ `users` - Clinician accounts
- ✅ `clients` - Client/patient information
- ✅ `appointments` - Scheduled appointments
- ✅ `invoices` - Billing records
- ✅ `document_templates` - Form templates
- ✅ `assigned_documents` - Client documents
- ✅ `audit_log` - HIPAA audit trail

---

### 4. Create Admin User

After schema is created, initialize admin user:

**Visit:** `https://clinicalspeak.vercel.app/api/setup-admin`

**Or via curl:**
```bash
curl -X POST https://clinicalspeak.vercel.app/api/setup-admin
```

**Default Credentials:**
- Username: `admin`
- Password: `admin123`

⚠️ **Change this password immediately in production!**

---

### 5. Test Data Persistence

**Test 1: Create a Client**
1. Login to app: admin / admin123
2. Go to Clients section
3. Add a new client
4. Reload the page
5. Verify client still exists (not in demo mode)

**Test 2: Check Database Directly**
1. Go to Neon Console → SQL Editor
2. Run query:
   ```sql
   SELECT * FROM clients;
   ```
3. Verify your test client appears

**Test 3: Create Appointment**
1. Create an appointment for the client
2. Reload page
3. Verify appointment persists

---

## Troubleshooting

### Issue: "Database not connected - running in demo mode"

**Causes:**
- `DATABASE_URL` not set in Vercel
- Connection string is invalid
- Neon database is paused or deleted

**Solutions:**
1. Check Vercel environment variables
2. Verify Neon database is active
3. Test connection string in Neon Console
4. Redeploy Vercel app after adding variables

---

### Issue: "relation does not exist"

**Causes:**
- Database schema not initialized
- Tables not created

**Solutions:**
1. Run `schema.sql` in Neon Console
2. Verify all tables exist
3. Check for SQL errors in Neon logs

---

### Issue: "unable to connect to database"

**Causes:**
- Invalid connection string
- SSL mode not enabled
- Network/firewall issues

**Solutions:**
1. Verify connection string format
2. Ensure `?sslmode=require` is included
3. Check Neon database is running
4. Test connection in Neon Console

---

## Production Checklist

Before going live with real patient data:

- [ ] Database encrypted at rest (Neon provides this)
- [ ] SSL/TLS connections enabled (Neon enforces this)
- [ ] Environment variables set in Vercel
- [ ] Admin password changed from default
- [ ] Backup schedule configured in Neon
- [ ] Audit logging enabled and tested
- [ ] HIPAA compliance review completed
- [ ] BAA signed with Neon (required for PHI)

---

## Quick Commands

### Test Connection
```bash
curl https://clinicalspeak.vercel.app/api/health
```

### Setup Admin User
```bash
curl -X POST https://clinicalspeak.vercel.app/api/setup-admin
```

### Check Database Tables (in Neon Console)
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';
```

---

## Next Steps

After database is verified:

1. ✅ Test all CRUD operations (Create, Read, Update, Delete)
2. ✅ Verify audit logging works
3. ✅ Test data backup/restore
4. ✅ Move to Custom Domain Setup
5. ✅ Begin HIPAA Compliance Documentation

---

**Status:** Ready for verification
**Last Updated:** January 2025
**Database Provider:** Neon PostgreSQL

