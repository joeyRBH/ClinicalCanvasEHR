const { downloadDocument } = require('./utils/backblaze-native');

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  const allowedOrigin = process.env.APP_URL || req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
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
    const { fileId } = req.query;

    if (!fileId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter: fileId'
      });
    }

    // Download from Backblaze B2 using native API
    const downloadResult = await downloadDocument(fileId);

    console.log('✅ Document downloaded from Backblaze B2:', fileId);

    res.setHeader('Content-Type', downloadResult.contentType || 'application/octet-stream');
    res.setHeader('Content-Length', downloadResult.contentLength);
    res.status(200).send(downloadResult.body);

  } catch (error) {
    console.error('❌ Download error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to download document',
      details: error.message
    });
  }
};
