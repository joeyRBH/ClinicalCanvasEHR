# 🗑️ Remove Neon Variables from Vercel

## ⚠️ Before Adding Backblaze, Remove Neon Variables

You need to remove any Neon-related environment variables from Vercel before adding the Backblaze variables.

---

## 📋 Variables to Remove

Look for and **DELETE** these variables if they exist:

### Neon Database Variables:
- ❌ `DATABASE_URL` (if it contains "neon" or "postgresql")
- ❌ `NEON_DATABASE_URL`
- ❌ `NEON_DATABASE`
- ❌ `POSTGRES_URL`
- ❌ Any variable with "neon" in the name

### Keep These Variables:
- ✅ `STRIPE_SECRET_KEY`
- ✅ `STRIPE_WEBHOOK_SECRET`
- ✅ `TWILIO_ACCOUNT_SID`
- ✅ `TWILIO_AUTH_TOKEN`
- ✅ `TWILIO_PHONE_NUMBER`
- ✅ `TWILIO_MESSAGING_SERVICE_SID`
- ✅ `JWT_SECRET` (if you have one)
- ✅ `NODE_ENV`

---

## 🔧 Step-by-Step Removal

### Step 1: Go to Vercel Dashboard

1. Open: [vercel.com/dashboard](https://vercel.com/dashboard)
2. **Log in** to your account

### Step 2: Select Your Project

1. **Find** your `ClinicalCanvas` project
2. **Click** on it to open the project dashboard

### Step 3: Go to Environment Variables

1. **Click** the **"Settings"** tab (top navigation)
2. **Click** **"Environment Variables"** (left sidebar)

### Step 4: Check for Neon Variables

Look through the list of environment variables and identify any that:
- Have "neon" in the name
- Have "DATABASE_URL" in the name
- Have "postgres" in the name
- Have "postgresql" in the value

### Step 5: Delete Neon Variables

For each Neon-related variable:
1. **Click** the **"..."** (three dots) next to the variable
2. **Click** **"Delete"**
3. **Confirm** deletion

---

## ✅ After Removing Neon Variables

Once you've removed all Neon variables, you should see:

### Current Variables (Keep These):
```
STRIPE_SECRET_KEY          sk_live_...
STRIPE_WEBHOOK_SECRET      whsec_...
TWILIO_ACCOUNT_SID         AC...
TWILIO_AUTH_TOKEN          ...
TWILIO_PHONE_NUMBER        +1...
TWILIO_MESSAGING_SERVICE_SID  MG...
```

### Variables to Add (Next Step):
```
B2_APPLICATION_KEY_ID      35f2d10537a9
B2_APPLICATION_KEY         004e1d36cd60fbdffeeb2551c90eb530a71288430a
B2_BUCKET_NAME             clinicalcanvas-documents
B2_ENDPOINT                https://s3.us-west-002.backblazeb2.com
B2_REGION                  us-west-002
```

---

## 🔍 How to Identify Neon Variables

### Example Neon DATABASE_URL:
```
postgresql://neondb_owner:password@ep-weathered-fire-afxg84or-pooler.c-2.us-west2.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

**This should be DELETED** - it's a Neon database connection string.

### Example Backblaze B2 (What You'll Add):
```
B2_APPLICATION_KEY_ID=35f2d10537a9
B2_APPLICATION_KEY=004e1d36cd60fbdffeeb2551c90eb530a71288430a
```

**These are DIFFERENT** - Backblaze uses API keys, not database URLs.

---

## ✅ Checklist

Before adding Backblaze variables:

- [ ] Opened Vercel dashboard
- [ ] Selected ClinicalCanvas project
- [ ] Went to Settings → Environment Variables
- [ ] Checked for `DATABASE_URL` (Neon)
- [ ] Checked for `NEON_DATABASE_URL`
- [ ] Checked for any variable with "neon" in the name
- [ ] Deleted all Neon-related variables
- [ ] Verified only Stripe/Twilio variables remain
- [ ] Ready to add Backblaze variables

---

## 🎯 Next Steps

After removing Neon variables:

1. **Add Backblaze variables** (see `ADD_BACKBLAZE_TO_VERCEL.md`)
2. **Redeploy** your app
3. **Test** the integration

---

## ⚠️ Important Notes

- **Don't delete** Stripe or Twilio variables
- **Don't delete** JWT_SECRET if you have one
- **Only delete** variables related to Neon database
- **Backblaze is for storage**, not a database
- **No DATABASE_URL needed** with Backblaze

---

## 📞 Need Help?

If you're unsure about a variable:
1. Check the variable name
2. Check if the value contains "neon" or "postgresql"
3. If yes → DELETE
4. If no → KEEP

---

**Last Updated**: January 2025  
**Status**: Ready for Neon Variable Removal  
**Next**: Remove Neon variables, then add Backblaze variables

