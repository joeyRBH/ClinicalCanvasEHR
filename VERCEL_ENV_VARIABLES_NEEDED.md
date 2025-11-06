# Vercel Environment Variables - AWS SES/SNS Integration

**Instructions:** Add these environment variables to your Vercel project.
**Location:** Vercel Dashboard → Your Project → Settings → Environment Variables

---

## 🔑 Required Environment Variables

### AWS SES (Email Service)

```
Variable Name: AWS_SES_ACCESS_KEY_ID
Value: [Your AWS IAM Access Key ID - starts with AKIA]
Environment: Production, Preview, Development (select all)
```

```
Variable Name: AWS_SES_SECRET_ACCESS_KEY
Value: [Your AWS IAM Secret Access Key - long string]
Environment: Production, Preview, Development (select all)
```

```
Variable Name: AWS_SES_REGION
Value: us-east-1
Environment: Production, Preview, Development (select all)
```

```
Variable Name: AWS_SES_FROM_EMAIL
Value: noreply@clinicalcanvas.app
Environment: Production, Preview, Development (select all)
```

```
Variable Name: AWS_SES_FROM_NAME
Value: ClinicalCanvas EHR
Environment: Production, Preview, Development (select all)
```

---

### AWS SNS (SMS Service)

```
Variable Name: AWS_SNS_ACCESS_KEY_ID
Value: [Your AWS IAM Access Key ID - starts with AKIA - can be same as SES]
Environment: Production, Preview, Development (select all)
```

```
Variable Name: AWS_SNS_SECRET_ACCESS_KEY
Value: [Your AWS IAM Secret Access Key - long string - can be same as SES]
Environment: Production, Preview, Development (select all)
```

```
Variable Name: AWS_SNS_REGION
Value: us-east-1
Environment: Production, Preview, Development (select all)
```

---

## 📋 Quick Copy Format (for notes)

```bash
# AWS SES Configuration
AWS_SES_ACCESS_KEY_ID=AKIA...
AWS_SES_SECRET_ACCESS_KEY=...
AWS_SES_REGION=us-east-1
AWS_SES_FROM_EMAIL=noreply@clinicalcanvas.app
AWS_SES_FROM_NAME=ClinicalCanvas EHR

# AWS SNS Configuration
AWS_SNS_ACCESS_KEY_ID=AKIA...
AWS_SNS_SECRET_ACCESS_KEY=...
AWS_SNS_REGION=us-east-1
```

---

## ⚠️ Important Notes

1. **AWS Credentials Required:**
   - If you don't have AWS credentials yet, you need to:
     - Create AWS account (or use existing)
     - Set up AWS SES (verify email, request production access)
     - Set up AWS SNS (configure SMS settings)
     - Create IAM user with SES and SNS permissions
     - Generate Access Key ID and Secret Access Key
   - Follow the full guide in `AWS_SETUP.md`

2. **Same Credentials:**
   - You can use the SAME Access Key ID and Secret Access Key for both SES and SNS
   - Just create one IAM user with both SES and SNS permissions

3. **Region:**
   - Use `us-east-1` for both services (recommended for lowest latency)
   - Make sure both SES and SNS are in the same region

4. **From Email:**
   - Must be a verified email/domain in AWS SES
   - Use `noreply@clinicalcanvas.app` (or your domain)
   - Email must be verified in AWS SES Console before sending

5. **After Adding:**
   - Redeploy your Vercel application
   - Test using `/api/health` endpoint
   - Test using `/api/test-notifications-aws` endpoint

---

## 🧪 Testing After Setup

### Check Configuration Status:
```
GET https://clinicalcanvas.vercel.app/api/health
```

Should return:
```json
{
  "services": {
    "email": true,
    "email_provider": "AWS SES",
    "sms": true,
    "sms_provider": "AWS SNS"
  }
}
```

### Test Email:
```bash
curl -X POST https://clinicalcanvas.vercel.app/api/test-notifications-aws \
  -H "Content-Type: application/json" \
  -d '{
    "testType": "email",
    "email": "your-email@example.com"
  }'
```

### Test SMS:
```bash
curl -X POST https://clinicalcanvas.vercel.app/api/test-notifications-aws \
  -H "Content-Type: application/json" \
  -d '{
    "testType": "sms",
    "phone": "+15551234567"
  }'
```

---

## 🔍 How to Check What's Already in Vercel

1. Go to: https://vercel.com/dashboard
2. Select your project: `ClinicalCanvasEHR`
3. Go to: Settings → Environment Variables
4. Look for any variables starting with `AWS_SES_` or `AWS_SNS_`
5. Compare with the list above
6. Add any missing variables

---

## ❓ Don't Have AWS Credentials Yet?

If you need to set up AWS first, follow these steps:

1. **Read:** `AWS_SETUP.md` (lines 42-199) for complete setup guide
2. **Quick summary:**
   - Go to: https://console.aws.amazon.com/
   - Set up SES (verify email, request production access)
   - Set up SNS (configure SMS settings)
   - Create IAM user with permissions
   - Get Access Key ID and Secret Access Key
   - Come back and add to Vercel

---

**Last Updated:** 2025-11-06
**Branch:** claude/fix-aws-ses-sns-integration-011CUr4MHqpjKRV4Pp8VKL3Z
