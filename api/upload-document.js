const { uploadDocument } = require('./utils/backblaze-native');

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
    const { clientId, documentId, fileName, fileData, contentType = 'application/pdf' } = req.body;

    // Validate inputs
    if (!clientId || !documentId || !fileName || !fileData) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: clientId, documentId, fileName, fileData'
      });
    }

    // Upload to Backblaze B2 using native API
    const uploadResult = await uploadDocument(clientId, documentId, fileName, fileData, contentType);

    console.log('✅ Document uploaded to Backblaze B2:', uploadResult.key);

    res.status(200).json({
      success: true,
      message: 'Document uploaded successfully',
      data: uploadResult
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
