# Production Testing Checklist for Sessionably

## Pre-Production Testing Status

Last Updated: 2025-11-16

---

## Environment Variables

### Required Environment Variables

- [ ] `DATABASE_URL` - PostgreSQL connection string
- [ ] `STRIPE_SECRET_KEY` - Stripe API key (live or test)
- [ ] `STRIPE_WEBHOOK_SECRET` - Stripe webhook signing secret
- [ ] `ANTHROPIC_API_KEY` - Claude AI API key for NoteTaker
- [ ] `APP_URL` - Application URL for CORS and links

### Optional Environment Variables

- [ ] `AWS_SES_ACCESS_KEY_ID` - Email sending (AWS SES)
- [ ] `AWS_SES_SECRET_ACCESS_KEY` - Email secret key
- [ ] `AWS_SES_REGION` - AWS SES region (default: us-east-1)
- [ ] `AWS_SNS_ACCESS_KEY_ID` - SMS sending (AWS SNS)
- [ ] `AWS_SNS_SECRET_ACCESS_KEY` - SMS secret key
- [ ] `AWS_SNS_REGION` - AWS SNS region (default: us-east-1)
- [ ] `NODE_ENV` - Set to 'production' for production

---

## Database Testing

### Schema & Tables

- [ ] Run `/api/setup-database` to create all tables
- [ ] Verify `subscription_addons` table exists (for AI NoteTaker)
- [ ] Run `/api/migrations/add-subscription-addons-table` for addon support
- [ ] Test database connection: `/api/health`
- [ ] Verify all indexes are created
- [ ] Check foreign key constraints are working

### Data Integrity

- [ ] Test client creation, update, delete
- [ ] Test appointment CRUD operations
- [ ] Test invoice generation and payment tracking
- [ ] Test document upload and assignment
- [ ] Test clinical notes creation and signing
- [ ] Test audit log tracking

---

## Third-Party Services Testing

### 1. Stripe Payment Integration

#### Setup
- [ ] Stripe account connected
- [ ] Webhook endpoint configured: `/api/webhooks/stripe-subscription`
- [ ] Products created in Stripe:
  - [ ] Base EHR Subscription ($50/month)
  - [ ] AI NoteTaker Add-On ($20/month)
- [ ] Price IDs updated in code

#### Testing
- [ ] Test payment intent creation (`/api/create-payment-intent`)
- [ ] Test subscription creation (`/api/create-subscription`)
- [ ] Test payment method storage (`/api/payment-methods`)
- [ ] Test autopay functionality (`/api/autopay`)
- [ ] Test refunds (`/api/refunds`)
- [ ] Test webhook event handling (use Stripe CLI)
- [ ] Verify subscription status updates from webhooks

#### Test Cards (Stripe Test Mode)
```
Success: 4242 4242 4242 4242
Declined: 4000 0000 0000 0002
Requires Auth: 4000 0025 0000 3155
```

### 2. AI NoteTaker (Anthropic Claude)

#### Setup
- [ ] Anthropic API key configured
- [ ] Database migration for `subscription_addons` complete
- [ ] Subscription verification enabled on API endpoints

#### Testing
- [ ] Test AI note generation without subscription (should fail with 403)
- [ ] Create test subscription in database
- [ ] Test AI note generation with active subscription (should succeed)
- [ ] Test all note formats: SOAP, DAP, Progress, Psychotherapy, Intake, Discharge
- [ ] Test note saving to database
- [ ] Test note signing and locking
- [ ] Test audit trail for clinical notes
- [ ] Verify HIPAA compliance (encryption, access controls, audit logs)

#### Test Endpoints
```bash
# Check subscription status
GET /api/subscription-addons?user_id=1&addon_type=ai_notetaker

# Generate note (requires subscription)
POST /api/ai-generate-note
{
  "user_id": 1,
  "transcript": "Test session transcript...",
  "noteFormat": "soap",
  "clientName": "Test Client",
  "sessionType": "individual"
}

# List clinical notes
GET /api/clinical-notes?client_id=1
```

### 3. Email Service (AWS SES)

#### Setup
- [ ] AWS SES credentials configured
- [ ] Sender email verified in AWS SES
- [ ] Recipient emails verified (if in sandbox mode)
- [ ] Production access requested (if going to production)

#### Testing
- [ ] Test welcome email sending
- [ ] Test invoice email sending
- [ ] Test appointment reminder emails
- [ ] Test document assignment notifications
- [ ] Test password reset emails (client portal)
- [ ] Verify email formatting and branding
- [ ] Check spam score and deliverability

