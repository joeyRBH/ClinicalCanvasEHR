// Test Brevo package import
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    console.log('Testing Brevo import...');
    
    const SibApiV3Sdk = await import('@getbrevo/brevo');
    console.log('Brevo imported successfully');
    console.log('SibApiV3Sdk type:', typeof SibApiV3Sdk);
    console.log('SibApiV3Sdk keys:', Object.keys(SibApiV3Sdk));
    
    if (SibApiV3Sdk.default) {
      console.log('SibApiV3Sdk.default keys:', Object.keys(SibApiV3Sdk.default));
    }
    
    return res.status(200).json({
      success: true,
      sdkType: typeof SibApiV3Sdk,
      sdkKeys: Object.keys(SibApiV3Sdk),
      hasDefault: !!SibApiV3Sdk.default,
      defaultKeys: SibApiV3Sdk.default ? Object.keys(SibApiV3Sdk.default) : null,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Brevo import error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
};
