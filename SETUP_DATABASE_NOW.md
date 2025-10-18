# 🚀 Quick Database Setup - DO THIS NOW

## ✅ You Have:
- ✅ Neon database connection string
- ✅ Database credentials saved locally
- ✅ Schema file ready (`schema.sql`)

## 📋 Next Steps (5 minutes):

### 1. Add DATABASE_URL to Vercel (2 minutes)

1. Go to: https://vercel.com/dashboard
2. Click on: **clinicalcanvas** project
3. Go to: **Settings** → **Environment Variables**
4. Click: **Add New**
5. Add:
   ```
   Name: DATABASE_URL
   Value: postgresql://neondb_owner:npg_BHz4Mxl3bXto@ep-weathered-fire-afxg84or-pooler.c-2.us-west2.aws.neon.tech/neondb?sslmode=require&channel_binding=require
   Environments: Production, Preview, Development (check all)
   ```
6. Click: **Save**

### 2. Run Database Schema in Neon (2 minutes)

**Option A: Using Neon Console (EASIEST)**

1. Go to: https://console.neon.tech
2. Select your project
3. Click: **SQL Editor** (left sidebar)
4. Open the file: `schema.sql` in this project
5. Copy ALL contents (Ctrl+A, Ctrl+C)
6. Paste into Neon SQL Editor
7. Click: **Run** button
8. ✅ Verify: Should see "Success" message

**Option B: Using psql command line**

```bash
psql 'postgresql://neondb_owner:npg_BHz4Mxl3bXto@ep-weathered-fire-afxg84or-pooler.c-2.us-west2.aws.neon.tech/neondb?sslmode=require&channel_binding=require' -f schema.sql
```

### 3. Redeploy Vercel (1 minute)

After adding DATABASE_URL:
1. Go to Vercel Dashboard → **Deployments**
2. Click **"..."** on latest deployment
3. Click **"Redeploy"**
4. Wait ~2 minutes for deployment

### 4. Test Connection (30 seconds)

Visit: https://clinicalcanvas.vercel.app/api/health

**Expected Response:**
```json
{
  "status": "healthy",
  "database": {
    "connected": true,
    "type": "postgresql"
  }
}
```

### 5. Create Admin User (30 seconds)

Visit: https://clinicalcanvas.vercel.app/api/setup-admin

**Expected Response:**
```json
{
  "success": true,
  "message": "Admin user created successfully"
}
```

### 6. Test Login (30 seconds)

1. Go to: https://clinicalcanvas.vercel.app
2. Login with:
   - Username: `admin`
   - Password: `admin123`
3. ✅ Verify you can see the dashboard

---

## ✅ Verification Checklist

After completing all steps:

- [ ] DATABASE_URL added to Vercel
- [ ] Schema.sql executed in Neon
- [ ] Vercel redeployed
- [ ] Health check shows database connected
- [ ] Admin user created
- [ ] Can login to app
- [ ] Created a test client
- [ ] Client persists after page reload

---

## 🐛 Troubleshooting

### Health check shows "demo_mode"

**Problem:** DATABASE_URL not set or invalid

**Solution:**
1. Double-check Vercel environment variables
2. Ensure you redeployed after adding the variable
3. Check Vercel function logs for errors

### "relation does not exist" error

**Problem:** Schema not run in Neon

**Solution:**
1. Go to Neon Console → SQL Editor
2. Run schema.sql again
3. Verify tables exist: `SELECT * FROM information_schema.tables;`

### Can't login after setup

**Problem:** Admin user not created

**Solution:**
1. Visit /api/setup-admin again
2. Check response for success message
3. Try login again

---

## 🎉 Success!

Once all steps are complete:
- ✅ Database is connected
- ✅ Data persists across sessions
- ✅ Ready for production use
- ✅ Can move to next task (Custom Domain)

---

**Questions?** Check `DATABASE_VERIFICATION.md` for detailed troubleshooting.

