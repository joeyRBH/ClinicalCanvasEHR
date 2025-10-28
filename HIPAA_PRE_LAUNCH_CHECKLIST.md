# HIPAA Pre-Launch Compliance Checklist

**Project**: ClinicalCanvasEHR
**Date Created**: 2025-10-28
**Target Launch Date**: _TBD_
**Last Updated**: 2025-10-28

---

## Executive Summary

ClinicalCanvasEHR is currently in **DEMO MODE** with no production database. This checklist tracks all HIPAA compliance requirements that must be completed before going live with Protected Health Information (PHI).

**Overall Status**: 🟡 In Progress (2/10 completed)

---

## 1. DATABASE LAYER

### Current Status: 🔴 Not Started

**Objective**: Migrate to HIPAA-compliant PostgreSQL database with proper encryption and BAA coverage.

| Task | Status | Priority | Notes |
|------|--------|----------|-------|
| Research HIPAA-compliant database providers | 🟡 In Progress | HIGH | Crunchy Bridge, AWS RDS, Azure Database recommended |
| Sign BAA with database provider | ⬜ Not Started | CRITICAL | Required before storing any PHI |
| Set up database instance | ⬜ Not Started | HIGH | - |
| Configure encryption at rest (AES-256) | ⬜ Not Started | CRITICAL | Must be enabled at provider level |
| Configure encryption in transit (TLS 1.2+) | ⬜ Not Started | CRITICAL | Enforce `sslmode=require` in connection string |
| Set up automated daily backups | ⬜ Not Started | HIGH | Retain for 6 years per HIPAA |
| Configure backup encryption | ⬜ Not Started | CRITICAL | Backups must also be encrypted |
| Set up point-in-time recovery (PITR) | ⬜ Not Started | MEDIUM | Recommended for disaster recovery |
| Document database architecture | ⬜ Not Started | MEDIUM | For audits and compliance reviews |
| Create database connection utility | ⬜ Not Started | HIGH | `api/utils/database-connection.js` |
| Run database schema creation scripts | ⬜ Not Started | HIGH | Tables for clients, appointments, audit logs, etc. |
| Test database connectivity | ⬜ Not Started | HIGH | Verify from Vercel environment |
| Add DATABASE_URL to Vercel env vars | ⬜ Not Started | HIGH | Format: `postgresql://user:pass@host:port/db?sslmode=require` |

### Database Provider Comparison

#### Option 1: Crunchy Bridge (Recommended)
- **Cost**: $9-50/month
- **HIPAA**: ✅ BAA available
- **Encryption**: ✅ At rest and in transit
- **Backups**: ✅ Automated, encrypted
- **Pros**: Specialized in PostgreSQL, HIPAA-ready
- **Cons**: Smaller provider, less brand recognition

#### Option 2: AWS RDS for PostgreSQL
- **Cost**: ~$15-100/month
- **HIPAA**: ✅ BAA available (covered under AWS BAA)
- **Encryption**: ✅ At rest and in transit
- **Backups**: ✅ Automated, encrypted, 35-day retention
- **Pros**: Enterprise-grade, extensive compliance certifications
- **Cons**: More complex setup, higher cost

#### Option 3: Azure Database for PostgreSQL
- **Cost**: ~$20-80/month
- **HIPAA**: ✅ BAA available (covered under Azure BAA)
- **Encryption**: ✅ At rest and in transit
- **Backups**: ✅ Automated, encrypted
- **Pros**: Microsoft ecosystem, compliance focus
- **Cons**: More expensive than Crunchy Bridge

#### Option 4: Neon (Previous Choice)
- **Cost**: $19-69/month (with HIPAA)
- **HIPAA**: ⚠️ BAA available only on Business plan ($69+/month)
- **Encryption**: ✅ At rest and in transit
- **Backups**: ✅ Automated
- **Pros**: Serverless, scales to zero
- **Cons**: More expensive for HIPAA compliance

**Recommendation**: **Crunchy Bridge** for best value with built-in HIPAA compliance.

---

