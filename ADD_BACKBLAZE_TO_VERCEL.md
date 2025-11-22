# 🚀 Add Backblaze B2 to Vercel Environment Variables

## ✅ Quick Setup Guide

Your Backblaze credentials are ready! Now add them to Vercel.

---

## 📋 Environment Variables to Add

Copy and paste these into Vercel:

```bash
B2_APPLICATION_KEY_ID=35f2d10537a9
B2_APPLICATION_KEY=004b1a8a87b71bc00c446280e745b5a36c7d96c2fa
B2_BUCKET_NAME=Sessionably
B2_ENDPOINT=https://s3.us-west-002.backblazeb2.com
B2_REGION=us-west-002
```

---

## 🔧 Step-by-Step Instructions

### Step 1: Go to Vercel Dashboard

1. Open: [vercel.com/dashboard](https://vercel.com/dashboard)
2. **Log in** to your account

### Step 2: Select Your Project

1. **Find** your `Sessionably` project
2. **Click** on it to open the project dashboard

### Step 3: Go to Settings

1. **Click** the **"Settings"** tab (top navigation)
2. **Click** **"Environment Variables"** (left sidebar)

### Step 4: Add Each Variable

For each variable below, click **"Add New"** and enter:

#### Variable 1:
- **Name**: `B2_APPLICATION_KEY_ID`
- **Value**: `35f2d10537a9`
- **Environments**: ✅ Production, ✅ Preview, ✅ Development

#### Variable 2:
- **Name**: `B2_APPLICATION_KEY`
- **Value**: `004e1d36cd60fbdffeeb2551c90eb530a71288430a`
- **Environments**: ✅ Production, ✅ Preview, ✅ Development

#### Variable 3:
- **Name**: `B2_BUCKET_NAME`
- **Value**: `sessionably-documents`
- **Environments**: ✅ Production, ✅ Preview, ✅ Development

#### Variable 4:
- **Name**: `B2_ENDPOINT`
- **Value**: `https://s3.us-west-002.backblazeb2.com`
- **Environments**: ✅ Production, ✅ Preview, ✅ Development

#### Variable 5:
- **Name**: `B2_REGION`
- **Value**: `us-west-002`
- **Environments**: ✅ Production, ✅ Preview, ✅ Development

### Step 5: Save

1. **Click** **"Save"** after adding each variable
2. **Verify** all 5 variables are listed
3. **Close** the settings page

---

## ✅ Verification

After adding the variables, you should see:

```
B2_APPLICATION_KEY_ID    35f2d10537a9
B2_APPLICATION_KEY       004e1d36cd60fbdffeeb2551c90eb530a71288430a
B2_BUCKET_NAME           sessionably-documents
B2_ENDPOINT              https://s3.us-west-002.backblazeb2.com
B2_REGION                us-west-002
```

---

## 🔄 Redeploy Your App

After adding environment variables, you need to redeploy:

### Option 1: Automatic (Recommended)
1. **Push** any change to GitHub
2. **Vercel** will auto-deploy with new variables

### Option 2: Manual
1. Go to **"Deployments"** tab
2. Click **"..."** (three dots) on latest deployment
3. Click **"Redeploy"**
4. Select **"Use existing Build Cache"**
5. Click **"Redeploy"**

---

## 🧪 Test the Integration

Once deployed, test with:

```bash
# Test upload
curl -X POST https://sessionably.com/api/upload-document \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "test-123",
    "documentId": "doc-456",
    "fileName": "test.pdf",
    "fileData": "base64_encoded_data_here"
  }'

# Test download
curl "https://sessionably.com/api/download-document?key=documents/test-123/doc-456/test.pdf"
```

---

## 🔒 Security Notes

✅ **Credentials are secure**:
- Stored in Vercel environment variables
- Not visible in code
- Not in Git history
- Protected by Vercel's security

✅ **File is protected**:
- `BACKBLAZE_CREDENTIALS.txt` is in `.gitignore`
- Won't be committed to GitHub

---

## 📞 Need Help?

If you run into issues:
1. Check that all 5 variables are added
2. Verify values are correct (no extra spaces)
3. Make sure all environments are selected
4. Redeploy after adding variables

---

## ✅ Checklist

- [ ] Added `B2_APPLICATION_KEY_ID` to Vercel
- [ ] Added `B2_APPLICATION_KEY` to Vercel
- [ ] Added `B2_BUCKET_NAME` to Vercel
- [ ] Added `B2_ENDPOINT` to Vercel
- [ ] Added `B2_REGION` to Vercel
- [ ] Selected all environments (Production, Preview, Development)
- [ ] Redeployed the application
- [ ] Tested the integration

---

## 🎉 Next Steps

Once you've added the environment variables:

1. **Redeploy** your app
2. **Test** the integration
3. **Let me know** and I'll create the upload/download API endpoints
4. **Integrate** Backblaze into Sessionably

---

**Last Updated**: January 2025  
**Status**: Ready for Vercel Integration  
**Next**: Add variables to Vercel and redeploy

