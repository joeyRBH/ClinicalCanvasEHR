# Connect Squarespace Domain to Vercel
## Step-by-Step Guide

---

## Overview

You don't need to "move" your domain from Squarespace to Vercel. Instead, you'll:
1. Keep your domain registered with Squarespace
2. Point it to Vercel's servers
3. Vercel will handle the hosting

---

## Option 1: Point Domain to Vercel (Recommended)

### Step 1: Add Domain in Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your `sessionably` project
3. Go to **Settings** → **Domains**
4. Click **"Add"** or **"Add Domain"**
5. Enter your domain: `sessionably.com`
6. Click **"Add"**

### Step 2: Get Vercel DNS Records

Vercel will show you DNS records you need to add. They'll look something like:

```
Type: A
Name: @
Value: 76.76.21.21

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

**Copy these values** - you'll need them in the next step.

---

### Step 3: Update DNS in Squarespace

1. Go to [Squarespace Dashboard](https://account.squarespace.com/)
2. Click on your website
3. Go to **Settings** → **Domains**
4. Click on your domain (`sessionably.com`)
5. Click **"DNS Settings"**
6. Click **"Custom Records"**

### Step 4: Add Vercel DNS Records

**Delete existing A and CNAME records** (if any), then add:

#### Record 1: Root Domain (A Record)
- **Type:** A
- **Host:** @
- **Data:** `76.76.21.21` (or the IP Vercel gives you)
- **TTL:** 3600 (or leave default)

#### Record 2: WWW Subdomain (CNAME Record)
- **Type:** CNAME
- **Host:** www
- **Data:** `cname.vercel-dns.com` (or the CNAME Vercel gives you)
- **TTL:** 3600 (or leave default)

### Step 5: Save and Wait

1. Click **"Save"**
2. Wait 5-60 minutes for DNS propagation
3. Vercel will automatically provision an SSL certificate

### Step 6: Verify

1. Go back to Vercel Dashboard → Settings → Domains
2. You should see your domain with a green checkmark ✅
3. Visit `https://sessionably.com` - it should load your Vercel app!

---

## Option 2: Transfer Domain to Vercel (Not Recommended)

**Note:** This is more complex and not necessary. You can keep your domain with Squarespace and just point it to Vercel.

If you really want to transfer:

1. Unlock domain in Squarespace
2. Get authorization code
3. Initiate transfer in Vercel
4. Approve transfer
5. Wait 5-7 days

**We don't recommend this.** Option 1 is simpler and works perfectly.

---

## Troubleshooting

### Domain Not Connecting

**Problem:** Domain shows as "Pending" in Vercel

**Solutions:**
1. Wait 5-60 minutes (DNS propagation takes time)
2. Check DNS records are correct in Squarespace
3. Verify you deleted old A/CNAME records
4. Try clearing your browser cache
5. Check DNS propagation: https://dnschecker.org

### SSL Certificate Not Provisioning

**Problem:** Site loads but shows "Not Secure"

**Solutions:**
1. Wait 10-30 minutes (SSL provisioning takes time)
2. Make sure you're using HTTPS (not HTTP)
3. Check Vercel dashboard for SSL status
4. Contact Vercel support if still not working

### Old Squarespace Site Still Showing

**Problem:** Visiting domain shows Squarespace site

**Solutions:**
1. Clear browser cache (Ctrl+Shift+Delete)
2. Try incognito/private browsing
3. Wait longer for DNS propagation
4. Check DNS records are correct

---

## DNS Propagation Check

After updating DNS, verify it's working:

1. Go to: https://dnschecker.org
2. Enter: `sessionably.com`
3. Select: **A** record type
4. Click **"Search"**
5. All locations should show: `76.76.21.21` (or Vercel's IP)

---

## Quick Reference

### Vercel DNS Records (Example)

```
A Record:
- Host: @
- Value: 76.76.21.21

CNAME Record:
- Host: www
- Value: cname.vercel-dns.com
```

### Squarespace DNS Settings

**Location:** Settings → Domains → [Your Domain] → DNS Settings → Custom Records

**What to Add:**
1. A record for root domain (@)
2. CNAME record for www subdomain

**What to Remove:**
- Any old A records pointing to Squarespace
- Any old CNAME records pointing to Squarespace

---

## After Domain is Connected

### 1. Test Your Site

Visit:
- https://sessionably.com
- https://www.sessionably.com

Both should work!

### 2. Update Any Hardcoded URLs

Check your code for any hardcoded URLs like:
- `https://sessionably.vercel.app`
- `localhost:3000`

Update them to use your custom domain.

### 3. Update Environment Variables

If you have any domain-specific environment variables:
- `ALLOWED_ORIGINS` - Add `https://sessionably.com`
- `FRONTEND_URL` - Update to `https://sessionably.com`

### 4. Test All Features

- Login works
- Database connection works
- SMS notifications work
- Stripe payments work
- All API endpoints respond

---

## Cost

**Domain Registration:** $20/year (you're already paying this to Squarespace)

**Vercel Hosting:** 
- Free tier: Works fine
- Pro tier: $20/month (required for BAA)

**Total Additional Cost:** $20/month (if upgrading to Pro for HIPAA)

---

## Need Help?

### Vercel Support
- Email: support@vercel.com
- Docs: https://vercel.com/docs/concepts/projects/domains

### Squarespace Support
- Email: help@squarespace.com
- Docs: https://support.squarespace.com/hc/en-us/articles/205815308

---

## Summary

**What You're Doing:**
1. Keep domain registered with Squarespace ✅
2. Add DNS records in Squarespace pointing to Vercel ✅
3. Vercel hosts your app ✅
4. SSL certificate auto-provisioned ✅

**Time Required:** 15-30 minutes  
**Difficulty:** Easy  
**Result:** Your domain works with Vercel!

---

**Last Updated:** January 2025  
**Status:** Ready to implement

