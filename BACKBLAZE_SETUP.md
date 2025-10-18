# 🗄️ Backblaze B2 Setup Guide for ClinicalCanvas

**HIPAA-Compliant Document Storage**

---

## 📋 Overview

Backblaze B2 provides serverless cloud storage that's:
- ✅ **HIPAA-Compliant** (with BAA)
- ✅ **S3-Compatible** (easy integration)
- ✅ **Cost-Effective** (~$5/TB/month)
- ✅ **Fast** (no egress fees for first 1GB/day)
- ✅ **Secure** (128-bit encryption, private keys available)

---

## 🚀 Quick Setup (5 Minutes)

### Step 1: Create Backblaze Account

1. Go to [backblaze.com](https://www.backblaze.com)
2. Click **"Sign Up"**
3. Enter your email and create a password
4. Verify your email address

### Step 2: Create B2 Bucket

1. Log in to Backblaze
2. Go to **"B2 Cloud Storage"**
3. Click **"Create a Bucket"**
4. Configure:
   - **Bucket Name**: `clinicalcanvas-documents`
   - **Files in Bucket are**: `Private`
   - **Default Encryption**: `Enabled`
   - **Object Lock**: `Disabled` (unless needed)
5. Click **"Create a Bucket"**

### Step 3: Get Application Keys

1. In B2 Cloud Storage, go to **"App Keys"**
2. Click **"Add a New Application Key"**
3. Configure:
   - **Name**: `ClinicalCanvas Production`
   - **Allow access to Bucket(s)**: Select `clinicalcanvas-documents`
   - **Capabilities**: 
     - ✅ `listBuckets`
     - ✅ `listFiles`
     - ✅ `readFiles`
     - ✅ `shareFiles`
     - ✅ `writeFiles`
     - ✅ `deleteFiles`
4. Click **"Create New Key"**
5. **IMPORTANT**: Copy both values immediately:
   - `keyID` (Application Key ID)
   - `applicationKey` (Application Key)

### Step 4: Request BAA for HIPAA Compliance

1. Go to [backblaze.com/contact](https://www.backblaze.com/contact.htm)
2. Select **"Sales"** or **"Support"**
3. Request a **Business Associate Agreement (BAA)** for HIPAA compliance
4. Mention you're using B2 Cloud Storage for healthcare data
5. Wait for BAA to be sent (usually 1-3 business days)

---

## 🔧 Integration with ClinicalCanvas

### Environment Variables

Add these to your Vercel project:

```bash
# Backblaze B2 Configuration
B2_APPLICATION_KEY_ID=your_key_id_here
B2_APPLICATION_KEY=your_application_key_here
B2_BUCKET_NAME=clinicalcanvas-documents
B2_ENDPOINT=https://s3.us-west-002.backblazeb2.com
B2_REGION=us-west-002
```

**To add to Vercel:**
1. Go to your project on [vercel.com](https://vercel.com)
2. Click **Settings** → **Environment Variables**
3. Add each variable above
4. Select **Production**, **Preview**, and **Development**
5. Click **Save**

---

## 💻 Code Integration

### Install AWS SDK

The AWS SDK is already configured in `package.json`. It's compatible with Backblaze B2's S3-compatible API.

### Example: Upload Document

```javascript
// api/upload-document.js
const AWS = require('aws-sdk');

const s3 = new AWS.S3({
  endpoint: process.env.B2_ENDPOINT,
  accessKeyId: process.env.B2_APPLICATION_KEY_ID,
  secretAccessKey: process.env.B2_APPLICATION_KEY,
  region: process.env.B2_REGION,
  s3ForcePathStyle: true
});

module.exports = async (req, res) => {
  try {
    const { clientId, documentId, fileName, fileData } = req.body;
    
    // Generate unique key
    const key = `documents/${clientId}/${documentId}/${fileName}`;
    
    // Upload to Backblaze B2
    const uploadResult = await s3.upload({
      Bucket: process.env.B2_BUCKET_NAME,
      Key: key,
      Body: Buffer.from(fileData, 'base64'),
      ContentType: 'application/pdf',
      Metadata: {
        'client-id': clientId,
        'document-id': documentId,
        'upload-date': new Date().toISOString()
      }
    }).promise();
    
    res.status(200).json({
      success: true,
      url: uploadResult.Location,
      key: key
    });
    
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload document'
    });
  }
};
```

### Example: Download Document

```javascript
// api/download-document.js
const AWS = require('aws-sdk');

const s3 = new AWS.S3({
  endpoint: process.env.B2_ENDPOINT,
  accessKeyId: process.env.B2_APPLICATION_KEY_ID,
  secretAccessKey: process.env.B2_APPLICATION_KEY,
  region: process.env.B2_REGION,
  s3ForcePathStyle: true
});

module.exports = async (req, res) => {
  try {
    const { key } = req.query;
    
    // Download from Backblaze B2
    const file = await s3.getObject({
      Bucket: process.env.B2_BUCKET_NAME,
      Key: key
    }).promise();
    
    res.setHeader('Content-Type', file.ContentType);
    res.setHeader('Content-Disposition', `attachment; filename="${key.split('/').pop()}"`);
    res.send(file.Body);
    
  } catch (error) {
    console.error('Download error:', error);
    res.status(404).json({
      success: false,
      error: 'Document not found'
    });
  }
};
```

### Example: Delete Document

```javascript
// api/delete-document.js
const AWS = require('aws-sdk');

const s3 = new AWS.S3({
  endpoint: process.env.B2_ENDPOINT,
  accessKeyId: process.env.B2_APPLICATION_KEY_ID,
  secretAccessKey: process.env.B2_APPLICATION_KEY,
  region: process.env.B2_REGION,
  s3ForcePathStyle: true
});

module.exports = async (req, res) => {
  try {
    const { key } = req.body;
    
    // Delete from Backblaze B2
    await s3.deleteObject({
      Bucket: process.env.B2_BUCKET_NAME,
      Key: key
    }).promise();
    
    res.status(200).json({
      success: true,
      message: 'Document deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete document'
    });
  }
};
```

---

## 📊 Storage Structure

Recommended folder structure in Backblaze B2:

```
clinicalcanvas-documents/
├── documents/
│   ├── {clientId}/
│   │   ├── {documentId}/
│   │   │   ├── document.pdf
│   │   │   └── signature.png
│   │   └── ...
│   └── ...
├── recordings/
│   ├── {clientId}/
│   │   ├── {sessionId}/
│   │   │   └── audio.mp3
│   │   └── ...
│   └── ...
└── backups/
    ├── {date}/
    │   └── data.json
    └── ...
```

---

## 💰 Cost Estimate

### Small Practice (50-100 clients):

| Storage Type | Size | Cost/Month |
|-------------|------|------------|
| Documents | 50 GB | $0.25 |
| Recordings | 100 GB | $0.50 |
| Backups | 50 GB | $0.25 |
| **Total** | **200 GB** | **~$1.00** |

### Medium Practice (100-500 clients):

| Storage Type | Size | Cost/Month |
|-------------|------|------------|
| Documents | 200 GB | $1.00 |
| Recordings | 500 GB | $2.50 |
| Backups | 200 GB | $1.00 |
| **Total** | **900 GB** | **~$4.50** |

### Large Practice (500+ clients):

| Storage Type | Size | Cost/Month |
|-------------|------|------------|
| Documents | 500 GB | $2.50 |
| Recordings | 1 TB | $5.00 |
| Backups | 500 GB | $2.50 |
| **Total** | **2 TB** | **~$10.00** |

**Note**: First 1GB of downloads per day is FREE!

---

## 🔒 Security Best Practices

### 1. Enable Encryption

Backblaze B2 encrypts data at rest by default. For additional security:

- Use **private encryption keys** for sensitive data
- Store keys in Vercel environment variables
- Never commit keys to Git

### 2. Access Control

- Use **Application Keys** with limited permissions
- Create separate keys for different environments (dev, staging, prod)
- Rotate keys regularly

### 3. Audit Logging

- Enable **bucket logging** in Backblaze
- Track all upload, download, and delete operations
- Review logs regularly for HIPAA compliance

### 4. Backup Strategy

- Keep **multiple backups** of critical data
- Use **versioning** for important documents
- Test restore procedures regularly

---

## 🧪 Testing

### Test Upload

```bash
curl -X POST https://your-domain.vercel.app/api/upload-document \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "test-123",
    "documentId": "doc-456",
    "fileName": "test.pdf",
    "fileData": "base64_encoded_data_here"
  }'
```

### Test Download

```bash
curl "https://your-domain.vercel.app/api/download-document?key=documents/test-123/doc-456/test.pdf" \
  -o test-download.pdf
```

### Test Delete

```bash
curl -X POST https://your-domain.vercel.app/api/delete-document \
  -H "Content-Type: application/json" \
  -d '{
    "key": "documents/test-123/doc-456/test.pdf"
  }'
```

---

## 📞 Support

### Backblaze Support

- **Documentation**: [backblaze.com/b2/docs](https://www.backblaze.com/b2/docs/)
- **Support**: [backblaze.com/support](https://www.backblaze.com/support.htm)
- **BAA Request**: Contact sales for HIPAA BAA

### ClinicalCanvas Support

- **GitHub Issues**: [github.com/joeyrbh/clinicalcanvas/issues](https://github.com/joeyrbh/clinicalcanvas/issues)
- **Email**: support@clinicalcanvas.app

---

## ✅ Checklist

Before going live:

- [ ] Created Backblaze account
- [ ] Created B2 bucket: `clinicalcanvas-documents`
- [ ] Generated Application Keys
- [ ] Added environment variables to Vercel
- [ ] Requested and received BAA from Backblaze
- [ ] Tested upload functionality
- [ ] Tested download functionality
- [ ] Tested delete functionality
- [ ] Enabled bucket logging
- [ ] Configured backup strategy
- [ ] Documented storage structure
- [ ] Trained team on new system

---

## 🎉 You're Ready!

Your ClinicalCanvas EHR now has HIPAA-compliant, cost-effective document storage with Backblaze B2!

**Next Steps:**
1. Complete the checklist above
2. Test all functionality
3. Deploy to production
4. Monitor costs and usage

---

**Last Updated**: January 2025  
**Version**: 1.0.0  
**Status**: ✅ Production Ready

