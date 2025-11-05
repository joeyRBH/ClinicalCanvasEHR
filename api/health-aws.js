// Health check for AWS configuration
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const config = {
      ses: {
        hasAccessKey: !!process.env.AWS_SES_ACCESS_KEY_ID,
        hasSecretKey: !!process.env.AWS_SES_SECRET_ACCESS_KEY,
        hasRegion: !!process.env.AWS_SES_REGION,
        hasFromEmail: !!process.env.AWS_SES_FROM_EMAIL,
        hasFromName: !!process.env.AWS_SES_FROM_NAME,
        region: process.env.AWS_SES_REGION || 'not set',
        fromEmail: process.env.AWS_SES_FROM_EMAIL || 'not set',
        fromName: process.env.AWS_SES_FROM_NAME || 'not set',
        accessKeyPrefix: process.env.AWS_SES_ACCESS_KEY_ID ? process.env.AWS_SES_ACCESS_KEY_ID.substring(0, 8) + '...' : 'not set'
      },
      sns: {
        hasAccessKey: !!process.env.AWS_SNS_ACCESS_KEY_ID,
        hasSecretKey: !!process.env.AWS_SNS_SECRET_ACCESS_KEY,
        hasRegion: !!process.env.AWS_SNS_REGION,
        region: process.env.AWS_SNS_REGION || 'not set',
        accessKeyPrefix: process.env.AWS_SNS_ACCESS_KEY_ID ? process.env.AWS_SNS_ACCESS_KEY_ID.substring(0, 8) + '...' : 'not set'
      },
      nodeVersion: process.version,
      platform: process.platform
    };

    return res.status(200).json({
      success: true,
      message: 'AWS configuration check',
      config
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
};