## 2. HOSTING LAYER (VERCEL)

### Current Status: 🟡 In Progress (Deployed but BAA not signed)

**Objective**: Ensure Vercel Pro plan BAA is signed and document that no PHI is stored on Vercel infrastructure.

| Task | Status | Priority | Notes |
|------|--------|----------|-------|
| Verify Vercel Pro plan active | ⬜ Not Started | CRITICAL | Only Pro/Enterprise plans can sign BAA |
| Contact Vercel to request BAA | ⬜ Not Started | CRITICAL | support@vercel.com or dashboard |
| Sign BAA with Vercel | ⬜ Not Started | CRITICAL | Required before production launch |
| Document data flow architecture | ⬜ Not Started | HIGH | Show PHI only in database/Backblaze |
| Create "No PHI on Vercel" attestation | ⬜ Not Started | MEDIUM | For compliance audits |
| Configure HTTPS-only (forced) | ✅ Complete | CRITICAL | Automatically enforced by Vercel |
| Set up custom domain with SSL | ✅ Complete | HIGH | clinicalcanvas.app configured |
| Enable Vercel security headers | ⬜ Not Started | MEDIUM | CSP, HSTS, X-Frame-Options |
| Configure rate limiting | ⬜ Not Started | MEDIUM | Prevent brute force attacks |
| Set up logging and monitoring | ⬜ Not Started | MEDIUM | Track errors without exposing PHI |

### Vercel BAA Process

1. **Confirm Plan**:
   - Go to Vercel Dashboard → Settings → Billing
   - Ensure "Pro" or "Enterprise" plan is active
   - Free/Hobby plans cannot sign BAAs

2. **Request BAA**:
   - Email: support@vercel.com
   - Subject: "Request for HIPAA Business Associate Agreement"
   - Include: Project name, account email, intended use case

3. **Sign BAA**:
   - Vercel will send DocuSign or similar
   - Review terms carefully (subcontractor provisions, breach notification)
   - Keep signed copy in compliance folder

4. **Document Architecture**:
   - Create diagram showing:
     - Vercel = Compute + UI (no PHI storage)
     - Database = PHI storage
     - Backblaze = Document storage (PHI)
   - Clarify that Vercel only processes PHI in memory during requests

---

## 3. FILE STORAGE (BACKBLAZE B2)

### Current Status: ✅ Complete

**Objective**: Ensure Backblaze B2 is properly configured for HIPAA-compliant document storage.

| Task | Status | Priority | Notes |
|------|--------|----------|-------|
| Set up Backblaze B2 account | ✅ Complete | HIGH | Account active |
| Sign BAA with Backblaze | ✅ Complete | CRITICAL | Signed on 2025-01-20 |
| Configure encryption at rest | ✅ Complete | CRITICAL | Server-side encryption enabled |
| Configure encryption in transit | ✅ Complete | CRITICAL | TLS enforced |
| Create private bucket for PHI documents | ⬜ Not Started | HIGH | Verify bucket is NOT public |
| Test file upload/download | ⬜ Not Started | HIGH | From Vercel environment |
| Document retention policy | ⬜ Not Started | MEDIUM | HIPAA requires 6-year retention |
| Set up lifecycle rules for old files | ⬜ Not Started | LOW | Optional: archive after X years |

**Status**: Backblaze configuration is largely complete. Verify bucket privacy settings before launch.

---

## 4. THIRD-PARTY SERVICES

### Current Status: 🟡 In Progress

**Objective**: Sign BAAs with all third-party services that handle PHI.

| Service | Purpose | BAA Required? | Status | Priority |
|---------|---------|---------------|--------|----------|
| Backblaze | Document Storage | ✅ Yes | ✅ Signed | CRITICAL |
| Vercel | Hosting | ✅ Yes | ⬜ Not Signed | CRITICAL |
| Database Provider | PHI Storage | ✅ Yes | ⬜ Not Selected | CRITICAL |
| SendGrid | Email Notifications | ⚠️ Maybe | ⬜ Not Assessed | HIGH |
| Twilio | SMS Notifications | ⚠️ Maybe | ⬜ Pending | MEDIUM |
| Stripe | Payments | ❌ No | ✅ N/A | N/A |

