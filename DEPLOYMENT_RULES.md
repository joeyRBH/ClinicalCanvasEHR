# 🚀 ClinicalSpeak EHR Deployment Rules

## 🔑 Login System Rule

**CRITICAL:** Use simple one-click login button for ALL deployments until real authentication is implemented.

### ✅ Current Implementation:
- **Single blue button**: "🏥 Login to EHR"
- **No username/password fields** - eliminates form validation issues
- **Automatic demo user login** - no credentials required
- **Globally accessible function** - `simpleLogin()` defined early in script
- **No complex authentication logic** - prevents deployment failures

### 🚫 What NOT to Deploy:
- Username/password forms
- Complex authentication flows
- Google OAuth (until properly configured)
- Multi-step login processes
- Form validation dependencies

### 🔧 Implementation Details:
```javascript
function simpleLogin() {
    try {
        authToken = 'demo-token-' + Date.now();
        currentUser = { 
            name: 'Demo User',
            email: 'demo@clinicalspeak.com',
            role: 'admin',
            loginMethod: 'simple'
        };
        
        saveToStorage('auth_token', authToken);
        saveToStorage('current_user', currentUser);
        
        logLocalAudit('login', { method: 'simple' });
        showApp();
        
        console.log('✅ Simple login successful!');
        
    } catch (error) {
        console.error('Login error:', error);
        alert('Login failed: ' + error.message);
    }
}
```

### 📋 Deployment Checklist:
- [ ] Simple login button present
- [ ] No username/password fields
- [ ] `simpleLogin()` function defined early in script
- [ ] No JavaScript syntax errors
- [ ] F12 console clean
- [ ] Button works on first click
- [ ] Session persists after refresh

### 🔄 When to Change:
Only implement full authentication when:
1. Real login system is 100% complete
2. All authentication flows are tested
3. OAuth providers are properly configured
4. Form validation is bulletproof
5. User explicitly requests the change

---

**Rule Status:** ✅ ACTIVE - Use simple login for all deployments
**Last Updated:** $(date)
**Reason:** Prevents deployment failures and login issues
