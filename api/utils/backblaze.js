const AWS = require('aws-sdk');

// Initialize Backblaze B2 S3 client
const getS3Client = () => {
  // Backblaze B2 requires specific configuration
  const config = {
    endpoint: process.env.B2_ENDPOINT,
    accessKeyId: process.env.B2_APPLICATION_KEY_ID,
    secretAccessKey: process.env.B2_APPLICATION_KEY,
    s3ForcePathStyle: true,
    signatureVersion: 'v4'
  };

  // Only add region if it's set
  if (process.env.B2_REGION) {
    config.region = process.env.B2_REGION;
  }

  console.log('S3 Client Config:', {
    endpoint: config.endpoint,
    hasAccessKeyId: !!config.accessKeyId,
    hasSecretAccessKey: !!config.secretAccessKey,
    region: config.region
  });

  return new AWS.S3(config);
};

// Upload document to Backblaze B2
const uploadDocument = async (clientId, documentId, fileName, fileData, contentType = 'application/pdf') => {
  const s3 = getS3Client();
  
  const timestamp = Date.now();
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  const key = `documents/${clientId}/${documentId}/${timestamp}_${sanitizedFileName}`;

  const buffer = Buffer.from(fileData, 'base64');

  const uploadResult = await s3.upload({
    Bucket: process.env.B2_BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    Metadata: {
      'client-id': clientId,
      'document-id': documentId,
      'original-filename': fileName,
      'upload-date': new Date().toISOString(),
      'upload-timestamp': timestamp.toString()
    }
  }).promise();

  return {
    key: key,
    url: uploadResult.Location,
    fileName: fileName,
    size: buffer.length,
    uploadedAt: new Date().toISOString()
  };
};

// Download document from Backblaze B2
const downloadDocument = async (key) => {
  const s3 = getS3Client();
  
  const file = await s3.getObject({
    Bucket: process.env.B2_BUCKET_NAME,
    Key: key
  }).promise();

  return {
    body: file.Body,
    contentType: file.ContentType,
    contentLength: file.ContentLength,
    metadata: file.Metadata
  };
};

// Delete document from Backblaze B2
const deleteDocument = async (key) => {
  const s3 = getS3Client();
  
  await s3.deleteObject({
    Bucket: process.env.B2_BUCKET_NAME,
    Key: key
  }).promise();

  return {
    key: key,
    deletedAt: new Date().toISOString()
  };
};

// List documents for a client
const listDocuments = async (clientId, prefix = '') => {
  const s3 = getS3Client();
  
  let searchPrefix = prefix;
  if (clientId) {
    searchPrefix = `documents/${clientId}/`;
  }

  const listResult = await s3.listObjectsV2({
    Bucket: process.env.B2_BUCKET_NAME,
    Prefix: searchPrefix,
    MaxKeys: 1000
  }).promise();

  const documents = (listResult.Contents || []).map(item => ({
    key: item.Key,
    fileName: item.Key.split('/').pop(),
    size: item.Size,
    lastModified: item.LastModified,
    etag: item.ETag
  }));

  return documents;
};

// Check if document exists
const documentExists = async (key) => {
  const s3 = getS3Client();
  
  try {
    await s3.headObject({
      Bucket: process.env.B2_BUCKET_NAME,
      Key: key
    }).promise();
    return true;
  } catch (error) {
    if (error.code === 'NotFound' || error.code === 'NoSuchKey') {
      return false;
    }
    throw error;
  }
};

// Get document metadata
const getDocumentMetadata = async (key) => {
  const s3 = getS3Client();
  
  const metadata = await s3.headObject({
    Bucket: process.env.B2_BUCKET_NAME,
    Key: key
  }).promise();

  return {
    key: key,
    fileName: key.split('/').pop(),
    size: metadata.ContentLength,
    contentType: metadata.ContentType,
    lastModified: metadata.LastModified,
    metadata: metadata.Metadata
  };
};

module.exports = {
  getS3Client,
  uploadDocument,
  downloadDocument,
  deleteDocument,
  listDocuments,
  documentExists,
  getDocumentMetadata
};