### Notes on Third-Party BAAs:

**SendGrid**:
- BAA required if sending PHI in emails (e.g., appointment reminders with details)
- **Recommendation**: Use generic messages without PHI (e.g., "You have a new appointment. Login to view details.")
- If PHI-free notifications: No BAA required

**Twilio**:
- BAA required if SMS contains PHI
- **Recommendation**: Send PHI-free messages only
- Status: User mentioned "Twilio BAA pending" in HIPAA_COMPLIANCE.md

**Stripe**:
- Processes payments only (no PHI)
- PCI DSS compliant, but HIPAA BAA not needed

---

## 5. AUTHENTICATION & ACCESS CONTROLS

### Current Status: 🟡 In Progress

**Objective**: Ensure proper user authentication, session management, and role-based access control.

| Task | Status | Priority | Notes |
|------|--------|----------|-------|
| Implement secure password hashing | ✅ Complete | CRITICAL | bcrypt/argon2 recommended |
| Session timeout (30 minutes) | ✅ Complete | HIGH | Configurable in code |
| "Remember Me" secure tokens (30 days) | ✅ Complete | MEDIUM | Secure cookie storage |
| Role-based access control (RBAC) | ✅ Complete | HIGH | Admin, Clinician roles |
| Multi-factor authentication (MFA) | ⬜ Not Started | HIGH | Recommended for HIPAA |
| Password complexity requirements | ⬜ Not Started | MEDIUM | Min 8 chars, complexity rules |
| Account lockout after failed attempts | ✅ Complete | HIGH | Rate limiting implemented |
| Login audit logging | ✅ Complete | CRITICAL | All auth events tracked |

**Status**: Core authentication is implemented. Consider adding MFA before launch.

---

## 6. AUDIT LOGGING

### Current Status: ✅ Implemented (Needs Database)

**Objective**: Log all PHI access and modifications with 6-year retention.

| Task | Status | Priority | Notes |
|------|--------|----------|-------|
| Create audit_log table schema | ⬜ Not Started | CRITICAL | Must include timestamp, user, action, IP |
| Log all PHI read access | ✅ Implemented | CRITICAL | Code in place, needs database |
| Log all PHI modifications | ✅ Implemented | CRITICAL | Code in place, needs database |
| Log authentication events | ✅ Implemented | HIGH | Login, logout, failed attempts |
| Log administrative actions | ✅ Implemented | HIGH | User creation, role changes, etc. |
| Set up 6-year retention policy | ⬜ Not Started | CRITICAL | HIPAA requirement |
| Create audit log review process | ⬜ Not Started | MEDIUM | Who reviews logs and how often? |
| Test audit log completeness | ⬜ Not Started | HIGH | Verify all PHI access is logged |

**Status**: Logging code is in place. Once database is connected, verify logs are being written correctly.

---

## 7. DATA ENCRYPTION

### Current Status: 🟡 In Progress

**Objective**: Ensure all PHI is encrypted at rest and in transit.

| Task | Status | Priority | Notes |
|------|--------|----------|-------|
| Database encryption at rest (AES-256) | ⬜ Not Started | CRITICAL | Provider-level setting |
| Database encryption in transit (TLS 1.2+) | ⬜ Not Started | CRITICAL | Force `sslmode=require` |
| Backblaze encryption at rest | ✅ Complete | CRITICAL | Enabled |
| Backblaze encryption in transit (TLS) | ✅ Complete | CRITICAL | Enforced |
| HTTPS-only for all web traffic | ✅ Complete | CRITICAL | Vercel enforces |
| Secure environment variable storage | ✅ Complete | HIGH | Encrypted by Vercel |
| No hardcoded secrets in code | ✅ Complete | CRITICAL | Verified |
| Encryption key management | ⬜ Not Started | MEDIUM | Document key rotation process |

**Status**: Web and file storage encryption complete. Database encryption pending provider selection.

