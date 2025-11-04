const { deleteDocument } = require('./utils/backblaze-native');

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

  if (req.method !== 'DELETE') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { fileName, fileId } = req.query;

    if (!fileName || !fileId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: fileName, fileId'
      });
    }

    // Delete from Backblaze B2 using native API
    const deleteResult = await deleteDocument(fileName, fileId);

    console.log('✅ Document deleted from Backblaze B2:', fileName);

    res.status(200).json({
      success: true,
      message: 'Document deleted successfully',
      data: deleteResult
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
