// Backblaze B2 Native API implementation
// This uses the B2 native API instead of S3-compatible API

let authToken = null;
let uploadUrl = null;
let uploadAuthToken = null;
let bucketId = null;

// Get authorization token from Backblaze
const getAuthToken = async () => {
  if (authToken) {
    return authToken;
  }

  const accountId = process.env.B2_APPLICATION_KEY_ID;
  const applicationKey = process.env.B2_APPLICATION_KEY;

  if (!accountId || !applicationKey) {
    throw new Error('Backblaze credentials not configured');
  }

  const response = await fetch('https://api.backblazeb2.com/b2api/v2/b2_authorize_account', {
    method: 'GET',
    headers: {
      'Authorization': `Basic ${Buffer.from(`${accountId}:${applicationKey}`).toString('base64')}`
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('B2 Auth Error:', errorText);
    throw new Error(`Failed to authorize with Backblaze: ${response.status}`);
  }

  const data = await response.json();
  authToken = data.authorizationToken;
  bucketId = data.allowed.bucketId;
  
  return authToken;
};

// Get upload URL
const getUploadUrl = async () => {
  const token = await getAuthToken();
  const apiUrl = process.env.B2_API_URL || 'https://api002.backblazeb2.com';

  const response = await fetch(`${apiUrl}/b2api/v2/b2_get_upload_url`, {
    method: 'POST',
    headers: {
      'Authorization': token
    },
    body: JSON.stringify({
      bucketId: bucketId
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Get Upload URL Error:', errorText);
    throw new Error(`Failed to get upload URL: ${response.status}`);
  }

  const data = await response.json();
  uploadUrl = data.uploadUrl;
  uploadAuthToken = data.authorizationToken;
  
  return { uploadUrl, uploadAuthToken };
};

// Upload document using native B2 API
const uploadDocument = async (clientId, documentId, fileName, fileData, contentType = 'application/pdf') => {
  const { uploadUrl: url, uploadAuthToken: token } = await getUploadUrl();
  
  const timestamp = Date.now();
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  const key = `documents/${clientId}/${documentId}/${timestamp}_${sanitizedFileName}`;

  const buffer = Buffer.from(fileData, 'base64');
  const sha1 = require('crypto').createHash('sha1').update(buffer).digest('hex');

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': token,
      'X-Bz-File-Name': key,
      'Content-Type': contentType,
      'X-Bz-Content-Sha1': sha1,
      'X-Bz-Info-Author': 'ClinicalCanvas',
      'Content-Length': buffer.length.toString()
    },
    body: buffer
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Upload Error:', errorText);
    throw new Error(`Failed to upload: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  
  return {
    key: key,
    fileId: data.fileId,
    fileName: fileName,
    size: buffer.length,
    uploadedAt: new Date().toISOString()
  };
};

// Download document using native B2 API
const downloadDocument = async (fileId) => {
  const token = await getAuthToken();
  const apiUrl = process.env.B2_API_URL || 'https://api002.backblazeb2.com';

  const response = await fetch(`${apiUrl}/b2api/v2/b2_download_file_by_id`, {
    method: 'POST',
    headers: {
      'Authorization': token
    },
    body: JSON.stringify({
      fileId: fileId
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Download Error:', errorText);
    throw new Error(`Failed to download: ${response.status}`);
  }

  const buffer = await response.arrayBuffer();
  
  return {
    body: Buffer.from(buffer),
    contentType: response.headers.get('content-type'),
    contentLength: response.headers.get('content-length')
  };
};

// Delete document using native B2 API
const deleteDocument = async (fileName, fileId) => {
  const token = await getAuthToken();
  const apiUrl = process.env.B2_API_URL || 'https://api002.backblazeb2.com';

  const response = await fetch(`${apiUrl}/b2api/v2/b2_delete_file_version`, {
    method: 'POST',
    headers: {
      'Authorization': token
    },
    body: JSON.stringify({
      fileName: fileName,
      fileId: fileId
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Delete Error:', errorText);
    throw new Error(`Failed to delete: ${response.status}`);
  }

  return {
    fileName: fileName,
    fileId: fileId,
    deletedAt: new Date().toISOString()
  };
};

// List documents using native B2 API
const listDocuments = async (clientId, prefix = '') => {
  const token = await getAuthToken();
  const apiUrl = process.env.B2_API_URL || 'https://api002.backblazeb2.com';

  let searchPrefix = prefix;
  if (clientId) {
    searchPrefix = `documents/${clientId}/`;
  }

  const response = await fetch(`${apiUrl}/b2api/v2/b2_list_file_names`, {
    method: 'POST',
    headers: {
      'Authorization': token
    },
    body: JSON.stringify({
      bucketId: bucketId,
      prefix: searchPrefix,
      maxFileCount: 1000
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('List Error:', errorText);
    throw new Error(`Failed to list files: ${response.status}`);
  }

  const data = await response.json();
  
  const documents = (data.files || []).map(file => ({
    key: file.fileName,
    fileId: file.fileId,
    fileName: file.fileName.split('/').pop(),
    size: file.contentLength,
    lastModified: file.uploadTimestamp,
    etag: file.contentSha1
  }));

  return documents;
};

module.exports = {
  uploadDocument,
  downloadDocument,
  deleteDocument,
  listDocuments
};

