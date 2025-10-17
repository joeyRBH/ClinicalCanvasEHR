# ClinicalSpeak EHR - Deployment Rules

## 🎨 **Color Scheme Rule - MANDATORY**

### **Light Grey Background with Black Text**

**CSS Variables (MUST be set in `:root`):**
```css
:root {
    --background-gradient: #e5e5e5;  /* Light grey background */
    --text-primary: #000000;         /* Black text */
    --text-secondary: #6c757d;       /* Grey secondary text */
}
```

**Force Light Theme in `.app-container`:**
```css
.app-container { 
    background: #e5e5e5 !important;
    color: #000000 !important;
}
```

**Disable Dark Mode:**
```css
@media (prefers-color-scheme: dark) {
    :root {
        --surface-color: #ffffff;
        --surface-elevated: #ffffff;
        --text-primary: #000000;
        --text-secondary: #6c757d;
        --border-color: #e9ecef;
    }
    
    body {
        background: #e5e5e5;
    }
}
```

---

## 🔐 **Authentication Rule - MANDATORY**

### **Username/Password Login System**

**Login Form MUST include:**
- Username input field
- Password input field
- Login button
- Registration link
- Demo credentials display

**Registration Form MUST include:**
- Username field (unique)
- Password field (minimum 8 characters)
- Confirm password field
- Full name field
- Email field
- Register button
- Login link

**Data Storage:**
- All clinicians stored in `localStorage` with key: `clinicalspeak_clinicians`
- Demo clinician pre-created: username `admin`, password `admin123`

**Functions Required:**
- `clinicianLogin()` - handles login with username/password
- `registerClinician()` - handles new clinician registration
- `showLoginForm()` - switches to login form
- `showRegisterForm()` - switches to registration form

---

## 📝 **Clinical Notes Rule - MANDATORY**

### **Digital Signature Requirement**

**ALL clinical notes MUST be digitally signed with:**
- Clinician name
- Timestamp (ISO format)
- Notes locked after signing
- Audit logging for signatures

**Signature Button:**
- "✍️ Sign & Lock Note" button in appointment detail panel
- Disables editing after signing
- Shows "✅ Signed & Locked" when signed

**Client Chart Display:**
- Session history with expandable/collapsible view
- Shows signature status (signed or unsigned)
- Green badge for signed notes
- Red warning for unsigned notes

---

## 🗂️ **Data Storage Rules**

### **localStorage Keys (All prefixed with `clinicalspeak_`):**

1. **`clinicalspeak_clinicians`** - Registered clinicians
2. **`clinicalspeak_clients`** - Client information
3. **`clinicalspeak_appointments`** - All appointments (with clinical notes and signatures)
4. **`clinicalspeak_assigned_docs`** - Assigned documents
5. **`clinicalspeak_invoices`** - Invoices
6. **`clinicalspeak_audit_logs`** - Audit trail

### **Storage Functions:**
- `saveToStorage(key, data)` - Save data to localStorage
- `loadFromStorage(key, defaultValue)` - Load data from localStorage
- `getStorageKey(key)` - Returns `clinicalspeak_${key}`

---

## 🚫 **What NOT to Deploy**

### **Never Deploy:**
- ❌ Dark mode (disabled by rule)
- ❌ Google OAuth integration (removed)
- ❌ Simple one-click login (replaced with username/password)
- ❌ Client chart calendar (removed)
- ❌ Inline appointment expansion (replaced with detail panel)

---

## ✅ **Deployment Checklist**

Before deploying, verify:
- [ ] Light grey background (#e5e5e5) enforced
- [ ] Black text (#000000) enforced
- [ ] Dark mode disabled
- [ ] Username/password login system active
- [ ] Registration form functional
- [ ] Demo clinician (admin/admin123) exists
- [ ] Clinical notes have digital signature button
- [ ] Client chart shows session history (no calendar)
- [ ] All data saves to localStorage
- [ ] Audit logging works for all actions

---

## 🔧 **Testing After Deployment**

1. **Login Test:**
   - Login with admin/admin123
   - Register new clinician
   - Login with new credentials

2. **Color Test:**
   - Verify light grey background
   - Verify black text throughout
   - Check on mobile and desktop

3. **Clinical Notes Test:**
   - Add notes to appointment
   - Save notes
   - Sign notes
   - Verify signature in client chart

4. **Data Persistence Test:**
   - Create data
   - Refresh page
   - Verify data persists

---

## 📋 **Version Control**

**Current Version:** 2.0  
**Last Updated:** January 2024  
**Color Scheme:** Light Grey (#e5e5e5) / Black (#000000)  
**Authentication:** Username/Password  
**Clinical Notes:** Digital Signature Required

---

## 🚨 **Emergency Rollback**

If deployment fails:
1. Check browser console for errors
2. Verify localStorage is accessible
3. Clear localStorage: `localStorage.clear()`
4. Refresh page
5. Re-register admin user if needed

---

**These rules are MANDATORY and must be followed for all deployments.**
