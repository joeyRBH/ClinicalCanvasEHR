const AWS = require('aws-sdk');

// Initialize S3 client with Backblaze B2 credentials
let s3;

try {
  s3 = new AWS.S3({
    endpoint: process.env.B2_ENDPOINT,
    accessKeyId: process.env.B2_APPLICATION_KEY_ID,
    secretAccessKey: process.env.B2_APPLICATION_KEY,
    region: process.env.B2_REGION,
    s3ForcePathStyle: true
  });
} catch (error) {
  console.error('Failed to initialize S3 client:', error);
}

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    // Check if S3 client is initialized
    if (!s3) {
      return res.status(500).json({
        success: false,
        error: 'Backblaze B2 not configured. Please check environment variables.',
        details: 'Missing B2 credentials'
      });
    }

    // Debug: Log environment variables (without exposing secrets)
    console.log('B2_ENDPOINT:', process.env.B2_ENDPOINT);
    console.log('B2_APPLICATION_KEY_ID:', process.env.B2_APPLICATION_KEY_ID ? 'SET' : 'NOT SET');
    console.log('B2_APPLICATION_KEY:', process.env.B2_APPLICATION_KEY ? 'SET' : 'NOT SET');
    console.log('B2_BUCKET_NAME:', process.env.B2_BUCKET_NAME);
    console.log('B2_REGION:', process.env.B2_REGION);

    const { clientId, documentId, fileName, fileData, contentType = 'application/pdf' } = req.body;

    // Validate inputs
    if (!clientId || !documentId || !fileName || !fileData) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: clientId, documentId, fileName, fileData'
      });
    }

    // Generate unique key for storage
    const timestamp = Date.now();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const key = `documents/${clientId}/${documentId}/${timestamp}_${sanitizedFileName}`;

    // Convert base64 to buffer
    const buffer = Buffer.from(fileData, 'base64');

    // Upload to Backblaze B2
    const uploadResult = await s3.upload({
      Bucket: process.env.B2_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      Metadata: {
        'client-id': clientId,
        'document-id': documentId,
        'original-filename': fileName,
        'upload-date': new Date().toISOString(),
        'upload-timestamp': timestamp.toString()
      }
    }).promise();

    console.log('✅ Document uploaded to Backblaze B2:', key);

    res.status(200).json({
      success: true,
      message: 'Document uploaded successfully',
      data: {
        key: key,
        url: uploadResult.Location,
        fileName: fileName,
        size: buffer.length,
        uploadedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Upload error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload document',
      details: error.message
    });
  }
};

