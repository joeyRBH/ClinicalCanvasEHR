# Insurance Claims & Benefits Verification Feature

## Overview

ClinicalCanvas now includes a comprehensive insurance management system integrated with **Availity**, a leading healthcare clearinghouse that provides free claims submission and eligibility verification for thousands of insurance payers nationwide.

## Features

### 1. Benefits Verification (Eligibility Checks)
- Real-time insurance eligibility verification
- Check deductibles, co-pays, and co-insurance
- View coverage details and out-of-pocket maximums
- ASC X12N 270/271 HIPAA transactions

### 2. Claims Submission
- Electronic claims submission to insurance payers
- Support for all standard CPT codes
- ICD-10 diagnosis code tracking
- ASC X12N 837 professional claims format

### 3. Claim Status Tracking
- Real-time claim status inquiries
- Track pending, approved, and denied claims
- Resubmit denied claims
- View payment amounts and adjustment details
- ASC X12N 276/277 status transactions

## Getting Started

### Step 1: Configure Availity API Credentials

1. Sign up for a free Availity account at [https://www.availity.com](https://www.availity.com)
2. Register for API access at [https://developer.availity.com](https://developer.availity.com)
3. Obtain your Client ID and Client Secret

### Step 2: Set Environment Variables

Add the following to your environment variables (`.env` file or Vercel settings):

```bash
# Availity API Configuration
AVAILITY_CLIENT_ID=your_client_id_here
AVAILITY_CLIENT_SECRET=your_client_secret_here
AVAILITY_TEST_MODE=true  # Set to false for production

# Provider Information (required for claims submission)
PROVIDER_NPI=your_10_digit_npi
PROVIDER_TAXONOMY=your_taxonomy_code  # e.g., 103T00000X for Psychologist
```

### Step 3: Run Database Migration

Run the migration to create the insurance tables:

```bash
# Using the migration API endpoint
POST /api/migrations/add-insurance-tables
```

Or run the SQL directly:

```bash
psql $DATABASE_URL -f schema.sql
```

### Step 4: Configure Insurance Settings

1. Navigate to the **Insurance** tab in ClinicalCanvas
2. Click on the **Settings** sub-tab
3. Enter your Availity API credentials
4. Configure default claim settings:
   - Place of Service (default: 11 - Office)
   - Billing Provider NPI
   - Provider Taxonomy Code
5. Click "Save Settings"
6. Test the connection using the "Test Connection" button

## Usage Guide

### Verifying Insurance Benefits

1. Go to **Insurance** → **Verifications** tab
2. Click **"Verify Benefits"** button
3. Fill in the form:
   - Select Patient
   - Enter Insurance Member ID
   - Enter Payer/Insurance Company name
   - Select Service Type
4. Click **"Verify Benefits"**
5. View the eligibility results showing:
   - Coverage status
   - Deductible and amount met
   - Co-pay and co-insurance
   - Out-of-pocket maximum

### Submitting Insurance Claims

1. Go to **Insurance** → **Claims** tab
2. Click **"Submit Claim"** button
3. Fill in the claim details:
   - Select Patient
   - Enter Insurance Member ID
   - Enter Payer/Insurance Company
   - Select Service Date
   - Choose CPT Code
   - Enter ICD-10 Diagnosis Code
   - Enter Charge Amount
   - Select Place of Service
4. Click **"Submit Claim"**
5. The claim will be submitted to Availity and tracked in the system

### Tracking Claim Status

1. Go to **Insurance** → **Claims** tab
2. View all submitted claims with their current status
3. Filter by status: Pending, Submitted, Approved, Denied
4. Click **"View"** to see claim details
5. For denied claims, click **"Resubmit"** to resubmit the claim

## Availity Integration Details

### Free Essentials Plan Includes:
- Real-time eligibility checks (270/271 transactions)
- Electronic claims submission (837 transactions)
- Claim status inquiries (276/277 transactions)
- Support for major payers including:
  - Anthem
  - Blue Cross Blue Shield (BCBS)
  - Aetna
  - UnitedHealthcare
  - Cigna
  - Humana
  - And 2000+ other payers

### Paid EDI Plan ($35/month):
- Access to 2000+ additional payers
- Enhanced reporting features
- Priority support

## Database Schema

### Tables Created:

#### `insurance_claims`
Stores all insurance claims with submission and status tracking.

#### `insurance_verifications`
Stores eligibility verification results.

#### `insurance_settings`
Stores Availity API credentials and default claim settings.

## API Endpoints

### Claims API (`/api/insurance-claims`)
- `GET` - Retrieve claims (filter by client_id, status)
- `POST` - Submit a new claim
- `PUT` - Update claim status
- `DELETE` - Delete a claim

### Verification API (`/api/insurance-verification`)
- `GET` - Retrieve verifications (filter by client_id)
- `POST` - Submit verification request
- `POST /test-connection` - Test Availity API connection

## Testing

### Test Mode
When `AVAILITY_TEST_MODE=true`, the system uses mock data instead of making actual API calls. This is useful for:
- Development and testing
- Demo purposes
- When API credentials are not yet configured

### Production Mode
Set `AVAILITY_TEST_MODE=false` to enable real API calls to Availity.

## Common CPT Codes for Behavioral Health

- **90791** - Psychiatric Diagnostic Evaluation
- **90834** - Psychotherapy 45 minutes
- **90837** - Psychotherapy 60 minutes
- **90847** - Family Psychotherapy
- **90853** - Group Psychotherapy

## Common ICD-10 Codes

- **F41.1** - Generalized Anxiety Disorder
- **F32.9** - Major Depressive Disorder, Single Episode
- **F33.1** - Major Depressive Disorder, Recurrent
- **F43.10** - Post-Traumatic Stress Disorder
- **F90.2** - ADHD, Combined Type

## Place of Service Codes

- **11** - Office
- **02** - Telehealth
- **12** - Home
- **22** - On Campus-Outpatient Hospital
- **99** - Other Place of Service

## Troubleshooting

### Connection Test Fails
- Verify your Availity Client ID and Secret are correct
- Check that AVAILITY_TEST_MODE is set appropriately
- Ensure your Availity account is active and approved for API access

### Claim Submission Fails
- Verify all required fields are filled
- Check that Provider NPI and Taxonomy codes are configured
- Ensure the payer ID is valid in Availity's network
- Review diagnosis and procedure codes for accuracy

### Benefits Verification Returns No Data
- Verify patient insurance member ID is correct
- Check that the payer name matches Availity's database
- Ensure the patient's coverage is active
- Try different service type codes

## Support

For technical issues with the ClinicalCanvas integration:
- Review this guide
- Check the browser console for error messages
- Review server logs for API errors

For Availity-specific questions:
- Visit [https://developer.availity.com](https://developer.availity.com)
- Contact Availity support at [https://www.availity.com/support](https://www.availity.com/support)

## Security & Compliance

- All API communications use HTTPS/TLS encryption
- Availity credentials are stored securely as environment variables
- All transactions follow HIPAA X12N standards
- Audit logs track all insurance-related activities
- Patient data is encrypted at rest and in transit

## Future Enhancements

Planned features for future releases:
- Prior authorization management
- Electronic remittance advice (ERA) processing
- Automated claim status updates
- Batch claims submission
- Advanced reporting and analytics
- Integration with accounting systems
- Automated eligibility checks before appointments