---

## 8. SECURITY POLICIES & DOCUMENTATION

### Current Status: 🟡 In Progress

**Objective**: Create and maintain required HIPAA security policies and documentation.

| Task | Status | Priority | Notes |
|------|--------|----------|-------|
| Security policies document | ✅ Complete | HIGH | HIPAA_COMPLIANCE.md exists |
| Privacy policy (HIPAA Notice of Privacy Practices) | ⬜ Not Started | CRITICAL | Required for patients |
| Breach notification procedure | ⬜ Not Started | CRITICAL | Required by law |
| Incident response plan | ⬜ Not Started | HIGH | How to handle security incidents |
| Business Associate Agreements folder | ⬜ Not Started | HIGH | Store all signed BAAs |
| Risk assessment documentation | ⬜ Not Started | MEDIUM | Annual HIPAA requirement |
| Workforce training plan | ⬜ Not Started | MEDIUM | HIPAA training for all users |
| Disaster recovery plan | ⬜ Not Started | MEDIUM | Database backup/restore procedures |
| Terms of Service | ⬜ Not Started | HIGH | Legal protection |
| Data retention and destruction policy | ⬜ Not Started | MEDIUM | 6-year retention, then secure deletion |

**Status**: Technical security docs exist. Legal/policy documents need creation (consider legal review).

---

## 9. TESTING & VALIDATION

### Current Status: 🔴 Not Started

**Objective**: Thoroughly test all security and compliance features before launch.

| Task | Status | Priority | Notes |
|------|--------|----------|-------|
| Security penetration testing | ⬜ Not Started | HIGH | Professional testing recommended |
| HIPAA compliance audit | ⬜ Not Started | HIGH | Third-party audit recommended |
| Database backup/restore test | ⬜ Not Started | CRITICAL | Verify backups work |
| Disaster recovery drill | ⬜ Not Started | MEDIUM | Simulate database failure |
| Audit log verification | ⬜ Not Started | CRITICAL | Verify all PHI access is logged |
| Session timeout testing | ⬜ Not Started | MEDIUM | Verify 30-minute timeout works |
| Access control testing | ⬜ Not Started | HIGH | Verify RBAC works correctly |
| Encryption validation | ⬜ Not Started | CRITICAL | Verify data is encrypted at rest |
| Network security scan | ⬜ Not Started | MEDIUM | Scan for vulnerabilities |
| Load testing | ⬜ Not Started | LOW | Ensure performance under load |

**Status**: Testing phase comes after database setup is complete.

---

## 10. LEGAL & COMPLIANCE REVIEW

### Current Status: 🔴 Not Started

**Objective**: Obtain legal review and sign all necessary agreements.

| Task | Status | Priority | Notes |
|------|--------|----------|-------|
| Hire healthcare attorney | ⬜ Not Started | CRITICAL | Specializes in HIPAA |
| Review all BAAs | ⬜ Not Started | CRITICAL | Ensure terms are acceptable |
| Legal review of privacy policy | ⬜ Not Started | CRITICAL | Must comply with HIPAA |
| Legal review of terms of service | ⬜ Not Started | HIGH | Liability protection |
| Obtain professional liability insurance | ⬜ Not Started | HIGH | Cyber insurance recommended |
| Register as covered entity (if required) | ⬜ Not Started | MEDIUM | Depends on your role |
| State-specific healthcare regulations | ⬜ Not Started | HIGH | Varies by state |
| Compliance officer designation | ⬜ Not Started | MEDIUM | HIPAA requires designated officer |

**Status**: Legal review should begin in parallel with technical setup.

---

## LAUNCH BLOCKERS (Must Complete Before Go-Live)

These items are **CRITICAL** and must be completed before launching with real PHI:

1. ❌ **Database BAA signed** - Cannot store PHI without BAA
2. ❌ **Database encryption enabled** - At rest and in transit
3. ❌ **Vercel BAA signed** - Hosting provider must have BAA
4. ❌ **Database backups configured** - With 6-year retention
5. ❌ **Audit logging active** - All PHI access must be logged
6. ❌ **Privacy policy published** - Legal requirement
7. ❌ **Breach notification procedure** - Required by law
8. ❌ **Security testing completed** - Verify no vulnerabilities

