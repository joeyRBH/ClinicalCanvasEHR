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

  if (req.method !== 'DELETE' && req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { key } = req.body;

    // Validate inputs
    if (!key) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: key'
      });
    }

    // Delete from Backblaze B2
    await s3.deleteObject({
      Bucket: process.env.B2_BUCKET_NAME,
      Key: key
    }).promise();

    console.log('✅ Document deleted from Backblaze B2:', key);

    res.status(200).json({
      success: true,
      message: 'Document deleted successfully',
      data: {
        key: key,
        deletedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Delete error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete document',
      details: error.message
    });
  }
};

