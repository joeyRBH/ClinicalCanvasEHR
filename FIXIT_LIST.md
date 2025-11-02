# Fix It List - ClinicalCanvas EHR

## 🎥 Telehealth Video Integration - Configuration Required

### **Twilio Video Credentials Setup** (Required for Production)

#### 1. **Create Twilio API Key for Video**
- [ ] Go to: https://console.twilio.com/us1/develop/video/manage-api-keys
- [ ] Click "Create new API Key"
- [ ] Give it a friendly name: "ClinicalCanvas Video"
- [ ] Copy the **SID** (starts with SK...)
- [ ] Copy the **Secret** (you won't see it again!)
- [ ] Save both values securely

#### 2. **Get Twilio Account Credentials**
- [ ] Go to: https://console.twilio.com/
- [ ] Copy your **Account SID** (starts with AC...)
- [ ] Copy your **Auth Token** (click "show" to reveal)
- [ ] These are already being used for SMS, but verify they're correct

#### 3. **Add Credentials to Local Environment**
Add to `.env` file (for local testing):
```bash
# Twilio Account Credentials (SMS + Video)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxx

# Twilio Video API Key
TWILIO_API_KEY_SID=SKxxxxxxxxxxxxxxxxxxxxx
TWILIO_API_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxx

# Twilio Phone Number (for SMS)
TWILIO_PHONE_NUMBER=+15555551234
```

#### 4. **Add Credentials to Vercel (for Production)**
- [ ] Go to: https://vercel.com/dashboard
- [ ] Select your project
- [ ] Go to Settings → Environment Variables
- [ ] Add each variable:
  - `TWILIO_API_KEY_SID`
  - `TWILIO_API_KEY_SECRET`
  - (TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN should already exist)

#### 5. **Deploy to Vercel**
- [ ] Commit and push the telehealth feature branch
- [ ] Create pull request: https://github.com/joeyRBH/ClinicalCanvasEHR/pull/new/claude/add-telehealth-twilio-video-011CUiNQMxWpPKwFk43XHbU7
- [ ] Merge the pull request
- [ ] Verify Vercel auto-deploys
- [ ] Test video functionality in production

#### 6. **Database Migration** (for existing production database)
Run this SQL on your production database:
```sql
ALTER TABLE appointments
ADD COLUMN modality VARCHAR(50) DEFAULT 'in-person',
ADD COLUMN telehealth_room_id VARCHAR(255),
ADD COLUMN telehealth_link TEXT;
```

**Note:** This is already in `schema.sql` for new installations.

#### 7. **HIPAA Compliance - Sign BAA with Twilio**
- [ ] Contact Twilio to sign Business Associate Agreement (BAA)
- [ ] Twilio support: https://www.twilio.com/help/sales
- [ ] Required for HIPAA-compliant video sessions
- [ ] Document BAA signing date

---

## 📋 Testing Checklist

### **Local Testing (Demo Mode)**
- [ ] Start local dev server: `npm run dev`
- [ ] Create a new appointment
- [ ] Select "Telehealth (Video)" modality
- [ ] Save appointment
- [ ] Verify "DEMO MODE" banner appears on video page
- [ ] Test local camera/microphone access

### **Production Testing (With Credentials)**
- [ ] Create telehealth appointment
- [ ] Verify video room is created (check Twilio console)
- [ ] Open appointment details
- [ ] Click "Join Video Session" link
- [ ] Verify real Twilio connection (no demo banner)
- [ ] Test with second device/browser
- [ ] Verify both participants can see/hear each other
- [ ] Test mute/unmute audio
- [ ] Test start/stop video
- [ ] Test leave session

### **Notification Testing**
- [ ] Schedule telehealth appointment 24 hours out
- [ ] Verify SMS includes telehealth link
- [ ] Verify email includes telehealth link with instructions
- [ ] Click link from notification
- [ ] Verify it opens video session page

---

## 💰 Cost Monitoring

### **Set Up Twilio Usage Alerts**
- [ ] Go to: https://console.twilio.com/us1/monitor/alerts
- [ ] Create alert for video usage
- [ ] Set threshold (e.g., $50/month)
- [ ] Add notification email

### **Monitor Video Usage**
- [ ] Check Twilio Console → Video → Usage
- [ ] Review participant minutes
- [ ] Verify rooms are completing after sessions
- [ ] Check for idle/uncompleted rooms

**Expected Costs:**
- Peer-to-peer rooms (2 people): **Free**
- Group rooms: ~$0.004/participant/minute
- Example: 60-min session with 2 people = ~$0.48

---

## 📚 Documentation

### **Staff Training**
- [ ] Review TELEHEALTH.md documentation
- [ ] Train staff on scheduling telehealth appointments
- [ ] Train staff on joining video sessions
- [ ] Create client-facing instructions
- [ ] Update practice policies for telehealth

### **Client Communication**
- [ ] Update website with telehealth availability
- [ ] Prepare client instructions document
- [ ] Add telehealth FAQ to website
- [ ] Update consent forms to include telehealth

---

## 🔐 Security & Compliance

### **HIPAA Compliance Checklist**
- [ ] Sign BAA with Twilio ✅ (add to compliance documentation)
- [ ] Document video session policies
- [ ] Update privacy policy to include telehealth
- [ ] Update consent forms
- [ ] Train staff on telehealth HIPAA requirements
- [ ] Verify end-to-end encryption is enabled
- [ ] Set up audit logging for video sessions

### **State Licensing**
- [ ] Verify telehealth is allowed in your state
- [ ] Check if you need special telehealth license
- [ ] Verify client location requirements
- [ ] Document state-specific requirements

---

## 🚀 Quick Start Guide

**Fastest path to get telehealth working:**

1. **Get Twilio API Key** (5 minutes)
   - https://console.twilio.com/us1/develop/video/manage-api-keys
   - Create key, save SID and Secret

2. **Add to Vercel** (2 minutes)
   - Vercel → Project → Settings → Environment Variables
   - Add `TWILIO_API_KEY_SID` and `TWILIO_API_KEY_SECRET`

3. **Merge & Deploy** (5 minutes)
   - Merge PR
   - Wait for auto-deploy
   - Run database migration if needed

4. **Test** (5 minutes)
   - Create telehealth appointment
   - Join session
   - Test with second device

**Total time: ~20 minutes**

---

## ❓ Troubleshooting

### Issue: "DEMO MODE" banner still showing
**Solution:** Verify all 4 Twilio credentials are in Vercel environment variables

### Issue: Database error on save
**Solution:** Run the database migration SQL

### Issue: Video page won't load
**Solution:** Check browser console, verify HTTPS is enabled

### Issue: Can't access camera/mic
**Solution:** Grant browser permissions, use HTTPS, try Chrome/Firefox

---

## 📞 Support Resources

- **Twilio Video Docs:** https://www.twilio.com/docs/video
- **Twilio Support:** https://support.twilio.com/
- **TELEHEALTH.md:** Complete feature documentation
- **GitHub Issues:** https://github.com/joeyRBH/ClinicalCanvasEHR/issues

---

**Status:** ⏳ **Pending Configuration**

Once Twilio credentials are added and deployed, this feature will be **production-ready**.
