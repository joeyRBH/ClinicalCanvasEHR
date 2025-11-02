# ClinicalCanvas EHR - Fix-It List
**Pre-Market Launch Critical Issues**

Last Updated: 2025-11-02

---

## 🔴 CRITICAL - Blocking Market Launch

### 1. Client Portal - Documents Not Populating
**Status:** Open
**Priority:** P0 - Critical
**Assigned:** Pending
**Created:** 2025-11-02

**Issue:**
- When clinicians assign documents to clients and provide auth codes
- Clients enter valid auth codes in the client portal
- Documents do not populate/display on the client portal side
- This completely blocks the client document workflow

**Expected Behavior:**
- Client enters valid auth code (format: XXXX-XXXXXXXX)
- Client portal should display assigned documents with form fields
- Client should be able to fill out and submit documents

**Actual Behavior:**
- Auth code is accepted
- Portal shows but no documents appear OR shows "Empty Document Template" error
- Forms do not render

**Technical Context:**
- Notification Settings tab was successfully added and works
- Issue appears to be with template/document data structure
- Multiple fix attempts made (template fields, migration logic, template IDs)
- Last known working branch: `claude/update-platform-fonts-011CUgW4czWQXEyqn92idmwL`

**Related Files:**
- `app.html` - Client portal rendering functions
- Functions: `renderClientDocuments()`, `loadTemplates()`, `saveAssignDoc()`

**Next Steps:**
- [ ] Debug localStorage state when documents are assigned
- [ ] Verify template structure matches what renderClientDocuments expects
- [ ] Test with fresh localStorage (clear cache)
- [ ] Add comprehensive logging to document assignment flow

---

## 🟡 HIGH PRIORITY - Should Fix Before Launch

*(No items yet)*

---

## 🟢 MEDIUM PRIORITY - Nice to Have

*(No items yet)*

---

## 📝 ENHANCEMENT REQUESTS

*(No items yet)*

---

## ✅ COMPLETED FIXES

### Client Portal Notification Settings Tab
**Completed:** 2025-11-02
**Status:** ✅ Working

- Added tabbed interface to client portal
- Created notification preferences section
- Tabs switch properly between Documents and Settings
- Settings persist to localStorage per client

---

## Notes for Development

**Before Adding New Features:**
1. Always test client portal document workflow
2. Verify auth code generation and validation
3. Check localStorage structure consistency
4. Test with both new and existing clients

**Testing Checklist:**
- [ ] Create new client
- [ ] Assign document to client
- [ ] Copy auth code
- [ ] Enter auth code in client portal
- [ ] Verify document displays with all fields
- [ ] Test document submission
- [ ] Verify clinician can review submitted document

---

## Version Control References

**Branches:**
- Working Portal: `claude/update-platform-fonts-011CUgW4czWQXEyqn92idmwL`
- Current: `claude/fix-clinical-document-formatting-011CUiBeqhjrTFqeZW81S4Fk`

**Key Commits:**
- `f7d7625` - Restore working client portal and merge notification settings tab
- `b743e8e` - CRITICAL FIX: Add template migration to ensure all templates have fields
- `1481c1b` - Fix clinical documents not populating in client portal
- `c989c76` - Add notification settings tab to client portal
