const { listDocuments } = require('./utils/backblaze-native');

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

    // List documents from Backblaze B2 using native API
    const documents = await listDocuments(clientId, prefix);

    console.log(`✅ Listed ${documents.length} documents from Backblaze B2`);

    res.status(200).json({
      success: true,
      message: 'Documents listed successfully',
      data: documents
    });

  } catch (error) {
    console.error('❌ List error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list documents',
      details: error.message
    });
  }
};
