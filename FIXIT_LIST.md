# 🔧 FIXIT LIST - ClinicalCanvas EHR

**Date Created:** November 3, 2025
**Status:** In Progress

---

## 🎯 Priority Issues to Fix

### 1. ✅ Invoice Simplification (Medium Priority) - COMPLETED
**Issue:** Invoice display format needs to be simplified and more user-friendly.

**Tasks:**
- [x] Update invoice display format to: `"90834 (Psychotherapy 45min) - $150.00"`
- [x] Simplify invoice view modal
- [x] Update email notifications to use new format
- [x] Test invoice generation and display

**Files Modified:**
- ✅ `app.html` - Updated viewInvoice() modal, email templates (HTML & text)

**Completed:** November 3, 2025
**Commit:** 1e761e8

---

### 2. ✅ Superbill Generation (High Priority) - COMPLETED
**Issue:** Clients need the ability to generate superbills for insurance reimbursement.

**Tasks:**
- [x] Add `superbill_monthly` preference field to client records
- [x] Add superbill checkbox to intake forms
- [x] Create superbill generator function with insurance info
- [x] Add "Generate Superbill" button to client chart Invoices tab
- [x] Design professional superbill template
- [x] Test superbill generation

**Files Modified:**
- ✅ `app.html` - Enhanced generateSuperbill() and createSuperbill() functions

**Features Implemented:**
- Provider info with NPI, Tax ID, License Number
- Automatic modifiers (95 for telehealth)
- Place of Service codes (11=Office, 02=Telehealth)
- ICD-10 diagnosis code section with examples
- Insurance reimbursement instructions
- Reference guide for codes and modifiers
- Professional print-ready formatting

**Completed:** November 3, 2025
**Commit:** e63deed

---

### 3. ✅ Client Portal Auth Code Fixes (High Priority) - COMPLETED
**Issue:** Auth code storage, validation, and user experience needs improvement.

**Tasks:**
- [x] Debug auth code storage/validation issues
- [x] Add code expiration (30 days)
- [x] Improve error messages for invalid/expired codes
- [x] Add admin testing view with Copy/Resend buttons
- [x] Test full auth code flow

**Files Modified:**
- ✅ `api/assigned-docs.js` - Fixed field names, added expiration validation
- ✅ `app.html` - Added Copy/Resend buttons, expiration display

**Completed:** November 3, 2025
**Commit:** c970a32

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

| Issue | Priority | Status | Time Spent |
|-------|----------|--------|------------|
| Invoice Simplification | Medium | ✅ **COMPLETED** | ~45 min |
| Superbill Generation | High | ✅ **COMPLETED** | ~1 hour |
| Auth Code Fixes | High | ✅ **COMPLETED** | ~1.5 hours |
| TODO Comments | Low | 🔴 Not Started | - |

---

## 🚀 Next Actions

1. ~~**Start with Auth Code Fixes**~~ ✅ **COMPLETED**
2. ~~**Simplify Invoice Display**~~ ✅ **COMPLETED**
3. ~~**Implement Superbill Generation**~~ ✅ **COMPLETED**
4. **Review and clean up TODO comments** (code cleanup) - NEXT

---

**Last Updated:** November 3, 2025
**Status:** 3 of 4 issues completed (75%)