---

## RECOMMENDED DATABASE: CRUNCHY BRIDGE

Based on your requirements, **Crunchy Bridge** is recommended for the following reasons:

### Why Crunchy Bridge?

1. **HIPAA-Ready**: BAA available on all plans
2. **Cost-Effective**: $9-50/month (vs. $69+ for Neon with HIPAA)
3. **PostgreSQL Expertise**: Managed by PostgreSQL experts
4. **Built-In Compliance**:
   - AES-256 encryption at rest (default)
   - TLS 1.2+ in transit (enforced)
   - Automated encrypted backups
   - Point-in-time recovery
   - Audit logging
5. **Easy Setup**: No complex configuration needed
6. **Performance**: SSD storage, connection pooling included

### Setup Steps for Crunchy Bridge:

1. **Sign Up**: https://www.crunchybridge.com/
2. **Create Cluster**:
   - Select plan: Start with "Hobby" ($9/month) for testing
   - Region: Choose closest to your users
   - PostgreSQL version: 15 or 16
3. **Enable Encryption**:
   - Encryption is enabled by default
   - Verify in cluster settings
4. **Configure Backups**:
   - Automated daily backups enabled by default
   - Configure retention: 6 years (2,190 days)
5. **Get Connection String**:
   - Format: `postgresql://user:password@host:5432/database?sslmode=require`
   - Add to Vercel environment variables as `DATABASE_URL`
6. **Sign BAA**:
   - Contact Crunchy Data support
   - Request HIPAA Business Associate Agreement
   - Sign and store in compliance folder
7. **Test Connection**:
   - Deploy a test function to Vercel
   - Verify database connectivity from Vercel edge network

---

## TIMELINE ESTIMATE

Assuming you work on this full-time, here's a realistic timeline:

| Phase | Duration | Tasks |
|-------|----------|-------|
| **Database Setup** | 1-2 days | Provider selection, setup, BAA signing |
| **Code Integration** | 2-3 days | Database connection, schema creation, testing |
| **Vercel BAA** | 3-7 days | Contact Vercel, sign BAA (depends on their response time) |
| **Documentation** | 3-5 days | Privacy policy, breach procedures, legal docs |
| **Testing** | 3-5 days | Security testing, backup testing, audit log verification |
| **Legal Review** | 5-10 days | Attorney review of policies and BAAs |
| **Final Validation** | 2-3 days | Complete checklist, resolve any blockers |

**Total Estimated Timeline**: **3-5 weeks**

**Critical Path**:
1. Database setup → Code integration → Testing
2. Vercel BAA (can run in parallel)
3. Legal review (can run in parallel)

---

## NEXT STEPS (PRIORITY ORDER)

### Immediate (This Week)

1. **Select Database Provider** (Recommend Crunchy Bridge)
2. **Set Up Database Instance**
3. **Sign Database BAA**
4. **Configure Encryption Settings**
5. **Get Connection String**
6. **Add DATABASE_URL to Vercel**

### Week 2

7. **Create Database Connection Utility** (`api/utils/database-connection.js`)
8. **Create Database Schema** (tables for clients, appointments, audit logs, etc.)
9. **Test Database Connectivity**
10. **Contact Vercel for BAA** (Pro plan required)
11. **Verify Audit Logging Works**

### Week 3

12. **Draft Privacy Policy** (consider legal review)
13. **Draft Breach Notification Procedure**
14. **Create Incident Response Plan**
15. **Security Testing** (penetration testing recommended)
16. **Backup/Restore Testing**

### Week 4-5

17. **Sign Vercel BAA**
18. **Legal Review of All Policies**
19. **Final Security Audit**
20. **Complete All Launch Blockers**
21. **Go-Live Decision**

---

## CONTACT INFORMATION FOR BAAs