#### Test Endpoint
```bash
POST /api/send-email
{
  "to": "test@example.com",
  "subject": "Test Email",
  "body": "This is a test email."
}
```

### 4. SMS Service (AWS SNS)

#### Setup
- [ ] AWS SNS credentials configured
- [ ] SMS spending limit set in AWS account
- [ ] Test phone numbers verified (if in sandbox)

#### Testing
- [ ] Test appointment reminder SMS
- [ ] Test payment confirmation SMS
- [ ] Test document notification SMS
- [ ] Verify SMS delivery and formatting
- [ ] Check SMS costs and limits

#### Test Endpoint
```bash
POST /api/send-sms
{
  "to": "+1234567890",
  "message": "Test SMS from Sessionably"
}
```

### 5. Document Upload (File Storage)

#### Testing
- [ ] Test document upload (`/api/upload-document`)
- [ ] Test document retrieval (`/api/list-documents`)
- [ ] Test document assignment to clients
- [ ] Test document signing workflow
- [ ] Verify file size limits
- [ ] Check file type restrictions (PDF, DOCX, etc.)
- [ ] Test document deletion
- [ ] Verify file storage location and security

---

## Feature Testing

### Core EHR Features

#### Client Management
- [ ] Create new client
- [ ] Edit client information
- [ ] Search clients
- [ ] View client dashboard
- [ ] Delete client (cascade check)
- [ ] Test client portal access

#### Appointment Scheduling
- [ ] Create appointment
- [ ] Edit appointment
- [ ] Cancel appointment
- [ ] View calendar
- [ ] Filter appointments by status
- [ ] Test appointment reminders (email/SMS)

#### Invoicing & Billing
- [ ] Create invoice
- [ ] Add line items
- [ ] Process payment
- [ ] Generate payment link
- [ ] Test autopay
- [ ] Issue refund
- [ ] View payment history
- [ ] Export invoice as PDF

#### Document Management
- [ ] Upload document
- [ ] Assign document to client
- [ ] Client signs document (portal)
- [ ] Track document completion
- [ ] Bulk document assignment
- [ ] Download signed documents

### AI NoteTaker Features

- [ ] Record session (web audio API)
- [ ] Real-time transcription
- [ ] Generate clinical note (all formats)
- [ ] Edit generated note
- [ ] Save note to database
- [ ] Link note to appointment
- [ ] Sign and lock note
- [ ] View note history
- [ ] Export notes
- [ ] Subscription required enforcement

### Analytics & Reporting

- [ ] View dashboard statistics
- [ ] Revenue reports
- [ ] Appointment analytics
- [ ] Client demographics
- [ ] Document completion rates
- [ ] Export reports (CSV, PDF)

### Settings & Configuration

- [ ] Practice settings (name, contact)
- [ ] Notification preferences
- [ ] Payment method management
- [ ] User account settings
- [ ] Subscription management (addons)
- [ ] Audit log viewing

---

## Security Testing

### Authentication & Authorization

- [ ] Admin login works
- [ ] Client portal login works
- [ ] Password reset functionality
- [ ] Session timeout working
- [ ] Failed login attempt limits
- [ ] Secure password requirements

### HIPAA Compliance

- [ ] All PHI encrypted in transit (HTTPS)
- [ ] Database encryption at rest
- [ ] Audit logging for all PHI access
- [ ] User access controls working
- [ ] Document signing legally valid
- [ ] Secure file storage
- [ ] Data backup and recovery plan

### API Security

- [ ] CORS headers configured correctly
- [ ] No sensitive data in client-side code
- [ ] API rate limiting (if implemented)
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention
- [ ] XSS protection
- [ ] CSRF protection (if applicable)

---

## Performance Testing

### Page Load Times
- [ ] Dashboard loads < 2 seconds
- [ ] Client list loads < 2 seconds
- [ ] Appointment calendar responsive
- [ ] Document upload handles large files

### Database Performance
- [ ] Query response times acceptable
- [ ] Indexes properly utilized
- [ ] No N+1 query issues
- [ ] Connection pooling configured

### API Response Times
- [ ] API endpoints respond < 500ms (except AI generation)
- [ ] AI note generation completes < 30 seconds
- [ ] Webhook processing < 5 seconds

---

## Browser & Device Testing

