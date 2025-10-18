# 🚀 ClinicalCanvas EHR - Deployment Guide

## Quick Deploy to Vercel

### Method 1: One-Click Deploy (Recommended)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/joeyRBH/clinicalcanvas)

### Method 2: Manual Deploy via Vercel Dashboard

1. **Go to Vercel**: Visit [vercel.com](https://vercel.com) and sign in with GitHub
2. **Import Project**: Click "New Project" → "Import Git Repository"
3. **Select Repository**: Choose `joeyRBH/clinicalcanvas`
4. **Configure Settings**:
   - **Framework Preset**: Other
   - **Root Directory**: `./` (leave default)
   - **Build Command**: (leave empty)
   - **Output Directory**: (leave empty)
5. **Deploy**: Click "Deploy" and wait 1-2 minutes

### Method 3: Vercel CLI (if you have Node.js)
```bash
npm i -g vercel
cd /path/to/clinicalcanvas
vercel --prod
```

## 🌐 Your Live URL
After deployment, your app will be available at:
- **Production**: `https://clinicalcanvas-[random].vercel.app`
- **Custom Domain**: You can add your own domain in Vercel settings

## 🔧 Environment Variables (Optional)
If you want to use a real database, add these in Vercel:
- `DATABASE_URL`: Your backblaze/Backblaze B2 connection string
- `JWT_SECRET`: A secure random string for authentication

## 📱 Features Included
- ✅ Modern pastel yellow theme
- ✅ Client management
- ✅ Appointment scheduling
- ✅ Document management
- ✅ Invoice generation
- ✅ Reports & Analytics
- ✅ Notifications system
- ✅ HIPAA-compliant design
- ✅ Mobile responsive

## 🎯 Demo Credentials
- **Clinician**: `admin` / `admin123`
- **Client Code**: `DEMO-123456`

## 🔄 Auto-Deploy
Every time you push to GitHub, Vercel will automatically redeploy your app!

---
**Made with 💚 for mental health professionals**