| Provider | Contact Method | Notes |
|----------|---------------|-------|
| **Crunchy Bridge** | support@crunchydata.com | Request BAA after account creation |
| **Vercel** | support@vercel.com | Must have Pro plan active |
| **SendGrid** | Via dashboard → Legal | Only if sending PHI in emails |
| **Twilio** | Via dashboard → Compliance | Only if sending PHI in SMS |

---

## COST SUMMARY

### Monthly Recurring Costs:

| Service | Plan | Monthly Cost | Annual Cost |
|---------|------|--------------|-------------|
| **Database** (Crunchy Bridge) | Hobby/Standard | $9-50 | $108-600 |
| **Hosting** (Vercel) | Pro | $20 | $240 |
| **File Storage** (Backblaze) | Pay-as-you-go | $5-20 | $60-240 |
| **Email** (SendGrid) | Free/Essentials | $0-20 | $0-240 |
| **SMS** (Twilio) | Pay-as-you-go | $10-50 | $120-600 |

**Estimated Total**: $44-160/month ($528-1,920/year)

### One-Time Costs:

| Item | Cost |
|------|------|
| **Legal Review** (Healthcare Attorney) | $1,000-3,000 |
| **Professional Liability Insurance** | $500-2,000/year |
| **Security Penetration Testing** | $500-2,000 |
| **HIPAA Compliance Audit** (Optional) | $1,000-5,000 |

**Estimated One-Time**: $3,000-12,000

---

## SUPPORT & RESOURCES

### HIPAA Resources:
- **HHS HIPAA Portal**: https://www.hhs.gov/hipaa/index.html
- **HIPAA Security Rule**: https://www.hhs.gov/hipaa/for-professionals/security/index.html
- **Breach Notification Rule**: https://www.hhs.gov/hipaa/for-professionals/breach-notification/index.html

### Technical Resources:
- **Crunchy Bridge Docs**: https://docs.crunchybridge.com/
- **Vercel HIPAA**: https://vercel.com/docs/security/hipaa
- **Backblaze B2 Security**: https://www.backblaze.com/b2/docs/security.html

### Legal Resources:
- **Find Healthcare Attorney**: https://www.healthlawyers.org/
- **HIPAA Templates**: https://www.hhs.gov/hipaa/for-professionals/privacy/guidance/model-notices/index.html

---

## NOTES & DECISIONS LOG

| Date | Decision | Rationale |
|------|----------|-----------|
| 2025-10-28 | Recommend Crunchy Bridge over Neon | Better HIPAA pricing ($9 vs $69/month) |
| 2025-01-20 | Backblaze BAA signed | File storage provider secured |
| _TBD_ | Database provider selected | _Pending decision_ |
| _TBD_ | Vercel BAA signed | _Pending Pro plan confirmation_ |

---

## APPENDIX: FILE STRUCTURE

```
/home/user/ClinicalCanvasEHR/
├── HIPAA_PRE_LAUNCH_CHECKLIST.md       (this file)
├── HIPAA_COMPLIANCE.md                  (technical security documentation)
├── api/
│   ├── utils/
│   │   ├── database-connection.js       (TODO: create this file)
│   │   ├── backblaze.js                 (✅ complete)
│   │   └── notifications.js             (✅ complete)
│   ├── clients.js                       (waiting for database)
│   ├── appointments.js                  (waiting for database)
│   └── ... (21 API endpoints)
└── compliance/                           (TODO: create this folder)
    ├── BAAs/
    │   ├── Backblaze_BAA_2025-01-20.pdf
    │   ├── Vercel_BAA.pdf               (TODO)
    │   └── CrunczyBridge_BAA.pdf        (TODO)
    ├── policies/
    │   ├── privacy_policy.pdf           (TODO)
    │   ├── breach_notification.pdf      (TODO)
    │   └── incident_response_plan.pdf   (TODO)
    └── audits/
        └── security_audit_2025.pdf      (TODO)
```

---

**Last Updated**: 2025-10-28
**Next Review**: After database provider selection
**Status**: 🟡 In Progress (2/10 major categories complete)
