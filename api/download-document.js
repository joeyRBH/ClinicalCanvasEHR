const AWS = require('aws-sdk');

const s3 = new AWS.S3({
  endpoint: process.env.B2_ENDPOINT,
  accessKeyId: process.env.B2_APPLICATION_KEY_ID,
  secretAccessKey: process.env.B2_APPLICATION_KEY,
  region: process.env.B2_REGION,
  s3ForcePathStyle: true
});

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

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { key } = req.query;

    // Validate inputs
    if (!key) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter: key'
      });
    }

    // Download from Backblaze B2
    const file = await s3.getObject({
      Bucket: process.env.B2_BUCKET_NAME,
      Key: key
    }).promise();

    console.log('✅ Document downloaded from Backblaze B2:', key);

    // Set appropriate headers
    const fileName = key.split('/').pop();
    res.setHeader('Content-Type', file.ContentType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', file.ContentLength);

    // Send file content
    res.status(200).send(file.Body);

  } catch (error) {
    console.error('❌ Download error:', error);
    
    if (error.code === 'NoSuchKey') {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to download document',
      details: error.message
    });
  }
};

