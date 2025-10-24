// Debug Brevo SDK import
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const SibApiV3Sdk = require('@getbrevo/brevo');
    
    return res.status(200).json({
      success: true,
      sdkType: typeof SibApiV3Sdk,
      sdkKeys: Object.keys(SibApiV3Sdk),
      hasTransactionalEmailsApi: 'TransactionalEmailsApi' in SibApiV3Sdk,
      hasSendSmtpEmail: 'SendSmtpEmail' in SibApiV3Sdk,
      transactionalEmailsApiType: typeof SibApiV3Sdk.TransactionalEmailsApi,
      sendSmtpEmailType: typeof SibApiV3Sdk.SendSmtpEmail,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
}
