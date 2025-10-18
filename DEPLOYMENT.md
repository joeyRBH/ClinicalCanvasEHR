# 🚀 Deployment Guide for ClinicalCanvas EHR

## Step-by-Step GitHub & Vercel Deployment

### 📝 Prerequisites
- GitHub account ([Sign up here](https://github.com/join))
- Vercel account ([Sign up here](https://vercel.com/signup))
- Git installed on your computer

---

## Part 1: Push to GitHub

### 1️⃣ Create Your Project Folder

Create a folder called `clinicalcanvas` and add these 3 files:
- `index.html` (the main EHR application)
- `README.md` (documentation)
- `.gitignore` (git configuration)

### 2️⃣ Initialize Git Repository

Open Terminal/Command Prompt in your project folder:

```bash
# Navigate to your project folder
cd path/to/clinicalcanvas

# Initialize git
git init

# Add all files
git add .

# Create first commit
git commit -m "Initial commit - ClinicalCanvas EHR"
```

### 3️⃣ Create GitHub Repository

1. Go to [github.com](https://github.com)
2. Click the **"+"** icon (top right) → **"New repository"**
3. Repository name: `clinicalcanvas`
4. Description: `HIPAA-compliant clinical EHR with simplified client access`
5. Keep it **Private** (recommended for healthcare)
6. **DO NOT** initialize with README (we already have one)
7. Click **"Create repository"**

### 4️⃣ Push Your Code

GitHub will show you commands - use these:

```bash
# Add GitHub as remote
git remote add origin https://github.com/YOUR_USERNAME/clinicalcanvas.git

# Push to GitHub
git branch -M main
git push -u origin main
```

✅ **Your code is now on GitHub!**

---

## Part 2: Deploy to Vercel

### 1️⃣ Connect Vercel to GitHub

1. Go to [vercel.com](https://vercel.com)
2. Click **"Sign Up"** or **"Log In"**
3. Choose **"Continue with GitHub"**
4. Authorize Vercel to access your GitHub account

### 2️⃣ Import Your Project

1. On Vercel dashboard, click **"Add New..."** → **"Project"**
2. Find your `clinicalcanvas` repository
3. Click **"Import"**

### 3️⃣ Configure & Deploy

**Project Settings:**
- **Project Name**: `clinicalcanvas` (or customize)
- **Framework Preset**: Other (it's just HTML)
- **Root Directory**: `./` (default)
- **Build Command**: Leave empty (not needed)
- **Output Directory**: Leave empty (not needed)

**Environment Variables:**
- None needed! (No backend)

Click **"Deploy"** 🚀

### 4️⃣ Wait for Deployment

Vercel will:
- Build your project (takes 10-30 seconds)
- Deploy to a live URL
- Show you the deployment status

✅ **You'll see**: "Congratulations! Your project is live!"

### 5️⃣ Access Your Site

Your site will be live at:
```
https://clinicalcanvas.vercel.app
```
or
```
https://clinicalcanvas-YOUR_USERNAME.vercel.app
```

---

## Part 3: Custom Domain (Optional)

### Add Your Own Domain

1. In Vercel dashboard, go to your project
2. Click **"Settings"** → **"Domains"**
3. Add your domain (e.g., `clinicalcanvas.app`)
4. Follow DNS configuration instructions
5. Wait 24-48 hours for propagation

**Recommended Domain Registrars:**
- [Namecheap](https://namecheap.com) - $8-12/year
- [Google Domains](https://domains.google) - $12/year
- [Cloudflare](https://cloudflare.com) - $8-10/year

---

## 🔄 Making Updates

### Update Your Code

```bash
# Make changes to index.html

# Stage changes
git add .

# Commit changes
git commit -m "Description of what you changed"

# Push to GitHub
git push
```

**Vercel automatically redeploys** when you push to GitHub! 🎉

---

## 🧪 Testing Your Deployment

### 1. Test Clinician Login
```
Username: admin
Password: admin123
```

### 2. Test Client Access
```
Auth Code: DEMO-123456
```

### 3. Test Core Features
- ✅ Create a new client
- ✅ Schedule an appointment
- ✅ Generate an AI note
- ✅ Assign a document
- ✅ Access document as client
- ✅ Complete and sign document
- ✅ Review and co-sign as clinician

---

## 🚨 Troubleshooting

### Issue: Can't push to GitHub
**Solution:** Make sure you've set up SSH keys or use HTTPS with personal access token
```bash
git remote set-url origin https://YOUR_USERNAME@github.com/YOUR_USERNAME/clinicalcanvas.git
```

### Issue: Vercel deployment failed
**Solution:** Check that `index.html` is in the root directory

### Issue: Site shows 404 error
**Solution:** Make sure your `index.html` is named exactly that (lowercase, no spaces)

### Issue: Changes not showing on live site
**Solution:** 
1. Hard refresh browser: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
2. Check Vercel dashboard for deployment status
3. Wait 1-2 minutes for CDN cache to clear

---

## 📊 Deployment Checklist

- [ ] Created project folder with 3 files
- [ ] Initialized git repository
- [ ] Created GitHub repository
- [ ] Pushed code to GitHub
- [ ] Connected Vercel to GitHub
- [ ] Imported project to Vercel
- [ ] Deployed successfully
- [ ] Tested clinician login
- [ ] Tested client access
- [ ] Tested core features
- [ ] (Optional) Added custom domain

---

## 💡 Pro Tips

1. **Keep it Private**: For healthcare applications, always use private repositories
2. **Use Branches**: Create feature branches before making big changes
3. **Regular Backups**: Export your data regularly from the audit log
4. **Monitor Usage**: Check Vercel analytics to track usage
5. **Test Changes**: Always test locally before pushing to production

---

## 📞 Need Help?

- 🐛 **GitHub Issues**: Create an issue in your repository
- 📧 **Vercel Support**: [vercel.com/support](https://vercel.com/support)
- 💬 **Community**: [vercel.com/discord](https://vercel.com/discord)

---

## 🎉 You're Done!

Your ClinicalCanvas EHR is now:
- ✅ Live on the internet
- ✅ Automatically deploying updates
- ✅ Hosted on fast, reliable servers
- ✅ Using HTTPS for security
- ✅ Ready for testing and development

**Next Steps:**
1. Test thoroughly with demo data
2. Customize for your practice
3. Consult HIPAA compliance expert before using with real PHI
4. Set up proper encrypted database for production

---

**Happy Deploying! 🚀**
