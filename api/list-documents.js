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
    const { clientId, prefix = '' } = req.query;

    // Build prefix for filtering
    let searchPrefix = prefix;
    if (clientId) {
      searchPrefix = `documents/${clientId}/`;
    }

    // List objects from Backblaze B2
    const listResult = await s3.listObjectsV2({
      Bucket: process.env.B2_BUCKET_NAME,
      Prefix: searchPrefix,
      MaxKeys: 1000
    }).promise();

    console.log('✅ Listed documents from Backblaze B2:', searchPrefix);

    // Format response
    const documents = (listResult.Contents || []).map(item => ({
      key: item.Key,
      fileName: item.Key.split('/').pop(),
      size: item.Size,
      lastModified: item.LastModified,
      etag: item.ETag
    }));

    res.status(200).json({
      success: true,
      message: 'Documents listed successfully',
      data: {
        documents: documents,
        count: documents.length,
        prefix: searchPrefix
      }
    });

  } catch (error) {
    console.error('❌ List documents error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list documents',
      details: error.message
    });
  }
};

