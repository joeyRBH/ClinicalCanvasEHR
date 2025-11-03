# 🔧 FIXIT LIST - ClinicalCanvas EHR

**Date Created:** November 3, 2025
**Status:** In Progress

---

## 🎯 Priority Issues to Fix

### 1. ⚠️ Invoice Simplification (Medium Priority)
**Issue:** Invoice display format needs to be simplified and more user-friendly.

**Tasks:**
- [ ] Update invoice display format to: `"90834 (Psychotherapy 45min) - $150.00"`
- [ ] Simplify invoice view modal
- [ ] Update email notifications to use new format
- [ ] Test invoice generation and display

**Files to Modify:**
- `app.html` or `index.html` (invoice display logic)
- API files for invoice formatting
- Email templates

---

### 2. 🔧 Superbill Generation (High Priority)
**Issue:** Clients need the ability to generate superbills for insurance reimbursement.

**Tasks:**
- [ ] Add `superbill_monthly` preference field to client records
- [ ] Add superbill checkbox to intake forms
- [ ] Create superbill generator function
- [ ] Add "Generate Superbill" button to client chart Invoices tab
- [ ] Design superbill PDF template
- [ ] Test superbill generation

**Files to Create/Modify:**
- Client data schema
- Superbill generator function
- PDF generation logic
- UI components in `app.html`

---

### 3. 🐛 Client Portal Auth Code Fixes (High Priority)
**Issue:** Auth code storage, validation, and user experience needs improvement.

**Tasks:**
- [ ] Debug auth code storage/validation issues
- [ ] Add code expiration (30 days)
- [ ] Improve error messages for invalid/expired codes
- [ ] Add admin testing view with Copy/Resend buttons
- [ ] Test full auth code flow

**Files to Modify:**
- `api/assigned-docs.js`
- Client portal access logic
- Admin document assignment interface

---

### 4. 📝 TODO Comments in Code (Low Priority)
**Issue:** There are unresolved TODO comments in the codebase.

**Locations:**
- `app.html:3727` - Stripe integration fields for invoice display
- `app.html:4319` - Stripe integration for appointment billing
- `app-working.html:2646` - Stripe integration fields
- `app-working.html:3086` - Stripe integration for appointments

**Note:** These may be intentionally commented out pending full Stripe integration.

---

## ✅ Previously Completed (October 2025)
- ✅ Appointments API merge conflicts
- ✅ Invoices API merge conflicts
- ✅ Calendar rendering and display
- ✅ Client document access with demo code (DEMO-123456)
- ✅ Client name propagation in documents and appointments

---

## 📊 Progress Tracking

| Issue | Priority | Status | Estimated Time |
|-------|----------|--------|----------------|
| Invoice Simplification | Medium | 🔴 Not Started | 2-3 hours |
| Superbill Generation | High | 🔴 Not Started | 4-6 hours |
| Auth Code Fixes | High | 🔴 Not Started | 2-3 hours |
| TODO Comments | Low | 🔴 Not Started | 1 hour |

---

## 🚀 Next Actions

1. **Start with Auth Code Fixes** (quickest win, high impact)
2. **Implement Superbill Generation** (high priority for clients)
3. **Simplify Invoice Display** (improves UX)
4. **Review and clean up TODO comments** (code cleanup)

---

**Last Updated:** November 3, 2025