### Browsers
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Mobile Chrome (Android)

### Screen Sizes
- [ ] Desktop (1920x1080)
- [ ] Laptop (1366x768)
- [ ] Tablet (768x1024)
- [ ] Mobile (375x667)

### Features
- [ ] Responsive design works
- [ ] Touch interactions (mobile)
- [ ] Audio recording (NoteTaker)
- [ ] File uploads
- [ ] PDF generation/viewing

---

## Error Handling & Edge Cases

### Network Issues
- [ ] Graceful degradation on slow connections
- [ ] Error messages are user-friendly
- [ ] Retry logic for failed requests
- [ ] Offline detection and messaging

### Data Validation
- [ ] Required field validation
- [ ] Email format validation
- [ ] Phone number validation
- [ ] Date range validation
- [ ] File size/type validation

### Edge Cases
- [ ] Empty states display correctly
- [ ] Large datasets paginated
- [ ] Concurrent user edits handled
- [ ] Timezone handling correct
- [ ] Special characters in input

---

## Deployment Checklist

### Pre-Deployment

- [ ] All tests passed
- [ ] Environment variables set in production
- [ ] Database migrated to production
- [ ] Stripe live mode enabled (if ready)
- [ ] AWS services in production mode
- [ ] SSL/TLS certificate installed
- [ ] Domain configured correctly
- [ ] CDN configured (if using)

### Post-Deployment

- [ ] Health check endpoint returns 200: `/api/health`
- [ ] Monitor error logs for issues
- [ ] Test critical user flows
- [ ] Verify webhooks working
- [ ] Check email/SMS delivery
- [ ] Monitor database performance
- [ ] Set up uptime monitoring
- [ ] Configure alerts for errors

---

## Production Monitoring

### Metrics to Track

- [ ] API response times
- [ ] Error rates
- [ ] Database query performance
- [ ] Payment success rates
- [ ] Email delivery rates
- [ ] SMS delivery rates
- [ ] AI NoteTaker usage
- [ ] Subscription conversion rates

### Alerting

- [ ] Error rate > 5%
- [ ] API response time > 2 seconds
- [ ] Database connection failures
- [ ] Payment processing failures
- [ ] Webhook delivery failures

---

## Known Issues / Future Improvements

### Current Limitations

- [ ] Document symbols removed from headers/modals (✓ Completed)
- [ ] AI NoteTaker prepared as paid addon (✓ Completed)
- [ ] Need to create actual Stripe products and get price IDs
- [ ] Need to configure AWS SES/SNS if not already done
- [ ] Consider adding usage limits for AI NoteTaker (e.g., 50 notes/month)

### Future Enhancements

- [ ] Two-factor authentication (2FA)
- [ ] Advanced analytics dashboards
- [ ] Mobile app (iOS/Android)
- [ ] Telemedicine integration
- [ ] Insurance claim filing
- [ ] Automated appointment scheduling
- [ ] Multi-practice support
- [ ] Role-based access control (staff levels)

---

## Support & Documentation

- [ ] User documentation complete
- [ ] API documentation available
- [ ] Setup guides written
- [ ] Troubleshooting guides created
- [ ] Support contact information set
- [ ] Feedback mechanism in place

---

## Sign-Off

- [ ] Developer testing complete
- [ ] Stakeholder review complete
- [ ] Security audit complete (if required)
- [ ] HIPAA compliance verified
- [ ] Legal review complete (terms, privacy policy)
- [ ] Ready for production deployment

**Tested by:** ________________
**Date:** ________________
**Approved by:** ________________
**Date:** ________________

---

## Quick Test Commands

```bash
# Test database connection
curl https://your-domain.com/api/health

# Test AI NoteTaker subscription
curl -X POST https://your-domain.com/api/subscription-addons \
  -H "Content-Type: application/json" \
  -d '{"user_id":1,"addon_type":"ai_notetaker","status":"active"}'

# Test Stripe webhook (use Stripe CLI)
stripe listen --forward-to localhost:3000/api/webhooks/stripe-subscription
stripe trigger customer.subscription.created

# Test email sending
curl -X POST https://your-domain.com/api/send-email \
  -H "Content-Type: application/json" \
  -d '{"to":"test@example.com","subject":"Test","body":"Hello"}'
```

---

## Notes

- Always test in a staging environment before production
- Keep this checklist updated as features are added
- Document any issues found during testing
- Maintain separate test data from production data
- Regularly backup production database
