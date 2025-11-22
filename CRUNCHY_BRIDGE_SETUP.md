# Crunchy Bridge Setup Guide

Complete guide to integrate Sessionably with Crunchy Bridge PostgreSQL.

---

## Step 1: Get Your Crunchy Bridge Connection String

1. **Log into Crunchy Bridge**: https://crunchybridge.com/dashboard
2. **Click your cluster** (or create one if you haven't yet)
3. **Copy the connection string**:
   - Click "Connection" tab
   - Copy the full PostgreSQL connection string
   - Format: `postgresql://user:password@p.xxxxx.db.crunchybridge.com:5432/database`

**Save this connection string** - you'll need it in the next steps.

---

## Step 2: Set Up the Database Schema

### Option A: Using psql (Recommended)

```bash
# Connect to your Crunchy Bridge database and run the schema
psql "postgresql://user:password@p.xxxxx.db.crunchybridge.com:5432/database" < schema.sql
```

### Option B: Using Crunchy Bridge Web Console

1. Go to your cluster in Crunchy Bridge dashboard
2. Click "SQL" or "Query" tab
3. Copy and paste the entire contents of `schema.sql`
4. Click "Execute" or "Run"

### What This Creates

- ✅ All database tables (clients, invoices, appointments, etc.)
- ✅ Indexes for performance
- ✅ Triggers for automatic timestamps
- ✅ Views for reporting
- ✅ Sample admin user (username: `admin`, password: `admin123`)
- ✅ Demo document templates

---

## Step 3: Install Dependencies

```bash
npm install
```

This installs the `postgres` client library (v3.4.4) which works with Crunchy Bridge.

---

## Step 4: Configure Environment Variables

### For Local Development:

1. **Copy the example file**:
   ```bash
   cp .env.example .env
   ```

2. **Edit `.env` and add your connection string**:
   ```env
   DATABASE_URL=postgresql://user:password@p.xxxxx.db.crunchybridge.com:5432/database
   ```

3. **Add your other secrets** (Stripe, SendGrid, etc.)

### For Vercel Deployment:

1. **Go to Vercel Dashboard**: https://vercel.com/dashboard
2. **Select your project** → Settings → Environment Variables
3. **Add the variable**:
   - **Name**: `DATABASE_URL`
   - **Value**: Your Crunchy Bridge connection string
   - **Environment**: Production (and Preview if needed)
4. **Click "Save"**

---

## Step 5: Test the Connection

### Local Testing:

```bash
npm run dev
```

Then visit: http://localhost:3000/api/health

You should see:
```json
{
  "status": "healthy",
  "database": {
    "connected": true,
    "type": "postgresql"
  }
}
```

### Vercel Testing:

After deploying, visit: `https://your-app.vercel.app/api/health`

Same expected response as above.

---

## Step 6: Verify Tables Were Created

### Using psql:

```bash
psql "your-connection-string"
```

Then run:
```sql
\dt -- List all tables
\d clients -- Describe clients table
SELECT * FROM users; -- Should show admin user
```

### Using Crunchy Bridge Dashboard:

1. Go to SQL tab
2. Run: `SELECT tablename FROM pg_tables WHERE schemaname = 'public';`
3. Should see all your tables listed

---

## Scaling Guide

### Monitoring Performance:

Crunchy Bridge provides **Postgres Insights** - check your dashboard for:
- Cache hit ratio (should be >90%)
- Query performance
- Connection counts
- CPU/memory usage

### When to Scale Up:

**50-100 subscribers**: Start with **0.5GB RAM / 2 vCores** (Hobby tier)
**100-500 subscribers**: Upgrade to **2GB RAM / 2 vCores**
**500-2,000 subscribers**: Upgrade to **4-8GB RAM / 4 vCores**

### How to Scale:

1. Go to Crunchy Bridge dashboard
2. Click your cluster → Settings
3. Choose "Resize"
4. Select new instance size
5. **Zero downtime** - automatic migration

---

## Connection Pooling (Already Configured!)

Your app includes **pgBouncer** through Crunchy Bridge's built-in connection pooling.

**What this means:**
- ✅ Handles 1,000s of connections efficiently
- ✅ Optimized for Vercel serverless functions
- ✅ No additional setup needed
- ✅ Reduces costs by using fewer database connections

**Settings** (in `api/utils/database-connection.js`):
```javascript
max: 10,              // Max connections per Vercel instance
idle_timeout: 20,     // Close idle connections after 20s
connect_timeout: 10   // Connection timeout
```

---

## Security Checklist

- [x] **SSL Enforced**: Connection string uses `sslmode=require`
- [x] **No credentials in code**: All secrets in environment variables
- [x] **Demo mode fallback**: Works without database for testing
- [x] **Audit logging**: Track all database operations
- [ ] **Change admin password**: Update from default `admin123`
- [ ] **Set strong JWT_SECRET**: In environment variables
- [ ] **Sign BAA with Crunchy Data**: For HIPAA compliance

---

## HIPAA Compliance with Crunchy Bridge

Crunchy Bridge is **HIPAA compliant** with:
- ✅ SOC 2 Type 2 certified
- ✅ Encryption at rest
- ✅ Encryption in transit (SSL)
- ✅ Isolated VPCs
- ✅ Audit logging
- ✅ Business Associate Agreement (BAA) available

**To ensure compliance:**
1. Sign BAA with Crunchy Data (contact their support)
2. Enable audit logging in your app (`ENABLE_AUDIT_LOG=true`)
3. Document database access procedures
4. Set up automated backups (Crunchy does this automatically)
5. Configure access controls for your team

---

## Backup & Recovery

**Crunchy Bridge handles backups automatically:**
- ✅ Daily automated backups (included free)
- ✅ Point-in-time recovery
- ✅ Retention: 7-30 days (depends on plan)

**To restore a backup:**
1. Go to Crunchy Bridge dashboard
2. Click your cluster → Backups
3. Choose backup to restore
4. Create new cluster from backup (or restore in-place)

---

## Troubleshooting

### Error: "Connection refused"

**Cause**: Database URL not set or incorrect

**Fix**:
```bash
# Check environment variable
echo $DATABASE_URL

# Test connection
psql "$DATABASE_URL"
```

### Error: "SSL connection required"

**Cause**: Connection string missing SSL parameter

**Fix**: Ensure connection string ends with `?sslmode=require`

### Error: "Too many connections"

**Cause**: Connection pool exhausted (rare with our setup)

**Fix**: Check Crunchy Bridge dashboard for active connections. Consider scaling up if consistently high.

### App shows "Demo mode"

**Cause**: DATABASE_URL not configured

**Fix**:
- Local: Check `.env` file exists and has DATABASE_URL
- Vercel: Go to Environment Variables and add DATABASE_URL

---

## Cost Estimates

Based on your subscription growth:

| Subscribers | Instance Size | Monthly Cost |
|-------------|---------------|--------------|
| 0-100       | 0.5GB / 2 vCores | $10-20 |
| 100-500     | 2GB / 2 vCores | $40-60 |
| 500-2,000   | 4GB / 4 vCores | $100-200 |
| 2,000+      | 8GB+ / 8 vCores | $300-500 |

**Storage**: $0.10/GB/month (automatically scales)

**Compare to:**
- AWS RDS similar setup: $80-150/month (baseline)
- AWS Aurora similar setup: $150-300/month (baseline)
- **Crunchy Bridge saves 40-60%** on average

---

## Getting Help

**Crunchy Data Support:**
- Documentation: https://docs.crunchybridge.com/
- Support Portal: https://support.crunchydata.com/
- Community: https://www.postgresql.org/community/

**Sessionably Issues:**
- Check API health: `/api/health`
- Review logs in Vercel dashboard
- Verify DATABASE_URL is set correctly

---

## Next Steps

1. ✅ Database is connected
2. ✅ Schema is created
3. ✅ Test the health endpoint
4. ⬜ Change default admin password
5. ⬜ Set up remaining environment variables (Stripe, SendGrid, etc.)
6. ⬜ Deploy to Vercel production
7. ⬜ Monitor performance in Crunchy Bridge dashboard
8. ⬜ Sign BAA for HIPAA compliance

---

**You're ready to go! Your Sessionably is now powered by Crunchy Bridge.**
