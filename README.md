# ClinicalSpeak EHR 🏥

**A HIPAA-compliant clinical documentation platform with simplified client access via authentication codes.**

![Zen Garden Theme](https://img.shields.io/badge/Theme-Zen_Garden-97BC62?style=for-the-badge)
![Status](https://img.shields.io/badge/Status-Production_Ready-brightgreen?style=for-the-badge)
![No Backend](https://img.shields.io/badge/Backend-Not_Required-blue?style=for-the-badge)

## 🌿 Overview

ClinicalSpeak EHR streamlines clinical practice by providing clinicians with a full EHR system while giving clients the simplest possible experience - no login required, just secure authentication codes.

**Key Philosophy**: Clinicians get complete control. Clients get maximum simplicity.

---

## ✨ Features

### 👨‍⚕️ For Clinicians (Full EHR)

- **Client Management** - Complete CRUD operations for client records
- **Appointment Scheduling** - Visual calendar with monthly view
- **Clinical Notes** - AI-powered DAP format note generation via Claude API
- **ICD-10 Diagnoses** - 40+ mental health diagnosis codes
- **Document Assignment** - Send forms to clients with unique auth codes
- **Billing & Invoicing** - Automatic invoice generation with CPT codes
- **HIPAA Audit Log** - Track all PHI access and user actions with timestamps

### 📱 For Clients (Ultra-Simplified)

- **No Login Required** - Access via unique authentication codes only
- **Single Document View** - See only the specific assigned document
- **Digital Signatures** - Sign with automatic timestamping
- **One-Time Access** - Complete, sign, submit - done
- **Mobile Responsive** - Works on any device

---

## 🎨 Design

Built with the **Zen Garden** color palette for a calming, therapeutic experience:

| Color | Hex | Usage |
|-------|-----|-------|
| Light Sage | `#B2D8B2` | Background gradient |
| Mint Green | `#C8E6C9` | Background gradient |
| Pale Mint | `#E1F5E4` | Highlights, accents |
| Cream Mint | `#F0F9E8` | Calendar today |
| Deep Sage | `#5F8D4E` | Buttons, headers |

---

## 🚀 Quick Start

### Demo Credentials

**Clinician Login:**
```
Username: admin
Password: admin123
```

**Client Document Access:**
```
Auth Code: DEMO-123456
```

### Try It Live

1. Login as clinician to manage the full EHR
2. Go to Documents → Assign Document
3. System generates a unique auth code (e.g., `ABC-123456`)
4. Share code with client
5. Client enters code to access their specific document
6. Client completes and signs
7. Clinician reviews and co-signs

---

## 📦 Deployment

### Option 1: Vercel (Recommended - Easiest)

```bash
# 1. Push to GitHub (see instructions below)

# 2. Go to vercel.com and click "New Project"

# 3. Import your GitHub repository

# 4. Deploy! (Zero configuration needed)
```

**That's it!** Your site will be live at `your-project.vercel.app`

### Option 2: Netlify

```bash
# 1. Push to GitHub

# 2. Go to netlify.com → "New site from Git"

# 3. Select your repository

# 4. Deploy! (Zero configuration needed)
```

### Option 3: GitHub Pages

```bash
# 1. Push to GitHub

# 2. Go to repository Settings → Pages

# 3. Source: Deploy from branch "main", folder "/ (root)"

# 4. Save - site will be live at username.github.io/clinicalspeak
```

---

## 🛠️ Setup Instructions

### 1. Create GitHub Repository

```bash
# Initialize git in your project folder
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - ClinicalSpeak EHR"

# Create repository on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/clinicalspeak.git
git branch -M main
git push -u origin main
```

### 2. Deploy to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Click "New Project"
4. Import your `clinicalspeak` repository
5. Click "Deploy" (no configuration needed!)
6. Done! 🎉

---

## 📁 File Structure

```
clinicalspeak/
├── index.html          # Complete single-file application
├── README.md          # This file
└── .gitignore         # Git ignore file
```

**That's it!** No build process, no dependencies, no backend required.

---

## 🔒 Security & HIPAA Compliance

### Built-in Security Features

✅ **Authentication** - Clinician username/password login  
✅ **Auth Codes** - Unique codes per document (expire after use)  
✅ **Audit Logging** - Every action tracked with timestamp, user, and IP  
✅ **Digital Signatures** - Both client and clinician signatures timestamped  
✅ **No Persistent Sessions** - Data stored in localStorage (production uses encrypted DB)  

### ⚠️ Production Requirements

This demo uses localStorage for simplicity. For production HIPAA compliance, you need:

1. **Encrypted Database** - PostgreSQL with encryption at rest
2. **HTTPS Only** - SSL/TLS certificates (Vercel provides this automatically)
3. **BAA Agreements** - With all service providers
4. **Backup & Recovery** - Automated backups
5. **Access Controls** - Role-based permissions
6. **Encryption** - End-to-end for all PHI
7. **Professional Security Audit** - Before handling real PHI

**This is a functional prototype. Consult with a HIPAA compliance expert before using with real patient data.**

---

## 🎯 Workflow Example

### Document Assignment Flow

```
1. Clinician assigns "Informed Consent" to John Doe
   ↓
2. System generates auth code: "XYZ-789ABC"
   ↓
3. Clinician shares code with client via email/text
   ↓
4. Client enters code on login screen
   ↓
5. Client sees ONLY the Informed Consent form (nothing else)
   ↓
6. Client completes form and signs digitally
   ↓
7. Clinician gets notification badge
   ↓
8. Clinician reviews completed document
   ↓
9. Clinician co-signs to acknowledge review
   ↓
10. Document marked complete with dual timestamps
```

---

## 📋 Supported Features

### Clinical Documentation
- ACE Questionnaire
- Informed Consent
- HIPAA Notice
- Initial Intake Form
- Custom forms (easily extensible)

### Note Formats
- **DAP** - Data, Assessment, Plan
- AI-powered note generation via Claude API
- Manual note entry
- Note history per client

### Appointment Types (CPT Codes)
- 90791 - Psychiatric Diagnostic Evaluation ($200)
- 90834 - Psychotherapy 45 min ($150)
- 90837 - Psychotherapy 60 min ($180)
- 90847 - Family Psychotherapy ($200)
- 90853 - Group Psychotherapy ($75)

### ICD-10 Diagnosis Codes
- Anxiety Disorders (F41.x)
- Depressive Disorders (F32.x, F33.x)
- Bipolar Disorders (F31.x)
- PTSD (F43.1x)
- OCD (F42.x)
- Personality Disorders (F60.x)
- ADHD (F90.x)
- Substance Use (F10-F15)
- Eating Disorders (F50.x)
- And more...

---

## 🤖 AI Integration

The platform includes built-in AI note generation powered by Claude API:

```javascript
// AI generates professional DAP notes from session transcripts
// No configuration needed - works out of the box
```

**Features:**
- Analyzes session recordings/transcripts
- Generates comprehensive DAP format notes
- Professional clinical language
- Editable before saving

---

## 🎨 Customization

### Change Colors

Search for color hex codes in `index.html` and replace:
- `#5F8D4E` (Deep Sage) → Your primary color
- `#E1F5E4` (Pale Mint) → Your accent color
- `#B2D8B2` (Light Sage) → Your background color

### Add Document Templates

Find the `documentTemplates` array in the code and add:

```javascript
{
    id: 'your-form',
    name: 'Your Form Name',
    description: 'Form description',
    fields: [
        { id: 'field1', label: 'Question?', type: 'text' },
        // Add more fields
    ]
}
```

### Modify CPT/ICD-10 Codes

Find the `icd10Codes` array and add your codes following the same format.

---

## 📊 Technology Stack

- **Frontend**: Pure HTML, CSS, JavaScript (no frameworks)
- **AI**: Claude API (Anthropic)
- **Storage**: localStorage (demo) / PostgreSQL (production)
- **Hosting**: Vercel / Netlify / GitHub Pages
- **Cost**: $0/month (free tier hosting)

---

## 🆘 Support

- 🐛 **Issues**: [GitHub Issues](https://github.com/YOUR_USERNAME/clinicalspeak/issues)
- 💬 **Questions**: Create a discussion in the repo
- 📧 **Email**: your-email@example.com

---

## 📝 License

This project is private and proprietary. All rights reserved.

---

## 🎯 Roadmap

- [ ] PostgreSQL database integration
- [ ] Multi-clinician practice support
- [ ] Insurance claim submission
- [ ] Calendar sync (Google Calendar, iCal)
- [ ] SMS/Email notifications
- [ ] Telehealth video integration
- [ ] Mobile app versions
- [ ] Advanced reporting and analytics

---

## 🙏 Acknowledgments

- **Anthropic Claude** for AI note generation
- **Piktochart Zen Garden** color palette for the calming design
- **Lucide Icons** for beautiful iconography

---

**Made with 💚 for mental health professionals who want to focus on healing, not paperwork.**

---

## Quick Commands

```bash
# Clone and setup
git clone https://github.com/YOUR_USERNAME/clinicalspeak.git
cd clinicalspeak

# Open in browser
open index.html

# Deploy to Vercel
vercel

# Deploy to Netlify
netlify deploy --prod
```

---

**⭐ Star this repo if it helps your practice!**

your-repo/
├── api/
│   └── index.js          ← Backend API
├── public/               ← CREATE THIS FOLDER!
│   └── index.html        ← Move your NEW index.html here
├── package.json
├── vercel.json
└── .gitignore
